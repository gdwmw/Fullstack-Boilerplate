import { format } from "date-fns";
import { readdir, rm, stat } from "node:fs/promises";
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

const getLogDirectory = () => process.env.LOG_DIR?.trim() || join(process.cwd(), "backups", "logs");

const getLogRetentionDays = () => toInt(process.env.LOG_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);

export const cleanupLogsWorker = async () => {
  const directory = getLogDirectory();
  const retentionDays = getLogRetentionDays();
  const maxAge = retentionDays * ONE_DAY_IN_MS;
  const now = Date.now();

  let entries: string[];

  try {
    entries = await readdir(directory);
  } catch {
    return;
  }

  let count = 0;

  for (const entry of entries) {
    if (!entry.startsWith("elysia-req-") || !entry.endsWith(".log")) {
      continue;
    }

    const targetPath = join(directory, entry);
    const info = await stat(targetPath);

    if (!info.isFile() || now - info.mtimeMs <= maxAge) {
      continue;
    }

    await rm(targetPath);
    count++;

    logger.info(
      {
        file: targetPath,
        retentionDays,
        scope: "cron",
      },
      "old request log removed",
    );
  }

  logger.info(
    {
      at: format(new Date(), "dd-MM-yyyy HH:mm:ss"),
      count,
      scope: "cron",
    },
    "request logs cleanup finished",
  );
};
