import { format } from "date-fns";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "@/src/libs";
import {
  decompressLogFileToTemp,
  getLogDirectory,
  getRequestLogFileName,
  isCompressedRequestLogFileName,
  isRequestLogFileName,
  paginateArray,
} from "@/src/utils";

import { IArchiveEntry, ILogEntry, TArchiveQuerySchema, TQuerySchema } from "./type";

interface ILogFileCacheEntry {
  entries: ILogEntry[];
  mtimeMs: number;
  size: number;
}

const logFileCache = new Map<string, ILogFileCacheEntry>();

const parseTimeFilter = (value?: string): { hours: number; minutes: number } | undefined => {
  if (!value) {
    return undefined;
  }

  const [hoursRaw, minutesRaw] = value.split(":");

  if (hoursRaw === undefined || minutesRaw === undefined) {
    return undefined;
  }

  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if ([hours, minutes].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return { hours, minutes };
};

const toTotalMinutes = ({ hours, minutes }: { hours: number; minutes: number }): number => hours * 60 + minutes;

const isTimeWithinRange = ({ candidate, from, to }: { candidate: number; from?: number; to?: number }): boolean => {
  if (from === undefined && to === undefined) {
    return true;
  }

  if (from !== undefined && to !== undefined) {
    if (from <= to) {
      return candidate >= from && candidate <= to;
    }

    return candidate >= from || candidate <= to;
  }

  if (from !== undefined) {
    return candidate >= from;
  }

  return candidate <= to!;
};

const parseArchiveDateFromFileName = (fileName: string): null | string => {
  const normalizedFileName = fileName.replace(/\.zst$/, "");
  const matchedDate = normalizedFileName.match(/^(?:elysia-req-)(\d{2}-\d{2}-\d{4})\.log$/);

  if (!matchedDate) {
    return null;
  }

  const dateToken = matchedDate[1];

  if (!dateToken) {
    return null;
  }

  const [dayRaw, monthRaw, yearRaw] = dateToken.split("-");

  if (dayRaw === undefined || monthRaw === undefined || yearRaw === undefined) {
    return null;
  }

  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if ([day, month, year].some((part) => Number.isNaN(part))) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return format(parsedDate, "yyyy-MM-dd");
};

const parseArchiveDate = (dateKey: string): Date => new Date(dateKey);
const getArchiveLabel = (dateKey: string) => format(new Date(dateKey), "dd MMM yyyy");
const getActorSearchValues = (entry: ILogEntry): string[] => {
  const user = entry.users;

  if (!user) {
    return [];
  }

  return [user.name, user.username, user.email, user.phone, user.role]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).toLowerCase());
};

const parseLogFile = async (filePath: string): Promise<ILogEntry[]> => {
  const content = await readFile(filePath, "utf-8");
  const entries: ILogEntry[] = [];
  let malformedLines = 0;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as ILogEntry);
    } catch {
      malformedLines++;
    }
  }

  if (malformedLines > 0) {
    logger.warn(
      {
        filePath,
        malformedLines,
        scope: "audit",
      },
      "malformed log lines were skipped while parsing audit logs",
    );
  }

  return entries;
};

const readLogEntries = async (filePath: string, isCompressed: boolean): Promise<ILogEntry[]> => {
  const fileStats = await stat(filePath);
  const cached = logFileCache.get(filePath);

  if (cached && cached.mtimeMs === fileStats.mtimeMs && cached.size === fileStats.size) {
    return cached.entries;
  }

  const entries = isCompressed ? await parseCompressedLogFile(filePath) : await parseLogFile(filePath);

  logFileCache.set(filePath, {
    entries,
    mtimeMs: fileStats.mtimeMs,
    size: fileStats.size,
  });

  return entries;
};

const parseCompressedLogFile = async (filePath: string): Promise<ILogEntry[]> => {
  const { cleanup, outputFilePath } = await decompressLogFileToTemp(filePath);

  try {
    return await parseLogFile(outputFilePath);
  } finally {
    await cleanup();
  }
};

export const service = {
  async getAllArchives({ month, page, pageSize, year }: TArchiveQuerySchema) {
    const logDir = getLogDirectory();

    let files: string[];

    try {
      files = (await readdir(logDir))
        .filter((file) => isRequestLogFileName(file))
        .sort()
        .reverse();
    } catch {
      return paginateArray({ items: [], page, pageSize });
    }

    const archiveMap = new Map<string, IArchiveEntry>();

    for (const file of files) {
      const dateKey = parseArchiveDateFromFileName(file);

      if (!dateKey) {
        continue;
      }

      if (archiveMap.has(dateKey)) {
        continue;
      }

      const archiveDate = parseArchiveDate(dateKey);

      if (year && archiveDate.getFullYear() !== year) {
        continue;
      }

      if (month && archiveDate.getMonth() + 1 !== month) {
        continue;
      }

      archiveMap.set(dateKey, {
        dateKey,
        label: getArchiveLabel(dateKey),
      });
    }

    return paginateArray({
      items: Array.from(archiveMap.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey)),
      page,
      pageSize,
    });
  },

  async getAllLogs({ actor, archiveDate, level, method, page, pageSize, path, statusCode, timeFrom, timeTo }: TQuerySchema) {
    const logDir = getLogDirectory();
    const selectedTimeFrom = parseTimeFilter(timeFrom);
    const selectedTimeTo = parseTimeFilter(timeTo);
    const selectedTimeFromMinutes = selectedTimeFrom ? toTotalMinutes(selectedTimeFrom) : undefined;
    const selectedTimeToMinutes = selectedTimeTo ? toTotalMinutes(selectedTimeTo) : undefined;
    const normalizedActor = actor?.trim().toLowerCase();
    const selectedFileDate = archiveDate ? new Date(archiveDate) : undefined;
    const selectedFileName = selectedFileDate ? getRequestLogFileName(selectedFileDate) : undefined;

    let files: string[];

    try {
      const all = await readdir(logDir);
      files = all
        .filter((f) => isRequestLogFileName(f))
        .filter((f) => (selectedFileName ? f === selectedFileName || f === `${selectedFileName}.zst` : true))
        .sort()
        .reverse();
    } catch {
      return paginateArray({ items: [], page, pageSize });
    }

    const allEntries = (await Promise.all(files.map((file) => readLogEntries(join(logDir, file), isCompressedRequestLogFileName(file))))).flat();
    allEntries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    const filtered = allEntries.filter((entry) => {
      if (selectedTimeFromMinutes !== undefined || selectedTimeToMinutes !== undefined) {
        const entryDate = new Date(entry.ts);
        const entryTotalMinutes = entryDate.getHours() * 60 + entryDate.getMinutes();

        if (!isTimeWithinRange({ candidate: entryTotalMinutes, from: selectedTimeFromMinutes, to: selectedTimeToMinutes })) {
          return false;
        }
      }

      if (normalizedActor) {
        const actorValues = getActorSearchValues(entry);
        if (!actorValues.some((value) => value.includes(normalizedActor))) {
          return false;
        }
      }

      if (level && entry.level !== level) return false;
      if (method && entry.method !== method) return false;
      if (path && !entry.path.includes(path)) return false;
      if (statusCode && entry.statusCode !== statusCode) return false;
      return true;
    });

    return paginateArray({ items: filtered, page, pageSize });
  },
};
