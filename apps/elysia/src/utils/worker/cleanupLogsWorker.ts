import { parseDurationToMs } from "@repo/utils";
import { format } from "date-fns";
import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import { env } from "@/src/environment";
import { logger } from "@/src/libs";
import { getLogDirectory, isRequestLogFileName } from "@/src/utils";

const ONE_DAY_IN_MS = parseDurationToMs("1d");

const getLogRetentionDays = () => env.LOG_RETENTION_DAYS;

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
    if (!isRequestLogFileName(entry)) {
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
