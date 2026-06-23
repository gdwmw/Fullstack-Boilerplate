import { P2002, P2003 } from "@/src/utils/handle-prisma-error/extract";

describe("P2003", () => {
  it("should format field_name from meta to Title Case", () => {
    expect(P2003({ field_name: "user_id" })).toBe("User Id");
  });

  it("should handle multiple underscores", () => {
    expect(P2003({ field_name: "created_at_timestamp" })).toBe("Created At Timestamp");
  });

  it("should return fallback when meta is undefined", () => {
    expect(P2003(undefined)).toBe("[failed to extract field name from error meta]");
  });

  it("should return fallback when field_name is missing from meta", () => {
    expect(P2003({})).toBe("[failed to extract field name from error meta]");
  });
});

describe("P2002", () => {
  it("should extract backtick-wrapped field name from last line", () => {
    const message = "some error\nUnique constraint failed on the fields: (`email`)";
    expect(P2002(message)).toBe("Email");
  });

  it("should format field name with underscores to Title Case", () => {
    const message = "some error\nUnique constraint failed on the fields: (`user_name`)";
    expect(P2002(message)).toBe("User Name");
  });

  it("should return fallback when no backtick field in last line", () => {
    const message = "some error\nno field here";
    expect(P2002(message)).toBe("[failed to extract field name from error message]");
  });

  it("should work with single-line message", () => {
    const message = "Unique constraint failed on the fields: (`phone`)";
    expect(P2002(message)).toBe("Phone");
  });
});
