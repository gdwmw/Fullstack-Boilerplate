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
      description: "Delete a user by ID",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).deleted),
            },
          },
          description: "User deleted successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("id").invalid }),
            },
          },
          description: "Invalid id parameter",
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
              schema: errorResponseSchema({ code: "P2025", message: responseMessage(label).notFound }),
            },
          },
          description: "User not found",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Delete",
      tags: [label.toLowerCase()],
    },

    getAll: {
      description: "Get all users",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).retrieved),
            },
          },
          description: "Users retrieved successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
            },
          },
          description: "Unauthorized",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Get All",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "Get a user by ID",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).retrieved),
            },
          },
          description: "User retrieved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("id").invalid }),
            },
          },
          description: "Invalid id parameter",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
            },
          },
          description: "Unauthorized",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Get by ID",
      tags: [label.toLowerCase()],
    },

    put: {
      description: "Update a user by ID",
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
          description: "User updated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request payload").invalid }),
            },
          },
          description: "Invalid request payload or id parameter",
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
              schema: errorResponseSchema({ code: "P2025", message: responseMessage(label).notFound }),
            },
          },
          description: "User not found",
        },
        409: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ code: "P2002", message: responseMessage("email").alreadyExists }),
            },
          },
          description: "Unique field conflict",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Update",
      tags: [label.toLowerCase()],
    },
  };
};
