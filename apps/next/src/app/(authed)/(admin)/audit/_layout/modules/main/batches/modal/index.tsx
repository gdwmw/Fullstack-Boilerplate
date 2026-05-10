"use client";

import { X } from "lucide-react";
import { FC, ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";

import { Container, ExampleA, Header } from "@/src/components";
import { IAuditLogEntry } from "@/src/utils";

import { durationClassName, levelClassName, methodClassName, statusClassName } from "../../components";

interface IAuditDetailModal {
  onClose: () => void;
  selectedLog: IAuditLogEntry | null;
}

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

const DetailMetaItem: FC<{ label: string; value: ReactNode | string }> = ({ label, value }): ReactElement => (
  <div className="flex h-25 flex-col gap-1 rounded-lg border border-black bg-black/5 p-3 dark:border-white dark:bg-white/5">
    <h3 className="text-xs font-semibold tracking-widest text-blue-500">{label}</h3>
    <p className="line-clamp-3 text-xs text-black/80 dark:text-white/80">{value}</p>
  </div>
);

const DetailBlock: FC<{ children: string; title: string }> = ({ children, title }): ReactElement => (
  <section className="flex flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-black bg-black/5 p-3 dark:border-white dark:bg-white/5">
    <h3 className="text-xs font-semibold tracking-widest text-blue-500">{title}</h3>
    <pre className="flex-1 overflow-auto rounded-md border border-black/10 bg-black/5 p-3 font-mono text-xs leading-relaxed text-black/90 dark:border-white/10 dark:bg-white/5 dark:text-white/90">
      {children}
    </pre>
  </section>
);

export const AuditDetailModal: FC<IAuditDetailModal> = ({ onClose, selectedLog }): null | ReactElement => {
  if (!selectedLog || typeof document === "undefined") {
    return null;
  }

  const selectedLogPayload = stringifyLogValue((selectedLog as { payload?: TAuditPayload } & IAuditLogEntry).payload ?? null);
  const selectedLogUser = stringifyLogValue((selectedLog as { users?: TAuditUser } & IAuditLogEntry).users ?? null);

  return createPortal(
    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm dark:bg-white/5">
      <Container className={{ innerContainer: "h-full max-h-200 max-w-350 gap-3" }} href="" label="">
        <div className="flex items-start justify-between">
          <Header
            className={{ label: "flex items-center" }}
            description="Inspect metadata, payload, user snapshot, and error detail for this request."
            label={["Audit Detail", "-", selectedLog.path].join(" ")}
          />

          <ExampleA color="black" onClick={onClose} size="sm" variant="ghost">
            <X size={20} />
          </ExampleA>
        </div>

        <div className="flex gap-1">
          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              levelClassName(selectedLog.level),
            ].join(" ")}
          >
            {selectedLog.level}
          </span>

          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              methodClassName(selectedLog.method),
            ].join(" ")}
          >
            {selectedLog.method}
          </span>

          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              statusClassName(selectedLog.statusCode),
            ].join(" ")}
          >
            {selectedLog.statusCode}
          </span>

          <span
            className={[
              "block max-w-21.5 min-w-21.5 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
              durationClassName(selectedLog.durationMs),
            ].join(" ")}
          >
            {selectedLog.durationMs} ms
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex size-full min-h-165.5 min-w-235 flex-col gap-3">
            <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden">
              <section className="flex flex-col gap-2 overflow-hidden text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <DetailMetaItem label="TIMESTAMP" value={selectedLog.ts} />
                  <DetailMetaItem label="USER AGENT" value={selectedLog.userAgent} />
                  <DetailMetaItem label="IP ADDRESS" value={selectedLog.ip} />
                </div>

                <DetailBlock title="USER SNAPSHOT">{selectedLogUser}</DetailBlock>
                <DetailBlock title="ERROR">{selectedLog.error ?? "-"}</DetailBlock>
              </section>

              <section className="flex flex-col gap-2 overflow-hidden text-sm">
                <DetailBlock title="PAYLOAD">{selectedLogPayload}</DetailBlock>
              </section>
            </div>
          </div>
        </div>
      </Container>

      <button aria-hidden onClick={onClose} type="button" />
    </div>,
    document.body,
  );
};
