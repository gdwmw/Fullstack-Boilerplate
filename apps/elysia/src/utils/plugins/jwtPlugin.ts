import { jwt } from "@elysiajs/jwt";

import { env } from "@/src/environment";

export const accessJwtPlugin = jwt({
  exp: env.JWT_ACCESS_EXPIRES_IN,
  name: "accessJwt",
  secret: env.JWT_ACCESS_SECRET,
});

export const refreshJwtPlugin = jwt({
  exp: env.JWT_REFRESH_EXPIRES_IN,
  name: "refreshJwt",
  secret: env.JWT_REFRESH_SECRET,
});
