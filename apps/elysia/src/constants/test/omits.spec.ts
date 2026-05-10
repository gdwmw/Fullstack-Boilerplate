import { AUTH_OMIT_FIELDS } from "@/src/constants/omits";

describe("AUTH_OMIT_FIELDS", () => {
  it("should be an object", () => {
    expect(typeof AUTH_OMIT_FIELDS).toBe("object");
    expect(AUTH_OMIT_FIELDS).not.toBeNull();
  });

  it("should have password field set to true", () => {
    expect(AUTH_OMIT_FIELDS.password).toBe(true);
  });

  it("should only contain the password key", () => {
    expect(Object.keys(AUTH_OMIT_FIELDS)).toEqual(["password"]);
  });

  it("should have exactly one property", () => {
    expect(Object.keys(AUTH_OMIT_FIELDS).length).toBe(1);
  });

  it("should use password as the only property", () => {
    expect(Object.prototype.hasOwnProperty.call(AUTH_OMIT_FIELDS, "password")).toBe(true);
  });

  it("should not have other auth-related fields", () => {
    expect(AUTH_OMIT_FIELDS).not.toHaveProperty("email");
    expect(AUTH_OMIT_FIELDS).not.toHaveProperty("token");
    expect(AUTH_OMIT_FIELDS).not.toHaveProperty("apiKey");
  });
});
