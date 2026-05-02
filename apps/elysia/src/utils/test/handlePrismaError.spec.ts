import { vi } from "vitest";

vi.mock("@repo/utils", () => ({
  logTemplate: {
    ERROR: vi.fn(),
  },
}));

vi.mock("@/src/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      meta?: Record<string, unknown>;
      constructor(message: string, { code, meta }: { clientVersion?: string; code: string; meta?: Record<string, unknown> }) {
        super(message);
        this.code = code;
        this.meta = meta;
      }
    },
  },
}));

import { StatusMap } from "elysia";

import { Prisma } from "@/src/generated/prisma/client";
import { handlePrismaError } from "@/src/utils/handle-prisma-error/handlePrismaError";

const makeSet = () => ({ headers: {} as Record<string, string>, status: undefined as keyof StatusMap | number | undefined });

const makePrismaError = (code: string, message = `line1\nline2\n\`field\``, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError(message, { clientVersion: "", code, meta });

describe("handlePrismaError", () => {
  it("should return undefined for non-Prisma errors", () => {
    const set = makeSet();
    const result = handlePrismaError("user", new Error("generic"), set);
    expect(result).toBeUndefined();
  });

  it("P2000 — should return 400 with too long message", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2000"), set);
    expect(set.status).toBe(400);
    expect(result?.message).toBe("the provided value is too long for this field");
    expect(result?.success).toBe(false);
  });

  it("P2001 — should return 404 with notFound message", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2001"), set);
    expect(set.status).toBe(404);
    expect(result?.message).toBe("user not found");
  });

  it("P2002 — should return 409 with alreadyExists message using extracted field", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2002", "error\nUnique constraint failed: (`email`)"), set);
    expect(set.status).toBe(409);
    expect(result?.message).toContain("already exists");
  });

  it("P2003 — should return 400 with foreign key message using meta field", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2003", "error\nline", { field_name: "user_id" }), set);
    expect(set.status).toBe(400);
    expect(result?.message).toContain("User Id");
  });

  it("P2025 — should return 404 with notFound message", () => {
    const set = makeSet();
    const result = handlePrismaError("post", makePrismaError("P2025"), set);
    expect(set.status).toBe(404);
    expect(result?.message).toBe("post not found");
  });

  it("P2014 — should return 409 with relation violation message", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2014"), set);
    expect(set.status).toBe(409);
    expect(result?.message).toBe("the change would violate a required relation");
  });

  it("P2024 — should return 503 with connection pool timeout message", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2024"), set);
    expect(set.status).toBe(503);
    expect(result?.message).toBe("timed out fetching a new connection from the connection pool");
  });

  it("P2034 — should return 409 with write conflict message", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P2034"), set);
    expect(set.status).toBe(409);
    expect(result?.message).toBe("transaction failed due to a write conflict or deadlock, please retry");
  });

  it("unknown code — should return 500 with unexpected error message", () => {
    const set = makeSet();
    const result = handlePrismaError("user", makePrismaError("P9999"), set);
    expect(set.status).toBe(500);
    expect(result?.message).toBe("an unexpected error occurred");
  });
});
