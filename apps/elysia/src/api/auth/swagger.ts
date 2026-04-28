import { DocumentDecoration } from "elysia";

const successResponseSchema = {
  properties: {
    data: {},
    message: { example: "Authentication success", nullable: true, type: "string" },
    success: { example: true, type: "boolean" },
  },
  type: "object",
} as const;

const errorResponseSchema = {
  properties: {
    code: { example: "P2025", nullable: true, type: "string" },
    error: { example: null, nullable: true },
    message: { example: "Access token is invalid", nullable: true, type: "string" },
    success: { example: false, type: "boolean" },
    token: {
      nullable: true,
      properties: {
        access: { type: "boolean" },
        refresh: { type: "boolean" },
      },
      type: "object",
    },
  },
  type: "object",
} as const;

export const docs = (label: string): Record<"changePassword" | "login" | "logout" | "me" | "refresh" | "register", DocumentDecoration> => ({
  changePassword: {
    description: "Change current authenticated user password",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              newPassword: { example: "NewSecret456!", maxLength: 72, minLength: 8, type: "string" },
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
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "Password changed successfully",
      },
      401: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "Unauthorized or current password invalid",
      },
    },
    security: [{ bearerAuth: [] }],
    summary: "Change Password",
    tags: [label],
  },
  login: {
    description: "Authenticate user and issue access/refresh token pair",
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
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "Login successful",
      },
      401: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "Invalid credentials",
      },
    },
    summary: "Login",
    tags: [label],
  },
  logout: {
    description: "Logout current session. Refresh token is read from HttpOnly cookie. Access token is optional but will be blocklisted if provided.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "Logout successful",
      },
    },
    summary: "Logout",
    tags: [label],
  },
  me: {
    description: "Get current authenticated user profile",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "User profile retrieved successfully",
      },
      401: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "Unauthorized",
      },
      404: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "User not found",
      },
    },
    security: [{ bearerAuth: [] }],
    summary: "Get Current User",
    tags: [label],
  },
  refresh: {
    description: "Rotate refresh token and issue a new access token. Refresh token is read from HttpOnly cookie.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "Token refreshed successfully",
      },
      401: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "Refresh token invalid or expired",
      },
      404: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "User not found",
      },
    },
    summary: "Refresh Token",
    tags: [label],
  },
  register: {
    description: "Register user and issue access/refresh token pair",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              email: { example: "john@example.com", format: "email", type: "string" },
              name: { example: "John Doe", minLength: 3, type: "string" },
              password: { example: "Secret123!", maxLength: 72, minLength: 8, type: "string" },
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
    responses: {
      201: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "Registration successful",
      },
      400: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "Invalid request payload",
      },
      409: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "User already exists",
      },
    },
    summary: "Register",
    tags: [label],
  },
});
