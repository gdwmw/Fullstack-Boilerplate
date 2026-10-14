import { DocumentDecoration } from "elysia";

export const docs = (label: string): Record<"delete" | "getAll" | "getById" | "put", DocumentDecoration> => {
  const idParameter = {
    in: "path",
    name: "id",
    required: true,
    schema: { example: "550e8400-e29b-41d4-a716-446655440000", format: "uuid", type: "string" },
  } as const;

  return {
    delete: {
      description: "delete a user by ID",
      parameters: [idParameter],
      responses: {
        200: { description: "user deleted successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "delete user",
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
        200: { description: "users retrieved successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "get all users",
      tags: [label.toLowerCase()],
    },

    getById: {
      description: "get a user by ID",
      parameters: [idParameter],
      responses: {
        200: { description: "user retrieved successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "get user by ID",
      tags: [label.toLowerCase()],
    },

    put: {
      description: "update a user by ID",
      parameters: [idParameter],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "jane@example.com", format: "email", type: "string" },
                imageId: { example: "550e8400-e29b-41d4-a716-446655440001", format: "uuid", nullable: true, type: "string" },
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
        200: { description: "user updated successfully" },
      },
      security: [{ bearerAuth: [] }],
      summary: "update user",
      tags: [label.toLowerCase()],
    },
  };
};
