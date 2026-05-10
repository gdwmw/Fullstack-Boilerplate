"use client";

import { DehydratedState, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parse } from "date-fns";
import { FC, ReactElement, useEffect, useMemo, useState } from "react";

import { Container, ExampleA, ExampleDatePicker, ExampleInput, ExampleSelect, Header } from "@/src/components";
import { ReactQueryProvider } from "@/src/libs";
import { GETAuditArchives, GETAuditLogs, IAuditArchiveEntry, IAuditLogEntry } from "@/src/utils";

import { AuditDetailModal } from "./batches";
import { AuditArchiveList, AuditPagination, AuditTable } from "./components";

const LEVEL_OPTIONS = ["ERROR", "INFO"] as const;
const METHOD_OPTIONS = ["DELETE", "GET", "PATCH", "POST", "PUT"] as const;
const MONTH_OPTIONS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
] as const;

const formatTimeForQuery = (value: Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  return format(value, "HH:mm");
};

const parseQueryTime = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsedDate = parse(value, "HH:mm", new Date());

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
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear - index), [currentYear]);
  const [page, setPage] = useState(1);
  const [selectedDateKey, setSelectedDateKey] = useState<null | string>(null);
  const [selectedLogRequestId, setSelectedLogRequestId] = useState<null | string>(null);
  const [archiveMonth, setArchiveMonth] = useState<number | undefined>(undefined);
  const [archiveYear, setArchiveYear] = useState<number | undefined>(currentYear);
  const [actor, setActor] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState<"ERROR" | "INFO" | undefined>(undefined);
  const [method, setMethod] = useState<"DELETE" | "GET" | "PATCH" | "POST" | "PUT" | undefined>(undefined);
  const [path, setPath] = useState<string | undefined>(undefined);
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [appliedActor, setAppliedActor] = useState<string | undefined>(undefined);
  const [appliedLevel, setAppliedLevel] = useState<"ERROR" | "INFO" | undefined>(undefined);
  const [appliedMethod, setAppliedMethod] = useState<"DELETE" | "GET" | "PATCH" | "POST" | "PUT" | undefined>(undefined);
  const [appliedPath, setAppliedPath] = useState<string | undefined>(undefined);
  const [appliedStatusCode, setAppliedStatusCode] = useState<number | undefined>(undefined);
  const [appliedTime, setAppliedTime] = useState<string | undefined>(undefined);

  const archiveQuery = useQuery({
    queryFn: async () => {
      const res = await GETAuditArchives({
        month: archiveMonth,
        year: archiveYear,
      });
      return res.data;
    },
    queryKey: ["audit-archives", { month: archiveMonth, year: archiveYear }],
  });

  const archives = useMemo(() => archiveQuery.data ?? [], [archiveQuery.data]);
  const resolvedSelectedDateKey = useMemo(() => {
    if (!selectedDateKey) {
      return null;
    }

    return archives.some((archive) => archive.dateKey === selectedDateKey) ? selectedDateKey : null;
  }, [archives, selectedDateKey]);

  const queryKey = [
    "audit-logs",
    {
      actor: appliedActor,
      archiveDate: resolvedSelectedDateKey,
      level: appliedLevel,
      limit: props.limit,
      method: appliedMethod,
      page,
      path: appliedPath,
      statusCode: appliedStatusCode,
      time: appliedTime,
    },
  ];

  const auditQuery = useQuery({
    enabled: Boolean(resolvedSelectedDateKey),
    queryFn: async () => {
      const res = await GETAuditLogs({
        actor: appliedActor,
        archiveDate: resolvedSelectedDateKey ?? undefined,
        level: appliedLevel,
        limit: props.limit,
        method: appliedMethod,
        page,
        path: appliedPath,
        statusCode: appliedStatusCode,
        time: appliedTime,
      });

      return res.data;
    },
    queryKey,
  });

  const logs = useMemo(() => auditQuery.data?.data ?? [], [auditQuery.data?.data]);
  const meta = auditQuery.data?.meta;
  const selectedLog = useMemo(() => {
    if (!selectedLogRequestId) {
      return null;
    }

    return logs.find((log) => log.requestId === selectedLogRequestId) ?? null;
  }, [logs, selectedLogRequestId]);
  const hasActiveFilters = Boolean(appliedActor || appliedLevel || appliedMethod || appliedPath || appliedStatusCode || appliedTime);
  const hasDraftFilters = Boolean(actor || level || method || path || statusCode || time);
  const hasPendingFilterChanges =
    actor !== appliedActor ||
    time !== appliedTime ||
    level !== appliedLevel ||
    method !== appliedMethod ||
    path !== appliedPath ||
    statusCode !== appliedStatusCode;

  useEffect(() => {
    if (!resolvedSelectedDateKey || !meta || page >= meta.totalPages) {
      return;
    }

    const nextPage = page + 1;

    void queryClient.prefetchQuery({
      queryFn: async () => {
        const res = await GETAuditLogs({
          actor: appliedActor,
          archiveDate: resolvedSelectedDateKey,
          level: appliedLevel,
          limit: props.limit,
          method: appliedMethod,
          page: nextPage,
          path: appliedPath,
          statusCode: appliedStatusCode,
          time: appliedTime,
        });

        return res.data;
      },
      queryKey: [
        "audit-logs",
        {
          actor: appliedActor,
          archiveDate: resolvedSelectedDateKey,
          level: appliedLevel,
          limit: props.limit,
          method: appliedMethod,
          page: nextPage,
          path: appliedPath,
          statusCode: appliedStatusCode,
          time: appliedTime,
        },
      ],
    });
  }, [
    appliedActor,
    appliedLevel,
    appliedMethod,
    appliedPath,
    appliedStatusCode,
    appliedTime,
    meta,
    page,
    props.limit,
    queryClient,
    resolvedSelectedDateKey,
  ]);

  const applyFilters = () => {
    setAppliedActor(actor);
    setAppliedLevel(level);
    setAppliedMethod(method);
    setAppliedPath(path);
    setAppliedStatusCode(statusCode);
    setAppliedTime(time);
    setPage(1);
  };

  const resetFilters = () => {
    setActor(undefined);
    setLevel(undefined);
    setMethod(undefined);
    setPath(undefined);
    setStatusCode(undefined);
    setTime(undefined);
    setAppliedActor(undefined);
    setAppliedLevel(undefined);
    setAppliedMethod(undefined);
    setAppliedPath(undefined);
    setAppliedStatusCode(undefined);
    setAppliedTime(undefined);
    setPage(1);
  };

  const closeModal = () => setSelectedLogRequestId(null);

  const selectArchive = (archive: IAuditArchiveEntry) => {
    setSelectedDateKey(archive.dateKey);
    setSelectedLogRequestId(null);
    setPage(1);
  };

  return (
    <main>
      <Container className={{ innerContainer: "h-full max-h-225 gap-3" }} href="/" label="Home">
        <Header description="Monitor request traffic, trace errors, and filter activity by date, level, method, or path." label="Audit Logs" />

        <div className="flex-1 overflow-auto">
          <div className="flex size-full min-h-172.5 min-w-235 flex-col gap-3">
            <section className="flex flex-col gap-3">
              <div className="flex gap-1">
                <ExampleDatePicker
                  className={{ container: "w-full" }}
                  color="default"
                  dateFormat="HH:mm"
                  label="Time"
                  onChange={(selectedDate: Date | null) => {
                    setTime(formatTimeForQuery(selectedDate));
                  }}
                  placeholderText="HH:mm"
                  selected={parseQueryTime(time)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeFormat="HH:mm"
                  timeIntervals={5}
                />

                <ExampleSelect
                  className={{ container: "w-full" }}
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
                  className={{ container: "w-full" }}
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
                  className={{ container: "w-full" }}
                  color="default"
                  label="Actor"
                  onChange={(e) => {
                    setActor(e.target.value || undefined);
                  }}
                  placeholder="Search..."
                  value={actor ?? ""}
                />

                <ExampleInput
                  className={{ container: "w-full" }}
                  color="default"
                  label="Path"
                  onChange={(e) => {
                    setPath(e.target.value || undefined);
                  }}
                  placeholder="/api/users"
                  value={path ?? ""}
                />

                <ExampleInput
                  className={{ container: "w-full" }}
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

              <div className="ml-auto flex gap-1">
                <ExampleA color="black" disabled={!hasActiveFilters && !hasDraftFilters} onClick={resetFilters} size="sm" variant="outline">
                  Reset
                </ExampleA>

                <ExampleA color="blue" disabled={!hasPendingFilterChanges} onClick={applyFilters} size="sm" variant="solid">
                  Search
                </ExampleA>
              </div>
            </section>

            <section className="flex flex-1 gap-3 overflow-hidden">
              <AuditArchiveList
                archiveMonth={archiveMonth}
                archives={archives}
                archiveYear={archiveYear}
                isError={archiveQuery.isError}
                isLoading={archiveQuery.isLoading}
                monthOptions={[...MONTH_OPTIONS]}
                onMonthChange={(newMonth) => {
                  setArchiveMonth(newMonth);
                  setSelectedDateKey(null);
                  setSelectedLogRequestId(null);
                  setPage(1);
                }}
                onSelect={selectArchive}
                onYearChange={(newYear) => {
                  setArchiveYear(newYear);
                  setSelectedDateKey(null);
                  setSelectedLogRequestId(null);
                  setPage(1);
                }}
                resolvedSelectedDateKey={resolvedSelectedDateKey}
                yearOptions={yearOptions}
              />

              <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                <AuditTable
                  isLoading={auditQuery.isLoading}
                  logs={logs as IAuditLogEntry[]}
                  onDetailClick={setSelectedLogRequestId}
                  resolvedSelectedDateKey={resolvedSelectedDateKey}
                />

                {resolvedSelectedDateKey && meta && meta.totalPages > 1 && (
                  <AuditPagination meta={{ page: meta.page, totalPages: meta.totalPages }} onPageChange={setPage} />
                )}
              </div>
            </section>
          </div>
        </div>

        <AuditDetailModal onClose={closeModal} selectedLog={selectedLog} />
      </Container>
    </main>
  );
};
