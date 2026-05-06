import { format } from "date-fns";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const REQUEST_LOG_PREFIX = "elysia-req-";
const RAW_LOG_EXTENSION = ".log";
const COMPRESSED_LOG_EXTENSION = ".log.zst";

export const getLogDirectory = () => process.env.LOG_DIR?.trim() || join(process.cwd(), "backups", "logs");

export const getRequestLogFileName = (date = new Date()) => `${REQUEST_LOG_PREFIX}${format(date, "dd-MM-yyyy")}${RAW_LOG_EXTENSION}`;

export const isRawRequestLogFileName = (entry: string) => entry.startsWith(REQUEST_LOG_PREFIX) && entry.endsWith(RAW_LOG_EXTENSION);

export const isCompressedRequestLogFileName = (entry: string) => entry.startsWith(REQUEST_LOG_PREFIX) && entry.endsWith(COMPRESSED_LOG_EXTENSION);

export const isRequestLogFileName = (entry: string) => isRawRequestLogFileName(entry) || isCompressedRequestLogFileName(entry);

export const compressLogFile = async (filePath: string) => {
  await execFileAsync("zstd", ["-q", "--rm", "-f", filePath, "-o", `${filePath}.zst`]);
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
    } catch {
      // ignore compression failures so request logging can continue with the active file
    }
  }
};

export const decompressLogFileToTemp = async (filePath: string) => {
  const tempDirectory = await mkdtemp(join(tmpdir(), "elysia-audit-"));
  const outputFilePath = join(tempDirectory, basename(filePath, ".zst"));

  await execFileAsync("zstd", ["-d", "-q", "-f", filePath, "-o", outputFilePath]);

  return {
    cleanup: async () => {
      await rm(tempDirectory, { force: true, recursive: true });
    },
    outputFilePath,
  };
};
