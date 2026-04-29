const COLORS = {
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  yellow: "\x1b[33m",
} as const;

type LogLevel = "DEBUG" | "ERROR" | "INFO" | "SUCCESS" | "WARN";

const levelToColor: Record<LogLevel, (typeof COLORS)[keyof typeof COLORS]> = {
  DEBUG: COLORS.cyan,
  ERROR: COLORS.red,
  INFO: COLORS.blue,
  SUCCESS: COLORS.green,
  WARN: COLORS.yellow,
};

const formatLog = ({ label, level, message }: { label?: string; level: LogLevel; message: string }) => {
  const color = levelToColor[level];
  const prefix = label ? `(${label}) - ` : "";
  return `${color}${level} : ${prefix}${message}${COLORS.reset}`;
};

export const templateLog = {
  DEBUG: (message: string, label?: string) => console.debug(formatLog({ label, level: "DEBUG", message })),
  ERROR: (message: string, label?: string) => console.error(formatLog({ label, level: "ERROR", message })),
  INFO: (message: string, label?: string) => console.log(formatLog({ label, level: "INFO", message })),
  SUCCESS: (message: string, label?: string) => console.log(formatLog({ label, level: "SUCCESS", message })),
  WARN: (message: string, label?: string) => console.warn(formatLog({ label, level: "WARN", message })),
} as const;
