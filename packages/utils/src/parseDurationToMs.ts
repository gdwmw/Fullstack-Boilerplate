export const parseDurationToMs = (value: string): number => {
  const parsed = /^(\d+)(ms|s|m|h|d)$/i.exec(value.trim());

  if (!parsed) {
    throw new Error("Invalid duration format. Use: 15m, 7d, 3600s");
  }

  const amountRaw = parsed[1];
  const unitRaw = parsed[2];

  if (!amountRaw || !unitRaw) {
    throw new Error("Invalid duration format. Use: 15m, 7d, 3600s");
  }

  const amount = Number(amountRaw);
  const unit = unitRaw.toLowerCase();

  const multiplierByUnit: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    ms: 1,
    s: 1000,
  };

  const multiplier = multiplierByUnit[unit];

  if (!multiplier) {
    throw new Error("Invalid duration unit. Use: ms, s, m, h, d");
  }

  return amount * multiplier;
};
