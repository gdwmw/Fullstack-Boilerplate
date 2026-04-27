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
  console.error(`ERROR : (${error.code}) - ${lastLine}`);

  switch (error.code) {
    case "P2000":
      set.status = 400;
      return ERROR_RESPONSE(error, "The provided value is too long for this field");
    case "P2001":
      set.status = 404;
      return ERROR_RESPONSE(error, responseMessage(label).notFound);
    case "P2002":
      set.status = 409;
      return ERROR_RESPONSE(error, responseMessage(P2002(error.message)).alreadyExists);
    case "P2003":
      set.status = 400;
      return ERROR_RESPONSE(error, `Foreign key constraint failed on field: ${P2003(error.meta)}`);
    case "P2004":
      set.status = 400;
      return ERROR_RESPONSE(error, "A constraint failed on the database");
    case "P2005":
      set.status = 400;
      return ERROR_RESPONSE(error, "Invalid value stored in the database for this field");
    case "P2006":
      set.status = 400;
      return ERROR_RESPONSE(error, "The provided value is not valid for this field");
    case "P2007":
      set.status = 400;
      return ERROR_RESPONSE(error, "Data validation error");
    case "P2008":
      set.status = 400;
      return ERROR_RESPONSE(error, "Failed to parse the query");
    case "P2009":
      set.status = 400;
      return ERROR_RESPONSE(error, "Failed to validate the query");
    case "P2010":
      set.status = 400;
      return ERROR_RESPONSE(error, "Raw query failed");
    case "P2011":
      set.status = 400;
      return ERROR_RESPONSE(error, "Null constraint violation: a required field is missing a value");
    case "P2012":
      set.status = 400;
      return ERROR_RESPONSE(error, "Missing a required value");
    case "P2013":
      set.status = 400;
      return ERROR_RESPONSE(error, "Missing a required argument");
    case "P2014":
      set.status = 409;
      return ERROR_RESPONSE(error, "The change would violate a required relation");
    case "P2015":
      set.status = 404;
      return ERROR_RESPONSE(error, "A related record could not be found");
    case "P2016":
      set.status = 400;
      return ERROR_RESPONSE(error, "Query interpretation error");
    case "P2017":
      set.status = 400;
      return ERROR_RESPONSE(error, "The records for the relation are not connected");
    case "P2018":
      set.status = 404;
      return ERROR_RESPONSE(error, "The required connected records were not found");
    case "P2019":
      set.status = 400;
      return ERROR_RESPONSE(error, "Input error");
    case "P2020":
      set.status = 400;
      return ERROR_RESPONSE(error, "Value out of range for the field type");
    case "P2021":
      set.status = 500;
      return ERROR_RESPONSE(error, "The table does not exist in the current database");
    case "P2022":
      set.status = 500;
      return ERROR_RESPONSE(error, "The column does not exist in the current database");
    case "P2023":
      set.status = 500;
      return ERROR_RESPONSE(error, "Inconsistent column data");
    case "P2024":
      set.status = 503;
      return ERROR_RESPONSE(error, "Timed out fetching a new connection from the connection pool");
    case "P2025":
      set.status = 404;
      return ERROR_RESPONSE(error, responseMessage(label).notFound);
    case "P2026":
      set.status = 400;
      return ERROR_RESPONSE(error, "The database provider does not support a feature used in this query");
    case "P2027":
      set.status = 500;
      return ERROR_RESPONSE(error, "Multiple errors occurred on the database during query execution");
    case "P2028":
      set.status = 500;
      return ERROR_RESPONSE(error, "Transaction API error");
    case "P2029":
      set.status = 400;
      return ERROR_RESPONSE(error, "Query parameter limit exceeded");
    case "P2030":
      set.status = 400;
      return ERROR_RESPONSE(error, "No fulltext index found for this search");
    case "P2031":
      set.status = 500;
      return ERROR_RESPONSE(error, "MongoDB replica set is required for this operation");
    case "P2033":
      set.status = 400;
      return ERROR_RESPONSE(error, "A number in the query does not fit into a 64-bit signed integer");
    case "P2034":
      set.status = 409;
      return ERROR_RESPONSE(error, "Transaction failed due to a write conflict or deadlock, please retry");
    case "P2035":
      set.status = 500;
      return ERROR_RESPONSE(error, "Assertion violation on the database");
    case "P2036":
      set.status = 500;
      return ERROR_RESPONSE(error, "External connector error");
    case "P2037":
      set.status = 503;
      return ERROR_RESPONSE(error, "Too many database connections opened");
  }
};
