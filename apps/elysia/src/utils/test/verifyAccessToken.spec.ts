import { vi } from "vitest";

vi.mock("@/src/libs/redis", () => ({
  redis: {
    exists: vi.fn(),
  },
}));

import { redis } from "@/src/libs/redis";
import { getBearerToken, verifyResponse } from "@/src/utils/verifyAccessToken";

const mockRedis = vi.mocked(redis);

describe("getBearerToken", () => {
  it("should return token when authorization starts with 'Bearer '", () => {
    expect(getBearerToken("Bearer mytoken123")).toBe("mytoken123");
  });

  it("should return null when authorization is undefined", () => {
    expect(getBearerToken()).toBeNull();
  });

  it("should return null when authorization does not start with 'Bearer '", () => {
    expect(getBearerToken("Basic sometoken")).toBeNull();
    expect(getBearerToken("mytoken123")).toBeNull();
  });

  it("should return empty string when token after Bearer is empty", () => {
    expect(getBearerToken("Bearer ")).toBe("");
  });
});

describe("verifyResponse", () => {
  const makeJwt = (result: unknown) => ({
    verify: vi.fn().mockResolvedValue(result),
  });

  it("should return required error when authorization is missing", async () => {
    const result = await verifyResponse({ accessJwt: makeJwt(null), authorization: undefined });
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("required");
  });

  it("should return invalid/expired error when jwt.verify returns falsy", async () => {
    const result = await verifyResponse({ accessJwt: makeJwt(false), authorization: "Bearer sometoken" });
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("invalid");
  });

  it("should return invalid/expired error when jwt.verify returns non-object", async () => {
    const result = await verifyResponse({ accessJwt: makeJwt("string"), authorization: "Bearer sometoken" });
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("invalid");
  });

  it("should return null (valid) when token is valid and not blocked", async () => {
    mockRedis.exists = vi.fn().mockResolvedValue(0);
    const result = await verifyResponse({
      accessJwt: makeJwt({ jti: "abc123", sub: "1" }),
      authorization: "Bearer validtoken",
    });
    expect(result).toBeNull();
  });

  it("should return invalid/expired error when jti is in redis blocklist", async () => {
    mockRedis.exists = vi.fn().mockResolvedValue(1);
    const result = await verifyResponse({
      accessJwt: makeJwt({ jti: "blockedJti", sub: "1" }),
      authorization: "Bearer validtoken",
    });
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("invalid");
  });

  it("should return null when decoded has no jti (skip redis check)", async () => {
    const result = await verifyResponse({
      accessJwt: makeJwt({ sub: "1" }),
      authorization: "Bearer validtoken",
    });
    expect(result).toBeNull();
  });
});
