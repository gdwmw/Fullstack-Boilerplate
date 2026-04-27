import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "upload", DocumentDecoration> => ({
  delete: {
    description: "Delete an uploaded file",
    parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
    security: [{ bearerAuth: [] }],
    summary: "Delete File",
    tags: [label],
  },
  getAll: {
    description: "Get all uploaded files",
    security: [{ bearerAuth: [] }],
    summary: "Get All Files",
    tags: [label],
  },
  getById: {
    description: "Get a file by ID",
    parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
    security: [{ bearerAuth: [] }],
    summary: "Get File by ID",
    tags: [label],
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
    security: [{ bearerAuth: [] }],
    summary: "Upload File",
    tags: [label],
  },
});
