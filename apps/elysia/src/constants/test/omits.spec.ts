import { USER_OMIT_FIELDS } from "@repo/types";

describe("USER_OMIT_FIELDS", () => {
  it("should be an object", () => {
    expect(typeof USER_OMIT_FIELDS).toBe("object");
    expect(USER_OMIT_FIELDS).not.toBeNull();
  });

  it("should have password field set to true", () => {
    expect(USER_OMIT_FIELDS.password).toBe(true);
  });

  it("should only contain the password key", () => {
    expect(Object.keys(USER_OMIT_FIELDS)).toEqual(["password"]);
  });

  it("should have exactly one property", () => {
    expect(Object.keys(USER_OMIT_FIELDS).length).toBe(1);
  });

  it("should use password as the only property", () => {
    expect(Object.prototype.hasOwnProperty.call(USER_OMIT_FIELDS, "password")).toBe(true);
  });

  it("should not have other auth-related fields", () => {
    expect(USER_OMIT_FIELDS).not.toHaveProperty("email");
    expect(USER_OMIT_FIELDS).not.toHaveProperty("token");
    expect(USER_OMIT_FIELDS).not.toHaveProperty("apiKey");
  });
});
