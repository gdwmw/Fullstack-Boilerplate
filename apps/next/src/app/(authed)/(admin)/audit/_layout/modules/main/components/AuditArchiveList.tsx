import { ChevronRight } from "lucide-react";
import { FC, ReactElement } from "react";

import { ExampleA, ExampleSelect } from "@/src/components";

interface IArchiveEntry {
  dateKey: string;
  label: string;
}

interface I {
  archiveMonth?: number;
  archives: IArchiveEntry[];
  archiveYear?: number;
  isError: boolean;
  isLoading: boolean;
  monthOptions: { label: string; value: number }[];
  onMonthChange: (month: number | undefined) => void;
  onSelect: (archive: IArchiveEntry) => void;
  onYearChange: (year: number | undefined) => void;
  resolvedSelectedDateKey: null | string;
  yearOptions: number[];
}

export const AuditArchiveList: FC<I> = (props): ReactElement => {
  const archiveContent = () => {
    if (props.isLoading) {
      return <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">Loading archives...</p>;
    }

    if (props.isError) {
      return <p className="py-4 text-center text-xs text-red-500">Failed to load archives.</p>;
    }

    if (props.archives.length === 0) {
      return <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">No audit archives found.</p>;
    }

    return props.archives.map((archive) => {
      const isActive = archive.dateKey === props.resolvedSelectedDateKey;

      return (
        <ExampleA color="blue" key={archive.dateKey} onClick={() => props.onSelect(archive)} size="sm" variant={isActive ? "solid" : "outline"}>
          {archive.label}
          <ChevronRight size={16} />
        </ExampleA>
      );
    });
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 overflow-hidden rounded-lg border border-black px-3 pt-2 pb-3 dark:border-white">
      <div className="border-b border-black pb-2 dark:border-white">
        <h2 className="text-lg font-semibold text-blue-500">Archive</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Choose a date to view logs</p>
      </div>

      <div className="flex flex-col gap-1">
        <ExampleSelect
          color="default"
          label="Year"
          onChange={(e) => {
            props.onYearChange(e.target.value ? Number(e.target.value) : undefined);
          }}
          value={props.archiveYear ?? ""}
        >
          <option className="text-black" value="">
            All Years
          </option>
          {props.yearOptions.map((yearOption) => (
            <option className="text-black" key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </ExampleSelect>

        <ExampleSelect
          color="default"
          label="Month"
          onChange={(e) => {
            props.onMonthChange(e.target.value ? Number(e.target.value) : undefined);
          }}
          value={props.archiveMonth ?? ""}
        >
          <option className="text-black" value="">
            All Months
          </option>
          {props.monthOptions.map((option) => (
            <option className="text-black" key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ExampleSelect>
      </div>

      <div className="mt-1 flex flex-1 flex-col gap-1 overflow-y-auto">{archiveContent()}</div>
    </aside>
  );
};
