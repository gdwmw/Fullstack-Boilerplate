import { parseDurationToMs } from "@repo/utils";
import { format } from "date-fns";
import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

import { env } from "@/src/environment";
import { logger } from "@/src/libs";
import { getLogDirectory, isRequestLogFileName } from "@/src/utils";

const ONE_DAY_IN_MS = parseDurationToMs("1d");

export const cleanupLogsWorker = async () => {
  const directory = getLogDirectory();
  const retentionDays = env.LOG_RETENTION_DAYS;
  const cutoffTime = Date.now() - retentionDays * ONE_DAY_IN_MS;

  let entries: string[];

  try {
    entries = await readdir(directory);
  } catch {
    return;
  }

  let removedCount = 0;

  for (const entry of entries) {
    if (!isRequestLogFileName(entry)) {
      continue;
    }

    const targetPath = join(directory, entry);
    const info = await stat(targetPath);

    if (!info.isFile() || info.mtimeMs > cutoffTime) {
      continue;
    }

    await rm(targetPath);
    removedCount++;

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
      count: removedCount,
      scope: "cron",
    },
    "request logs cleanup finished",
  );
};
