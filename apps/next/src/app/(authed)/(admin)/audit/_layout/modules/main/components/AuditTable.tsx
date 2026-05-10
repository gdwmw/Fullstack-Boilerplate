import { format, isValid } from "date-fns";
import { FC, ReactElement } from "react";

import { ExampleA } from "@/src/components";

interface ILogEntry {
  durationMs: number;
  ip: string;
  level: "ERROR" | "INFO";
  method: string;
  path: string;
  requestId: string;
  statusCode: number;
  ts: string;
  userAgent: string;
}

const formatLogTimestamp = (value: string): string => {
  const date = new Date(value);

  if (!isValid(date)) {
    return value;
  }

  return format(date, "dd MMM yyyy, HH:mm:ss");
};

export const getBrowserName = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();

  if (!ua || ua === "unknown") {
    return "Unknown";
  }

  if (ua.includes("edg/") || ua.includes("edge/")) {
    return "Edge";
  }

  if (ua.includes("opr/") || ua.includes("opera")) {
    return "Opera";
  }

  if (ua.includes("firefox/") || ua.includes("fxios/")) {
    return "Firefox";
  }

  if (ua.includes("crios/") || ua.includes("chrome/")) {
    return "Chrome";
  }

  if (ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/")) {
    return "Safari";
  }

  if (ua.includes("msie") || ua.includes("trident/")) {
    return "Internet Explorer";
  }

  return "Other";
};

export const getDisplayIp = (ip: string): string => {
  const rawIp = ip.trim();

  if (!rawIp || rawIp.toLowerCase() === "unknown") {
    return "Unknown";
  }

  const firstForwardedIp = rawIp.includes(",") ? rawIp.split(",")[0]?.trim() : rawIp;

  if (!firstForwardedIp) {
    return "Unknown";
  }

  if (firstForwardedIp.startsWith("::ffff:")) {
    return firstForwardedIp.replace("::ffff:", "");
  }

  return firstForwardedIp;
};

export const levelClassName = (level: ILogEntry["level"]): string => {
  if (level === "ERROR") {
    return "bg-red-500 text-white";
  }

  if (level === "INFO") {
    return "bg-blue-500 text-white";
  }

  return "bg-zinc-500 text-white";
};

export const methodClassName = (method: string): string => {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET") {
    return "bg-emerald-600 text-white";
  }

  if (normalizedMethod === "POST") {
    return "bg-blue-600 text-white";
  }

  if (normalizedMethod === "PUT") {
    return "bg-amber-500 text-black";
  }

  if (normalizedMethod === "PATCH") {
    return "bg-violet-600 text-white";
  }

  if (normalizedMethod === "DELETE") {
    return "bg-red-600 text-white";
  }

  return "bg-zinc-500 text-white";
};

export const statusClassName = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) {
    return "bg-emerald-600 text-white";
  }

  if (statusCode >= 300 && statusCode < 400) {
    return "bg-sky-500 text-white";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "bg-amber-500 text-black";
  }

  if (statusCode >= 500) {
    return "bg-red-600 text-white";
  }

  return "bg-zinc-500 text-white";
};

export const durationClassName = (durationMs: number): string => {
  if (durationMs < 100) {
    return "bg-emerald-600 text-white";
  }

  if (durationMs < 500) {
    return "bg-amber-500 text-black";
  }

  return "bg-red-600 text-white";
};

interface I {
  isLoading: boolean;
  logs: ILogEntry[];
  onDetailClick: (requestId: string) => void;
  resolvedSelectedDateKey: null | string;
}

export const AuditTable: FC<I> = (props): ReactElement => (
  <section className="flex-1 overflow-auto rounded-lg border border-black text-sm dark:border-white">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-black bg-black/5 text-center dark:border-white dark:bg-white/5 [&>th]:px-3 [&>th]:py-2.5 [&>th]:font-semibold">
          <th className="max-w-44 min-w-44 text-left">Timestamp</th>
          <th className="max-w-20 min-w-20">Level</th>
          <th className="max-w-20 min-w-20">Method</th>
          <th className="max-w-64 min-w-64 text-left">Path</th>
          <th className="max-w-18 min-w-18">Status</th>
          <th className="max-w-32 min-w-32">IP</th>
          <th className="max-w-24 min-w-24">Duration</th>
          <th className="max-w-35 min-w-35">Detail</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-black/10 dark:divide-white/10">
        {!props.resolvedSelectedDateKey ? (
          <tr>
            <td className="px-3 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
              Choose an archive from the sidebar to load entries.
            </td>
          </tr>
        ) : props.logs.length === 0 && !props.isLoading ? (
          <tr>
            <td className="px-3 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
              No audit logs found.
            </td>
          </tr>
        ) : (
          props.logs.map((log) => (
            <tr className="hover:bg-black/5 dark:hover:bg-white/5 [&>td]:px-3 [&>td]:py-2" key={log.requestId}>
              <td className="max-w-44 min-w-44">
                <p>{formatLogTimestamp(log.ts)}</p>
                <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">{log.requestId}</p>
              </td>
              <td className="max-w-20 min-w-20 text-center">
                <span className={["block rounded-full px-2 py-0.5 text-xs font-semibold", levelClassName(log.level)].join(" ")}>{log.level}</span>
              </td>
              <td className="max-w-20 min-w-20 text-center">
                <span className={["block rounded-full px-2 py-0.5 text-xs font-semibold", methodClassName(log.method)].join(" ")}>{log.method}</span>
              </td>
              <td className="max-w-64 min-w-64">
                <p className="truncate">{log.path}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{getBrowserName(log.userAgent)}</p>
              </td>
              <td className="max-w-18 min-w-18 text-center">
                <span className={["block rounded-full px-2 py-0.5 text-xs font-semibold", statusClassName(log.statusCode)].join(" ")}>
                  {log.statusCode}
                </span>
              </td>
              <td className="max-w-32 min-w-32 text-center">
                <p className="truncate">{getDisplayIp(log.ip)}</p>
              </td>
              <td className="max-w-24 min-w-24 text-center">
                <span className={["block rounded-full px-2 py-0.5 text-xs font-semibold", durationClassName(log.durationMs)].join(" ")}>
                  {log.durationMs} ms
                </span>
              </td>
              <td className="max-w-35 min-w-35 text-center">
                <ExampleA className="w-full" color="blue" onClick={() => props.onDetailClick(log.requestId)} size="sm" variant="outline">
                  Detail
                </ExampleA>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </section>
);
