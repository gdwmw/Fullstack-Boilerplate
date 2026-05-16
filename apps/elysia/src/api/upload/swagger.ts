import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "upload", DocumentDecoration> => {
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
      description: "delete an uploaded file",
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
          description: "file deleted successfully",
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
          description: "file not found",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "delete file",
      tags: [label.toLowerCase()],
    },

    getAll: {
      description: "get all uploaded files",
      parameters: [
        {
          description: "page number for pagination.",
          in: "query",
          name: "page",
          schema: { default: 1, example: 1, minimum: 1, type: "integer" },
        },
        {
          description: "maximum number of files to return per page.",
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
          description: "files retrieved successfully",
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
      summary: "get all files",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "get a file by ID",
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
          description: "file retrieved successfully",
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
      summary: "get file by ID",
      tags: [label.toLowerCase()],
    },

    upload: {
      description: "upload a file",
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              properties: {
                file: {
                  format: "binary",
                  type: "string",
                },
              },
              required: ["file"],
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
                message: responseMessage(label).created,
              }),
            },
          },
          description: "file uploaded successfully",
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
              schema: errorResponseSchema({ message: unauthorizedMessage }),
            },
          },
          description: "unauthorized",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "upload file",
      tags: [label.toLowerCase()],
    },
  };
};
