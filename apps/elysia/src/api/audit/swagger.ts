import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

type TContentResponse = Extract<NonNullable<NonNullable<DocumentDecoration["responses"]>[200]>, { content?: unknown }>;
type TResponseSchema = NonNullable<NonNullable<NonNullable<TContentResponse["content"]>["application/json"]>["schema"]>;

export const docs = (label: string): Record<"getAll", DocumentDecoration> => {
  const auditLogEntrySchema = {
    properties: {
      durationMs: { example: 128, type: "integer" },
      error: { example: null, nullable: true, type: "string" },
      ip: { example: "127.0.0.1", type: "string" },
      level: { enum: ["INFO", "ERROR"], type: "string" },
      method: { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], type: "string" },
      path: { example: "/auth/login", type: "string" },
      requestId: { example: "d290f1ee-6c54-4b01-90e6-d701748f0851", type: "string" },
      statusCode: { example: 200, type: "integer" },
      ts: { example: "2026-05-07T14:30:00.000Z", format: "date-time", type: "string" },
      userAgent: { example: "Mozilla/5.0", type: "string" },
    },
    type: "object",
  };

  const auditLogMetaSchema = {
    properties: {
      limit: { example: 20, type: "integer" },
      page: { example: 1, type: "integer" },
      total: { example: 42, type: "integer" },
      totalPages: { example: 3, type: "integer" },
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
          description: "Page number for pagination.",
          in: "query",
          name: "page",
          schema: { default: 1, example: 1, minimum: 1, type: "integer" },
        },
        {
          description: "Maximum number of audit log entries to return per page.",
          in: "query",
          name: "limit",
          schema: { default: 20, example: 20, maximum: 100, minimum: 1, type: "integer" },
        },
        {
          description: "Filter entries within the selected minute using DD-MM-YYYY HH:mm format.",
          in: "query",
          name: "dateTime",
          schema: { example: "07-05-2026 14:30", type: "string" },
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
  };
};
