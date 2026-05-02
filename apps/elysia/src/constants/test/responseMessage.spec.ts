import { responseMessage } from "@/src/constants/responseMessage";

describe("responseMessage", () => {
  const msg = responseMessage("User");

  it("should normalize label to lowercase", () => {
    expect(msg.created).toBe("user created successfully");
  });

  it("should trim whitespace from label", () => {
    const trimmed = responseMessage("  Token  ");
    expect(trimmed.expired).toBe("token is expired");
  });

  it("should return correct alreadyExists message", () => {
    expect(msg.alreadyExists).toBe("user already exists");
  });

  it("should return correct created message", () => {
    expect(msg.created).toBe("user created successfully");
  });

  it("should return correct deleted message", () => {
    expect(msg.deleted).toBe("user deleted successfully");
  });

  it("should return correct expired message", () => {
    expect(msg.expired).toBe("user is expired");
  });

  it("should return correct invalid message", () => {
    expect(msg.invalid).toBe("user is invalid");
  });

  it("should return correct notFound message", () => {
    expect(msg.notFound).toBe("user not found");
  });

  it("should return correct required message", () => {
    expect(msg.required).toBe("user is required");
  });

  it("should return correct retrieved message", () => {
    expect(msg.retrieved).toBe("user data retrieved successfully");
  });

  it("should return correct success message", () => {
    expect(msg.success).toBe("user success");
  });

  it("should return correct updated message", () => {
    expect(msg.updated).toBe("user updated successfully");
  });
});
