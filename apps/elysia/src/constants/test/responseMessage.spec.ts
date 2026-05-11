import { responseMessage } from "@/src/constants";

describe("responseMessage", () => {
  describe("with standard input", () => {
    const msg = responseMessage("User");

    it("should normalize label to lowercase", () => {
      expect(msg.created).toBe("user created successfully");
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

  describe("with whitespace handling", () => {
    it("should trim leading whitespace", () => {
      const msg = responseMessage("  Token");
      expect(msg.expired).toBe("token is expired");
    });

    it("should trim trailing whitespace", () => {
      const msg = responseMessage("Token  ");
      expect(msg.expired).toBe("token is expired");
    });

    it("should trim both leading and trailing whitespace", () => {
      const msg = responseMessage("  Token  ");
      expect(msg.expired).toBe("token is expired");
    });
  });

  describe("with different case inputs", () => {
    it("should handle uppercase labels", () => {
      const msg = responseMessage("ACCOUNT");
      expect(msg.created).toBe("account created successfully");
    });

    it("should handle mixed case labels", () => {
      const msg = responseMessage("DataSet");
      expect(msg.created).toBe("dataset created successfully");
    });

    it("should handle lowercase labels", () => {
      const msg = responseMessage("profile");
      expect(msg.created).toBe("profile created successfully");
    });

    it("should preserve short acronyms", () => {
      const msg = responseMessage("OTP token");
      expect(msg.created).toBe("OTP token created successfully");
    });

    it("should lowercase long uppercase words", () => {
      const msg = responseMessage("ACCOUNT");
      expect(msg.created).toBe("account created successfully");
    });
  });

  describe("message format consistency", () => {
    const msg = responseMessage("Email");

    it("should return object with all expected keys", () => {
      const expectedKeys = ["alreadyExists", "created", "deleted", "expired", "invalid", "notFound", "required", "retrieved", "success", "updated"];
      expect(Object.keys(msg).sort()).toEqual(expectedKeys.sort());
    });

    it("all messages should be strings", () => {
      Object.values(msg).forEach((message) => {
        expect(typeof message).toBe("string");
      });
    });

    it("all messages should contain the label", () => {
      Object.values(msg).forEach((message) => {
        expect(message).toContain("email");
      });
    });
  });

  describe("special characters handling", () => {
    it("should handle labels with numbers", () => {
      const msg = responseMessage("User2");
      expect(msg.created).toBe("user2 created successfully");
    });

    it("should handle labels with hyphens", () => {
      const msg = responseMessage("api-key");
      expect(msg.created).toBe("api-key created successfully");
    });
  });
});
