"use client";

import { X } from "lucide-react";
import { FC, ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";

import { ExampleA } from "@/src/components/elements/example/A/ExampleA";
import { Container } from "@/src/components/templates/Container";
import { Header } from "@/src/components/templates/Header";
import { IAuditLogEntry } from "@/src/utils/api/audit";

import {
  durationClassName,
  getBrowserName,
  getDisplayIp,
  getOSName,
  levelClassName,
  methodClassName,
  statusClassName,
} from "../../components/AuditTable";

type TAuditPayload = null | Record<string, unknown>;
type TAuditUser = IAuditLogEntry["users"];

const stringifyLogValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
};

const DetailMetaItem: FC<{ label: string; value: ReactNode | string }> = (props): ReactElement => (
  <div className="flex h-25 flex-col gap-1 rounded-lg border border-black bg-black/5 p-3 dark:border-white dark:bg-white/5">
    <h3 className="text-xs font-semibold tracking-widest text-blue-500">{props.label}</h3>
    <p className="line-clamp-3 text-xs text-black/80 dark:text-white/80">{props.value}</p>
  </div>
);

const DetailBlock: FC<{ children: string; title: string }> = (props): ReactElement => (
  <section className="flex flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-black bg-black/5 p-3 dark:border-white dark:bg-white/5">
    <h3 className="text-xs font-semibold tracking-widest text-blue-500">{props.title}</h3>
    <pre className="flex-1 overflow-auto rounded-md border border-black/10 bg-black/5 p-3 font-mono text-xs leading-relaxed text-black/90 dark:border-white/10 dark:bg-white/5 dark:text-white/90">
      {props.children}
    </pre>
  </section>
);

interface I {
  onClose: () => void;
  selectedLog: IAuditLogEntry | null;
}

export const AuditDetailModal: FC<I> = (props): null | ReactElement => {
  if (!props.selectedLog || typeof document === "undefined") {
    return null;
  }

  const selectedLogBrowser = getBrowserName(props.selectedLog.userAgent ?? "");
  const selectedLogOs = getOSName(props.selectedLog.userAgent ?? "");
  const selectedLogIp = getDisplayIp(props.selectedLog.ip ?? "");
  const selectedLogPayload = stringifyLogValue((props.selectedLog as { payload?: TAuditPayload } & IAuditLogEntry).payload ?? null);
  const selectedLogUser = stringifyLogValue((props.selectedLog as { users?: TAuditUser } & IAuditLogEntry).users ?? null);

  return createPortal(
    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm dark:bg-white/5">
      <Container className={{ innerContainer: "h-full max-h-200 max-w-350 gap-3" }} href="" label="">
        <div className="flex items-start justify-between">
          <Header
            className={{ label: "flex items-center" }}
            description="Inspect metadata, payload, user snapshot, and error detail for this request."
            label={["Audit Detail", "-", props.selectedLog.path].join(" ")}
          />

          <ExampleA color="black" onClick={props.onClose} size="sm" variant="ghost">
            <X size={20} />
          </ExampleA>
        </div>

        <div className="flex gap-1">
          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              levelClassName(props.selectedLog.level),
            ].join(" ")}
          >
            {props.selectedLog.level}
          </span>

          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              methodClassName(props.selectedLog.method),
            ].join(" ")}
          >
            {props.selectedLog.method}
          </span>

          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              statusClassName(props.selectedLog.statusCode),
            ].join(" ")}
          >
            {props.selectedLog.statusCode}
          </span>

          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              durationClassName(props.selectedLog.durationMs),
            ].join(" ")}
          >
            {props.selectedLog.durationMs} ms
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex size-full min-h-165.5 min-w-235 flex-col gap-3">
            <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden">
              <section className="flex flex-col gap-2 overflow-hidden text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <DetailMetaItem label="TIMESTAMP" value={props.selectedLog.ts} />
                  <DetailMetaItem label="BROWSER/OS" value={`${selectedLogBrowser} • ${selectedLogOs}`} />
                  <DetailMetaItem label="IP ADDRESS" value={<span className="break-all">{selectedLogIp}</span>} />
                </div>

                <DetailBlock title="USER SNAPSHOT">{selectedLogUser}</DetailBlock>
                <DetailBlock title="ERROR">{props.selectedLog.error ?? "-"}</DetailBlock>
              </section>

              <section className="flex flex-col gap-2 overflow-hidden text-sm">
                <DetailBlock title="PAYLOAD">{selectedLogPayload}</DetailBlock>
              </section>
            </div>
          </div>
        </div>
      </Container>

      <button aria-hidden onClick={props.onClose} type="button" />
    </div>,
    document.body,
  );
};
