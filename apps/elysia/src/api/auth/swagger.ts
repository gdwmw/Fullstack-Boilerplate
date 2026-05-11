import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"changePassword" | "login" | "logout" | "me" | "refresh" | "register", DocumentDecoration> => {
  const successResponseSchema = (message: string) =>
    ({
      properties: {
        data: {},
        message: { example: message, nullable: true, type: "string" },
        meta: { nullable: true, type: "object" },
        success: { example: true, type: "boolean" },
      },
      type: "object",
    }) as const;

  const errorResponseSchema = ({ code = null, message }: { code?: null | string; message: string }) =>
    ({
      properties: {
        code: { example: code, nullable: true, type: "string" },
        message: { example: message, nullable: true, type: "string" },
        success: { example: false, type: "boolean" },
      },
      type: "object",
    }) as const;

  return {
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
              schema: successResponseSchema(responseMessage("password").updated),
            },
          },
          description: "Password changed successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "Invalid request payload",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("current password").invalid }),
            },
          },
          description: "Unauthorized or current password invalid",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Change Password",
      tags: [label.toLowerCase()],
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
              schema: successResponseSchema(responseMessage("login").success),
            },
          },
          description: "Login successful",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "Invalid request payload",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("email or password").invalid }),
            },
          },
          description: "Invalid credentials",
        },
      },
      summary: "Login",
      tags: [label.toLowerCase()],
    },

    logout: {
      description:
        "Logout current session. Refresh token is read from HttpOnly cookie. Access token is optional but will be blocklisted if provided.",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage("logout").success),
            },
          },
          description: "Logout successful",
        },
      },
      summary: "Logout",
      tags: [label.toLowerCase()],
    },

    me: {
      description: "Get current authenticated user profile",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage("users").retrieved),
            },
          },
          description: "User profile retrieved successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
            },
          },
          description: "Unauthorized",
        },
        404: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("users").notFound }),
            },
          },
          description: "User not found",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Get Current User",
      tags: [label.toLowerCase()],
    },

    refresh: {
      description: "Rotate refresh token and issue a new access token. Refresh token is read from HttpOnly cookie.",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage("token").updated),
            },
          },
          description: "Token refreshed successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("refresh token").required }),
            },
          },
          description: "Refresh token invalid or expired",
        },
        404: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("users").notFound }),
            },
          },
          description: "User not found",
        },
      },
      summary: "Refresh Token",
      tags: [label.toLowerCase()],
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
              schema: successResponseSchema(responseMessage("register").success),
            },
          },
          description: "Registration successful",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "Invalid request payload",
        },
        409: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ code: "P2002", message: responseMessage("email").alreadyExists }),
            },
          },
          description: "User already exists",
        },
      },
      summary: "Register",
      tags: [label.toLowerCase()],
    },
  };
};
