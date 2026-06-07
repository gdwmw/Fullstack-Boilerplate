import { format } from "date-fns";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

import { env } from "@/src/environment";
import { logger } from "@/src/libs/pino";

const execFileAsync = promisify(execFile);

const REQUEST_LOG_PREFIX = "elysia-req-";
const RAW_LOG_EXTENSION = ".log";
const COMPRESSED_LOG_EXTENSION = ".log.zst";

let zstdAvailabilityPromise: null | Promise<boolean> = null;

export const getLogDirectory = () => env.LOG_DIR;
export const getRequestLogFileName = (date = new Date()) => `${REQUEST_LOG_PREFIX}${format(date, "dd-MM-yyyy")}${RAW_LOG_EXTENSION}`;
export const isRawRequestLogFileName = (entry: string) => entry.startsWith(REQUEST_LOG_PREFIX) && entry.endsWith(RAW_LOG_EXTENSION);
export const isCompressedRequestLogFileName = (entry: string) => entry.startsWith(REQUEST_LOG_PREFIX) && entry.endsWith(COMPRESSED_LOG_EXTENSION);
export const isRequestLogFileName = (entry: string) => isRawRequestLogFileName(entry) || isCompressedRequestLogFileName(entry);

export const checkZstdAvailability = async (): Promise<boolean> => {
  if (!zstdAvailabilityPromise) {
    zstdAvailabilityPromise = execFileAsync("zstd", ["--version"])
      .then(() => true)
      .catch(() => false);
  }

  return zstdAvailabilityPromise;
};

export const compressLogFile = async (filePath: string) => {
  const outputFilePath = `${filePath}.zst`;

  logger.info(
    {
      filePath,
      outputFilePath,
      scope: "audit",
    },
    "compressing archived request log file",
  );

  try {
    await execFileAsync("zstd", ["-q", "--rm", "-f", filePath, "-o", outputFilePath]);

    logger.info(
      {
        filePath,
        outputFilePath,
        scope: "audit",
      },
      "finished compressing archived request log file",
    );
  } catch (error) {
    logger.error(
      {
        error,
        filePath,
        outputFilePath,
        scope: "audit",
      },
      "failed to compress archived request log file",
    );

    throw error;
  }
};

export const compressArchivedLogFiles = async ({ currentFileName, directory }: { currentFileName: string; directory: string }) => {
  let entries: string[];

  try {
    await mkdir(directory, { recursive: true });
    entries = await readdir(directory);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!isRawRequestLogFileName(entry) || entry === currentFileName) {
      continue;
    }

    try {
      await compressLogFile(join(directory, entry));
    } catch (error) {
      logger.warn(
        {
          directory,
          entry,
          error,
          scope: "audit",
        },
        "failed to compress archived request log file",
      );
    }
  }
};

export const decompressLogFileToTemp = async (filePath: string) => {
  const tempDirectory = await mkdtemp(join(tmpdir(), "elysia-audit-"));
  const outputFilePath = join(tempDirectory, basename(filePath, ".zst"));

  logger.info(
    {
      filePath,
      outputFilePath,
      scope: "audit",
    },
    "decompressing archived request log file",
  );

  try {
    await execFileAsync("zstd", ["-d", "-q", "-f", filePath, "-o", outputFilePath]);

    logger.info(
      {
        filePath,
        outputFilePath,
        scope: "audit",
      },
      "finished decompressing archived request log file",
    );
  } catch (error) {
    logger.error(
      {
        error,
        filePath,
        outputFilePath,
        scope: "audit",
      },
      "failed to decompress archived request log file",
    );

    throw error;
  }

  return {
    cleanup: async () => {
      await rm(tempDirectory, { force: true, recursive: true });
    },
    outputFilePath,
  };
};
