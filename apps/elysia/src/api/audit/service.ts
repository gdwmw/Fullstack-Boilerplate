import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { ILogEntry, TQuerySchema } from "./type";

const getLogDirectory = () => process.env.LOG_DIR?.trim() || join(process.cwd(), "backups", "logs");

const parseDateTimeFilter = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const [datePart, timePart] = value.split(" ");
  const [day, month, year] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  if ([day, month, year, hours, minutes].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return new Date(year, month - 1, day, hours, minutes);
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

export const service = {
  async getAll({ dateTime, level, limit, method, page, path, statusCode }: TQuerySchema) {
    const logDir = getLogDirectory();
    const selectedDateTime = parseDateTimeFilter(dateTime);
    const selectedDate = dateTime?.split(" ")[0];

    let files: string[];
    try {
      const all = await readdir(logDir);
      files = all
        .filter((f) => f.startsWith("elysia-req-") && f.endsWith(".log"))
        .filter((f) => (selectedDate ? f === `elysia-req-${selectedDate}.log` : true))
        .sort()
        .reverse(); // most recent first
    } catch {
      return { data: [], meta: { limit, page, total: 0, totalPages: 0 } };
    }

    const allEntries: ILogEntry[] = [];

    for (const file of files) {
      const entries = await parseLogFile(join(logDir, file));
      allEntries.push(...entries);
    }

    // sort descending by timestamp
    allEntries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    const filtered = allEntries.filter((entry) => {
      if (selectedDateTime) {
        const entryTimestamp = new Date(entry.ts).getTime();
        const filterTimestamp = selectedDateTime.getTime();

        if (entryTimestamp < filterTimestamp || entryTimestamp >= filterTimestamp + 60_000) {
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
};
