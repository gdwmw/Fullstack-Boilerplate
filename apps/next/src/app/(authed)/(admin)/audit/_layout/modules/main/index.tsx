"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { FC, ReactElement, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Container, ExampleA, ExampleDatePicker, ExampleInput, ExampleSelect, Header } from "@/src/components";
import { useModal } from "@/src/hooks";
import { GETAuditArchives, GETAuditLogs, IAuditArchiveEntry } from "@/src/utils";

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

interface IFilterFormValues {
  actor: string;
  level: "" | "ERROR" | "INFO";
  method: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  path: string;
  statusCode: string;
  timeFrom: Date | null;
  timeTo: Date | null;
}

interface IAppliedFilters {
  actor?: string;
  level?: "ERROR" | "INFO";
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  path?: string;
  statusCode?: number;
  timeFrom?: string;
  timeTo?: string;
}

const FILTER_DEFAULT_VALUES: IFilterFormValues = {
  actor: "",
  level: "",
  method: "",
  path: "",
  statusCode: "",
  timeFrom: null,
  timeTo: null,
};

interface I {
  defaultPageSize: number;
}

export const Main: FC<I> = (props): ReactElement => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear - index), [currentYear]);
  const { control, handleSubmit, register, reset } = useForm<IFilterFormValues>({
    defaultValues: FILTER_DEFAULT_VALUES,
  });
  const detailModal = useModal();
  const [page, setPage] = useState(1);
  const [selectedDateKey, setSelectedDateKey] = useState<null | string>(null);
  const [selectedLogRequestId, setSelectedLogRequestId] = useState<null | string>(null);
  const [archiveMonth, setArchiveMonth] = useState<number | undefined>(undefined);
  const [archiveYear, setArchiveYear] = useState<number | undefined>(currentYear);
  const [pageSize, setPageSize] = useState<number>(props.defaultPageSize);
  const [appliedFilters, setAppliedFilters] = useState<IAppliedFilters>({});

  const filterValues = useWatch({ control });
  const draftFilters = useMemo<IAppliedFilters>(() => {
    const normalizedActor = (filterValues.actor ?? "").trim();
    const normalizedPath = (filterValues.path ?? "").trim();
    const parsedStatusCode = filterValues.statusCode ? Number(filterValues.statusCode) : undefined;

    return {
      actor: normalizedActor || undefined,
      level: filterValues.level || undefined,
      method: filterValues.method || undefined,
      path: normalizedPath || undefined,
      statusCode: parsedStatusCode !== undefined && Number.isNaN(parsedStatusCode) ? undefined : parsedStatusCode,
      timeFrom: formatTimeForQuery(filterValues.timeFrom ?? null),
      timeTo: formatTimeForQuery(filterValues.timeTo ?? null),
    };
  }, [filterValues]);

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
      actor: appliedFilters.actor,
      archiveDate: resolvedSelectedDateKey,
      level: appliedFilters.level,
      method: appliedFilters.method,
      page,
      pageSize,
      path: appliedFilters.path,
      statusCode: appliedFilters.statusCode,
      timeFrom: appliedFilters.timeFrom,
      timeTo: appliedFilters.timeTo,
    },
  ];

  const auditQuery = useQuery({
    enabled: Boolean(resolvedSelectedDateKey),
    queryFn: async () => {
      const res = await GETAuditLogs({
        actor: appliedFilters.actor,
        archiveDate: resolvedSelectedDateKey ?? undefined,
        level: appliedFilters.level,
        method: appliedFilters.method,
        page,
        pageSize,
        path: appliedFilters.path,
        statusCode: appliedFilters.statusCode,
        timeFrom: appliedFilters.timeFrom,
        timeTo: appliedFilters.timeTo,
      });

      return res;
    },
    queryKey,
  });

  const logs = useMemo(() => auditQuery.data?.data ?? [], [auditQuery.data?.data]);
  const meta = auditQuery.data?.meta;
  const totalPage = useMemo(() => {
    if (!meta) {
      return 0;
    }

    return meta.totalPage ?? Math.max(1, Math.ceil(meta.totalData / meta.pageSize));
  }, [meta]);
  const selectedLog = useMemo(() => {
    if (!selectedLogRequestId) {
      return null;
    }

    return logs.find((log) => log.requestId === selectedLogRequestId) ?? null;
  }, [logs, selectedLogRequestId]);
  const hasActiveFilters = Boolean(
    appliedFilters.actor ||
    appliedFilters.level ||
    appliedFilters.method ||
    appliedFilters.path ||
    appliedFilters.statusCode ||
    appliedFilters.timeFrom ||
    appliedFilters.timeTo,
  );
  const hasDraftFilters = Boolean(
    draftFilters.actor ||
    draftFilters.level ||
    draftFilters.method ||
    draftFilters.path ||
    draftFilters.statusCode ||
    draftFilters.timeFrom ||
    draftFilters.timeTo,
  );
  const hasPendingFilterChanges =
    draftFilters.actor !== appliedFilters.actor ||
    draftFilters.timeFrom !== appliedFilters.timeFrom ||
    draftFilters.timeTo !== appliedFilters.timeTo ||
    draftFilters.level !== appliedFilters.level ||
    draftFilters.method !== appliedFilters.method ||
    draftFilters.path !== appliedFilters.path ||
    draftFilters.statusCode !== appliedFilters.statusCode;

  useEffect(() => {
    if (!resolvedSelectedDateKey || !meta || page >= totalPage) {
      return;
    }

    const nextPage = page + 1;

    queryClient.prefetchQuery({
      queryFn: async () => {
        const res = await GETAuditLogs({
          actor: appliedFilters.actor,
          archiveDate: resolvedSelectedDateKey,
          level: appliedFilters.level,
          method: appliedFilters.method,
          page: nextPage,
          pageSize,
          path: appliedFilters.path,
          statusCode: appliedFilters.statusCode,
          timeFrom: appliedFilters.timeFrom,
          timeTo: appliedFilters.timeTo,
        });

        return res;
      },
      queryKey: [
        "audit-logs",
        {
          actor: appliedFilters.actor,
          archiveDate: resolvedSelectedDateKey,
          level: appliedFilters.level,
          method: appliedFilters.method,
          page: nextPage,
          pageSize,
          path: appliedFilters.path,
          statusCode: appliedFilters.statusCode,
          timeFrom: appliedFilters.timeFrom,
          timeTo: appliedFilters.timeTo,
        },
      ],
    });
  }, [
    appliedFilters.actor,
    appliedFilters.level,
    appliedFilters.method,
    appliedFilters.path,
    appliedFilters.statusCode,
    appliedFilters.timeFrom,
    appliedFilters.timeTo,
    meta,
    page,
    pageSize,
    queryClient,
    resolvedSelectedDateKey,
    totalPage,
  ]);

  const applyFilters = handleSubmit(() => {
    setAppliedFilters(draftFilters);
    setPage(1);
  });

  const resetFilters = () => {
    reset(FILTER_DEFAULT_VALUES);
    setAppliedFilters({});
    setPage(1);
  };

  const closeModal = () => {
    detailModal.close();
    setSelectedLogRequestId(null);
  };

  const openModal = (requestId: string) => {
    setSelectedLogRequestId(requestId);
    detailModal.open();
  };

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
                <Controller
                  control={control}
                  name="timeFrom"
                  render={({ field }) => (
                    <ExampleDatePicker
                      className={{ container: "w-full" }}
                      color="default"
                      dateFormat="HH:mm"
                      label="Time From"
                      onChange={(selectedDate: Date | null) => {
                        field.onChange(selectedDate);
                      }}
                      placeholderText="HH:mm"
                      selected={field.value}
                      showTimeSelect
                      showTimeSelectOnly
                      timeFormat="HH:mm"
                      timeIntervals={5}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="timeTo"
                  render={({ field }) => (
                    <ExampleDatePicker
                      className={{ container: "w-full" }}
                      color="default"
                      dateFormat="HH:mm"
                      label="Time To"
                      onChange={(selectedDate: Date | null) => {
                        field.onChange(selectedDate);
                      }}
                      placeholderText="HH:mm"
                      selected={field.value}
                      showTimeSelect
                      showTimeSelectOnly
                      timeFormat="HH:mm"
                      timeIntervals={5}
                    />
                  )}
                />

                <ExampleSelect className={{ container: "w-full" }} color="default" label="Level" {...register("level")}>
                  <option className="text-black" value="">
                    All Levels
                  </option>
                  {LEVEL_OPTIONS.map((option) => (
                    <option className="text-black" key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </ExampleSelect>

                <ExampleSelect className={{ container: "w-full" }} color="default" label="Method" {...register("method")}>
                  <option className="text-black" value="">
                    All Methods
                  </option>
                  {METHOD_OPTIONS.map((option) => (
                    <option className="text-black" key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </ExampleSelect>

                <ExampleInput className={{ container: "w-full" }} color="default" label="Actor" placeholder="Search..." {...register("actor")} />

                <ExampleInput className={{ container: "w-full" }} color="default" label="Path" placeholder="/api/users" {...register("path")} />

                <ExampleInput
                  className={{ container: "w-full" }}
                  color="default"
                  label="Status"
                  max={599}
                  min={100}
                  placeholder="200"
                  type="number"
                  {...register("statusCode")}
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
                  detailModal.close();
                  setPage(1);
                }}
                onSelect={selectArchive}
                onYearChange={(newYear) => {
                  setArchiveYear(newYear);
                  setSelectedDateKey(null);
                  setSelectedLogRequestId(null);
                  detailModal.close();
                  setPage(1);
                }}
                resolvedSelectedDateKey={resolvedSelectedDateKey}
                yearOptions={yearOptions}
              />

              <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                <AuditTable
                  isLoading={auditQuery.isLoading}
                  logs={logs}
                  onDetailClick={openModal}
                  resolvedSelectedDateKey={resolvedSelectedDateKey}
                />

                {resolvedSelectedDateKey && meta && (
                  <AuditPagination
                    meta={{ page: meta.page, pageSize: meta.pageSize, totalData: meta.totalData, totalPage: meta.totalPage }}
                    onPageChange={setPage}
                    onPageSizeChange={(nextPageSize) => {
                      setPageSize(nextPageSize);
                      setPage(1);
                    }}
                  />
                )}
              </div>
            </section>
          </div>
        </div>

        <AuditDetailModal onClose={closeModal} selectedLog={detailModal.isOpen ? selectedLog : null} />
      </Container>
    </main>
  );
};
