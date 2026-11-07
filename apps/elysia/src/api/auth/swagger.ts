import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"changePassword" | "login" | "logout" | "me" | "refresh" | "register", DocumentDecoration> => {
  const bearerSecurity = [{ bearerAuth: [] }];

  return {
    changePassword: {
      description: "change the password of the currently authenticated user",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                newPassword: {
                  description: "At least 8 characters, including an uppercase letter, a number, and a symbol (!@#$%^&*).",
                  example: "NewSecret456!",
                  maxLength: 72,
                  minLength: 8,
                  type: "string",
                },
                oldPassword: { example: "Secret123!", minLength: 1, type: "string" },
              },
              required: ["oldPassword", "newPassword"],
              type: "object",
            },
          },
        },
        required: true,
      },
      responses: {
        200: { description: "password changed successfully" },
      },
      security: bearerSecurity,
      summary: "change password",
      tags: [label.toLowerCase()],
    },

    login: {
      description: "authenticate with an email address or username and receive access and refresh tokens",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                identifier: { example: "jane@example.com", type: "string" },
                method: { enum: ["email", "username"], example: "email", type: "string" },
                password: { example: "Secret123!", minLength: 1, type: "string" },
              },
              required: ["identifier", "method", "password"],
              type: "object",
            },
          },
        },
        required: true,
      },
      responses: {
        200: { description: "login successful" },
      },
      summary: "login",
      tags: [label.toLowerCase()],
    },

    logout: {
      description: "log out the current session. An access token is optional; if supplied, it is added to the blocklist.",
      responses: {
        200: { description: "logout successful" },
      },
      security: bearerSecurity,
      summary: "logout",
      tags: [label.toLowerCase()],
    },

    me: {
      description: "get the profile of the currently authenticated user",
      responses: {
        200: { description: "user profile retrieved successfully" },
      },
      security: bearerSecurity,
      summary: "get current user",
      tags: [label.toLowerCase()],
    },

    refresh: {
      description: "exchange a valid refresh token for a new access and refresh token pair",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                refreshToken: { example: "<refresh-token>", minLength: 1, type: "string" },
              },
              required: ["refreshToken"],
              type: "object",
            },
          },
        },
        required: true,
      },
      responses: {
        200: { description: "tokens refreshed successfully" },
      },
      summary: "refresh tokens",
      tags: [label.toLowerCase()],
    },

    register: {
      description: "register a user and receive access and refresh tokens",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "jane@example.com", format: "email", type: "string" },
                name: { example: "Jane Doe", minLength: 3, type: "string" },
                password: {
                  description: "At least 8 characters, including an uppercase letter, a number, and a symbol (!@#$%^&*).",
                  example: "Secret123!",
                  maxLength: 72,
                  minLength: 8,
                  type: "string",
                },
                phone: { example: "08123456789", minLength: 10, type: "string" },
                role: { default: "user", enum: ["user", "admin"], example: "user", type: "string" },
                username: { example: "janedoe", minLength: 4, type: "string" },
              },
              required: ["name", "email", "password", "phone", "username"],
              type: "object",
            },
          },
        },
        required: true,
      },
      responses: {
        200: { description: "registration successful" },
      },
      summary: "register",
      tags: [label.toLowerCase()],
    },
  };
};
