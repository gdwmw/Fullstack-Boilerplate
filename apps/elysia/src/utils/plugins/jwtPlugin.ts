import { jwt } from "@elysiajs/jwt";

import { env } from "@/src/environment";

export const accessJWTPlugin = jwt({
  exp: env.JWT_ACCESS_EXPIRES_IN,
  name: "accessJWT",
  secret: env.JWT_ACCESS_SECRET,
});

export const refreshJWTPlugin = jwt({
  exp: env.JWT_REFRESH_EXPIRES_IN,
  name: "refreshJWT",
  secret: env.JWT_REFRESH_SECRET,
});
