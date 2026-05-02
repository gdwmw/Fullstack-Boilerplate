import { vi } from "vitest";

vi.mock("@/src/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, { code }: { clientVersion?: string; code: string }) {
        super(message);
        this.code = code;
      }
    },
  },
}));

import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { Prisma } from "@/src/generated/prisma/client";

describe("SUCCESS_RESPONSE", () => {
  it("should return success true with data and message", () => {
    const result = SUCCESS_RESPONSE({ data: { id: 1 }, message: "ok" });
    expect(result).toEqual({ data: { id: 1 }, message: "ok", success: true });
  });

  it("should return null for data when data is falsy", () => {
    const result = SUCCESS_RESPONSE({ data: null, message: null });
    expect(result.data).toBeNull();
  });

  it("should return null for message when message is null", () => {
    const result = SUCCESS_RESPONSE({ data: [], message: null });
    expect(result.message).toBeNull();
  });
});

describe("ERROR_RESPONSE", () => {
  it("should return success false with message", () => {
    const result = ERROR_RESPONSE({ message: "something went wrong" });
    expect(result).toEqual({ code: null, message: "something went wrong", success: false });
  });

  it("should extract code when error is PrismaClientKnownRequestError", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { clientVersion: "", code: "P2002" });
    const result = ERROR_RESPONSE({ error: prismaError, message: "conflict" });
    expect(result.code).toBe("P2002");
    expect(result.success).toBe(false);
  });

  it("should return null code for non-Prisma errors", () => {
    const result = ERROR_RESPONSE({ error: new Error("generic"), message: "error" });
    expect(result.code).toBeNull();
  });
});
