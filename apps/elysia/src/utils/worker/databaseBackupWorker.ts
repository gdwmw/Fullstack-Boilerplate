import { format } from "date-fns";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "@/src/libs";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 365;

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const getBackupDirectory = () => process.env.DB_BACKUP_DIR?.trim() || join(process.cwd(), "backups", "db");

const getBackupRetentionDays = () => toInt(process.env.DB_BACKUP_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

const getConnectionInfo = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database backup.");
  }

  const parsed = new URL(databaseUrl);
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
  const maxAge = retentionDays * ONE_DAY_IN_MS;
  const now = Date.now();

  for (const entry of entries) {
    const targetPath = join(directory, entry);
    const info = await stat(targetPath);

    if (!info.isFile()) {
      continue;
    }

    if (!entry.startsWith("postgres-") || !entry.endsWith(".dump")) {
      continue;
    }

    if (now - info.mtimeMs <= maxAge) {
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
    const directory = getBackupDirectory();
    const retentionDays = getBackupRetentionDays();

    await mkdir(directory, { recursive: true });

    const { database, host, password, port, username } = getConnectionInfo();
    const timestamp = format(new Date(), "dd-MM-yyyy-HH-mm-ss");
    const fileName = `postgres-${sanitize(database)}-${timestamp}.dump`;
    const outputPath = join(directory, fileName);

    const backupProcess = Bun.spawn(
      ["pg_dump", "--format=custom", `--file=${outputPath}`, `--host=${host}`, `--port=${port}`, `--username=${username}`, database],
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

    await cleanupOldBackups(directory, retentionDays);

    logger.info(
      {
        file: outputPath,
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
