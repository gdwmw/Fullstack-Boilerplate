import { currencyFormat } from "../formatter";

describe("currencyFormat", () => {
  it("formats USD amount with 2 fraction digits", () => {
    expect(currencyFormat(1000, "USD")).toBe("$1,000.00");
  });

  it("formats JPY amount without fraction digits", () => {
    expect(currencyFormat(1234, "JPY")).toMatch(/[¥￥]1,234/);
  });

  it("accepts numeric strings", () => {
    expect(currencyFormat("99.5", "GBP")).toBe("\u00a399.50");
  });

  it("throws for invalid amount", () => {
    expect(() => currencyFormat("invalid", "USD")).toThrow("invalid amount value");
  });
});
