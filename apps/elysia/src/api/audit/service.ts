import { format } from "date-fns";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { decompressLogFileToTemp, getLogDirectory, getRequestLogFileName, isCompressedRequestLogFileName, isRequestLogFileName } from "@/src/utils";

import { IArchiveEntry, ILogEntry, TArchiveQuerySchema, TQuerySchema } from "./type";

const parseTimeFilter = (value?: string): { hours: number; minutes: number } | undefined => {
  if (!value) {
    return undefined;
  }

  const [hours, minutes] = value.split(":").map(Number);

  if ([hours, minutes].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return { hours, minutes };
};

const parseArchiveDateFromFileName = (fileName: string): null | string => {
  const normalizedFileName = fileName.replace(/\.zst$/, "");
  const matchedDate = normalizedFileName.match(/^(?:elysia-req-)(\d{2}-\d{2}-\d{4})\.log$/);

  if (!matchedDate) {
    return null;
  }

  const [day, month, year] = matchedDate[1].split("-").map(Number);
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

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as ILogEntry);
    } catch {
      // skip malformed lines
    }
  }

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
  async getAll({ actor, archiveDate, level, limit, method, page, path, statusCode, time }: TQuerySchema) {
    const logDir = getLogDirectory();
    const selectedTime = parseTimeFilter(time);
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
        .reverse(); // most recent first
    } catch {
      return { data: [], meta: { limit, page, total: 0, totalPages: 0 } };
    }

    const allEntries: ILogEntry[] = [];

    for (const file of files) {
      const filePath = join(logDir, file);
      const entries = isCompressedRequestLogFileName(file) ? await parseCompressedLogFile(filePath) : await parseLogFile(filePath);
      allEntries.push(...entries);
    }

    // sort descending by timestamp
    allEntries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    const filtered = allEntries.filter((entry) => {
      if (selectedTime) {
        const entryDate = new Date(entry.ts);

        if (entryDate.getHours() !== selectedTime.hours || entryDate.getMinutes() !== selectedTime.minutes) {
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

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);

    return {
      data,
      meta: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getArchives({ month, year }: TArchiveQuerySchema): Promise<IArchiveEntry[]> {
    const logDir = getLogDirectory();

    let files: string[];
    try {
      files = (await readdir(logDir))
        .filter((file) => isRequestLogFileName(file))
        .sort()
        .reverse();
    } catch {
      return [];
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

    return Array.from(archiveMap.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey));
  },
};
