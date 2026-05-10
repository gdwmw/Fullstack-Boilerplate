import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

type TContentResponse = Extract<NonNullable<NonNullable<DocumentDecoration["responses"]>[200]>, { content?: unknown }>;
type TResponseSchema = NonNullable<NonNullable<NonNullable<TContentResponse["content"]>["application/json"]>["schema"]>;

export const docs = (label: string): Record<"getAll" | "getArchives", DocumentDecoration> => {
  const auditLogUserSchema = {
    nullable: true,
    properties: {
      email: { example: "user@example.com", nullable: true, type: "string" },
      name: { example: "John Doe", nullable: true, type: "string" },
      phone: { example: "+6281234567890", nullable: true, type: "string" },
      role: { example: "user", nullable: true, type: "string" },
      username: { example: "johndoe", nullable: true, type: "string" },
    },
    type: "object",
  };

  const auditLogEntrySchema = {
    properties: {
      durationMs: { example: 128, type: "integer" },
      error: { example: null, nullable: true, type: "string" },
      ip: { example: "127.0.0.1", type: "string" },
      level: { enum: ["INFO", "ERROR"], type: "string" },
      method: { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], type: "string" },
      path: { example: "/auth/login", type: "string" },
      payload: { example: { email: "user@example.com", method: "email" }, nullable: true, type: "object" },
      requestId: { example: "d290f1ee-6c54-4b01-90e6-d701748f0851", type: "string" },
      statusCode: { example: 200, type: "integer" },
      ts: { example: "2026-05-07T14:30:00.000Z", format: "date-time", type: "string" },
      userAgent: { example: "Mozilla/5.0", type: "string" },
      users: auditLogUserSchema,
    },
    type: "object",
  };

  const auditLogMetaSchema = {
    properties: {
      page: { example: 1, type: "integer" },
      pageSize: { example: 50, type: "integer" },
      total: { example: 42, type: "integer" },
      totalPages: { example: 1, type: "integer" },
    },
    type: "object",
  };

  const auditArchiveSchema = {
    properties: {
      dateKey: { example: "2026-05-07", type: "string" },
      label: { example: "07 May 2026", type: "string" },
    },
    type: "object",
  };

  const successResponseSchema = {
    properties: {
      data: {
        properties: {
          data: {
            items: auditLogEntrySchema,
            type: "array",
          },
          meta: auditLogMetaSchema,
        },
        type: "object",
      },
      message: { example: responseMessage(label).retrieved, nullable: true, type: "string" },
      success: { example: true, type: "boolean" },
    },
    type: "object",
  };

  const archiveSuccessResponseSchema = {
    properties: {
      data: {
        items: auditArchiveSchema,
        type: "array",
      },
      message: { example: responseMessage("audit archives").retrieved, nullable: true, type: "string" },
      success: { example: true, type: "boolean" },
    },
    type: "object",
  };

  const errorResponseSchema = {
    properties: {
      code: { example: null, nullable: true, type: "string" },
      message: { example: responseMessage(label).notFound, nullable: true, type: "string" },
      success: { example: false, type: "boolean" },
    },
    type: "object",
  } as const;

  return {
    getAll: {
      description: "Get all audit logs from log files with optional filters",
      parameters: [
        {
          description: "Load entries from a selected archive date using YYYY-MM-DD format.",
          in: "query",
          name: "archiveDate",
          schema: { example: "2026-05-07", type: "string" },
        },
        {
          description: "Page number for pagination.",
          in: "query",
          name: "page",
          schema: { default: 1, example: 1, minimum: 1, type: "integer" },
        },
        {
          description: "Maximum number of audit log entries to return per page.",
          in: "query",
          name: "pageSize",
          schema: { default: 50, example: 50, maximum: 100, minimum: 1, type: "integer" },
        },
        {
          description: "Search actor snapshot by name, username, email, phone, or role.",
          in: "query",
          name: "actor",
          schema: { example: "admin", type: "string" },
        },
        {
          description: "Filter entries within the selected minute using HH:mm format.",
          in: "query",
          name: "time",
          schema: { example: "14:30", type: "string" },
        },
        {
          description: "Filter by log level.",
          in: "query",
          name: "level",
          schema: { enum: ["INFO", "ERROR"], type: "string" },
        },
        {
          description: "Filter by HTTP method.",
          in: "query",
          name: "method",
          schema: { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], type: "string" },
        },
        {
          description: "Filter logs whose path contains the provided substring.",
          in: "query",
          name: "path",
          schema: { example: "/auth/login", type: "string" },
        },
        {
          description: "Filter by exact HTTP status code.",
          in: "query",
          name: "statusCode",
          schema: { example: 200, maximum: 599, minimum: 100, type: "integer" },
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: successResponseSchema as TResponseSchema,
            },
          },
          description: "Audit logs retrieved successfully",
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
    getArchives: {
      description: "Get the available audit log archives grouped by date.",
      parameters: [
        {
          description: "Optional month filter for archives.",
          in: "query",
          name: "month",
          schema: { example: 5, maximum: 12, minimum: 1, type: "integer" },
        },
        {
          description: "Optional year filter for archives.",
          in: "query",
          name: "year",
          schema: { example: 2026, minimum: 2000, type: "integer" },
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: archiveSuccessResponseSchema as TResponseSchema,
            },
          },
          description: "Audit archives retrieved successfully",
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
      summary: "Get Archives",
      tags: [label.toLowerCase()],
    },
  };
};
