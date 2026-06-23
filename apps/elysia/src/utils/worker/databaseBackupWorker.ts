import { parseDurationToMs } from "@repo/utils";
import { format } from "date-fns";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import { env } from "@/src/environment";
import { logger } from "@/src/libs/pino";
import { checkZstdAvailability, compressLogFile } from "@/src/utils/logCompression";

const ONE_DAY_IN_MS = parseDurationToMs("1d");
const BACKUP_FILE_PREFIX = "postgres-";
const RAW_BACKUP_EXTENSION = ".dump";
const COMPRESSED_BACKUP_EXTENSION = ".dump.zst";

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

const isBackupFileName = (entry: string) =>
  entry.startsWith(BACKUP_FILE_PREFIX) && (entry.endsWith(RAW_BACKUP_EXTENSION) || entry.endsWith(COMPRESSED_BACKUP_EXTENSION));

const getConnectionInfo = () => {
  const parsed = new URL(env.DATABASE_URL);
  const database = parsed.pathname.replace(/^\//, "");

  return {
    database,
    host: parsed.hostname,
    password: decodeURIComponent(parsed.password),
    port: parsed.port || "5432",
    username: decodeURIComponent(parsed.username),
  };
};

const cleanupOldBackups = async (directory: string, retentionDays: number) => {
  const entries = await readdir(directory);
  const cutoffTime = Date.now() - retentionDays * ONE_DAY_IN_MS;

  for (const entry of entries) {
    if (!isBackupFileName(entry)) {
      continue;
    }

    const targetPath = join(directory, entry);
    const info = await stat(targetPath);

    if (!info.isFile() || info.mtimeMs > cutoffTime) {
      continue;
    }

    await rm(targetPath);

    logger.info(
      {
        file: targetPath,
        retentionDays,
        scope: "cron",
      },
      "old database backup removed",
    );
  }
};

let isBackupRunning = false;

export const databaseBackupWorker = async () => {
  if (isBackupRunning) {
    logger.warn({ scope: "cron" }, "database backup skipped because previous run is still active");
    return;
  }

  isBackupRunning = true;

  try {
    const directory = env.DB_BACKUP_DIR;
    const retentionDays = env.DB_BACKUP_RETENTION_DAYS;

    await mkdir(directory, { recursive: true });

    const { database, host, password, port, username } = getConnectionInfo();
    const timestamp = format(new Date(), "dd-MM-yyyy-HH-mm-ss");
    const fileName = `${BACKUP_FILE_PREFIX}${sanitize(database)}-${timestamp}${RAW_BACKUP_EXTENSION}`;
    const outputPath = join(directory, fileName);
    let finalOutputPath = outputPath;

    const backupProcess = Bun.spawn(
      ["pg_dump", "--format=custom", "--compress=0", `--file=${outputPath}`, `--host=${host}`, `--port=${port}`, `--username=${username}`, database],
      {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
        stderr: "pipe",
        stdout: "pipe",
      },
    );

    const exitCode = await backupProcess.exited;

    if (exitCode !== 0) {
      const errorOutput = await new Response(backupProcess.stderr).text();
      throw new Error(errorOutput || `pg_dump failed with exit code ${exitCode}`);
    }

    const zstdAvailable = await checkZstdAvailability();

    if (zstdAvailable) {
      try {
        await compressLogFile(outputPath);
        finalOutputPath = `${outputPath}.zst`;
      } catch (error) {
        logger.warn(
          {
            error,
            file: outputPath,
            scope: "cron",
          },
          "database backup compression failed, keeping raw backup file",
        );
      }
    } else {
      logger.warn(
        {
          file: outputPath,
          scope: "cron",
        },
        "zstd is not available, database backup file is stored without additional compression",
      );
    }

    await cleanupOldBackups(directory, retentionDays);

    logger.info(
      {
        compressed: finalOutputPath.endsWith(".zst"),
        file: finalOutputPath,
        retentionDays,
        scope: "cron",
      },
      "database backup finished",
    );
  } catch (error) {
    logger.error(
      {
        error,
        scope: "cron",
      },
      "database backup failed",
    );
  } finally {
    isBackupRunning = false;
  }
};
