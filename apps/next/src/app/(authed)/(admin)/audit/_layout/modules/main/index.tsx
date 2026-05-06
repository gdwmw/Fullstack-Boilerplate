"use client";

import { DehydratedState, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parse } from "date-fns";
import { FC, ReactElement, useEffect, useState } from "react";

import { ExampleATWM, ExampleDatePicker, ExampleInput, ExampleSelect, FormContainer } from "@/src/components";
import { ReactQueryProvider } from "@/src/libs";
import { GETAuditLogs, IAuditLogEntry } from "@/src/utils";

const LEVEL_OPTIONS = ["INFO", "ERROR"] as const;
const METHOD_OPTIONS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const getStatusCodeClassName = (statusCode: number): string => {
  if (statusCode >= 500) {
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  }

  if (statusCode >= 400) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  }

  if (statusCode >= 300) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  }

  return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";
};

const formatDateForQuery = (value: Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  return format(value, "dd-MM-yyyy HH:mm");
};

const parseQueryDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsedDate = parse(value, "dd-MM-yyyy HH:mm", new Date());

  if (!isValid(parsedDate)) {
    return null;
  }

  return parsedDate;
};

interface I {
  dehydratedState: DehydratedState;
  limit: number;
}

export const Main: FC<I> = (props): ReactElement => (
  <ReactQueryProvider dehydratedState={props.dehydratedState}>
    <MainContent limit={props.limit} />
  </ReactQueryProvider>
);

interface IMainContent {
  limit: number;
}

const MainContent: FC<IMainContent> = (props): ReactElement => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<"ERROR" | "INFO" | undefined>(undefined);
  const [method, setMethod] = useState<"DELETE" | "GET" | "PATCH" | "POST" | "PUT" | undefined>(undefined);
  const [path, setPath] = useState<string | undefined>(undefined);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [dateTime, setDateTime] = useState<string | undefined>(undefined);
  const [appliedLevel, setAppliedLevel] = useState<"ERROR" | "INFO" | undefined>(undefined);
  const [appliedMethod, setAppliedMethod] = useState<"DELETE" | "GET" | "PATCH" | "POST" | "PUT" | undefined>(undefined);
  const [appliedPath, setAppliedPath] = useState<string | undefined>(undefined);
  const [appliedStatusCode, setAppliedStatusCode] = useState<number | undefined>(undefined);
  const [appliedDateTime, setAppliedDateTime] = useState<string | undefined>(undefined);

  const queryKey = [
    "audit-logs",
    {
      dateTime: appliedDateTime,
      level: appliedLevel,
      limit: props.limit,
      method: appliedMethod,
      page,
      path: appliedPath,
      statusCode: appliedStatusCode,
    },
  ];

  const auditQuery = useQuery({
    queryFn: async () => {
      const res = await GETAuditLogs({
        dateTime: appliedDateTime,
        level: appliedLevel,
        limit: props.limit,
        method: appliedMethod,
        page,
        path: appliedPath,
        statusCode: appliedStatusCode,
      });
      return res.data;
    },
    queryKey,
  });

  const logs = auditQuery.data?.data ?? [];
  const meta = auditQuery.data?.meta;
  const hasActiveFilters = Boolean(appliedDateTime || appliedLevel || appliedMethod || appliedPath || appliedStatusCode);
  const hasDraftFilters = Boolean(dateTime || level || method || path || statusCode);
  const hasPendingFilterChanges =
    dateTime !== appliedDateTime || level !== appliedLevel || method !== appliedMethod || path !== appliedPath || statusCode !== appliedStatusCode;

  useEffect(() => {
    if (!meta || page >= meta.totalPages) {
      return;
    }

    const nextPage = page + 1;

    void queryClient.prefetchQuery({
      queryFn: async () => {
        const res = await GETAuditLogs({
          dateTime: appliedDateTime,
          level: appliedLevel,
          limit: props.limit,
          method: appliedMethod,
          page: nextPage,
          path: appliedPath,
          statusCode: appliedStatusCode,
        });

        return res.data;
      },
      queryKey: [
        "audit-logs",
        {
          dateTime: appliedDateTime,
          level: appliedLevel,
          limit: props.limit,
          method: appliedMethod,
          page: nextPage,
          path: appliedPath,
          statusCode: appliedStatusCode,
        },
      ],
    });
  }, [appliedDateTime, appliedLevel, appliedMethod, appliedPath, appliedStatusCode, props.limit, meta, page, queryClient]);

  const applyFilters = () => {
    setAppliedDateTime(dateTime);
    setAppliedLevel(level);
    setAppliedMethod(method);
    setAppliedPath(path);
    setAppliedStatusCode(statusCode);
    setPage(1);
  };

  const resetFilters = () => {
    setDateTime(undefined);
    setLevel(undefined);
    setMethod(undefined);
    setPath(undefined);
    setStatusCode(undefined);
    setAppliedDateTime(undefined);
    setAppliedLevel(undefined);
    setAppliedMethod(undefined);
    setAppliedPath(undefined);
    setAppliedStatusCode(undefined);
    setPage(1);
  };

  return (
    <main>
      <FormContainer className={{ innerContainer: "h-[calc(100dvh-2.5rem)] max-w-7xl flex-col gap-4 overflow-auto" }} href="/" label="Home">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-blue-500">Audit Logs</h1>
              <p className="max-w-2xl text-sm tracking-wide dark:text-white">
                Monitor request traffic, trace errors, and filter activity by date, level, method, or path.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-900/60">
                <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 uppercase dark:text-gray-400">Records</p>
                <p className="text-lg font-semibold">{meta?.total ?? logs.length}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-900/60">
                <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 uppercase dark:text-gray-400">Page</p>
                <p className="text-lg font-semibold">{meta?.page ?? page}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-900/60">
                <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 uppercase dark:text-gray-400">Per Page</p>
                <p className="text-lg font-semibold">{props.limit}</p>
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-600 dark:bg-gray-900/40">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <ExampleDatePicker
                className={{ container: "z-20" }}
                color="default"
                dateFormat="dd-MM-yyyy HH:mm"
                label="Date & Time"
                onChange={(selectedDate: Date | null) => {
                  setDateTime(formatDateForQuery(selectedDate));
                }}
                placeholderText="DD-MM-YYYY HH:mm"
                selected={parseQueryDate(dateTime)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
              />

              <ExampleSelect
                color="default"
                label="Level"
                onChange={(e) => {
                  setLevel((e.target.value as "ERROR" | "INFO") || undefined);
                }}
                value={level ?? ""}
              >
                <option className="text-black" value="">
                  All Levels
                </option>
                {LEVEL_OPTIONS.map((option) => (
                  <option className="text-black" key={option} value={option}>
                    {option}
                  </option>
                ))}
              </ExampleSelect>

              <ExampleSelect
                color="default"
                label="Method"
                onChange={(e) => {
                  setMethod((e.target.value as "DELETE" | "GET" | "PATCH" | "POST" | "PUT") || undefined);
                }}
                value={method ?? ""}
              >
                <option className="text-black" value="">
                  All Methods
                </option>
                {METHOD_OPTIONS.map((option) => (
                  <option className="text-black" key={option} value={option}>
                    {option}
                  </option>
                ))}
              </ExampleSelect>

              <ExampleInput
                color="default"
                label="Path"
                onChange={(e) => {
                  setPath(e.target.value || undefined);
                }}
                placeholder="/api/users"
                value={path ?? ""}
              />

              <ExampleInput
                color="default"
                label="Status"
                max={599}
                min={100}
                onChange={(e) => {
                  setStatusCode(e.target.value ? Number(e.target.value) : undefined);
                }}
                placeholder="200"
                type="number"
                value={statusCode ?? ""}
              />
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{auditQuery.isLoading ? "Loading audit logs..." : `Showing ${logs.length} row${logs.length === 1 ? "" : "s"}`}</span>
                {auditQuery.isFetching && !auditQuery.isLoading && <span>Refreshing data...</span>}
                {auditQuery.isError && <span className="font-medium text-red-600">Failed to load audit logs.</span>}
              </div>

              <div className="flex gap-2">
                <button
                  className={ExampleATWM({ className: "w-full px-4 sm:w-fit", color: "blue", size: "sm", variant: "solid" })}
                  disabled={!hasPendingFilterChanges}
                  onClick={applyFilters}
                  type="button"
                >
                  Search
                </button>

                <button
                  className={ExampleATWM({ className: "w-full px-4 sm:w-fit", color: "black", size: "sm", variant: "outline" })}
                  disabled={!hasActiveFilters && !hasDraftFilters}
                  onClick={resetFilters}
                  type="button"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </section>
        </header>

        <section className="size-full max-h-132 min-h-132 flex-1 overflow-hidden rounded-lg border border-blue-500">
          <div className="size-full max-w-full overflow-auto">
            <table className="max-w-384 min-w-6xl border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-blue-50 dark:bg-gray-900">
                <tr>
                  <th className="max-w-60 min-w-60 border-b border-blue-100 px-4 py-3 font-semibold whitespace-nowrap dark:border-gray-700">
                    Timestamp
                  </th>
                  <th className="max-w-20 min-w-20 border-b border-blue-100 px-4 py-3 text-center font-semibold whitespace-nowrap dark:border-gray-700">
                    Level
                  </th>
                  <th className="max-w-21 min-w-21 border-b border-blue-100 px-4 py-3 text-center font-semibold whitespace-nowrap dark:border-gray-700">
                    Method
                  </th>
                  <th className="max-w-72 min-w-72 border-b border-blue-100 px-4 py-3 font-semibold whitespace-nowrap dark:border-gray-700">Path</th>
                  <th className="max-w-18 min-w-18 border-b border-blue-100 px-4 py-3 text-center font-semibold whitespace-nowrap dark:border-gray-700">
                    Status
                  </th>
                  <th className="max-w-40 min-w-40 border-b border-blue-100 px-4 py-3 font-semibold whitespace-nowrap dark:border-gray-700">IP</th>
                  <th className="max-w-23 min-w-23 border-b border-blue-100 px-4 py-3 text-center font-semibold whitespace-nowrap dark:border-gray-700">
                    Duration
                  </th>
                  <th className="max-w-72 min-w-72 border-b border-blue-100 px-4 py-3 font-semibold whitespace-nowrap dark:border-gray-700">Error</th>
                </tr>
              </thead>

              <tbody>
                {logs.length === 0 && !auditQuery.isLoading && !auditQuery.isFetching ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={8}>
                      No audit logs found.
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log: IAuditLogEntry) => (
                    <tr className="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-900/80" key={log.requestId}>
                      <td className="max-w-60 min-w-60 border-b border-gray-200 px-4 py-3 align-top whitespace-nowrap dark:border-gray-700">
                        <div className="font-medium">{new Date(log.ts).toLocaleString()}</div>
                        <div className="truncate text-xs text-gray-500 dark:text-gray-400">{log.requestId}</div>
                      </td>
                      <td className="max-w-20 min-w-20 border-b border-gray-200 px-4 py-3 text-center align-top dark:border-gray-700">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            log.level === "ERROR"
                              ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                          }`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="max-w-21 min-w-21 border-b border-gray-200 px-4 py-3 text-center align-top dark:border-gray-700">
                        <span className="font-mono text-xs font-semibold tracking-wide">{log.method}</span>
                      </td>
                      <td className="max-w-72 min-w-72 border-b border-gray-200 px-4 py-3 align-top dark:border-gray-700">
                        <div className="font-mono text-xs break-all text-gray-700 dark:text-gray-200">{log.path}</div>
                        <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{log.userAgent}</div>
                      </td>
                      <td className="max-w-18 min-w-18 border-b border-gray-200 px-4 py-3 text-center align-top dark:border-gray-700">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusCodeClassName(log.statusCode)}`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="max-w-40 min-w-40 border-b border-gray-200 px-4 py-3 align-top font-mono text-xs dark:border-gray-700">
                        {log.ip}
                      </td>
                      <td className="max-w-23 min-w-23 border-b border-gray-200 px-4 py-3 text-center align-top whitespace-nowrap dark:border-gray-700">
                        {log.durationMs} ms
                      </td>
                      <td className="max-w-72 min-w-72 border-b border-gray-200 px-4 py-3 align-top dark:border-gray-700">
                        <div className="text-xs break-all text-gray-600 dark:text-gray-300">{log.error ?? "-"}</div>
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {meta.page} of {meta.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                className={ExampleATWM({ className: "w-full px-4 sm:w-fit", color: "black", disabled: page <= 1, size: "sm", variant: "outline" })}
                disabled={page <= 1}
                onClick={() => setPage((previousPage) => previousPage - 1)}
                type="button"
              >
                Previous
              </button>

              <button
                className={ExampleATWM({
                  className: "w-full px-4 sm:w-fit",
                  color: "blue",
                  disabled: page >= meta.totalPages,
                  size: "sm",
                  variant: "solid",
                })}
                disabled={page >= meta.totalPages}
                onClick={() => setPage((previousPage) => previousPage + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </FormContainer>
    </main>
  );
};
