# AI Coding Instructions

This document defines the **mandatory** conventions for all code changes in this monorepo. Before writing any code, read similar files in the surrounding context and match their patterns exactly. Do not invent new patterns.

---

## 1. Project Overview

Monorepo managed by **Turborepo + pnpm workspace**. Node 22+ (Bun for backend). TypeScript strict mode everywhere.

| Path                     | Purpose                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `apps/next`              | Next.js App Router frontend (React 19, Tailwind v4, React Query, Jotai, NextAuth, react-hook-form + Zod) |
| `apps/elysia`            | Elysia.js backend (Bun runtime, Prisma + PostgreSQL, Redis/ioredis, Pino, JWT)                           |
| `packages/constants`     | Cross-app constants (`schemaMessage`, `POSITION_STEP`)                                                   |
| `packages/schemas`       | Cross-app Zod schemas (auth, etc.)                                                                       |
| `packages/types`         | Cross-app types (Prisma model wrappers like `IKanbanBoard`, `IUsersModel`)                               |
| `packages/utils`         | Cross-app utilities (`logTemplate`, `parseDurationToMs`)                                                 |
| `packages/eslint-config` | Shared ESLint flat config (`base`, `next`, `elysia`)                                                     |

**Before writing code**: read the relevant ESLint config (`packages/eslint-config/src/{base,next,elysia}.js`) and `tsconfig` per app. All rules in those files are authoritative.

---

## 2. TypeScript Rules

### 2.1 Strict Mode Compliance

`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `useUnknownInCatchVariables` are all active. This means:

- `catch` errors are typed `unknown` — always narrow before use.
- Array/record access returns `T | undefined` — always guard before use.
- **NEVER** use `any`. Use `unknown` + narrowing for dynamic values.
- **NEVER** use the non-null assertion operator `!`. Always use proper type narrowing.

```ts
// ❌ WRONG
const value = props.data!.id;
const item = items[0]!;
await fetchData(props.id!);

// ✅ CORRECT
if (props.data) {
  const value = props.data.id;
}

const first = items[0];
if (!first) return null;

if (props.boardDocumentId) {
  await getBoard(props.boardDocumentId);
}
```

### 2.2 Catch Error Narrowing

```ts
try {
  /* ... */
} catch (error) {
  if (error instanceof Error) logger.error({ error }, error.message);
  throw error;
}
```

### 2.3 Type Naming Conventions

| Construct   | Prefix | Usage                                                                 | Example                          |
| ----------- | ------ | --------------------------------------------------------------------- | -------------------------------- |
| `interface` | `I`    | Object contracts that will be `extend`ed/`implement`ed                | `IUsersModel`, `IPaginationMeta` |
| `type`      | `T`    | Unions, mapped types, utility types, `z.infer` results, local aliases | `TPayloadSchema`, `TLoginSchema` |

```ts
// Zod inferred types
export const payloadSchema = z.object({ name: z.string() });
export type TPayloadSchema = z.infer<typeof payloadSchema>;
```

### 2.4 Component Props Interface (apps/next/src/components/\*\*)

For simple components in the shared `components/` directory, use a single-letter `interface I`:

```tsx
interface I {
  label: string;
  onClick: () => void;
}

export const SubmitButton: FC<I> = (props): ReactElement => <button onClick={props.onClick}>{props.label}</button>;
```

If there are multiple local interfaces in the same file, use a more specific name with `I` prefix (e.g., `IHeaderProps`, `IFooterProps`).

### 2.5 Void Usage

**NEVER** use `void` — neither to discard a Promise nor as a return type. Call async functions directly (fire-and-forget) or `await` them.

```ts
// ❌ WRONG
void publishEvent(data);

// ✅ CORRECT — fire and forget
publishEvent(data);

// ✅ CORRECT — when you need the result
await publishEvent(data);
```

---

## 3. Code Style & ESLint

ESLint runs with `--max-warnings 0`, so **every warning is a build failure**.

### 3.1 Function Style

Always use arrow function expressions with `const`. Never use function declarations.

```ts
// ✅ CORRECT
const greet = (name: string): string => `hello ${name}`;

// ❌ WRONG — function declaration
function greet(name: string) {
  return "hello " + name;
}

// ❌ WRONG — unnecessary body block
const greet = (name: string) => {
  return `hello ${name}`;
};
```

### 3.2 No Nested Ternaries

Break nested ternaries into variables or early returns:

```ts
// ❌ WRONG
const tone = isError ? "red" : isWarn ? "yellow" : "gray";

// ✅ CORRECT
const getTone = (): string => {
  if (isError) return "red";
  if (isWarn) return "yellow";
  return "gray";
};
```

### 3.3 Complexity & Params Limits

- `complexity: 25` — break complex logic into helpers.
- `max-params: 4` — if a function needs more than 4 params, use a single object param:

```ts
// ❌ WRONG — 5 params
const createUser = (name, email, role, phone, avatar) => {
  /* ... */
};

// ✅ CORRECT — object param
const createUser = (input: { avatar: string; email: string; name: string; phone: string; role: string }) => {
  /* ... */
};
```

### 3.4 Strict Equality

Always use `===` / `!==`. Never use `==` / `!=`.

### 3.5 Unused Variables

Prefix intentionally unused arguments/variables/catch bindings with `_`:

```ts
const { password: _password, ...safeUser } = userRecord;
```

### 3.6 Perfectionist Plugin (Alphabetical Ordering)

**Object keys**: sorted alphabetically, with `id` always first (custom group):

```ts
// ✅ CORRECT
const user = {
  id: "u_1",
  createdAt: new Date(),
  email: "a@b.com",
  name: "alice",
  role: "user",
};
```

**Imports**: separated by newlines between groups, alphabetical within each group. Internal patterns: `@/` and `@repo/`.

### 3.7 Import Order & Rules

Imports are auto-sorted by `perfectionist/sort-imports`. The order is:

```
1. ALL imports use regular `import` (NEVER use `import type` or `import { type ... }`)
2. Builtin + external (alphabetical, one group)
3. Internal (`@/...`, `@repo/...`)
4. Parent / sibling / index
```

Each group is separated by one blank line. Do NOT use `import type` or `import { type ... }` — use plain `import` for everything.

```ts
import { FC, ReactElement } from "react";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { IUsersModel } from "@repo/types";

import { schemaMessage } from "@repo/constants";
import { twm } from "@/src/libs/twm";

import { TPayloadSchema } from "./type";

import { payloadSchema } from "./schema";
```

### 3.8 Direct Imports (No Barrel Exports)

**NEVER** use barrel exports (`index.ts` that re-exports from other modules). Always import directly from the source file:

```ts
// ✅ CORRECT — direct import
import { twm } from "@/src/libs/twm";
import { prisma } from "@/src/libs/prisma";
import { logger } from "@/src/libs/pino";
import { responseMessage } from "@/src/constants/responseMessage";
import { ERROR_RESPONSE } from "@/src/constants/responseTemplate";
import { protectedRoutePlugin } from "@/src/utils/plugins/protectedRoutePlugin";

// ❌ WRONG — barrel import
import { twm } from "@/src/libs";
import { prisma, logger } from "@/src/libs";
import { responseMessage, ERROR_RESPONSE } from "@/src/constants";
import { protectedRoutePlugin } from "@/src/utils";
```

For local declarations, use inline named exports (`export const myFn = ...`). Avoid bottom-of-file `export { myFn }` patterns.

---

## 4. File & Folder Naming

| What                                   | Pattern                               | Example                                        |
| -------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| React component                        | PascalCase, file = component name     | `Header.tsx`, `CardEditModal.tsx`              |
| Hook / util / function                 | camelCase, file = main export name    | `useToggle.ts`, `parseDurationToMs.ts`         |
| Generic util folder (no main function) | context/folder name                   | `type.ts`, `index.ts`, `metadata.ts`           |
| Test                                   | module name + `.spec.ts(x)`           | `useToggle.spec.ts`, `responseMessage.spec.ts` |
| Storybook                              | `<Component>.stories.tsx`             | `ExampleA.stories.tsx`                         |
| Backend domain folder                  | lowercase, plural for collections     | `users/`, `auth/`, `audit/`                    |
| Nested element folders                 | single-letter groups `A/`, `B/`, `C/` | `components/elements/example/A/ExampleA.tsx`   |
| Long folder names                      | kebab-case                            | `handle-prisma-error/`                         |
| Next App Router folders                | Next conventions                      | `(authed)/(user)/profile/page.tsx`, `_layout/` |

---

## 5. React / Next.js Conventions (apps/next/src)

### 5.1 Component Declaration

Always use `FC` with an explicit return type (`ReactElement`, `null | ReactElement`, `Promise<ReactElement>`, `ReactNode`).

```tsx
export const MyComponent: FC<IMyComponent> = (props): ReactElement => <div>{props.name}</div>;
```

### 5.2 No React Namespace

Never use `React.` prefix for types. Import types directly from `react`:

```tsx
// ✅ CORRECT
import { Ref, SyntheticEvent } from "react";
const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => e.preventDefault();

// ❌ WRONG
const onSubmit = (e: React.FormEvent) => e.preventDefault();
```

### 5.3 Page & Layout Components

Pages, layouts, and `_layout/index.tsx` files use `export default`. Do NOT destructure props in the parameter for page/layout server components:

```tsx
// app/(authed)/(user)/profile/page.tsx
import { FC, ReactElement } from "react";

import { ProfileLayout } from "./_layout";

const ProfilePage: FC = (): ReactElement => <ProfileLayout />;
export default ProfilePage;
```

For components with props (e.g., root layout):

```tsx
import { FC, PropsWithChildren, ReactElement } from "react";

type T = Readonly<PropsWithChildren>;

const RootLayout: FC<T> = (props): ReactElement => (
  <html lang="en">
    <body>{props.children}</body>
  </html>
);
export default RootLayout;
```

### 5.4 Reusable Component Export Rule

- Pages, layouts, `_layout/index.tsx`: use `export default` (Next.js convention).
- Reusable components in `components/**`: **MUST** use named exports. **NEVER** use `export default`.
- For `next/dynamic`, use the `.then()` pattern with named exports — `export default` is NOT required:

  ```tsx
  // ✅ CORRECT — named export + .then() in dynamic import
  export const CardEditModal: FC<I> = (props): ReactElement => {
    /* ... */
  };

  const CardEditModalDynamic = dynamic(() => import("../components/CardEditModal").then((mod) => mod.CardEditModal), { ssr: false });

  // ❌ WRONG — do not add export default just for next/dynamic
  export default CardEditModal;
  ```

### 5.5 Props Access Pattern

- **`components/templates/**`** (simple props): access via `props.X`:

  ```tsx
  interface I {
    title: string;
    user: IUsersModel;
  }

  export const Header: FC<I> = (props): ReactElement => (
    <header>
      <h1>{props.title}</h1>
      <span>{props.user.username}</span>
    </header>
  );
  ```

- **`components/elements/**`\*\* (interactive, many props): destructure in parameter:

  ```tsx
  interface I extends ButtonHTMLAttributes<HTMLButtonElement> {
    color?: TButtonColor;
    size?: TButtonSize;
  }

  export const ExampleA: FC<I> = ({ className, color = "blue", size = "md", ...rest }): ReactElement => (
    <button className={twm(ExampleATWM({ color, size }), className)} {...rest} />
  );
  ```

- **Feature-local components** (e.g., `_layout/modules/components/`): follow the pattern of surrounding files. The kanban feature uses `props.X` access pattern.

### 5.6 Variant Component Pattern

Export a `const` array, union type, `<Name>TWM` helper, and the main component:

```tsx
export const EXAMPLE_A_COLORS = ["blue", "green", "red"] as const;
export type TExampleAColor = (typeof EXAMPLE_A_COLORS)[number];

export const EXAMPLE_A_SIZES = ["lg", "md", "sm"] as const;
export type TExampleASize = (typeof EXAMPLE_A_SIZES)[number];

const COLOR_MAP: Record<TExampleAColor, string> = {
  blue: "bg-blue-500 text-white",
  green: "bg-green-500 text-white",
  red: "bg-red-500 text-white",
};

const SIZE_MAP: Record<TExampleASize, string> = {
  lg: "px-6 py-3 text-lg",
  md: "px-4 py-2 text-base",
  sm: "px-2 py-1 text-sm",
};

export const ExampleATWM = ({ color, size }: { color: TExampleAColor; size: TExampleASize }): string =>
  twm("rounded-md font-medium", COLOR_MAP[color], SIZE_MAP[size]);
```

### 5.7 Avoid Unnecessary Prop Aliases

Do not create aliases like `const boardId = props.boardId` if the value is only passed through or used directly without transformation. Use `props.boardDocumentId` directly.

### 5.8 Routing & Layout Pattern

For complex pages, use the layered layout pattern:

```
app/<route>/page.tsx                     → renders <RouteLayout />
app/<route>/_layout/index.tsx            → assembles modules (default export)
app/<route>/_layout/modules/<part>/index.tsx
app/<route>/_layout/modules/schema.ts    → local feature schema/types
```

Example `_layout/index.tsx`:

```tsx
import { Aside } from "./modules/aside";
import { Main } from "./modules/main";

const ProfileLayout: FC = (): ReactElement => (
  <div className={twm("flex gap-4")}>
    <Aside />
    <Main />
  </div>
);
export default ProfileLayout;
```

Route groups `(authed)`, `(admin)`, `(user)` are used for auth scoping.

### 5.9 State Management

- **Lightweight global state**: Jotai atoms in `context/`:

  ```ts
  import { atom, useAtom } from "jotai";

  const userAtom = atom<IUsersModel | null>(null);

  export const useGlobalContext = () => {
    const [user, setUser] = useAtom(userAtom);
    return { setUser, user };
  };
  ```

- **Server state**: `@tanstack/react-query` (`useMutation`, `useQuery`).
- **Forms**: `react-hook-form` + `zodResolver`. If the schema comes from a shared package, import directly from `@repo/schemas` — do NOT re-export via a local schema file.
- **Local schema files** (`_layout/modules/schema.ts`): only for schemas that are truly feature-local and not available in a shared package.

### 5.10 HTTP Client

**MUST** use the helpers in `apps/next/src/utils/api/`. **NEVER** call `axios` directly in components (except health check).

---

## 6. API Client Pattern (apps/next/src/utils/api/)

### 6.1 File Organization

One file per domain: `users.ts`, `upload.ts`, `audit.ts`. Domains with many endpoints (auth) use a folder + file per endpoint.

### 6.2 Function Naming

Use UPPERCASE method prefix:

```ts
GETUsers;
GETUsersById;
POSTLogin;
PUTUsers;
PATCHExample;
DELETEUpload;
```

### 6.3 Standard Endpoint Implementation

```ts
import { IUsersModel } from "@repo/types";

import { deleteApi, getApi, ISuccessResponse, postApi, TQueryParams } from "./base";

const label = "users";

export interface IUsersPayload {
  email: string;
  name: string;
  role: "admin" | "user";
}

export const GETUsers = (params?: TQueryParams): Promise<ISuccessResponse<IUsersModel[]>> => getApi({ endpoint: "/users", label, params });

export const POSTUsers = (payload: IUsersPayload): Promise<ISuccessResponse<IUsersModel>> => postApi({ endpoint: "/users", label, payload });

export const DELETEUsers = (id: string): Promise<ISuccessResponse<null>> => deleteApi({ endpoint: `/users/${id}`, label });
```

Key rules:

- Define `I<Payload>` and `I<Response>` interfaces (or use types from `@repo/types`) in the same file.
- Add a `const label = "..."` for logging in every file.
- All list/getAll endpoints **MUST** accept standardized pagination query params.
- Use the base helpers: `getApi`, `postApi`, `putApi`, `patchApi`, `deleteApi` from `./base`.
- Use `auth: false` only for public endpoints (login/register).

---

## 7. Styling

### 7.1 twm Usage

Use `twm(...)` from `@/src/libs/twm` for:

- Reusable components
- Class composition with potential utility conflicts (e.g., `px-*`, `text-*`, `bg-*` overrides)
- Conditional classes

```tsx
// ✅ CORRECT
<div className={twm("rounded-md p-4", isActive && "bg-blue-500", className)} />

// ❌ WRONG — template literal for className
<div className={`rounded-md p-4 ${isActive ? "bg-blue-500" : ""} ${className}`} />
```

For simple conditional classes without utility conflicts, `className={[...].join(" ")}` is acceptable.

**NEVER** use template literals for `className`. This is enforced by ESLint rule `no-restricted-syntax`.

### 7.2 Transition Classes

Do **NOT** add `transition*` classes by default. Only add them when explicitly needed for UX or requested.

### 7.3 Aria Attributes

Do **NOT** use `aria-*` attributes (`aria-label`, `aria-hidden`, `aria-expanded`, etc.) unless explicitly requested.

### 7.4 ClassName Prop Convention for Reusable Components

- Single wrapper: `className?: string`
- Multiple slots: `className?: { <slotA>?: string; <slotB>?: string }`
- Do **NOT** create separate props like `inputClassName`, `labelClassName`. Unify via a `className` object per slot.

### 7.5 Dark Mode

Use `dark:` variant. Always provide dark mode styles for basic text/background colors.

### 7.6 Export TWM Helpers

Reusable class patterns per component should be exported as `<Name>TWM` so other elements can reuse them:

```ts
export const ButtonTWM = ({ color, variant }: { color: TButtonColor; variant: TButtonVariant }): string =>
  twm("rounded-md font-medium", COLOR_MAP[color], VARIANT_MAP[variant]);
```

---

## 8. Path Aliases

| Alias             | Maps To            | Usage                                  |
| ----------------- | ------------------ | -------------------------------------- |
| `@/...`           | `apps/next` root   | `@/src/...`, `@/public/...`            |
| `@/elysia/...`    | `apps/elysia` root | For consuming Prisma generated types   |
| `@repo/<package>` | Workspace package  | `@repo/types`, `@repo/constants`, etc. |

---

## 9. Backend Elysia (apps/elysia/src)

### 9.1 Domain Structure

Every domain in `api/<domain>/` **MUST** have these files:

| File         | Content                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `route.ts`   | `new Elysia({ prefix: "/<domain>" })` + `.use(protectedRoutePlugin(LABEL))` + handler chain                    |
| `service.ts` | `export const service = { async method(...) { ... }, ... }` — single object literal                            |
| `schema.ts`  | Zod schemas (`payloadSchema`, `paramSchema`, `querySchema`, etc.) using `schemaMessage` from `@repo/constants` |
| `type.ts`    | `export type TXxxSchema = z.infer<typeof xxxSchema>;` (+ local interfaces if needed)                           |
| `swagger.ts` | `export const docs = (label: string): Record<...DocumentDecoration> => ({ ... })`                              |

### 9.2 Schema

```ts
// apps/elysia/src/api/examples/schema.ts
import { schemaMessage } from "@repo/constants";
import { z } from "zod";

export const payloadSchema = z.object({
  name: z.string({ message: schemaMessage.string.required("name") }).min(1, { message: schemaMessage.string.min("name", 1) }),
});

export const paramSchema = z.object({
  id: z.uuid({ message: schemaMessage.string.uuid("id") }),
});
```

### 9.3 Type

```ts
// apps/elysia/src/api/examples/type.ts
import { z } from "zod";

import { paramSchema, payloadSchema } from "./schema";

export type TParamSchema = z.infer<typeof paramSchema>;
export type TPayloadSchema = z.infer<typeof payloadSchema>;
```

### 9.4 Service

```ts
// apps/elysia/src/api/examples/service.ts
import { prisma } from "@/src/libs/prisma";

import { TPayloadSchema } from "./type";

export const service = {
  async create(payload: TPayloadSchema) {
    return await prisma.examples.create({ data: payload });
  },

  async getById(id: string) {
    return await prisma.examples.findUnique({ where: { id } });
  },
};
```

### 9.5 Swagger

```ts
// apps/elysia/src/api/examples/swagger.ts
import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants/responseMessage";

export const docs = (label: string): Record<"create" | "getById", DocumentDecoration> => ({
  create: {
    description: "create new example",
    responses: { 200: { description: responseMessage(label).created } },
    summary: "create example",
    tags: [label],
  },
  getById: {
    description: "get example by id",
    responses: {
      200: { description: responseMessage(label).fetched },
      404: { description: responseMessage(label).notFound },
    },
    summary: "get example by id",
    tags: [label],
  },
});
```

### 9.6 Route

```ts
// apps/elysia/src/api/examples/route.ts
import { Elysia } from "elysia";

import { SUCCESS_RESPONSE } from "@/src/constants/responseTemplate";
import { responseMessage } from "@/src/constants/responseMessage";
import { protectedRoutePlugin } from "@/src/utils/plugins/protectedRoutePlugin";

import { paramSchema, payloadSchema } from "./schema";
import { service } from "./service";
import { docs } from "./swagger";

const LABEL = "examples";

export const examplesRoute = new Elysia({ prefix: "/examples" })
  .use(protectedRoutePlugin(LABEL))
  .post(
    "/",
    async ({ body }) => {
      const payload = payloadSchema.parse(body);
      const data = await service.create(payload);
      return SUCCESS_RESPONSE({ data, message: responseMessage(LABEL).created });
    },
    { detail: docs(LABEL).create },
  )
  .get(
    "/:id",
    async ({ params }) => {
      const { id } = paramSchema.parse(params);
      const data = await service.getById(id);
      return SUCCESS_RESPONSE({ data, message: responseMessage(LABEL).fetched });
    },
    { detail: docs(LABEL).getById },
  );
```

### 9.7 Route Registration

Add new routes and mount with `.use(...)` in `apps/elysia/src/index.ts`:

```ts
// apps/elysia/src/index.ts
import { examplesRoute } from "@/src/api/examples/route";

new Elysia().use(examplesRoute).listen(env.PORT);
```

### 9.8 Response & Error Handling

- Success: `SUCCESS_RESPONSE({ data, message: responseMessage(LABEL).<key>, meta? })`
- All list/getAll endpoints **MUST** use validated pagination and return `meta`. Never return a list without `meta`.
- Messages: use `responseMessage(label).<key>` — never write manually. Add new keys in `apps/elysia/src/constants/responseMessage.ts` if needed.
- Schema validation messages: use `schemaMessage.string.<x>` / `schemaMessage.number.<x>` from `@repo/constants`.
- Prisma errors: handled automatically by `protectedRoutePlugin` → `handlePrismaError`. Add/edit mappings in `apps/elysia/src/utils/handle-prisma-error/handlePrismaError.ts` if needed.

### 9.9 Plugin Pattern

- One file per plugin in `utils/plugins/<name>Plugin.ts`.
- Always attach `protectedRoutePlugin(LABEL)` on auth-required routes.
- Logging: use `logger` from `libs/pino.ts`. First arg = structured fields (`scope`, `code`, etc.), second = message string.

```ts
logger.info({ scope: LABEL, userId: user.id }, "user logged in");
logger.error({ error, scope: LABEL }, "failed to fetch users");
```

### 9.10 Backend Path Aliases

| Alias                    | Maps To                                              |
| ------------------------ | ---------------------------------------------------- |
| `@/...` / `@/elysia/...` | `apps/elysia` root (`@/src/...`, `@/elysia/src/...`) |
| `@repo/<package>`        | Workspace package                                    |

---

## 10. Shared Packages

- Add to `packages/<x>` **only** if code is used by **2+ apps** or is clearly reusable across contexts.
- All exports go through `src/index.ts` (barrel).
- Cross-app schemas → `@repo/schemas`. Import directly from the package — do NOT re-export via local schema files.
- Types wrapping Prisma models → `@repo/types`:

  ```ts
  // packages/types/src/users.ts
  import { UsersModel } from "@/elysia/src/generated/prisma/models";

  export const USER_OMIT_FIELDS = { password: true } as const;
  export interface IUsersModel extends Omit<UsersModel, "password"> {}
  ```

- Pure JS/TS utilities (no Bun/Node-only API dependency) → `@repo/utils`.

---

## 11. Environment

- Backend: `apps/elysia/src/environment.ts` validated via Zod. Add new vars there, then update `turbo.json` (`globalEnv`) and `.env.example`.
- Frontend: `apps/next/src/environments/env.client.ts` (`NEXT_PUBLIC_*`) and `env.server.ts`. Access public env via `clientEnv`.
- **NEVER** access `process.env` directly. Always use the parsed env object:

  ```ts
  // ✅ CORRECT
  import { env } from "@/src/environment";
  const port = env.PORT;

  // ❌ WRONG
  const port = process.env.PORT;
  ```

---

## 12. Message Tone

All log messages, error messages, backend response messages, and schema messages: **lowercase**, except:

- Acronyms: `API`, `URL`, `ID`, `JWT`, `REST`, `UUID`, `OTP`, `HTTP`
- Product names: `Next.js`, `Prisma`, `Redis`, `Elysia`, `MongoDB`, `PostgreSQL`
- Proper nouns (person/place names)
- Date/time tokens (case-sensitive): `YYYY`, `MM`, `DD`, `HH`, `hh`, `mm`, `ss`, `SSS`

Backend message patterns (always lowercase + label):

```ts
responseMessage("users").created; // → "users created successfully"
responseMessage("access token").required; // → "access token is required"
schemaMessage.string.email("email"); // → "email must be a valid email"
schemaMessage.string.min("name", 1); // → "name must contain at least 1 character"
```

Frontend UI text (labels, placeholders, titles, buttons): use natural capitalization (Title Case / sentence case). Example: "Change Password", "Confirm Password". Do **NOT** use all lowercase for UI text.

---

## 13. Testing

- Framework: **Vitest**. Globals are active (`describe`, `it`, `expect` — no imports needed).
- Test location: `test/` folder adjacent to the module file.
  - Backend: `apps/elysia/src/<area>/test/<module>.spec.ts`
  - Frontend: `apps/next/src/<area>/test/<module>.spec.ts(x)`
- File name: `<module>.spec.ts(x)`
- When adding or changing utils, schemas, hooks, or services, **MUST** add or update relevant tests.

```ts
import { responseMessage } from "../responseMessage";

describe("responseMessage", () => {
  describe("with label 'users'", () => {
    const message = responseMessage("users");

    it("returns lowercase 'created' message", () => {
      expect(message.created).toBe("users created successfully");
    });

    it("returns lowercase 'notFound' message", () => {
      expect(message.notFound).toBe("users not found");
    });
  });
});
```

---

## 14. Files That MUST NOT Be Manually Edited

- `apps/elysia/src/generated/**` (Prisma client generated)
- `apps/next/storybook-static/**` (Storybook build)
- `node_modules/**`, `.next/**`, `.turbo/**`, `dist/**` (build artifacts)
- `pnpm-lock.yaml` (except via `pnpm install`)

---

## 15. Change Discipline

- **Minimal changes only.** Do not refactor unrelated areas. Do not perform cosmetic cleanup outside the task scope.
- Do not change existing public APIs unless the task requires it.
- **Reuse before creating**: check `@repo/utils`, `@repo/schemas`, `@repo/types`, `@repo/constants`, then `utils/`, `hooks/`, `components/`, `libs/` per app. Only create new code if nothing exists.
- Placement rules for new code:
  - Cross-app → `packages/*`
  - Single app → `apps/<app>/src/<utils|hooks|components|...>`
  - Single feature/route → local to feature folder (e.g., `app/<route>/_layout/modules/...`)
- Match surrounding files' style: naming, typing, return structure, property order. When unsure, find the most similar file and follow its structure exactly.

---

## 16. Pre-Completion Checklist

Before marking any task as complete, run:

```bash
pnpm lint:fix && pnpm prettier && pnpm lint && pnpm check-types
```

All four commands must pass with zero errors.
