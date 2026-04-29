import { add, calculateAverage, calculateIncreasePercentage, calculatePriceWithTax, divide, multiply, subtract } from "../math";

describe("math utils", () => {
  it("adds numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("subtracts numbers", () => {
    expect(subtract(10, 4)).toBe(6);
  });

  it("multiplies numbers", () => {
    expect(multiply(3, 7)).toBe(21);
  });

  it("divides numbers", () => {
    expect(divide(20, 5)).toBe(4);
  });

  it("throws when dividing by zero", () => {
    expect(() => divide(1, 0)).toThrow("Cannot divide by zero");
  });

  it("calculates average", () => {
    expect(calculateAverage([10, 20, 30])).toBe(20);
  });

  it("throws when averaging empty array", () => {
    expect(() => calculateAverage([])).toThrow("Cannot divide by zero");
  });

  it("calculates increase percentage", () => {
    expect(calculateIncreasePercentage(100, 120)).toBe(20);
  });

  it("calculates price with tax", () => {
    expect(calculatePriceWithTax(100, 10)).toBe(110);
  });
});
