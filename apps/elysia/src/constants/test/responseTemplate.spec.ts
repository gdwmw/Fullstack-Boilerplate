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

import { ERROR_RESPONSE, SUCCESS_RESPONSE } from "@/src/constants";
import { Prisma } from "@/src/generated/prisma/client";

describe("SUCCESS_RESPONSE", () => {
  describe("with valid data", () => {
    it("should return success true with data and message", () => {
      const result = SUCCESS_RESPONSE({ data: { id: 1 }, message: "ok" });
      expect(result).toEqual({ data: { id: 1 }, message: "ok", success: true });
    });

    it("should return success true with empty object", () => {
      const result = SUCCESS_RESPONSE({ data: {}, message: "ok" });
      expect(result.data).toEqual({});
      expect(result.success).toBe(true);
    });

    it("should return success true with array data", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = SUCCESS_RESPONSE({ data, message: "ok" });
      expect(result.data).toEqual(data);
      expect(result.success).toBe(true);
    });

    it("should return success true with empty array", () => {
      const result = SUCCESS_RESPONSE({ data: [], message: "ok" });
      expect(result.data).toEqual([]);
      expect(result.success).toBe(true);
    });

    it("should return success true with string data", () => {
      const result = SUCCESS_RESPONSE({ data: "test", message: "ok" });
      expect(result.data).toBe("test");
      expect(result.success).toBe(true);
    });
  });

  describe("with pagination meta", () => {
    it("should include provided meta when supplied", () => {
      const result = SUCCESS_RESPONSE({
        data: [{ id: 1 }],
        message: "ok",
        meta: { page: 1, pageSize: 50, totalData: 120, totalPage: 3 },
      });

      expect(result.meta).toEqual({ page: 1, pageSize: 50, totalData: 120, totalPage: 3 });
    });

    it("should include meta with totalPage", () => {
      const result = SUCCESS_RESPONSE({
        data: [{ id: 1 }],
        message: "ok",
        meta: { page: 1, pageSize: 10, totalData: 50, totalPage: 5 },
      });

      expect(result.meta).toEqual({ page: 1, pageSize: 10, totalData: 50, totalPage: 5 });
    });

    it("should omit meta when not provided", () => {
      const result = SUCCESS_RESPONSE({ data: {}, message: "ok" });
      expect(result).not.toHaveProperty("meta");
    });
  });

  describe("with falsy data", () => {
    it("should return null for data when data is null", () => {
      const result = SUCCESS_RESPONSE({ data: null, message: "ok" });
      expect(result.data).toBeNull();
    });

    it("should return null for data when data is undefined", () => {
      const result = SUCCESS_RESPONSE({ data: undefined, message: "ok" });
      expect(result.data).toBeNull();
    });

    it("should return null for data when data is false", () => {
      const result = SUCCESS_RESPONSE({ data: false, message: "ok" });
      expect(result.data).toBeNull();
    });

    it("should return null for data when data is 0", () => {
      const result = SUCCESS_RESPONSE({ data: 0, message: "ok" });
      expect(result.data).toBeNull();
    });
  });

  describe("with message handling", () => {
    it("should handle null message", () => {
      const result = SUCCESS_RESPONSE({ data: { id: 1 }, message: null });
      expect(result.message).toBeNull();
      expect(result.success).toBe(true);
    });

    it("should return null for empty string message", () => {
      const result = SUCCESS_RESPONSE({ data: { id: 1 }, message: "" });
      expect(result.message).toBeNull();
    });
  });

  describe("response structure", () => {
    it("should always have required properties", () => {
      const result = SUCCESS_RESPONSE({ data: null, message: null });
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
    });

    it("should have exactly 3 properties without meta", () => {
      const result = SUCCESS_RESPONSE({ data: {}, message: "ok" });
      expect(Object.keys(result).length).toBe(3);
    });
  });
});

describe("ERROR_RESPONSE", () => {
  describe("with basic error", () => {
    it("should return success false with message", () => {
      const result = ERROR_RESPONSE({ message: "something went wrong" });
      expect(result).toEqual({ message: "something went wrong", success: false });
    });

    it("should omit code when error is not provided", () => {
      const result = ERROR_RESPONSE({ message: "error" });
      expect(result.success).toBe(false);
      expect(result).not.toHaveProperty("code");
    });

    it("should handle null message", () => {
      const result = ERROR_RESPONSE({ message: null });
      expect(result.message).toBeNull();
      expect(result.success).toBe(false);
    });
  });

  describe("with Prisma errors", () => {
    it("should extract code when error is PrismaClientKnownRequestError", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "",
        code: "P2002",
      });
      const result = ERROR_RESPONSE({ error: prismaError, message: "conflict" });
      expect(result.code).toBe("P2002");
      expect(result.success).toBe(false);
      expect(result.message).toBe("conflict");
    });

    it("should handle different Prisma error codes", () => {
      const errorCodes = ["P2000", "P2001", "P2002", "P2025"];
      errorCodes.forEach((code) => {
        const prismaError = new Prisma.PrismaClientKnownRequestError("Error", {
          clientVersion: "",
          code,
        });
        const result = ERROR_RESPONSE({ error: prismaError, message: "error" });
        expect(result.code).toBe(code);
      });
    });
  });

  describe("with non-Prisma errors", () => {
    it("should omit code for generic Error", () => {
      const result = ERROR_RESPONSE({ error: new Error("generic"), message: "error" });
      expect(result).not.toHaveProperty("code");
      expect(result.success).toBe(false);
    });

    it("should omit code for TypeError", () => {
      const result = ERROR_RESPONSE({ error: new TypeError("type error"), message: "error" });
      expect(result).not.toHaveProperty("code");
    });

    it("should omit code for plain object error", () => {
      const result = ERROR_RESPONSE({ error: { message: "custom" }, message: "error" });
      expect(result).not.toHaveProperty("code");
    });
  });

  describe("response structure", () => {
    it("should always have required properties", () => {
      const result = ERROR_RESPONSE({ message: "error" });
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
    });

    it("should have exactly 2 properties without Prisma code", () => {
      const result = ERROR_RESPONSE({ message: "error" });
      expect(Object.keys(result).length).toBe(2);
    });

    it("should have exactly 3 properties with Prisma code", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "",
        code: "P2002",
      });
      const result = ERROR_RESPONSE({ error: prismaError, message: "conflict" });
      expect(Object.keys(result).length).toBe(3);
    });
  });
});
