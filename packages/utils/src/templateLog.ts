const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
} as const;

type LogLevel = "SUCCESS" | "ERROR" | "WARN" | "INFO" | "DEBUG";

const levelToColor: Record<LogLevel, (typeof COLORS)[keyof typeof COLORS]> = {
  SUCCESS: COLORS.green,
  ERROR: COLORS.red,
  WARN: COLORS.yellow,
  INFO: COLORS.blue,
  DEBUG: COLORS.cyan,
};

const formatLog = ({ level, label, message }: { level: LogLevel; label?: string; message: string }) => {
  const color = levelToColor[level];
  const prefix = label ? `(${label}) - ` : "";
  return `${color}${level} : ${prefix}${message}${COLORS.reset}`;
};

export const templateLog = {
  SUCCESS: (message: string, label?: string) => console.log(formatLog({ level: "SUCCESS", label, message })),
  INFO: (message: string, label?: string) => console.log(formatLog({ level: "INFO", label, message })),
  WARN: (message: string, label?: string) => console.warn(formatLog({ level: "WARN", label, message })),
  ERROR: (message: string, label?: string) => console.error(formatLog({ level: "ERROR", label, message })),
  DEBUG: (message: string, label?: string) => console.debug(formatLog({ level: "DEBUG", label, message })),
} as const;
