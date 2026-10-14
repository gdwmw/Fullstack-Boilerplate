import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "upload", DocumentDecoration> => {
  const idParameter = {
    in: "path",
    name: "id",
    required: true,
    schema: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", type: "string" },
  } as const;

  return {
    delete: {
      description: "delete an uploaded file by ID",
      parameters: [idParameter],
      responses: {
        200: { description: "file deleted successfully" },
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
        200: { description: "files retrieved successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "get all files",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "get an uploaded file by ID",
      parameters: [idParameter],
      responses: {
        200: { description: "file retrieved successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "get file by ID",
      tags: [label.toLowerCase()],
    },

    upload: {
      description: "upload a file. Files must be non-empty and no larger than 10 MB.",
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              properties: {
                file: {
                  description: "File to upload (maximum size: 10 MB).",
                  format: "binary",
                  maxLength: 10485760,
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
        200: { description: "file uploaded successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "upload file",
      tags: [label.toLowerCase()],
    },
  };
};
