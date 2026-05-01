import { jwt } from "@elysiajs/jwt";

export const accessJwtPlugin = jwt({
  exp: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  name: "accessJwt",
  secret: process.env.JWT_ACCESS_SECRET || "",
});

export const refreshJwtPlugin = jwt({
  exp: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  name: "refreshJwt",
  secret: process.env.JWT_REFRESH_SECRET || "",
});
