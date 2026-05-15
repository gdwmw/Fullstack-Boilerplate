# Copilot Instructions for Fullstack-Boilerplate

Panduan ini wajib diikuti untuk semua perubahan kode agar konsisten dengan pola repository.
Saat menulis kode baru, **selalu lihat dulu file sejenis di sekitarnya** dan ikuti pola yang sudah ada — jangan invent pola baru.

---

## 1. Scope Project

Monorepo Turborepo + pnpm workspace, runtime Node 22+ (Bun untuk backend), TypeScript strict.

| Path                     | Isi                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `apps/next`              | Frontend Next.js App Router (React 19, Tailwind v4, React Query, Jotai, NextAuth, react-hook-form + Zod). |
| `apps/elysia`            | Backend Elysia.js (Bun runtime, Prisma + PostgreSQL, Redis/ioredis, Pino, JWT).                           |
| `packages/constants`     | Constant lintas app (`schemaMessage`).                                                                    |
| `packages/schemas`       | Zod schema lintas app (auth dll.).                                                                        |
| `packages/types`         | Type lintas app (wrapper Prisma model).                                                                   |
| `packages/utils`         | Util lintas app (`logTemplate`, `parseDurationToMs`).                                                     |
| `packages/eslint-config` | Shared ESLint flat config (`base`, `next`, `elysia`).                                                     |

Sebelum menulis kode, baca config ESLint shared (`packages/eslint-config/src/{base,next,elysia}.js`) dan tsconfig per app — semuanya menetapkan aturan yang dipakai contoh-contoh di bawah.

---

## 2. TypeScript

- Mode `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `useUnknownInCatchVariables` aktif. Catch error bertipe `unknown` → narrow dulu sebelum dipakai. Akses array/record bertipe `T | undefined` → guard dulu.
- Hindari `any`. Pakai `unknown` + narrowing kalau benar-benar dinamis.
- Naming type:
  - `interface` → prefix `I` (contoh: `IUsersModel`, `IPaginationMeta`, `IExampleA`). Pakai untuk object contract yang akan di-`extend`/`implement`.
  - `type` → prefix `T` (contoh: `TPayloadSchema`, `TLoginSchema`, `TCurrencyCode`). Pakai untuk union, mapped, utility, hasil `z.infer`, atau alias singkat lokal komponen.
- Type yang berasal dari Zod:
  ```ts
  export const payloadSchema = z.object({ name: z.string() });
  export type TPayloadSchema = z.infer<typeof payloadSchema>;
  ```
- Catch error harus di-narrow:
  ```ts
  try {
    /* ... */
  } catch (error) {
    if (error instanceof Error) logger.error({ error }, error.message);
    throw error;
  }
  ```
- Akses index bertipe `T | undefined` harus di-guard:
  ```ts
  const first = items[0];
  if (!first) return null;
  // first sekarang bertipe T
  ```
- **Khusus props komponen di `apps/next/src/components/**`**: konvensi project pakai single-letter `interface I { ... }`. Kalau ada lebih dari satu interface lokal di file yang sama, baru gunakan nama spesifik dengan prefix `I`.

  ```tsx
  interface I {
    label: string;
    onClick: () => void;
  }

  export const SubmitButton: FC<I> = (props): ReactElement => <button onClick={props.onClick}>{props.label}</button>;
  ```

---

## 3. Style & ESLint

Konfigurasi ESLint memberi `--max-warnings 0`, jadi semua warning = build break. Aturan utama yang sering kena:

- `prefer-const`, `prefer-template`, `prefer-arrow-callback`, `arrow-body-style: as-needed`, `func-style: expression` → selalu arrow function expression dengan `const`.

  ```ts
  // ✅
  const greet = (name: string): string => `hello ${name}`;

  // ❌ function declaration / string concat / body block tak perlu
  function greet(name: string) {
    return "hello " + name;
  }
  const greet = (name: string) => {
    return `hello ${name}`;
  };
  ```

- `no-nested-ternary` → split ternary menjadi variabel atau early return.

  ```ts
  // ❌
  const tone = isError ? "red" : isWarn ? "yellow" : "gray";

  // ✅
  const getTone = (): string => {
    if (isError) return "red";
    if (isWarn) return "yellow";
    return "gray";
  };
  ```

- `complexity: 25`, `max-params: 4` → kalau lebih, pisah jadi helper atau gunakan single object param `{ ... }`.

  ```ts
  // ❌ 5 param
  const createUser = (name, email, role, phone, avatar) => {
    /* ... */
  };

  // ✅ object param
  const createUser = (input: { avatar: string; email: string; name: string; phone: string; role: string }) => {
    /* ... */
  };
  ```

- `eqeqeq: always` → `===` / `!==`.
- `@typescript-eslint/no-unused-vars`: argumen/var/catch yang sengaja unused harus diawali `_`.
  ```ts
  const { password: _password, ...safeUser } = userRecord;
  ```
- **Perfectionist plugin** (alphabetical):
  - **Object keys di-sort alphabetical** dengan `id` selalu di awal (custom group).
    ```ts
    // ✅
    const user = {
      id: "u_1",
      createdAt: new Date(),
      email: "a@b.com",
      name: "alice",
      role: "user",
    };
    ```
  - **Imports** dipisah newline antar grup, urut alphabetical, internal pattern `@/` dan `@repo/`.
- **Tailwind**: gunakan helper `twm` untuk komponen reusable (terutama di `components/**`) atau saat class perlu dikomposisikan lintas tempat. Untuk layout/page/module yang non-reusable, className biasa atau template literal diperbolehkan. Plugin `better-tailwindcss` tetap aktif (`callees: ["twm"]`, variabel `*TWM`).

  ```ts
  // libs/twm.ts (tipikal isinya)
  import clsx, { ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";
  export const twm = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
  ```

  ```tsx
  // ✅
  <div className={twm("rounded-md p-4", isActive && "bg-blue-500", className)} />

  // ❌
  <div className={`rounded-md p-4 ${isActive ? "bg-blue-500" : ""} ${className}`} />
  ```

### Urutan & Grup Import

Auto-formatted oleh `perfectionist/sort-imports`. Urutannya:

```
1. semua import pakai `import` biasa (jangan gunakan `import type` atau `import { type ... }`)
2. builtin + external (alphabetical, satu grup)
3. internal (`@/...`, `@repo/...`)
4. parent / sibling / index
```

Contoh tipikal:

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

Setiap grup dipisah satu baris kosong. Jangan gunakan `import type` maupun `import { type ... }`; cukup `import` biasa agar konsisten dengan aturan project. Jangan campur urutan manual — biarkan ESLint auto-fix.

---

## 4. Konvensi Penamaan File & Folder

| Hal                                         | Pola                                              | Contoh                                                       |
| ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| Komponen React                              | PascalCase, file = nama komponen                  | `Header.tsx`, `ExampleA.tsx`                                 |
| Hook / util / fungsi                        | camelCase, file = nama export utama               | `useToggle.ts`, `parseDurationToMs.ts`, `responseMessage.ts` |
| Folder util generik tanpa "fungsi utama"    | konteks/folder sebelumnya                         | `type.ts`, `index.ts`, `metadata.ts`                         |
| Test                                        | nama modul + `.spec.ts(x)`                        | `useToggle.spec.ts`, `responseMessage.spec.ts`               |
| Storybook                                   | `<Component>.stories.tsx`                         | `ExampleA.stories.tsx`                                       |
| Folder domain backend                       | lowercase, plural kalau koleksi                   | `users/`, `auth/`, `audit/`, `upload/`                       |
| Folder element bertingkat                   | grup huruf tunggal `A/`, `B/`, `C/` di dalam grup | `components/elements/example/A/ExampleA.tsx`                 |
| Folder kebab-case dipakai bila nama panjang |                                                   | `handle-prisma-error/`                                       |
| Folder Next App Router                      | sesuai konvensi Next                              | `(authed)/(user)/profile/page.tsx`, `_layout/`, `_example/`  |

Setiap folder yang sudah memiliki `index.ts` adalah barrel export — pertahankan pola itu saat menambah file baru.

---

## 5. React / Next.js (`apps/next/src`)

### Komponen

- **Selalu** `FC` dengan return type eksplisit (`ReactElement`, `null | ReactElement`, `Promise<ReactElement>`, `ReactNode` sesuai kebutuhan).
- Page / layout / server component App Router: jangan destructure props di parameter. Pattern wajib:

  ```tsx
  // app/(authed)/(user)/profile/page.tsx
  import { FC, ReactElement } from "react";

  import { ProfileLayout } from "./_layout";

  const ProfilePage: FC = (): ReactElement => <ProfileLayout />;
  export default ProfilePage;
  ```

  Untuk yang punya props (mis. root layout):

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

- Hindari alias props yang tidak perlu (contoh `const boardId = props.boardId`) jika nilainya hanya diteruskan atau dipakai langsung tanpa transformasi.

- Komponen di `components/templates/**` dengan props sederhana boleh akses lewat `props.X`:

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

- Komponen di `components/elements/**` (interaktif / banyak prop) boleh destructure di parameter:

  ```tsx
  interface I extends ButtonHTMLAttributes<HTMLButtonElement> {
    color?: TExampleAColor;
    size?: TExampleASize;
  }

  export const ExampleA: FC<I> = ({ className, color = "blue", size = "md", ...rest }): ReactElement => (
    <button className={twm(ExampleATWM({ color, size }), className)} {...rest} />
  );
  ```

- **Variant component**: ekspor const list options + type union + helper `<Name>TWM` + komponen utama:

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

### Default Export Rule

- Pages, layouts, dan file `_layout/index.tsx` Next App Router pakai `export default` (sesuai konvensi Next).
- Reusable component di `components/**` **dilarang** `export default` kecuali memang harus di-`next/dynamic`. Pakai named export.

### Routing & Layout

- Halaman: `app/<route>/page.tsx`. Title pakai `metadata.title`.
- Untuk halaman kompleks, gunakan pola layered:

  ```
  app/<route>/page.tsx                     → renders <RouteLayout />
  app/<route>/_layout/index.tsx            → assembles modules (default export)
  app/<route>/_layout/modules/<part>/index.tsx
  app/<route>/_layout/modules/schema.ts    → schema/types lokal feature
  ```

  Contoh `_layout/index.tsx`:

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

- Route group `(authed)`, `(admin)`, `(user)` untuk auth scoping. Auth gating juga dilakukan via NextAuth middleware di `apps/next/src/proxy.ts`.

### State, Form, Data

- Global state ringan: Jotai atom di `context/`.

  ```ts
  import { atom, useAtom } from "jotai";

  const userAtom = atom<IUsersModel | null>(null);

  export const useGlobalContext = () => {
    const [user, setUser] = useAtom(userAtom);
    return { setUser, user };
  };
  ```

- Form: `react-hook-form` + `zodResolver`. Schema lintas app dari `@repo/schemas`, atau lokal di `_layout/modules/schema.ts` yang re-export schema repo.
  ```tsx
  const form = useForm<TLoginFormSchema>({ resolver: zodResolver(loginFormSchema(true)) });
  ```
- Server state: `@tanstack/react-query` (`useMutation`, `useQuery`).
- HTTP client: **wajib** lewat helper di `apps/next/src/utils/api/`. Jangan panggil `axios` langsung di komponen kecuali untuk health check.

### API Client Pattern (`apps/next/src/utils/api/`)

- File per domain: `users.ts`, `upload.ts`, `audit.ts`, `example.ts`. Domain dengan banyak endpoint (auth) pakai folder + `index.ts` barrel + file per endpoint (`login.ts`, `logout.ts`, `me.ts`, dst.).
- Function naming **UPPERCASE method prefix**: `GETUsers`, `GETUsersById`, `POSTLogin`, `PUTUsers`, `PATCHExample`, `DELETEUpload`.
- Helper dasar: `getApi`, `postApi`, `putApi`, `patchApi`, `deleteApi` dari `./base`. `auth: false` hanya untuk endpoint publik (login/register).
- Definisikan interface payload (`I<Name>Payload`) dan response (`I<Name>Response` atau pakai `IXxxModel` dari `@repo/types`) di file yang sama.
- Konstanta `const label = "..."` di tiap file untuk logging.

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

### Styling

- Gunakan `twm(...)` untuk komponen reusable atau class composition yang dipakai lintas tempat. Untuk page/layout/module non-reusable, className biasa atau template literal kondisional diperbolehkan.
- Tema gelap pakai `dark:` variant. Selalu sediakan dark mode style untuk warna teks/background dasar.
- Class yang reusable per komponen → ekspor `<Name>TWM` agar bisa dipakai elemen lain (lihat contoh `ExampleATWM` di section Komponen di atas).

### Path Alias

- `@/...` → root `apps/next` (jadi `@/src/...`, `@/public/...`).
- `@/elysia/...` → root `apps/elysia` (dipakai untuk konsumsi tipe Prisma generated).
- `@repo/<package>` → workspace package.

---

## 6. Backend Elysia (`apps/elysia/src`)

### Struktur Domain (`api/<domain>/`)

Wajib mengikuti file set ini:

| File         | Isi                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `route.ts`   | `new Elysia({ prefix: "/<domain>" })` + `.use(protectedRoutePlugin(LABEL))` + chain handler. Berisi parsing schema, panggil `service`, balikan `SUCCESS_RESPONSE`. |
| `service.ts` | `export const service = { async method(...) { ... }, ... }` — satu object literal, akses Prisma/Redis/file system.                                                 |
| `schema.ts`  | Zod schema (`payloadSchema`, `paramSchema`, `querySchema`, dll.). Pesan error pakai `schemaMessage` dari `@repo/constants`.                                        |
| `type.ts`    | `export type TXxxSchema = z.infer<typeof xxxSchema>;` (+ interface lokal kalau perlu).                                                                             |
| `swagger.ts` | `export const docs = (label: string): Record<...DocumentDecoration> => ({ ... });` — schema response, security, summary, tags.                                     |
| `index.ts`   | `export * from "./route";`                                                                                                                                         |

Tambahan wajib di `route.ts`:

```ts
const LABEL = "<domain>";
```

LABEL **uppercase const string** dipakai untuk `protectedRoutePlugin`, `responseMessage`, dan `docs`.

Contoh skeleton minimal satu domain `examples/`:

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

```ts
// apps/elysia/src/api/examples/type.ts
import { z } from "zod";

import { paramSchema, payloadSchema } from "./schema";

export type TParamSchema = z.infer<typeof paramSchema>;
export type TPayloadSchema = z.infer<typeof payloadSchema>;
```

```ts
// apps/elysia/src/api/examples/service.ts
import { prisma } from "@/src/libs";

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

```ts
// apps/elysia/src/api/examples/swagger.ts
import { DocumentDecoration } from "elysia";

import { responseMessage } from "@/src/constants";

export const docs = (label: string): Record<"create" | "getById", DocumentDecoration> => ({
  create: {
    description: "create new example",
    responses: {
      200: { description: responseMessage(label).created },
    },
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

```ts
// apps/elysia/src/api/examples/route.ts
import { Elysia } from "elysia";

import { responseMessage, SUCCESS_RESPONSE } from "@/src/constants";
import { protectedRoutePlugin } from "@/src/utils/plugins";

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

```ts
// apps/elysia/src/api/examples/index.ts
export * from "./route";
```

### Response & Error

- Sukses: `SUCCESS_RESPONSE({ data, message: responseMessage(LABEL).<key>, meta? })`.
- Pesan: gunakan `responseMessage(label).<key>` — jangan tulis manual. Kalau butuh frasa baru, tambahkan key di `apps/elysia/src/constants/responseMessage.ts` lalu update test-nya.

  ```ts
  // contoh pemakaian
  return SUCCESS_RESPONSE({
    data: user,
    message: responseMessage("users").created, // → "users created successfully"
  });

  // dengan meta paginasi
  return SUCCESS_RESPONSE({
    data,
    message: responseMessage("users").fetched,
    meta: createPaginationMeta({ page, pageSize, totalData: total }),
  });
  ```

- Validasi pesan: gunakan `schemaMessage.string.<x>` / `schemaMessage.number.<x>` dari `@repo/constants`.
  ```ts
  z.string({ message: schemaMessage.string.required("email") }).email({ message: schemaMessage.string.email("email") });
  ```
- Error Prisma: ditangani otomatis oleh `protectedRoutePlugin` → `handlePrismaError`. Tambah/edit mapping di `apps/elysia/src/utils/handle-prisma-error/handlePrismaError.ts` bila perlu.
- Format pesan: lowercase, lihat aturan di section 9.

### Plugin Pattern

- Setiap plugin Elysia 1 file di `utils/plugins/<name>Plugin.ts`, di-barrel dari `utils/plugins/index.ts`.
- Wajib pasang `protectedRoutePlugin(LABEL)` di route yang butuh auth.
- Logging: pakai `logger` dari `libs/pino.ts`. Object pertama untuk structured fields (`scope`, `code`, dll.), string kedua untuk pesan.
  ```ts
  logger.info({ scope: LABEL, userId: user.id }, "user logged in");
  logger.error({ error, scope: LABEL }, "failed to fetch users");
  ```

### Pendaftaran Route

Tambah route baru ke `apps/elysia/src/api/index.ts` (barrel) dan pasang dengan `.use(...)` di `apps/elysia/src/index.ts`:

```ts
// apps/elysia/src/index.ts (potongan)
import { examplesRoute } from "@/src/api";

new Elysia().use(examplesRoute).listen(env.PORT);
```

### Path Alias Backend

- `@/...` / `@/elysia/...` → root `apps/elysia` (dipakai sebagai `@/src/...`, `@/elysia/src/...`).
- `@repo/<package>` → workspace package.

---

## 7. Shared Packages

- Tambah ke `packages/<x>` hanya bila kode **dipakai oleh ≥2 app** atau jelas-jelas reusable lintas konteks.
- Export wajib via `src/index.ts` (barrel).
- Schema lintas app → `@repo/schemas`. Frontend lalu re-export di `_layout/modules/schema.ts` lokal bila perlu rename/extend:
  ```ts
  // app/<route>/_layout/modules/schema.ts
  export { loginFormSchema, type TLoginFormSchema } from "@repo/schemas";
  ```
- Type yang membungkus Prisma model → `@repo/types`:

  ```ts
  // packages/types/src/users.ts
  import { UsersModel } from "@/elysia/src/generated/prisma/models";

  export const USER_OMIT_FIELDS = { password: true } as const;
  export interface IUsersModel extends Omit<UsersModel, "password"> {}
  ```

- Util murni JS/TS yang tidak depend ke Bun/Node-only API → `@repo/utils`.

---

## 8. Environment

- Backend: `apps/elysia/src/environment.ts` validasi via Zod. Tambah variabel baru di sini, lalu di `turbo.json` `globalEnv`, dan `.env.example`.
- Frontend: `apps/next/src/environments/env.client.ts` (NEXT*PUBLIC*\*) dan `env.server.ts`. Public env diakses lewat `clientEnv`.
- Jangan akses `process.env` langsung di kode aplikasi — selalu lewat object hasil parse.

  ```ts
  // ✅
  import { env } from "@/src/environment";
  const port = env.PORT;

  // ❌
  const port = process.env.PORT;
  ```

---

## 9. Tone Pesan

- **Pesan log, error backend, response message, schema message**: semuanya lowercase, kecuali:
  - Akronim/singkatan: `API`, `URL`, `ID`, `JWT`, `REST`, `UUID`, `OTP`, `HTTP`.
  - Nama produk: `Next.js`, `Prisma`, `Redis`, `Elysia`, `MongoDB`, `PostgreSQL`.
  - Proper noun (nama orang/tempat).
  - Format tanggal/waktu: tulis token sesuai maknanya (case-sensitive):
    - `YYYY` = tahun 4 digit, `MM` = bulan, `DD` = tanggal.
    - `HH` = jam 24-jam (00–23), `hh` = jam 12-jam (01–12, dipakai bersama `AM/PM`).
    - `mm` = menit, `ss` = detik, `SSS` = milidetik.
    - Contoh umum: `YYYY-MM-DD`, `HH:mm`, `HH:mm:ss`, `hh:mm A`.
- Pola backend (semua lowercase + label):
  ```ts
  // responseMessage("users").created → "users created successfully"
  // responseMessage("access token").required → "access token is required"
  // schemaMessage.string.email("email") → "email must be a valid email"
  // schemaMessage.string.min("name", 1) → "name must contain at least 1 character"
  ```
- **Teks UI frontend** (label, placeholder, judul, tombol, copy text): kapitalisasi natural sesuai konteks tampilan (Title Case / sentence case). Contoh: "Change Password", "UPDATE", "Confirm Password". Bukan all lowercase.

---

## 10. Testing

- Vitest. Globals aktif (`describe`, `it`, `expect` tidak perlu di-import).
- Lokasi test: folder `test/` bersebelahan dengan file modul.
  - Backend: `apps/elysia/src/<area>/test/<module>.spec.ts`.
  - Frontend: `apps/next/src/<area>/test/<module>.spec.ts(x)`.
- Nama file: `<module>.spec.ts(x)`.
- Saat menambah/mengubah util, schema, hook, atau service, **tambahkan/perbarui test** yang relevan.

  ```ts
  // contoh struktur test
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

## 11. File yang TIDAK Boleh Diedit Manual

- `apps/elysia/src/generated/**` (Prisma client generated).
- `apps/next/storybook-static/**` (build Storybook).
- `node_modules/**`, `.next/**`, `.turbo/**`, `dist/**`, build artifact lain.
- `pnpm-lock.yaml` (kecuali via `pnpm install`).

---

## 12. Gaya Perubahan

- **Sekecil mungkin.** Jangan refactor area tidak terkait, jangan bersih-bersih kosmetik di luar scope task.
- Jangan ubah public API existing kecuali memang dibutuhkan task.
- **Reuse dulu** sebelum bikin baru: cek `@repo/utils`, `@repo/schemas`, `@repo/types`, `@repo/constants`, lalu folder `utils/`, `hooks/`, `components/`, `libs/` per app. Baru bikin baru bila tidak ada.
- Scope penempatan kode baru:
  - Lintas app → `packages/*`.
  - Satu app saja → `apps/<app>/src/<utils|hooks|components|...>`.
  - Spesifik 1 fitur/route → lokal di folder fitur (mis. `app/<route>/_layout/modules/...`).
- Sesuaikan style penamaan, typing, struktur return, dan urutan property dengan file sekitar. Bila ragu, cari file paling mirip lalu jiplak strukturnya.

---

## 13. Checklist Sebelum Selesai

- [ ] Import sudah rapi sesuai grup & urutan (auto-fixed by ESLint).
- [ ] Tidak ada placement file yang melanggar struktur per section di atas.
- [ ] Domain backend baru punya 6 file lengkap (`route`, `service`, `schema`, `type`, `swagger`, `index`).
- [ ] LABEL backend uppercase, response & error message via helper, lowercase tone.
- [ ] Komponen Next pakai `FC`, return type eksplisit, page/layout pakai `props.X`, default export hanya untuk page/layout.
- [ ] Class Tailwind di komponen reusable via `twm`; variant component punya `<Name>TWM`.
- [ ] API client baru pakai prefix `GET/POST/PUT/PATCH/DELETE` + `getApi/postApi/...` helper.
- [ ] Test relevan ditambah/diperbarui di `test/` terdekat.
- [ ] `pnpm lint` dan `pnpm check-types` pass tanpa warning baru.
