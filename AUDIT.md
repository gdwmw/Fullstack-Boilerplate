# Architectural Audit — Fullstack Boilerplate

> **Update (post-audit):** the Security-First **P0 batch** has been applied — see §12 below. The original audit body is preserved as written for traceability; only finding **S4 / §4.1** was found to be wrong (Next.js 16 deprecated `middleware` and **renamed it to `proxy`**, so `proxy.ts` is in fact the correct convention) and is annotated accordingly.

> Audit only. No source files were modified. Findings are grouped by area, prioritized **P0 (critical)**, **P1 (high)**, **P2 (medium)**, **P3 (nice-to-have)**, and each finding has: **Problem → Why it matters → Recommended solution → Refactor sketch → Impact**.

Stack reviewed: Turborepo + pnpm, Next.js 16 (App Router) + React 19 + Tailwind v4 + Jotai + TanStack Query + NextAuth, Elysia.js + Prisma 7 + PostgreSQL + Redis (Bun runtime), Vitest, ESLint flat + Prettier.

---

## 0. Executive summary

The boilerplate is feature-rich (JWT rotation + blocklist, audit log compression, DB backup worker, Storybook, theme, file upload with `sharp`/`plaiceholder`). The biggest themes for improvement:

1. **Boundary leakage**: domain logic, transport, infrastructure, and validation are intermixed inside route handlers (especially `auth/route.ts`). The `service` modules are thin wrappers over Prisma rather than a real application/domain layer.
2. **Configuration is duplicated and unsafe**: env vars are read with `process.env.X || default` in many places *and* validated by `throw new Error` chains in `index.ts` / `layout.tsx`. There is no single typed config module, so type inference is wrong (`string | undefined`) downstream and defaults silently shadow misconfiguration.
3. **Cross-cutting concerns reimplemented per route**: every route group repeats `accessJwtPlugin + onError(handlePrismaError) + onBeforeHandle(verifyAccessToken) + manual schema.parse(...)`. This is the single biggest source of duplication and inconsistency.
4. **Inconsistent response/error contract**: Zod errors, generic JS errors, `ERROR_RESPONSE`, and `throw new Error(...)` (e.g. upload "File not found") all coexist; the global Elysia `error` handler is not used to normalize them.
5. **Frontend has a real-but-leaky API client**: `apps/next/src/utils/api/base.ts` mixes server/client concerns (`getSession` is server-only but called from a generic helper used in client mutations), and the contract is duplicated by hand on both sides instead of shared via a typed package.
6. **Type safety holes**: `any` in `params`, manual interfaces that mirror Prisma models, `as unknown as IAuthResponse` bridges, JWT payload typed as `Record<string, unknown>` everywhere.
7. **DX friction**: scripts inconsistent across packages, `pre-push` runs full storybook+build (slow), `lint-staged` shells into each package with `bash -c 'cd ...'` (slow + brittle on Windows).
8. **Tests cover only the easy parts**: pure utils, response templates, a couple of hooks. Auth flow, refresh rotation, request logger, workers, upload, and audit service have **0 coverage** despite being the most critical/complex code.

---

## 1. Monorepo & infrastructure

### 1.1 [P0] Single source of truth for environment variables is missing

**Problem.** `apps/elysia/src/index.ts` has 14 separate `if (!process.env.X) throw new Error(...)` blocks at module top-level; `apps/next/src/app/layout.tsx` repeats the pattern with 7 more checks. Throughout the rest of the codebase env vars are then re-read with fallbacks like `process.env.JWT_REFRESH_COOKIE_NAME || "refreshToken"`, `process.env.JWT_ACCESS_SECRET || ""`, `process.env.LOG_DIR?.trim() || join(process.cwd(), "backups", "logs")`. Examples:

- [apps/elysia/src/utils/plugins/jwtPlugin.ts](apps/elysia/src/utils/plugins/jwtPlugin.ts#L4-L7) — `secret: process.env.JWT_ACCESS_SECRET || ""` (silently produces an empty-secret JWT signer if env is missing).
- [apps/elysia/src/api/auth/route.ts](apps/elysia/src/api/auth/route.ts#L17-L20) — `process.env.JWT_REFRESH_COOKIE_NAME || "refreshToken"` (defaults inconsistent with the validator in `index.ts` that requires the var).
- [apps/elysia/src/libs/redis.ts](apps/elysia/src/libs/redis.ts#L5) — `process.env.REDIS_URL || "redis://localhost:6379"`.
- [apps/elysia/src/libs/prisma.ts](apps/elysia/src/libs/prisma.ts#L7) — ``const connectionString = `${process.env.DATABASE_URL}`;`` coerces `undefined` to the literal string `"undefined"`.

**Why it matters.** (a) The validation block in `index.ts` is duplicated, fragile, and only protects the entry script; tests, workers spawned via cron, or any module imported in isolation re-introduce defaults that hide misconfiguration. (b) Type inference downstream stays `string | undefined`, leading to non-null assertions and casts. (c) Empty default secrets are a real **security** problem — a misconfigured deployment will boot and silently sign tokens with `""`.

**Recommended solution.** Single Zod-validated config module per app, imported anywhere env is needed.

```ts
// apps/elysia/src/config/env.ts
import { z } from "zod";

const Env = z.object({
  ELYSIA_PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_COOKIE_NAME: z.string().default("refreshToken"),
  JWT_REFRESH_COOKIE_PATH: z.string().default("/auth"),
  JWT_REFRESH_COOKIE_SAME_SITE: z.enum(["Lax", "Strict", "None"]).default("Lax"),
  JWT_REFRESH_COOKIE_SECURE: z.enum(["true", "false"]).transform((v) => v === "true"),
  CORS_ORIGINS: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  LOG_DIR: z.string().default("./backups/logs"),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  DB_BACKUP_DIR: z.string().default("./backups/database"),
  DB_BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = Env.parse(process.env);
export type Env = z.infer<typeof Env>;
```

Same pattern for Next.js, separating `serverEnv` (private) from `publicEnv` (must start with `NEXT_PUBLIC_`). Forbid `process.env.*` reads outside `config/env.ts` via an ESLint `no-restricted-properties` rule.

**Impact.** Eliminates ~30 lines of validation boilerplate, removes dozens of `|| "default"` fallbacks, gives strict typing to every consumer, and produces one fail-fast error message at boot listing **all** missing vars at once instead of the first one.

---

### 1.2 [P1] `turbo.json` task graph is incomplete

**Problem.** `turbo.json` declares 11 tasks but only `build` configures `inputs` and `outputs`. `lint`, `check-types`, `vitest:run`, `prettier`, `cpenv` have no `inputs`/`outputs`, so Turbo's content-based hashing falls back to defaults. `dev` correctly uses `cache: false, persistent: true`, but `start` is missing the same flags despite being a long-running process. `globalEnv` includes `NEXT_PUBLIC_DEBUG_MODE` but `NEXT_PUBLIC_REFRESH_BUFFER_MS` and others are missing.

**Recommended solution.**

- For `lint` and `check-types`: scope `inputs` to source files; `outputs: []` for clarity.
- For `vitest:run`: declare `outputs: ["coverage/**"]` and depend on `^build` only if you actually need built deps (you don't since paths use `src/index.ts`).
- For `start`: add `cache: false, persistent: true, dependsOn: ["build"]`.
- Add a `clean` task and a `format` task.
- Move all `NEXT_PUBLIC_*` to `globalEnv` and audit secret env vars (they should be in `globalEnv`, not per-task `env`).

**Impact.** Faster cold cache hits, deterministic CI, fewer "why didn't this rerun" surprises.

---

### 1.3 [P2] `tsconfig.base.json` is too thin

**Problem.** It enables `strict` (good) but is missing important guards already standard in modern projects:

```jsonc
{
  "noUncheckedIndexedAccess": true,   // would catch `splited[splited.length - 1]` patterns
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "exactOptionalPropertyTypes": true, // matches your "?:" usage style
  "useUnknownInCatchVariables": true, // already default with strict, but pin it
  "verbatimModuleSyntax": true,       // forces consistent `import type`
  "allowSyntheticDefaultImports": true
}
```

`apps/elysia/tsconfig.json` overrides `moduleResolution` to `"node"` while base uses `"Bundler"` — pick one. Bun + Elysia work fine with `"Bundler"`, the override is unnecessary.

**Impact.** `noUncheckedIndexedAccess` alone would have flagged real bugs like `cookie.split("=")` indexing in `readRefreshTokenFromCookie` and the regex `parsed[2]` access in `parseDurationToMs`.

---

### 1.4 [P1] `.husky/pre-push` is too heavy

```
pnpm lint
pnpm check-types
pnpm vitest:run
pnpm storybook:build
pnpm build
```

**Problem.** Five full-monorepo tasks on every `git push` is brutal — `storybook:build` plus `next build` can easily take minutes. Devs will start using `--no-verify` and bypass safety entirely.

**Recommended solution.** Keep `pre-commit` light (lint-staged is good). Keep `pre-push` to the **fast** safety checks: `pnpm check-types && pnpm lint`. Move `vitest:run`, `storybook:build`, and `build` into CI (GitHub Actions). Storybook builds belong on a separate workflow that only runs when components change.

**Impact.** Faster developer iteration, healthier hook compliance.

---

### 1.5 [P1] CI workflow is dangerous

[.github/workflows/sync-main.yml](.github/workflows/sync-main.yml) does `git checkout --orphan main && git push -f origin main` on every push to `development`. That destroys `main`'s history and any direct contributions or hotfixes on `main` are silently lost. Tags, release commits, signed commits — all gone.

**Recommendation.** Either (a) treat `development` as the integration branch and open PRs into `main` (recommended), or (b) use a fast-forward sync. Document this destructive behavior loudly in `README.md` if you keep it. There's also no actual CI: no test/lint/build verification before merge.

**Impact.** Safety + traceability. Today this repo has no real "main" history, which makes hotfixes, reverts, and audit trails impossible.

---

### 1.6 [P2] `.lintstagedrc` shell-out anti-pattern

Each glob runs `bash -c 'cd apps/next && eslint --fix'` followed by a second eslint pass, then prettier. (a) Two eslint invocations per file is wasteful; the first `--fix` would already produce lint output. (b) `bash -c 'cd ...'` is slow and breaks on Windows. (c) Lint-staged already passes the changed file paths — passing them to `eslint` directly is much faster than running eslint over the whole package.

**Recommendation.**

```jsonc
{
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

ESLint flat config with `eslint.config.mjs` discovery already resolves the right config per file; `cd` is unnecessary.

**Impact.** Faster pre-commit (one eslint pass instead of two-per-package), works on every OS.

---

## 2. Shared packages

### 2.1 [P1] `packages/constants` is too small to justify a package

It contains exactly one file (`schemaMessage.ts`). A package boundary adds publishing friction (own `package.json`, `tsconfig`, `eslint`) for ~17 lines. Keep it as a package only if you plan to add cross-cutting constants soon (e.g., shared schemas, error codes, role enums). Otherwise inline it.

**Better use.** Promote `packages/constants` into `packages/contracts` and put the **shared Zod schemas + inferred types** for the API contract there (see §6.1). Both Elysia and Next.js currently duplicate `IUserResponse`, `IAuthResponse`, register/login/changePassword shapes. A single `@repo/contracts` would unify them.

---

### 2.2 [P1] Frontend doesn't import the shared schemas

Backend has `apps/elysia/src/api/auth/schema.ts` with `loginSchema`, `registerSchema`, `changePasswordSchema`. Frontend has `apps/next/src/app/authentication/login/_layout/modules/main/schema.ts` (a separate `loginSchema` referenced as `"../schema"`). They will drift. The whole point of `@repo/constants/schemaMessage` only matters if both ends use it; today only Elysia does.

**Recommendation.** Move all input Zod schemas to `@repo/schemas` and import them on both sides. `react-hook-form`'s `zodResolver` and Elysia's `body.parse` will use the exact same source.

---

### 2.3 [P2] `packages/utils` has poor abstractions

- [`logTemplate`](packages/utils/src/logTemplate.ts) is a `console.log` wrapper with ANSI colors. It works in Node, but in a browser it prints raw escape sequences (`\x1b[34m`) into devtools. The frontend imports it via `@repo/utils` and calls it inside React mutations and `useLocalStorage`. Use the browser console's `%c` styling, or split the package into `@repo/utils-node` + `@repo/utils-browser`, or accept that frontend logging should go through a dedicated client logger.
- [`parseDurationToMs`](packages/utils/src/parseDurationToMs.ts) uses a non-anchored regex if you forget — it actually anchors with `^...$`, OK. But `parsed[2].toLowerCase()` then `multiplierByUnit[unit]` returns `undefined` if the regex permitted an unknown unit; the regex enumerates units so this is fine, but `parsed[1]` would benefit from `noUncheckedIndexedAccess`. Trivial.
- The package's `tsconfig.json` declares `"lib": ["ES2022", "DOM"]` even though the code is pure Node. Drop `DOM` to make accidental browser-only API usage impossible.

---

### 2.4 [P2] `packages/eslint-config` has an inconsistent self-import

[packages/eslint-config/src/utils.js](packages/eslint-config/src/utils.js):

```js
import { baseConfig } from "../../eslint-config/src/base.js";
```

Should be `from "./base.js"`. The current path is a relative jump out and back in. Cosmetic but confusing.

Also `eslint-config/src/next.js` enables `react/react-in-jsx-scope: off` (correct for React 19) but `react/jsx-no-undef: warn` (the rule is largely subsumed by TS and is noisy). The `// "react/no-multi-comp"` and `// "react/prefer-read-only-props"` commented-out lines should be deleted, not left as dead config.

---

## 3. Elysia backend — architecture

### 3.1 [P0] Routes are doing too much; no clear application layer

[`apps/elysia/src/api/auth/route.ts`](apps/elysia/src/api/auth/route.ts) is 470+ lines and handles:

- Cookie parsing/serialization
- JWT issuance + verification + base64url decoding
- Hashing (`hashToken`)
- Request metadata extraction
- Refresh-rotation **business rules** (revoke family, blocklist, expiry)
- HTTP transport (cookie headers, status codes)
- Schema validation (`registerSchema.parse(body)`)
- Logging side effects

`service.ts` is essentially a Prisma DAO with `Bun.password` sprinkled in. There is no **application/use-case** layer; the route handler *is* the application service. This is the single biggest reason the file is hard to read and untestable.

**Recommended layering.**

```
api/auth/
  route.ts            // HTTP only: parse, call usecase, format response
  usecases/
    register.ts       // orchestrates: hash password -> create user -> issue tokens -> persist session
    login.ts
    refresh.ts
    logout.ts
    changePassword.ts
    me.ts
  domain/
    tokens.ts         // pure: issue pair, parse claims, build refresh-cookie string
    refreshSession.ts // pure rules: isExpired(), isRevoked(), nextRotation()
  infra/
    sessionRepository.ts // Prisma calls only
    blocklistStore.ts    // Redis calls only
    passwordHasher.ts    // Bun.password
  schema.ts           // Zod (move to @repo/contracts)
```

Routes then become 10–15 lines each:

```ts
.post("/login", async ({ body, set, cookies, request }) => {
  const payload = loginSchema(...).parse(body)
  const result = await loginUsecase({ payload, meta: getClientMetadata(request.headers), deps })
  if (!result.ok) { set.status = 401; return ERROR_RESPONSE({ message: result.error }) }
  set.headers["set-cookie"] = serializeRefreshCookie(result.refreshToken)
  return SUCCESS_RESPONSE({ data: result.data, message: responseMessage("login").success })
})
```

**Impact.** Each usecase is testable in isolation (no Elysia, no real Prisma, no real Redis). The route file becomes scannable. Cross-cutting bug fixes (e.g., a new revocation rule) live in one place.

---

### 3.2 [P0] Refresh-rotation has subtle race + correctness issues

In [`apps/elysia/src/api/auth/route.ts`](apps/elysia/src/api/auth/route.ts) `/refresh`:

1. The full chain (verify → check blocklist → load session → compare hash → check revoked → check expired → load user → issue tokens → blocklist old → rotate session) is **not transactional end-to-end**. `addToBlocklist` is in Redis, `rotateRefreshSession` is in Postgres, `getRefreshSessionByJti` is unindexed for the freshness check. Two concurrent refresh requests with the same token will both pass the "not revoked" check (TOCTOU) and produce two new sessions in the same family. Today, families are revoked only on hash mismatch, not on duplicate rotation — so a successfully replayed token can briefly mint two valid access tokens.

2. `revokeRefreshSessionByJti` and `rotateRefreshSession` use `updateMany({ where: { jti, revokedAt: null }})` which is the right intent (idempotent), but the rotation code calls them in two separate awaits **outside** the `$transaction`. The transaction inside `rotateRefreshSession` only wraps the rotation half.

3. Pre-rotation blocklist insert (`addToBlocklist(session.jti, session.expiresAt)`) is fire-and-forget relative to the rotation; if rotation throws, the old token is now blocklisted but no new token has been issued — the user is silently logged out.

**Recommended solution.**

- Wrap the entire refresh use case in a single Postgres transaction with `SELECT ... FOR UPDATE` on the session row (or an atomic conditional update like `UPDATE sessions SET replacedByJti = $newJti, revokedAt = now() WHERE jti = $jti AND revokedAt IS NULL RETURNING ...`). Only proceed if the update affected 1 row.
- Move the Redis blocklist insert to **after** the DB transaction commits successfully.
- On any detection of **reuse** (the row is already rotated/revoked), revoke the **whole family** and force re-login. This is the standard refresh-token-reuse-detection pattern; today only the `replacedByJti` check covers it partially.
- Add an index on `(userId, expiresAt)` for cleanup, and `(jti)` is already unique — good.

**Impact.** Closes a real auth concurrency hole and eliminates "phantom logouts" caused by partial failures.

---

### 3.3 [P0] Empty/insecure JWT defaults

```ts
export const accessJwtPlugin = jwt({
  exp: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  name: "accessJwt",
  secret: process.env.JWT_ACCESS_SECRET || "",
});
```

If `JWT_ACCESS_SECRET` is missing, this signs JWTs with the empty string. The `index.ts` validator catches it at boot, but only when `index.ts` is the entrypoint — tests, scripts, and Vitest setup that import `jwtPlugin` directly bypass the check. Fail loud at the plugin level too:

```ts
import { env } from "@/src/environment";
export const accessJwtPlugin = jwt({ exp: env.JWT_ACCESS_EXPIRES_IN, name: "accessJwt", secret: env.JWT_ACCESS_SECRET });
```

(See §1.1 for the env module.)

---

### 3.4 [P0] Two parallel JWT verifiers — keep one

`apps/elysia/src/utils/verifyAccessToken.ts` uses `accessJwt.verify` (the `@elysiajs/jwt` plugin). `apps/elysia/src/utils/plugins/requestLoggerPlugin.ts` reimplements verification with raw `crypto.subtle.importKey` + `crypto.subtle.verify` and base64url decoding. Two implementations of the same trust boundary is a recipe for divergence (one might enforce `nbf`, the other not — and indeed the plugin enforces `nbf` while `verifyResponse` does not).

**Recommendation.** Extract a single `verifyJwt(token)` function in `infra/jwt.ts` used by both the request logger and the auth guard. The logger doesn't need full Elysia context; just call `verifyJwt(getBearerToken(headers.authorization))`.

---

### 3.5 [P1] Per-route cross-cutting plumbing is duplicated

Every route file re-applies the same setup:

```ts
.use(accessJwtPlugin)
.onError(({ error, set }) => handlePrismaError(LABEL, error, set))
.onBeforeHandle(async ({ accessJwt, headers, set }) => {
  const verifyResponse = await verifyAccessToken({ accessJwt, headers, set });
  if (verifyResponse) return verifyResponse;
})
```

Found in `users/route.ts`, `upload/route.ts`, `audit/route.ts`. Differences are accidental (e.g., `LABEL`).

**Recommendation.** Create an Elysia plugin chain:

```ts
// utils/plugins/protectedRoutes.ts
export const protectedRoutes = (label: string) =>
  new Elysia()
    .use(accessJwtPlugin)
    .onError(({ error, set }) => handlePrismaError(label, error, set))
    .onBeforeHandle(async ({ accessJwt, headers, set }) =>
      (await verifyAccessToken({ accessJwt, headers, set })) ?? undefined,
    );

// users/route.ts
export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(protectedRoutes("users"))
  .get("/", ...)
```

Same for `publicRoutes(label)` for `/auth`.

**Impact.** ~30 lines of duplication removed; one place to change the auth/error pipeline.

---

### 3.6 [P1] Validation should be Elysia-native, not `schema.parse(...)` inside handlers

Right now every handler does `paramSchema.parse(params)`, `payloadSchema.parse(body)`. When `parse` throws, Elysia's default error handler returns a 500 with the raw Zod error — it is not normalized to your `ERROR_RESPONSE({ success: false })` shape.

**Recommendation.** Use Elysia's first-class validation by adapting your Zod schemas to TypeBox or providing a Zod adapter. With `elysia-zod` (or a 10-line adapter that pre-parses in a `transform` hook), errors flow through `.onError` and you get a single normalized error contract.

```ts
.onError(({ code, error, set }) => {
  if (code === "VALIDATION") { set.status = 422; return ERROR_RESPONSE({ message: formatZodIssues(error) }) }
  return handlePrismaError(LABEL, error, set)
})
```

**Impact.** Consistent 422 errors with field-level messages; removes 12+ `schema.parse(...)` calls; routes shrink further.

---

### 3.7 [P1] `handlePrismaError` always returns the response *and* mutates `set.status`

```ts
.onError(({ error, set }) => handlePrismaError(LABEL, error, set))
```

The function returns `undefined` for non-Prisma errors, which Elysia treats as "continue with default handler". For Zod errors and `throw new Error("File not found")` (in `upload/service.ts`) this means the client sees Elysia's default 500 with stack trace exposed in dev. Add explicit branches for `ZodError` (→ 422) and generic `Error` (→ 500 with sanitized message).

Also the `PRISMA_ERROR_MAP("resource")` call inside `getPrismaErrorMessage` ignores the `label` argument from the outer function (it hardcodes `"resource"`). Dead code path — `getPrismaErrorMessage` is unused; consider deleting it.

---

### 3.8 [P1] `service` modules expose Prisma rows directly

Returning a Prisma `users` row (with `omit: { password: true }`) leaks `imageId`, `createdAt`, `updatedAt`, and `image: Files | null` into the wire response. The frontend then duplicates the type as `IUserResponse`. The contract is implicit and changes if you ever rename a Prisma column.

**Recommendation.** Define explicit response DTOs (or Zod output schemas in `@repo/contracts`) and map Prisma rows → DTOs in the service. This also lets you safely add denormalized fields (`imageUrl`) without leaking the FK.

---

### 3.9 [P1] `upload/service.ts` errors and side-effects

- [`upload/service.ts`](apps/elysia/src/api/upload/service.ts#L48-L68): `delete` does `prisma.delete()` *before* the disk cleanup. If file deletion fails partway, the DB row is gone but disk artifacts remain orphaned. Wrap in a transaction-like pattern: collect filenames first, delete DB row, then best-effort delete files (you already swallow errors — at least log them).
- The first call `await prisma.files.findUnique` followed by `prisma.files.delete` allows a race; use `prisma.files.delete({ where: { id }})` and rely on `P2025` Not Found.
- `throw new Error("File not found")` bypasses your `ERROR_RESPONSE` shape. Use Prisma's behavior or throw a typed `NotFoundError`.
- `processImage` writes files inside the loop sequentially — make it `Promise.all` for concurrent resize.
- No max upload size. A 1 GB image will OOM your worker. Validate `file.size` in the schema (`.refine((f) => f.size <= 10 * 1024 * 1024)`).
- No MIME sniffing — the schema trusts `file.type` from the client. Use `sharp`'s metadata or `file-type` to verify.
- Filenames generated with `randomUUID() + extname(originalFilename)` — if `extname` returns `.svg` you might be opening an XSS vector when serving from `/uploads/*`. Force `.webp` for processed images, force `.bin` or content-type checks for the rest.
- Static file serving in `index.ts`: `Bun.file(join(process.cwd(), "uploads", params["*"]))` is **path traversal**. `params["*"]` could be `../../etc/passwd`. You must normalize and verify the resolved path stays inside `UPLOAD_DIR`.

```ts
const safe = path.normalize(params["*"]);
if (safe.startsWith("..") || path.isAbsolute(safe)) throw new Error("forbidden");
return Bun.file(join(UPLOAD_DIR, safe));
```

This is a **P0 security** issue and should be fixed immediately.

---

### 3.10 [P1] `audit/service.ts` reads, decompresses, and parses log files synchronously per request

The audit endpoint walks `LOG_DIR`, optionally decompresses zst files via spawning `zstd` processes, parses every line of every file, then filters and paginates **in memory**. With a year of retention this becomes an O(N) request-time job.

**Recommendation.** Either:

- (Best) Persist audit events to a dedicated Postgres table (or ClickHouse / Loki) and query with SQL (with proper indexes on `ts`, `level`, `method`, `userId`). Compressed log files become a backup/audit medium, not the read path.
- Otherwise, build an in-memory index per file with start/end timestamps, then short-circuit file reads by pagination boundary; cache decompressed file content for a TTL.
- Avoid spawning `zstd` per request: pre-decompress on a worker and cache.

---

### 3.11 [P2] Cron jobs in `index.ts`

`Bun.cron` is hard-coded inline at the bottom of `index.ts`. Move to `src/jobs/index.ts` with a `registerCronJobs(app)` helper. Also add jitter to `databaseBackupWorker` (currently runs at exactly 09:00, 12:00, 15:00, 18:00 — multiple instances would all back up at the same instant).

`databaseBackupWorker` uses a module-level `let isBackupRunning = false` mutex. With multiple processes/instances this is **not** a mutex. Use a Redis SET NX EX lock.

---

### 3.12 [P2] Logging + secrets

`requestLoggerPlugin` already sanitizes a `SENSITIVE_FIELD_NAMES` set — good. But:

- The set should be exhaustive: add `cookie`, `set-cookie`, `x-api-key`, `apiKey`, `secret`.
- Logging includes the **full request body** even for non-sensitive routes, which can include PII (phone, email). Add a per-route opt-out or only log fields explicitly allowlisted.
- `JSON.parse(trimmed)` in `parseLogFile` swallows malformed lines silently — good for resilience but log a metric.

---

### 3.13 [P2] Prisma usage hygiene

- `apps/elysia/prisma/models/sessions.prisma` uses lowercase model name `sessions` while `Users` and `Files` are PascalCase. Inconsistent — Prisma convention is PascalCase singular (`User`, `File`, `Session`). The DB table mappings (`@@map("sessions")`) handle the SQL side, so renaming the model is purely a TS-facing improvement and a one-time migration of generated client.
- `prisma.config.ts` references `schema: "prisma"` (a directory). With Prisma 7's schema folder feature, ensure CI runs `prisma format` to merge models reproducibly.
- `Files.user` is declared as `Users?` with a 1:1 relation via `imageId @unique`. That means a file cannot be associated with more than one user as an avatar. If avatars are a use case, make a separate `UserAvatar` join or accept the constraint explicitly. If you intend files to be reusable assets, drop the `@unique` and add a separate `Avatars` model.
- `prisma/schema.prisma` no longer has `url = env("DATABASE_URL")` because `prisma.config.ts` injects it via `defineConfig`. That's fine for the new Prisma config flow, but document this — a new dev seeing `datasource db { provider = "postgresql" }` will be confused by the missing URL.

---

## 4. Frontend (Next.js)

### 4.1 [WITHDRAWN] ~~Filename `proxy.ts` should be `middleware.ts`~~

> **This finding is incorrect for Next.js 16 and has been withdrawn.**
>
> Next.js 16 (Nov 2025) deprecated `middleware` and **renamed the convention to `proxy`**. The file [apps/next/src/proxy.ts](apps/next/src/proxy.ts) with a default export and `config.matcher` is therefore the *current, supported* form and is auto-loaded by the framework. RBAC is **not** disabled.
>
> Source: <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>. Migration codemod for older projects: `npx @next/codemod@canary middleware-to-proxy .`.
>
> No action required.

---

### 4.2 [P1] Authorization rules duplicated client-side and (intended) middleware-side

Even after fixing 4.1, the role check `request.nextauth.token?.role !== "admin"` is hardcoded. Define a single `routeAccessRules` object:

```ts
export const routeAccessRules = [
  { match: /^\/admin-example/, requires: { role: "admin" } },
  { match: /^\/audit/,         requires: { role: "admin" } },
  { match: /^\/example\/([^/]+)/, requires: ({ token, params }) => params[0] === token?.username },
] as const
```

Then both server middleware and client navigation guards consume the same source. This becomes essential as the route count grows.

---

### 4.3 [P1] `apps/next/src/utils/api/base.ts` mixes server-only and client code

```ts
import { getSession } from "@/src/utils";
const accessToken = auth ? await getSession("accessToken") : null;
```

`getSession` is annotated `"use server"` ([apps/next/src/utils/server/session.ts](apps/next/src/utils/server/session.ts)). Importing a server action into a module that is itself imported by client components (`POSTLogin` is called inside the `login` page form mutation, which is `"use client"`) means every client call generates a Server Action HTTP round-trip just to read the session — instead of using `useSession()` from `next-auth/react`.

**Recommendation.** Split the API client into:

- `utils/api/server.ts` — uses `getServerSession` for SSR/RSC fetching.
- `utils/api/client.ts` — accepts `accessToken` as parameter, called from client mutations after `useSession()`.
- A lower-level `apiRequest` that takes `{ accessToken: string | null }` and never decides where to read it from.

```ts
// utils/api/client.ts
"use client"
export const useApi = () => {
  const { data } = useSession()
  return { post: <T>(opts) => apiRequest<T>({ ...opts, accessToken: data?.user?.accessToken ?? null }) }
}
```

**Impact.** Removes hidden network round-trips, makes server vs client boundaries explicit, eliminates the `eslint-disable any` in `params`.

---

### 4.4 [P1] `ReactQueryProvider` creates a new `QueryClient` per render in client components

```ts
const [queryClient] = useState(() => new QueryClient());
```

Looks fine, but it's defined at the **app shell** in `layout.tsx` as a client provider — meaning every navigation that re-mounts the layout would lose the cache. With the App Router this is mitigated, but the bigger issue is that `<ReactQueryProvider dehydratedState={...}>` is also used **inside** `(authed)/(admin)/audit/_layout/modules/main/index.tsx` — nesting two `QueryClientProvider`s creates two independent caches. The inner provider's purpose seems to be hydration of server-prefetched state, but it should not introduce a new QueryClient. Use `<HydrationBoundary state={dehydratedState}>` directly without a nested `QueryClientProvider`.

**Recommendation.**

- Top-level provider only in `layout.tsx`.
- Per-page `<HydrationBoundary state={dehydratedState}>` for SSR prefetching.
- Set sensible defaults: `staleTime: 60_000`, `gcTime`, `retry: (n, err) => err.status >= 500 && n < 2` to avoid thundering retries on 4xx.

---

### 4.5 [P1] `NextAuthProvider` runs two parallel timers per session

`RefreshSessionGuard` schedules a `signOut` timeout when session expires; `AccessTokenRefreshGuard` schedules a `POSTRefresh` before access token expiry. Both depend only on `[session.status]` (with `eslint-disable react-hooks/exhaustive-deps`). Issues:

1. The dep-list lie hides bugs: when `accessTokenExpiresAt` updates after a refresh, the timer is **not** rescheduled. After the first refresh the access token is fresh but the next refresh won't fire because the effect didn't re-run.
2. Two tabs both run their own timers and both call `POSTRefresh` simultaneously — each rotates the refresh token, the second rotation invalidates the first. With your hash-mismatch detection that revokes the entire family, **opening a second tab logs the user out**. This is a real reproducible bug today.
3. `setTimeout` with `sessionExpiresAt - Date.now()` may exceed `2^31 ms` (~24.8 days) and silently fire immediately.

**Recommendation.**

- Coordinate cross-tab refresh via `BroadcastChannel("auth")` or the `localStorage` storage event so only one tab refreshes; others reuse the result.
- Make `AccessTokenRefreshGuard` depend on `[session.data?.user?.accessTokenExpiresAt]` so it reschedules after each refresh.
- Cap timers at safe values; for sessions > 24 days, re-arm.
- Remove the eslint-disable; if the dep is intentionally narrow, encode that with a `useEffectEvent` (React 19) or by reading current values from a ref.

---

### 4.6 [P1] `useGlobalContext` is a Jotai anti-pattern

```ts
const openAAtom = atom<...>(false)
const openBAtom = atom<...>(false)
export const useGlobalContext = () => {
  const [openA, setOpenA] = useAtom(openAAtom)
  const [openB, setOpenB] = useAtom(openBAtom)
  return { openA, openB, setOpenA, setOpenB }
}
```

Every component that calls `useGlobalContext` subscribes to **both** atoms even if it only needs one — defeating Jotai's per-atom granularity. Plus `openA` / `openB` are placeholder names that suggest this is an example file shipped to production.

**Recommendation.** Either delete this and consume atoms directly (`useAtom(openAAtom)`), or expose per-atom hooks (`useOpenA`, `useOpenB`). Adopt the "atom per concern" mental model; never bundle unrelated atoms in a single hook.

---

### 4.7 [P2] `useToast` keeps state local — useless for global toasts

Each consumer of `useToast` gets its own `toasts` array. Calling `success(...)` in one component does not show a toast in another. Either lift to a Jotai atom (`toastsAtom`) or wrap in a `<ToastProvider>` with React context. As-is, the hook is misleading.

Also: `setTimeout` IDs are not cleaned up on unmount — an unmounted component's pending timeout calls `setToasts` on a dead component (React 18+ silently no-ops, but it's still a leak indicator).

---

### 4.8 [P2] `ChangeThemeButton` cookie + theme drift

The cookie is a manual `setCookie({ name: "theme", value: newTheme })` (server action) followed by `setTheme(newTheme)` (client). Two writes, two sources of truth. `next-themes` already handles client persistence via `localStorage` and has its own SSR handling — adding a cookie duplicates state. Use `next-themes`'s `attribute="class"` + `defaultTheme="system"` and read `document.documentElement.classList` for SSR-safe styling, or commit fully to the cookie approach by writing a tiny custom theme provider. Don't do both.

The icon shown comes from the **cookie prop**, not from the live `theme`, so right after a click the icon is stale until the next render with refreshed cookie.

---

### 4.9 [P2] `APIConnectionChecker` design

- `ENVIRONMENT_DATA_VARIABLES` is hardcoded but `ENVIRONMENT_DATA_VALUES` reads `process.env.NEXT_PUBLIC_BASE_API_URL` at module load — fine, but if you add another URL you update two parallel arrays. Use a single `[{ name, value }]`.
- The "Connected" mock card (with hardcoded `NEXT_PUBLIC_EXAMPLE_URL` label and always-green icon) is a UI placeholder that should be removed before production.
- Polling every 30s with `axios HEAD` against your API in production from every browser is unnecessary load. Gate behind `process.env.NODE_ENV === "development"` only — currently the check is `development || NEXT_PUBLIC_DEBUG_MODE === "true"` which is exposed to prod.

---

### 4.10 [P2] Component "elements" / "templates" split is unclear

[`src/components/elements/index.ts`](apps/next/src/components/elements/index.ts) re-exports from `./example` only. The intended "atoms / molecules / organisms / templates" hierarchy isn't enforced and the prefix `Example*` is on production components (`ExampleA`, `ExampleATWM`, `ExampleInput`, `ExampleSelect`, `ExampleDatePicker`). Either:

- Rename `Example*` to real names (`Button`, `ButtonLink`, `Input`, `Select`, `DatePicker`), or
- Move them under `components/elements/example/` clearly labelled as boilerplate examples.

The `index.ts` barrel files that re-export everything will hurt tree-shaking in a real app — `import { Button } from "@/components"` pulls in the whole templates tree (including `APIConnectionChecker` with axios, `LogoutButton` with NextAuth). Prefer per-file imports.

---

### 4.11 [P2] Deeply nested folder layout

```
src/app/(authed)/(admin)/audit/_layout/modules/main/index.tsx
src/app/(authed)/(admin)/audit/_layout/modules/main/batches/AuditDetailModal.tsx
src/app/(authed)/(admin)/audit/_layout/modules/main/components/AuditTable.tsx
```

Six levels deep before any meaningful code. The `_layout/modules/main/` convention isn't a Next.js convention; it's a custom architectural style that mirrors `templates/` from elsewhere. Recommended: collocate page-specific components under `app/<route>/_components/` (with the `_` prefix Next.js already supports for non-route folders). The `_layout`, `modules`, `main` triple is redundant.

---

### 4.12 [P2] `next.config.ts` has dev-only allowances bleed into prod

```ts
allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
images: { dangerouslyAllowLocalIP: true, ... }
```

`dangerouslyAllowLocalIP` is a footgun in production. Wrap with `process.env.NODE_ENV === "development"`. Same for `allowedDevOrigins`. Add `output: "standalone"` if you'll deploy on a container.

---

## 5. Type safety

### 5.1 [P1] Hand-rolled API contract types duplicate Prisma + Zod

Frontend declares `IUserResponse`, `IUserPayload`, `IAuthResponse`, `INextAuthResponse` by hand. They mirror the Elysia service return shapes and Prisma rows. Drift is inevitable.

**Recommendation.** Single source of truth in `@repo/contracts`:

```ts
// packages/contracts/src/users.ts
export const userResponseSchema = z.object({...})
export type TUserResponse = z.infer<typeof userResponseSchema>
```

Backend handlers parse Zod input, then `userResponseSchema.parse(serviceResult)` on output (debug-mode only or always). Frontend imports the type and the schema (for runtime validation of API responses if you want defensive parsing).

This also unlocks RPC-style typing — you can later swap to **Eden Treaty** (`@elysiajs/eden`) for end-to-end inference without code generation, since Elysia exposes its app type. With Eden, your `apiRequest` shrinks to one line per call and types come from the server definition automatically.

---

### 5.2 [P1] Liberal use of `as unknown as`

- `configs/authentication.ts`: `const u = user as unknown as IAuthResponse;`, `return res.data as IAuthResponse & User;`
- `auth/route.ts`: many `(decoded as TJwtPayload)?.sub`, `body as { method: "email" | "username" }`.

These are the symptom of (a) NextAuth's loose `User`/`JWT` types and (b) `@elysiajs/jwt`'s `verify` returning `unknown`. Solution: define typed wrappers `verifyAccessToken: () => Promise<{ sub: string; jti: string; exp: number } | null>` once, and augment the NextAuth types in `next-auth.d.ts` so `User` *is* `IAuthResponse` (you already do that — just make `authorize()` return `IAuthResponse` directly without the cast).

---

### 5.3 [P2] `// eslint-disable-next-line @typescript-eslint/no-explicit-any`

In [`base.ts`](apps/next/src/utils/api/base.ts#L28): `params?: Record<string, any>`. Use `Record<string, unknown>` or, better, `Record<string, string | number | boolean | undefined>` to match the actual axios `params` contract.

---

## 6. Validation strategy

### 6.1 [P0] Schemas live next to routes; frontend reinvents them

- Backend: `apps/elysia/src/api/auth/schema.ts` (`registerSchema`, `loginSchema`, `changePasswordSchema`).
- Frontend: `apps/next/src/app/authentication/login/_layout/modules/main/schema.ts` (separate `loginSchema` + `TLoginSchema`).

These will drift. Move to `packages/contracts/src/auth.ts` and consume from both sides. Same for users payload, upload, audit query.

### 6.2 [P1] Error message helpers in `schemaMessage` are inconsistent

```ts
email: (label: string) => `${label.trim()} must be a valid email address`.toLowerCase(),
required: (label: string) => `please enter ${label.trim()}`.toLowerCase(),
```

Mixing imperative ("please enter X") and declarative ("X must be Y") styles. Standardize on one (declarative is cleaner: `"x is required"`, `"x must be a valid email address"`). Also `.toLowerCase()` after concatenation forces every message lowercase — including proper nouns like "URL", "ID" — change to lowercase the **label** only.

---

## 7. Performance

### 7.1 [P1] Frontend bundle bloat from barrel exports

`@/src/utils` re-exports `api/`, `formatter`, `math`, `server/`, `validations`. Importing `getSession` (server) from `@/src/utils` in a client component pulls all client utilities into the chunk too. Webpack/Turbopack tree-shaking helps but barrel re-exports defeat per-file granularity for many bundlers when re-exports include `"use server"` files.

**Recommendation.** Drop the deep barrels. Always import from the leaf path (`@/src/utils/api/users`, `@/src/utils/server/session`). Add an ESLint rule `no-restricted-imports: ["@/src/utils"]` to enforce.

### 7.2 [P1] `Bun.password.hash` defaults to argon2id with default cost

Good default. But `register` and `changePassword` await it serially before issuing tokens. For high registration throughput, dispatch the hash via `Bun.spawn`/worker pool. P2 if your traffic is low.

### 7.3 [P2] N+1 risk in audit endpoint

The audit service does `Promise.all(files.map(parseLogFile))` which decompresses every matching log per request. Add a result cache keyed by file mtime, or use a streaming JSON parser to short-circuit at `pageSize`.

### 7.4 [P2] `lucide-react` tree-shaking

`lucide-react` is import-named which tree-shakes well, but make sure your Next config doesn't accidentally bundle the whole icon set in a `client-reference-manifest`. Add `transpilePackages` only if needed; otherwise leave alone.

---

## 8. Security & reliability summary

| # | Severity | Area | Issue |
|---|----------|------|-------|
| S1 | **P0** | Upload | Path traversal in `Bun.file(join(cwd, "uploads", params["*"]))` |
| S2 | **P0** | Auth | Missing `JWT_*` secrets default to `""` at module scope |
| S3 | **P0** | Auth | Refresh rotation TOCTOU + multi-tab self-logout |
| S4 | ~~P0~~ **withdrawn** | Routing | ~~`proxy.ts` not loaded as middleware → no RBAC~~ — invalid for Next.js 16; `proxy.ts` is the new convention |
| S5 | P1 | Upload | No size cap, no MIME sniffing, accepts arbitrary extensions |
| S6 | P1 | Logging | Body logged in full; PII risk |
| S7 | P1 | CORS | Allowlist depends on `CORS_ORIGINS` parse; an empty/whitespace value silently allows nothing past the dev origins (good failure mode), but trailing comma yields empty string — assert non-empty after parse |
| S8 | P1 | CI | `sync-main.yml` force-pushes orphan over main |
| S9 | P2 | DB | Backup mutex is in-process only |
| S10 | P2 | Errors | Zod errors not formatted via `ERROR_RESPONSE` |
| S11 | P2 | Frontend | `dangerouslyAllowLocalIP` in prod build |

---

## 9. Developer experience

### 9.1 [P1] Scripts inconsistent across packages

Root has `cpenv` that delegates to `turbo run cpenv`, each app has `cpenv: cp .env.example .env`. Shared packages have no `cpenv`. Some have `vitest`, some don't. `clean` exists only in `apps/next`. `base64` (a one-liner OpenSSL helper) is duplicated in both apps with different lengths (33 vs 64).

**Recommendation.**

- Standardize per-app: `dev`, `build`, `start`, `lint`, `lint:fix`, `prettier`, `check-types`, `vitest`, `vitest:run`, `clean`, `cpenv`.
- Move `base64` and other one-shots to a `scripts/` folder at root: `pnpm dlx zx scripts/base64.mjs --bytes 64`.

### 9.2 [P1] No editor config

Add `.editorconfig` so non-VSCode users get the right indent/EOL.

### 9.3 [P2] No `pnpm dev:*` filtered scripts

`pnpm dev` runs everything via Turbo. Add `dev:next` and `dev:elysia` (`turbo run dev --filter=nextjs`) for focused work.

### 9.4 [P2] Storybook is heavy in `pre-push`

Move to a separate workflow.

---

## 10. Testing

### 10.1 [P1] Coverage is shallow on critical paths

Existing tests:

| Path | Status |
|------|--------|
| `apps/elysia/src/constants/test/omits.spec.ts` | ✅ trivial |
| `apps/elysia/src/constants/test/responseMessage.spec.ts` | ✅ trivial |
| `apps/elysia/src/constants/test/responseTemplate.spec.ts` | ✅ |
| `apps/elysia/src/utils/test/handlePrismaError.spec.ts` | ✅ table-driven, good |
| `apps/elysia/src/utils/test/extract.spec.ts` | ✅ |
| `apps/elysia/src/utils/test/verifyAccessToken.spec.ts` | ✅ partial (no JWT integration) |
| `apps/next/src/utils/test/formatter.spec.ts` | ✅ |
| `apps/next/src/utils/test/math.spec.ts` | ✅ |
| `apps/next/src/utils/test/validations.spec.ts` | ✅ |
| `apps/next/src/hooks/test/useToggle.spec.ts` | ✅ |
| `apps/next/src/hooks/test/useModal.spec.ts` | ✅ |
| `apps/next/src/hooks/test/useToast.spec.ts` | ✅ |
| `apps/next/src/hooks/test/useWindowSize.spec.ts` | ✅ |
| `apps/next/src/hooks/test/useLocalStorage.spec.ts` | ✅ |

**Untested (high-value):**

- `auth/service.ts` — register, login, refresh, change password, hash token, blocklist, family revoke, rotation transaction.
- `auth/route.ts` — entire HTTP flow, cookie issuance, bad token paths.
- `users/service.ts`, `upload/service.ts` (the biggest), `audit/service.ts`.
- `requestLoggerPlugin` (sensitive field redaction is one mistake away from leaking passwords to disk).
- `jwtPlugin` — secret loading, expiry parsing.
- `databaseBackupWorker`, `cleanupLogsWorker`, `cleanupSessionsWorker`.
- `corsPlugin` — origin allowlist behavior.
- Frontend: `NextAuthProvider` refresh logic, login page mutation, ChangeThemeButton, LogoutButton, APIConnectionChecker.
- Frontend: API client (`apiRequest`) with mocked axios.

### 10.2 [P1] Use Vitest workspace + integration tier

Add a `vitest.workspace.ts` at root, define two projects per app: `unit` (current) and `integration` (spins up `@elysiajs/eden` test client + a Postgres test container via `pg-mem` or `testcontainers` + `ioredis-mock`). Then write the auth flow once, against the real route handler.

### 10.3 [P2] Mocking pattern is verbose

Each spec re-implements a `vi.mock("@/src/generated/prisma/client", () => ...)`. Centralize in `apps/elysia/vitest.setup.ts` or a `test-utils` folder. Today `vitest.setup.ts` is just a comment.

---

## 11. Recommended refactor sequencing

If you want to act on this audit, this order minimizes risk and yields visible wins early:

1. **P0 fixes (ship in one PR each):**
   1. ~~Rename `proxy.ts` → `middleware.ts`~~ — withdrawn (see §4.1).
   2. Path-traversal fix in `index.ts` static handler.
   3. Replace JWT plugin secret defaults with `env.ts` checks; introduce `config/env.ts` (Elysia + Next).
   4. Wrap refresh rotation in a single transaction with reuse-detection.
2. **P0 architecture:**
   5. Introduce `@repo/contracts` and migrate auth schemas there; FE consumes them.
   6. Extract `protectedRoutes(label)` plugin; deduplicate routes.
   7. Extract auth use-case layer (`usecases/`, `infra/`).
3. **P1 plumbing:**
   8. Tighten `tsconfig.base.json` (`noUncheckedIndexedAccess`, etc.).
   9. Trim `pre-push`; build a real CI workflow.
   10. Replace `lint-staged` shell-out with direct eslint invocations.
   11. Coordinate cross-tab refresh (`BroadcastChannel`).
4. **P1 frontend hygiene:**
   12. Split `utils/api/base.ts` into server/client.
   13. Remove nested `ReactQueryProvider`; standardize `<HydrationBoundary>`.
   14. Drop barrel re-exports from `@/src/utils` and `@/src/components` for tree-shaking.
5. **P2 polish:** rename `Example*` components, audit endpoint storage strategy, theme cookie cleanup, scripts standardization, integration tests for auth.

---

## 12. Smaller findings (for completeness)

- `apps/elysia/src/api/upload/service.ts` truncated in tooling but the visible code already shows several issues; review the rest for the same patterns.
- `apps/elysia/src/api/audit/service.ts` — `parseTimeFilter` returns `{hours, minutes}` only; if `time` has seconds the regex rejects, but with `noUncheckedIndexedAccess` you'd see `hours/minutes` are `number | undefined`.
- `apps/elysia/src/constants/responseTemplate.ts` — `data: data || null` falsy-coalesces `0`, `""`, `false`. Use `data ?? null`.
- `apps/elysia/src/api/auth/route.ts` — `LABEL = "authentication"` but `responseMessage("login")`, `responseMessage("token")`, `responseMessage("users")`, `responseMessage("access token")` are passed ad-hoc; the `LABEL` constant is unused except as the route prefix's tag — consider deleting it or actually using it.
- `apps/elysia/prisma/schema.prisma` lacks `directUrl` for migrations against pgBouncer — add when you go to production.
- `apps/next/src/types/next-auth.d.ts` augmentation works but lives next to `INextAuthResponse` defined in `utils/api/authentication/index.ts` — circular awareness; once `@repo/contracts` exists, define both there.
- `getImageBase64.ts` has a commented `//console.log` — delete it.
- `LogoutButton`'s `setLoading(true)` is never reset because `signOut()` redirects; document this so devs don't think it's a leak.
- `useLocalStorage` reads `typeof globalThis === "undefined"` which is **never true** in modern runtimes; the SSR guard you want is `typeof window === "undefined"`.

---

## 13. What's already good (keep doing)

- Clear separation of `elements` vs `templates` intent (just needs to be renamed away from `Example*`).
- `handlePrismaError` table-driven mapping is excellent — tests cover the table, easy to extend.
- Refresh-token model with `familyId`, `rotatedFromJti`, `replacedByJti`, hashed token storage — the **schema** is correct; only the rotation orchestration needs work.
- Pino + structured logging + zstd archival is production-grade thinking.
- Storybook + Vitest workspace + perfectionist + Tailwind v4 + ESLint flat config is a modern, future-proof stack.
- Single Prettier + commitlint + Commitizen + Husky setup is consistent.
- `parseDurationToMs` shared between FE and BE for token timing — exactly the right reuse.

---

## 12. Applied — Security First (P0) batch

The following P0 items were implemented on the `development` branch. Each block is a logically separate commit.

### 12.1 Path traversal hardening (`/uploads/*`)

[apps/elysia/src/index.ts](apps/elysia/src/index.ts) — the bare `Bun.file(join(cwd, "uploads", params["*"]))` was replaced by a `resolveUploadPath()` helper that:

- rejects NUL bytes and absolute paths (`/`, `\\`),
- normalizes the request path,
- rejects any traversal segment (`..`),
- resolves to an absolute path and asserts it is contained in `resolve(cwd, "uploads")`,
- responds `400` for any rejection instead of leaking files outside the upload directory.

### 12.2 Typed environment modules (Elysia + Next)

New files:

- [apps/elysia/src/config/env.ts](apps/elysia/src/config/env.ts) — Zod-validated `env` object covering all 17 backend variables. JWT secrets are required to be `>= 32` chars. Booleans, numbers, and CSV lists are coerced/transformed. Loads `dotenv/config` once at module entry. Throws a single multi-error message on misconfig instead of 14 sequential `throw new Error` statements.
- [apps/next/src/config/env.client.ts](apps/next/src/config/env.client.ts) — Zod schema for `NEXT_PUBLIC_*` only. Each variable is referenced as a literal `process.env.NEXT_PUBLIC_*` so the Next bundler can inline.
- [apps/next/src/config/env.server.ts](apps/next/src/config/env.server.ts) — Zod schema for server-only vars (`NEXTAUTH_*`, `NODE_ENV`). Marked with `import "server-only"` so accidental client imports become build errors.

All 14 raw `process.env.*` reads with `|| ""` / `|| "default"` fallbacks were removed across:

- Elysia: [index.ts](apps/elysia/src/index.ts), [libs/redis.ts](apps/elysia/src/libs/redis.ts), [libs/prisma.ts](apps/elysia/src/libs/prisma.ts) (also fixes the `${undefined}` template-string bug), [libs/pino.ts](apps/elysia/src/libs/pino.ts), [utils/plugins/jwtPlugin.ts](apps/elysia/src/utils/plugins/jwtPlugin.ts), [utils/plugins/corsPlugin.ts](apps/elysia/src/utils/plugins/corsPlugin.ts), [utils/plugins/requestLoggerPlugin.ts](apps/elysia/src/utils/plugins/requestLoggerPlugin.ts), [utils/logCompression.ts](apps/elysia/src/utils/logCompression.ts), [utils/worker/databaseBackupWorker.ts](apps/elysia/src/utils/worker/databaseBackupWorker.ts), [utils/worker/cleanupLogsWorker.ts](apps/elysia/src/utils/worker/cleanupLogsWorker.ts), [api/auth/route.ts](apps/elysia/src/api/auth/route.ts), [api/auth/service.ts](apps/elysia/src/api/auth/service.ts).
- Next: [app/layout.tsx](apps/next/src/app/layout.tsx) (7 `throw new Error` calls deleted in favor of `import "../config/env.server"` fail-fast), [libs/providers/NextAuthProvider.tsx](apps/next/src/libs/providers/NextAuthProvider.tsx), [utils/api/base.ts](apps/next/src/utils/api/base.ts), [components/templates/APIConnectionChecker.tsx](apps/next/src/components/templates/APIConnectionChecker.tsx), [app/(authed)/(user)/profile/_layout/modules/main/index.tsx](apps/next/src/app/(authed)/(user)/profile/_layout/modules/main/index.tsx), [configs/authentication.ts](apps/next/configs/authentication.ts).

This eliminates the class of vulnerabilities where a missing `JWT_*_SECRET` would silently sign tokens with the empty string.

### 12.3 Atomic refresh rotation + reuse detection

[apps/elysia/src/api/auth/service.ts](apps/elysia/src/api/auth/service.ts) — added `service.rotateRefreshSessionAtomic()`:

- Performs `findUnique` → hash compare → revoked check → expiry check → conditional `updateMany({ where: { jti, revokedAt: null }})` → `create` **inside a single `prisma.$transaction`**.
- Returns a discriminated result `{ kind: "OK" | "NOT_FOUND" | "HASH_MISMATCH" | "REUSE_DETECTED" | "EXPIRED" }`.
- On `HASH_MISMATCH` or `REUSE_DETECTED` (already-revoked jti **or** the conditional update returned `count === 0`, i.e. a concurrent rotation race), the entire family (`familyId`) is revoked atomically.

[apps/elysia/src/api/auth/route.ts](apps/elysia/src/api/auth/route.ts) — the `/refresh` handler was collapsed from 7 sequential read/check/write steps with a TOCTOU window into:

1. cookie + JWT verify (cheap, stateless),
2. blocklist check,
3. issue new tokens,
4. **single atomic** `rotateRefreshSessionAtomic` call,
5. user existence check (with rollback-by-revoke if missing),
6. blocklist the old jti **after** the transaction commits (no more partial-failure logout), and
7. write the new cookie.

### 12.4 Validation

- `pnpm check-types` (turbo): green for both apps.
- `pnpm lint --max-warnings 0`: green for both apps.
- `pnpm vitest:run`: 49/49 tests pass in elysia, 38/38 in next (87 total).

### 12.5 Out of scope (intentionally deferred)

- **Withdrawn:** §4.1 / S4 (`proxy.ts` rename) — see correction at top of file.
- All P1+ items remain open. The next recommended batch is P1 — split `utils/api/base.ts` into server/client, tighten upload validation (size/MIME), and `BroadcastChannel` cross-tab refresh coordination.

---

*End of audit.*
