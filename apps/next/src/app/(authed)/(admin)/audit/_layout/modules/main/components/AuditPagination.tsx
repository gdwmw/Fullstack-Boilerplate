import { FC, ReactElement } from "react";

import { ExampleA } from "@/src/components";

interface IMeta {
  page: number;
  totalPages: number;
}

interface I {
  meta: IMeta;
  onPageChange: (newPage: number) => void;
}

export const AuditPagination: FC<I> = (props): ReactElement => (
  <div className="flex justify-between">
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Page {props.meta.page} of {props.meta.totalPages}
    </p>

    <div className="flex items-center gap-2">
      <ExampleA color="black" disabled={props.meta.page <= 1} onClick={() => props.onPageChange(props.meta.page - 1)} size="sm" variant="outline">
        Previous
      </ExampleA>

      <ExampleA
        color="blue"
        disabled={props.meta.page >= props.meta.totalPages}
        onClick={() => props.onPageChange(props.meta.page + 1)}
        size="sm"
        variant="solid"
      >
        Next
      </ExampleA>
    </div>
  </div>
);
