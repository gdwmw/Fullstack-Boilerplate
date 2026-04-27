import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "put", DocumentDecoration> | undefined => ({
  delete: {
    parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
    security: [{ bearerAuth: [] }],
    summary: "Delete",
    tags: [label],
  },
  getAll: {
    security: [{ bearerAuth: [] }],
    summary: "Get All",
    tags: [label],
  },
  getById: {
    parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
    security: [{ bearerAuth: [] }],
    summary: "Get by ID",
    tags: [label],
  },
  put: {
    parameters: [{ in: "path", name: "id", required: true, schema: { example: 1, type: "integer" } }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            properties: {
              email: { example: "jane@example.com", format: "email", type: "string" },
              imageId: { example: 1, nullable: true, type: "integer" },
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
    security: [{ bearerAuth: [] }],
    summary: "Update",
    tags: [label],
  },
});
