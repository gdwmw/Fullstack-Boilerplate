const COLORS = {
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  yellow: "\x1b[33m",
} as const;

type LogLevel = "DEBUG" | "ERROR" | "INFO" | "SUCCESS" | "WARN";

const BROWSER_COLORS = {
  DEBUG: "#0ea5e9",
  ERROR: "#ef4444",
  INFO: "#2563eb",
  SUCCESS: "#16a34a",
  WARN: "#d97706",
} as const;

const levelToColor: Record<LogLevel, (typeof COLORS)[keyof typeof COLORS]> = {
  DEBUG: COLORS.cyan,
  ERROR: COLORS.red,
  INFO: COLORS.blue,
  SUCCESS: COLORS.green,
  WARN: COLORS.yellow,
};

const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;

const formatLog = ({ label, level, message }: { label?: string; level: LogLevel; message: string }) => {
  const color = levelToColor[level];
  const prefix = label ? `(${label}) - ` : "";
  return `${color}${level} : ${prefix}${message}${COLORS.reset}`;
};

const formatPlainLog = ({ label, level, message }: { label?: string; level: LogLevel; message: string }) => {
  const prefix = label ? `(${label}) - ` : "";
  return `${level} : ${prefix}${message}`;
};

const emitLog = (level: LogLevel, message: string, label?: string) => {
  const text = formatPlainLog({ label, level, message });

  if (isBrowser) {
    const style = `color: ${BROWSER_COLORS[level]}; font-weight: 600;`;

    if (level === "ERROR") {
      console.error(`%c${text}`, style);
      return;
    }

    if (level === "WARN") {
      console.warn(`%c${text}`, style);
      return;
    }

    if (level === "DEBUG") {
      console.debug(`%c${text}`, style);
      return;
    }

    console.log(`%c${text}`, style);
    return;
  }

  const ansiLog = formatLog({ label, level, message });

  if (level === "ERROR") {
    console.error(ansiLog);
    return;
  }

  if (level === "WARN") {
    console.warn(ansiLog);
    return;
  }

  if (level === "DEBUG") {
    console.debug(ansiLog);
    return;
  }

  console.log(ansiLog);
};

export const logTemplate = {
  DEBUG: (message: string, label?: string) => emitLog("DEBUG", message, label),
  ERROR: (message: string, label?: string) => emitLog("ERROR", message, label),
  INFO: (message: string, label?: string) => emitLog("INFO", message, label),
  SUCCESS: (message: string, label?: string) => emitLog("SUCCESS", message, label),
  WARN: (message: string, label?: string) => emitLog("WARN", message, label),
} as const;
