import { templateLog } from "@repo/utils";
import { HTTPHeaders, StatusMap } from "elysia";
import { ElysiaCookie } from "elysia/dist/cookies";

import { ERROR_RESPONSE, responseMessage } from "@/src/constants";
import { Prisma } from "@/src/generated/prisma/client";

import { P2002, P2003 } from "./extract";

export const handlePrismaError = (
  label: string,
  error: unknown,
  set: {
    cookie?: Record<string, ElysiaCookie>;
    headers: HTTPHeaders;
    redirect?: string;
    status?: keyof StatusMap | number;
  },
) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return;

  const splitedRawMessage = error.message.split("\n");
  const lastLine = splitedRawMessage[splitedRawMessage.length - 1];
  templateLog.ERROR(lastLine.toLowerCase(), error.code);

  switch (error.code) {
    case "P2000":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "the provided value is too long for this field" });
    case "P2001":
      set.status = 404;
      return ERROR_RESPONSE({ error, message: responseMessage(label).notFound });
    case "P2002":
      set.status = 409;
      return ERROR_RESPONSE({ error, message: responseMessage(P2002(error.message)).alreadyExists });
    case "P2003":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: `foreign key constraint failed on field: ${P2003(error.meta)}` });
    case "P2004":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "a constraint failed on the database" });
    case "P2005":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "invalid value stored in the database for this field" });
    case "P2006":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "the provided value is not valid for this field" });
    case "P2007":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "data validation error" });
    case "P2008":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "failed to parse the query" });
    case "P2009":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "failed to validate the query" });
    case "P2010":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "raw query failed" });
    case "P2011":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "null constraint violation: a required field is missing a value" });
    case "P2012":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "missing a required value" });
    case "P2013":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "missing a required argument" });
    case "P2014":
      set.status = 409;
      return ERROR_RESPONSE({ error, message: "the change would violate a required relation" });
    case "P2015":
      set.status = 404;
      return ERROR_RESPONSE({ error, message: "a related record could not be found" });
    case "P2016":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "query interpretation error" });
    case "P2017":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "the records for the relation are not connected" });
    case "P2018":
      set.status = 404;
      return ERROR_RESPONSE({ error, message: "the required connected records were not found" });
    case "P2019":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "input error" });
    case "P2020":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "value out of range for the field type" });
    case "P2021":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "the table does not exist in the current database" });
    case "P2022":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "the column does not exist in the current database" });
    case "P2023":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "inconsistent column data" });
    case "P2024":
      set.status = 503;
      return ERROR_RESPONSE({ error, message: "timed out fetching a new connection from the connection pool" });
    case "P2025":
      set.status = 404;
      return ERROR_RESPONSE({ error, message: responseMessage(label).notFound });
    case "P2026":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "the database provider does not support a feature used in this query" });
    case "P2027":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "multiple errors occurred on the database during query execution" });
    case "P2028":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "transaction api error" });
    case "P2029":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "query parameter limit exceeded" });
    case "P2030":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "no fulltext index found for this search" });
    case "P2031":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "mongodb replica set is required for this operation" });
    case "P2033":
      set.status = 400;
      return ERROR_RESPONSE({ error, message: "a number in the query does not fit into a 64-bit signed integer" });
    case "P2034":
      set.status = 409;
      return ERROR_RESPONSE({ error, message: "transaction failed due to a write conflict or deadlock, please retry" });
    case "P2035":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "assertion violation on the database" });
    case "P2036":
      set.status = 500;
      return ERROR_RESPONSE({ error, message: "external connector error" });
    case "P2037":
      set.status = 503;
      return ERROR_RESPONSE({ error, message: "too many database connections opened" });
  }
};
