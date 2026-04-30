import { DocumentDecoration } from "elysia";

const successResponseSchema = {
  properties: {
    data: {},
    message: { example: "users data retrieved successfully", nullable: true, type: "string" },
    success: { example: true, type: "boolean" },
  },
  type: "object",
} as const;

const errorResponseSchema = {
  properties: {
    code: { example: "P2025", nullable: true, type: "string" },
    error: { example: null, nullable: true },
    message: { example: "users not found", nullable: true, type: "string" },
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

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "put", DocumentDecoration> => ({
  delete: {
    description: "Delete a user by ID",
    parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "User deleted successfully",
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
    summary: "Delete",
    tags: [label.toLowerCase()],
  },
  getAll: {
    description: "Get all users",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
        description: "Users retrieved successfully",
      },
      401: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
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
            schema: successResponseSchema,
          },
        },
        description: "User retrieved successfully",
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
            schema: successResponseSchema,
          },
        },
        description: "User updated successfully",
      },
      400: {
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
        description: "Invalid request payload",
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
    summary: "Update",
    tags: [label.toLowerCase()],
  },
});
