import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "put", DocumentDecoration> => {
  const unauthorizedMessage = `${responseMessage("access token").required} or ${responseMessage("access token").invalid} or ${
    responseMessage("access token").expired
  }`;

  const successResponseSchema = ({ data, message, meta }: { data: Record<string, unknown>; message: string; meta?: Record<string, unknown> }) =>
    ({
      properties: {
        data,
        message: { example: message, nullable: true, type: "string" },
        meta: meta ?? { nullable: true, type: "object" },
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

  const paginationMetaSchema = {
    properties: {
      page: { example: 1, type: "integer" },
      pageSize: { example: 50, type: "integer" },
      totalData: { example: 42, type: "integer" },
      totalPage: { example: 1, type: "integer" },
    },
    type: "object",
  } as const;

  return {
    delete: {
      description: "delete a user by ID",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", type: "string" },
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema({
                data: {},
                message: responseMessage(label).deleted,
              }),
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
          description: "invalid ID parameter",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: unauthorizedMessage }),
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
      parameters: [
        {
          description: "page number for pagination.",
          in: "query",
          name: "page",
          schema: { default: 1, example: 1, minimum: 1, type: "integer" },
        },
        {
          description: "maximum number of users to return per page.",
          in: "query",
          name: "pageSize",
          schema: { default: 50, example: 50, maximum: 100, minimum: 1, type: "integer" },
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema({
                data: { items: { type: "object" }, type: "array" },
                message: responseMessage(label).retrieved,
                meta: paginationMetaSchema,
              }),
            },
          },
          description: "users retrieved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: responseMessage("request query").invalid }),
            },
          },
          description: "invalid request query",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: unauthorizedMessage }),
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
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", type: "string" },
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema({
                data: {},
                message: responseMessage(label).retrieved,
              }),
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
          description: "invalid ID parameter",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: unauthorizedMessage }),
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
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", type: "string" },
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "jane@example.com", format: "email", type: "string" },
                imageId: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", nullable: true, type: "string" },
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
              schema: successResponseSchema({
                data: {},
                message: responseMessage(label).updated,
              }),
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
          description: "invalid request payload or ID parameter",
        },
        401: {
          content: {
            "application/json": {
              schema: errorResponseSchema({ message: unauthorizedMessage }),
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
