import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "upload", DocumentDecoration> => {
  const successResponseSchema = {
    properties: {
      data: {},
      message: { example: responseMessage(label).retrieved, nullable: true, type: "string" },
      success: { example: true, type: "boolean" },
    },
    type: "object",
  } as const;

  const errorResponseSchema = {
    properties: {
      code: { example: "P2025", nullable: true, type: "string" },
      message: { example: responseMessage(label).notFound, nullable: true, type: "string" },
      success: { example: false, type: "boolean" },
    },
    type: "object",
  } as const;

  return {
    delete: {
      description: "Delete an uploaded file",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema,
            },
          },
          description: "File deleted successfully",
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
          description: "File not found",
        },
      },
      security: [{ bearerAuth: [] }],
      summary: "Delete File",
      tags: [label.toLowerCase()],
    },

    getAll: {
      description: "Get all uploaded files",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema,
            },
          },
          description: "Files retrieved successfully",
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
      summary: "Get All Files",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "Get a file by ID",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema,
            },
          },
          description: "File retrieved successfully",
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
      summary: "Get File by ID",
      tags: [label.toLowerCase()],
    },

    upload: {
      description: "Upload a file",
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
              schema: successResponseSchema,
            },
          },
          description: "File uploaded successfully",
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
      },
      security: [{ bearerAuth: [] }],
      summary: "Upload File",
      tags: [label.toLowerCase()],
    },
  };
};
