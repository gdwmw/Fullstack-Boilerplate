import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"create" | "delete" | "getAll" | "getById" | "update", DocumentDecoration> => {
  const idParameter = {
    in: "path",
    name: "id",
    required: true,
    schema: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", type: "string" },
  } as const;

  const payload = {
    properties: {
      description: { example: "An example description", minLength: 1, type: "string" },
      label: { example: "Example", minLength: 1, type: "string" },
    },
    required: ["label", "description"],
    type: "object",
  } as const;

  return {
    create: {
      description: "create an example",
      requestBody: {
        content: {
          "application/json": {
            schema: { ...payload, required: [...payload.required] },
          },
        },
        required: true,
      },
      responses: {
        200: { description: "example created successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "create example",
      tags: [label.toLowerCase()],
    },

    delete: {
      description: "delete an example by ID",
      parameters: [idParameter],
      responses: {
        200: { description: "example deleted successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "delete example",
      tags: [label.toLowerCase()],
    },

    getAll: {
      description: "get all examples",
      parameters: [
        {
          description: "page number for pagination.",
          in: "query",
          name: "page",
          schema: { default: 1, example: 1, minimum: 1, type: "integer" },
        },
        {
          description: "maximum number of examples to return per page.",
          in: "query",
          name: "pageSize",
          schema: { default: 50, example: 50, maximum: 100, minimum: 1, type: "integer" },
        },
      ],
      responses: {
        200: { description: "examples retrieved successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "get all examples",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "get an example by ID",
      parameters: [idParameter],
      responses: {
        200: { description: "example retrieved successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "get example by ID",
      tags: [label.toLowerCase()],
    },

    update: {
      description: "update an example by ID",
      parameters: [idParameter],
      requestBody: {
        content: {
          "application/json": {
            schema: { ...payload, required: [...payload.required] },
          },
        },
        required: true,
      },
      responses: {
        200: { description: "example updated successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "update example",
      tags: [label.toLowerCase()],
    },
  };
};
