import { HTTPHeaders, StatusMap } from "elysia";

import { ERROR_RESPONSE, responseMessage } from "@/src/constants";
import { Prisma } from "@/src/generated/prisma/client";
import { logger } from "@/src/libs";

import { P2002, P2003 } from "./extract";

type TPrismaErrorMap = (label: string) => Record<string, { message: ((e: Prisma.PrismaClientKnownRequestError) => string) | string; status: number }>;

const PRISMA_ERROR_MAP: TPrismaErrorMap = (label: string) => ({
  P2000: { message: "the provided value is too long for this field", status: 400 },
  P2001: { message: () => responseMessage(label).notFound, status: 404 },
  P2002: { message: (e) => responseMessage(P2002(e.message)).alreadyExists, status: 409 },
  P2003: { message: (e) => `foreign key constraint failed on field: ${P2003(e.meta)}`, status: 400 },
  P2004: { message: "a constraint failed on the database", status: 400 },
  P2005: { message: "invalid value stored in the database for this field", status: 400 },
  P2006: { message: "the provided value is not valid for this field", status: 400 },
  P2007: { message: "data validation error", status: 400 },
  P2008: { message: "failed to parse the query", status: 400 },
  P2009: { message: "failed to validate the query", status: 400 },
  P2010: { message: "raw query failed", status: 400 },
  P2011: { message: "null constraint violation: a required field is missing a value", status: 400 },
  P2012: { message: "missing a required value", status: 400 },
  P2013: { message: "missing a required argument", status: 400 },
  P2014: { message: "the change would violate a required relation", status: 409 },
  P2015: { message: "a related record could not be found", status: 404 },
  P2016: { message: "query interpretation error", status: 400 },
  P2017: { message: "the records for the relation are not connected", status: 400 },
  P2018: { message: "the required connected records were not found", status: 404 },
  P2019: { message: "input error", status: 400 },
  P2020: { message: "value out of range for the field type", status: 400 },
  P2021: { message: "the table does not exist in the current database", status: 500 },
  P2022: { message: "the column does not exist in the current database", status: 500 },
  P2023: { message: "inconsistent column data", status: 500 },
  P2024: { message: "timed out fetching a new connection from the connection pool", status: 503 },
  P2025: { message: () => responseMessage(label).notFound, status: 404 },
  P2026: { message: "the database provider does not support a feature used in this query", status: 400 },
  P2027: { message: "multiple errors occurred on the database during query execution", status: 500 },
  P2028: { message: "transaction api error", status: 500 },
  P2029: { message: "query parameter limit exceeded", status: 400 },
  P2030: { message: "no fulltext index found for this search", status: 400 },
  P2031: { message: "mongodb replica set is required for this operation", status: 500 },
  P2033: { message: "a number in the query does not fit into a 64-bit signed integer", status: 400 },
  P2034: { message: "transaction failed due to a write conflict or deadlock, please retry", status: 409 },
  P2035: { message: "assertion violation on the database", status: 500 },
  P2036: { message: "external connector error", status: 500 },
  P2037: { message: "too many database connections opened", status: 503 },
});

export const getPrismaErrorMessage = (error: unknown): null | string => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  const entry = PRISMA_ERROR_MAP("resource")[error.code];

  if (!entry) return "an unexpected database error occurred";

  if (typeof entry.message === "function") {
    return entry.message(error);
  }

  return entry.message;
};

export const handlePrismaError = (
  label: string,
  error: unknown,
  set: {
    cookie?: Record<string, unknown>;
    headers: HTTPHeaders;
    redirect?: string;
    status?: keyof StatusMap | number;
  },
) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return;

  const splitedRawMessage = error.message.split("\n");
  const lastLine = splitedRawMessage[splitedRawMessage.length - 1];

  logger.error({ code: error.code, scope: "prisma" }, (lastLine ?? error.message).toLowerCase());

  const entry = PRISMA_ERROR_MAP(label)[error.code];

  let message: string;

  if (!entry) {
    message = "an unexpected error occurred";
  } else if (typeof entry.message === "function") {
    message = entry.message(error);
  } else {
    message = entry.message;
  }

  set.status = entry?.status ?? 500;

  return ERROR_RESPONSE({ error, message });
};
