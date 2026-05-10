import { FC, ReactElement } from "react";

import { ExampleA } from "@/src/components";

interface IMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

interface I {
  meta: IMeta;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const AuditPagination: FC<I> = (props): ReactElement =>
  (() => {
    const totalPages = props.meta.totalPages ?? Math.max(1, Math.ceil(props.meta.total / props.meta.pageSize));

    return (
      <div className="flex justify-between">
        <p className="text-xs text-gray-500">
          Page {props.meta.page} of {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span>Page Size</span>
            <select
              onChange={(e) => {
                const nextPageSize = Number(e.target.value);

                if (Number.isNaN(nextPageSize)) {
                  return;
                }

                props.onPageSizeChange(nextPageSize);
              }}
              value={String(props.meta.pageSize)}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <ExampleA color="black" disabled={props.meta.page <= 1} onClick={() => props.onPageChange(props.meta.page - 1)} size="sm" variant="outline">
            Previous
          </ExampleA>

          <ExampleA
            color="blue"
            disabled={props.meta.page >= totalPages}
            onClick={() => props.onPageChange(props.meta.page + 1)}
            size="sm"
            variant="solid"
          >
            Next
          </ExampleA>
        </div>
      </div>
    );
  })();
