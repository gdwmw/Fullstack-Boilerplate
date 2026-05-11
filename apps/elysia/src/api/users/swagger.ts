import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "put", DocumentDecoration> => {
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
    delete: {
      description: "delete a user by ID",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).deleted),
            },
          },
          description: "user deleted successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("id").invalid }),
            },
          },
          description: "invalid id parameter",
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
              schema: errorResponseSchema({ code: "P2025", message: responseMessage(label).notFound }),
            },
          },
          description: "user not found",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "delete",
      tags: [label.toLowerCase()],
    },

    getAll: {
      description: "get all users",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).retrieved),
            },
          },
          description: "users retrieved successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
            },
          },
          description: "unauthorized",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "get all",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "get a user by ID",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).retrieved),
            },
          },
          description: "user retrieved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("id").invalid }),
            },
          },
          description: "invalid id parameter",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
            },
          },
          description: "unauthorized",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "get by ID",
      tags: [label.toLowerCase()],
    },

    put: {
      description: "update a user by ID",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "jane@example.com", format: "email", type: "string" },
                imageId: { example: 1, minimum: 1, nullable: true, type: "integer" },
                name: { example: "Jane Doe", minLength: 3, type: "string" },
                phone: { example: "08123456789", minLength: 10, type: "string" },
                role: { enum: ["user", "admin"], example: "user", type: "string" },
                username: { example: "janedoe", minLength: 4, type: "string" },
              },
              required: ["name", "email", "phone", "username"],
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
              schema: successResponseSchema(responseMessage(label).updated),
            },
          },
          description: "user updated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "invalid request payload or id parameter",
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
              schema: errorResponseSchema({ code: "P2025", message: responseMessage(label).notFound }),
            },
          },
          description: "user not found",
        },
        409: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ code: "P2002", message: responseMessage("email").alreadyExists }),
            },
          },
          description: "unique field conflict",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "update",
      tags: [label.toLowerCase()],
    },
  };
};
