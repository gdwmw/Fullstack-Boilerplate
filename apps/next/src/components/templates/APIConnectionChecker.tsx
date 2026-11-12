"use client";

import axios from "axios";
import { Check, Server, X } from "lucide-react";
import { FC, ReactElement, useEffect, useState } from "react";

import { ExampleA } from "@/src/components/elements/example/A/ExampleA";
import { clientEnv } from "@/src/environments/env.client";
import { useModal } from "@/src/hooks/useModal";

// ------------------------------------------------------------------
const ENVIRONMENT_DATA_VARIABLES = ["NEXT_PUBLIC_BASE_API_URL"];
const ENVIRONMENT_DATA_VALUES = [clientEnv.NEXT_PUBLIC_BASE_API_URL];
// ------------------------------------------------------------------

export const APIConnectionChecker: FC = (): ReactElement => {
  const { close, isOpen, open } = useModal();
  const [connection, setConnection] = useState<boolean[]>(() => ENVIRONMENT_DATA_VALUES.map(() => false));

  useEffect(() => {
    const setConnectionStatus = (isConnected: boolean, connectionIndex: number) => {
      setConnection((currentStatuses) => {
        const updatedStatuses = [...currentStatuses];
        updatedStatuses[connectionIndex] = isConnected;
        return updatedStatuses;
      });
    };

    const checkConnection = async (url: string, connectionIndex: number) => {
      try {
        await axios(url, { method: "HEAD" });
        setConnectionStatus(true, connectionIndex);
      } catch {
        setConnectionStatus(false, connectionIndex);
      }
    };

    const checkConfiguredConnections = () => {
      if (!isOpen) {
        return;
      }

      const connectionChecks = ENVIRONMENT_DATA_VALUES.map((url, connectionIndex) => {
        if (!url) {
          setConnectionStatus(false, connectionIndex);
          return Promise.resolve();
        }

        return checkConnection(url, connectionIndex);
      });

      Promise.allSettled(connectionChecks);
    };

    checkConfiguredConnections();

    const interval = setInterval(checkConfiguredConnections, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <section className="fixed right-5 bottom-5 z-50 w-[calc(100%-40px)] max-w-full sm:w-auto sm:max-w-sm">
      <div className="flex flex-col items-end">
        {isOpen && (
          <div className="flex max-h-[70vh] w-full flex-col gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-xs shadow-black/50 sm:w-auto sm:p-5 dark:border-gray-600 dark:bg-gray-800 dark:shadow-white/70">
            <div className="flex items-center justify-between gap-3 sm:gap-5">
              <h1 className="truncate text-base font-semibold sm:text-lg dark:text-white">API Connection Checker</h1>
              <ExampleA className="-mb-0.5" color="blue" onClick={close} size="sm" variant="ghost">
                <X size={20} />
              </ExampleA>
            </div>

            {ENVIRONMENT_DATA_VARIABLES.map((dt, i) => (
              <div
                className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-100 p-2 dark:border-gray-600 dark:bg-gray-700"
                key={dt}
              >
                <div
                  className={[
                    "flex min-h-8 min-w-8 items-center justify-center rounded-full text-white",
                    connection[i] ? "bg-green-500" : "bg-red-500",
                  ].join(" ")}
                >
                  {connection[i] ? <Check size={18} /> : <X size={18} />}
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-sm font-semibold sm:text-base dark:text-white">{connection[i] ? "Connected" : "Disconnected"}</h2>
                  <span className="block max-w-50 truncate text-xs text-gray-600 sm:max-w-xs dark:text-gray-300">{dt}</span>
                </div>
              </div>
            ))}

            <p className="mt-1 text-xs text-gray-400">Last checked: {new Date().toLocaleTimeString()}</p>
          </div>
        )}

        {!isOpen && (
          <ExampleA className="min-w-10" color="blue" onClick={open} size="sm" variant="solid">
            <Server size={18} />
          </ExampleA>
        )}
      </div>
    </section>
  );
};
