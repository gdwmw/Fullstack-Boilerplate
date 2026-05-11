import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "upload", DocumentDecoration> => {
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
      description: "Delete an uploaded file",
      parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema(responseMessage(label).deleted),
            },
          },
          description: "File deleted successfully",
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
              schema: successResponseSchema(responseMessage(label).retrieved),
            },
          },
          description: "Files retrieved successfully",
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
              schema: successResponseSchema(responseMessage(label).retrieved),
            },
          },
          description: "File retrieved successfully",
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
              schema: successResponseSchema(responseMessage(label).created),
            },
          },
          description: "File uploaded successfully",
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
              schema: errorResponseSchema({ message: responseMessage("access token").required }),
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
