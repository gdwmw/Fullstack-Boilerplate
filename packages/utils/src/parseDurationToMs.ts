export const parseDurationToMs = (value: string): number => {
  const parsed = /^([0-9]+)(ms|s|m|h|d)$/i.exec(value.trim());

  if (!parsed) {
    throw new Error("Invalid duration format. Use: 15m, 7d, 3600s");
  }

  const amount = Number(parsed[1]);
  const unit = parsed[2].toLowerCase();

  const multiplierByUnit: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    ms: 1,
    s: 1000,
  };

  return amount * multiplierByUnit[unit];
};
