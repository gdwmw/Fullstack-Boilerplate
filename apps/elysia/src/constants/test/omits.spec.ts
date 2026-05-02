import { AUTH_OMIT_FIELDS } from "@/src/constants/omits";

describe("AUTH_OMIT_FIELDS", () => {
  it("should have password field set to true", () => {
    expect(AUTH_OMIT_FIELDS.password).toBe(true);
  });

  it("should only contain the password key", () => {
    expect(Object.keys(AUTH_OMIT_FIELDS)).toEqual(["password"]);
  });
});
