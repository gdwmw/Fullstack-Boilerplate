import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"changePassword" | "login" | "logout" | "me" | "refresh" | "register", DocumentDecoration> => ({
  changePassword: {
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              newPassword: { example: "NewSecret456!", minLength: 8, type: "string" },
              oldPassword: { example: "Secret123!", minLength: 1, type: "string" },
            },
            required: ["oldPassword", "newPassword"],
            type: "object",
          },
        },
      },
      required: true,
    },
    security: [{ bearerAuth: [] }],
    summary: "Change Password",
    tags: [label],
  },
  login: {
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              identifier: { example: "john@example.com or johndoe", type: "string" },
              method: { enum: ["email", "username"], example: "email", type: "string" },
              password: { example: "Secret123!", type: "string" },
            },
            required: ["identifier", "method", "password"],
            type: "object",
          },
        },
      },
      required: true,
    },
    summary: "Login",
    tags: [label],
  },
  logout: {
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              refreshToken: { example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", type: "string" },
            },
            required: ["refreshToken"],
            type: "object",
          },
        },
      },
      required: true,
    },
    summary: "Logout",
    tags: [label],
  },
  me: {
    security: [{ bearerAuth: [] }],
    summary: "Get Current User",
    tags: [label],
  },
  refresh: {
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              refreshToken: { example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", type: "string" },
            },
            required: ["refreshToken"],
            type: "object",
          },
        },
      },
      required: true,
    },
    summary: "Refresh Token",
    tags: [label],
  },
  register: {
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              email: { example: "john@example.com", format: "email", type: "string" },
              name: { example: "John Doe", type: "string" },
              password: { example: "Secret123!", minLength: 8, type: "string" },
              phone: { example: "08123456789", minLength: 10, type: "string" },
              role: { enum: ["user", "admin"], example: "user", type: "string" },
              username: { example: "johndoe", minLength: 4, type: "string" },
            },
            required: ["name", "email", "password", "phone", "username"],
            type: "object",
          },
        },
      },
      required: true,
    },
    summary: "Register",
    tags: [label],
  },
});
