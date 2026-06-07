import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";

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
      description: "change current authenticated user password",
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
          description: "password changed successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "invalid request payload",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("current password").invalid }),
            },
          },
          description: "unauthorized or current password invalid",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "change password",
      tags: [label.toLowerCase()],
    },

    login: {
      description: "authenticate user and issue access/refresh token pair",
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
          description: "login successful",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "invalid request payload",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("email or password").invalid }),
            },
          },
          description: "invalid credentials",
        },
      },
      summary: "login",
      tags: [label.toLowerCase()],
    },

    logout: {
      description: "logout current session. access token is optional but will be blocklisted if provided.",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage("logout").success),
            },
          },
          description: "logout successful",
        },
      },
      summary: "logout",
      tags: [label.toLowerCase()],
    },

    me: {
      description: "get current authenticated user profile",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage("users").retrieved),
            },
          },
          description: "user profile retrieved successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
            },
          },
          description: "unauthorized",
        },
        404: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("users").notFound }),
            },
          },
          description: "user not found",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "get current user",
      tags: [label.toLowerCase()],
    },

    refresh: {
      description: "rotate refresh token and issue a new access token using refresh token from request body.",
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
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage("token").updated),
            },
          },
          description: "token refreshed successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: `${responseMessage("refresh token").invalid} or ${responseMessage("refresh token").expired}` }),
            },
          },
          description: "refresh token invalid or expired",
        },
        404: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("users").notFound }),
            },
          },
          description: "user not found",
        },
      },
      summary: "refresh token",
      tags: [label.toLowerCase()],
    },

    register: {
      description: "register user and issue access/refresh token pair",
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
          description: "registration successful",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "invalid request payload",
        },
        409: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ code: "P2002", message: responseMessage("email").alreadyExists }),
            },
          },
          description: "user already exists",
        },
      },
      summary: "register",
      tags: [label.toLowerCase()],
    },
  };
};
