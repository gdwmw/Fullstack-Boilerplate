# Copilot Instructions for Fullstack-Boilerplate

Panduan ini wajib diikuti untuk semua perubahan kode agar konsisten dengan pola repository.
Saat menulis kode baru, **selalu lihat file sejenis di sekitarnya terlebih dahulu** dan ikuti pola yang sudah ada. Jangan membuat pola baru sendiri.

---

## 1. Cakupan Proyek

Monorepo ini menggunakan Turborepo + pnpm workspace, runtime Node 22+ (Bun untuk backend), dan TypeScript strict.

| Path                     | Isi                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `apps/next`              | Frontend Next.js App Router (React 19, Tailwind v4, React Query, Jotai, NextAuth, react-hook-form + Zod). |
| `apps/elysia`            | Backend Elysia.js (Bun runtime, Prisma + PostgreSQL, Redis/ioredis, Pino, JWT).                           |
| `packages/constants`     | Konstanta lintas app (`schemaMessage`).                                                                   |
| `packages/schemas`       | Zod schema lintas app (auth dll.).                                                                        |
| `packages/types`         | Type lintas app (wrapper Prisma model).                                                                   |
| `packages/utils`         | Util lintas app (`logTemplate`, `parseDurationToMs`).                                                     |
| `packages/eslint-config` | Shared ESLint flat config (`base`, `next`, `elysia`).                                                     |

Sebelum menulis kode, baca konfigurasi ESLint shared (`packages/eslint-config/src/{base,next,elysia}.js`) dan `tsconfig` per app. Seluruh aturan pada file tersebut menjadi acuan untuk contoh-contoh di bawah.

---

## 2. TypeScript

- Mode `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, dan `useUnknownInCatchVariables` aktif. Error pada `catch` bertipe `unknown` harus di-narrow terlebih dahulu. Akses array/record bertipe `T | undefined` juga harus di-guard terlebih dahulu.
- Hindari `any`. Pakai `unknown` + narrowing kalau benar-benar dinamis.
- Penamaan tipe:
  - `interface` → prefix `I` (contoh: `IUsersModel`, `IPaginationMeta`, `IExampleA`). Pakai untuk object contract yang akan di-`extend`/`implement`.
  - `type` → prefix `T` (contoh: `TPayloadSchema`, `TLoginSchema`, `TCurrencyCode`). Pakai untuk union, mapped, utility, hasil `z.infer`, atau alias singkat lokal komponen.
- Tipe yang berasal dari Zod:
  ```ts
  export const payloadSchema = z.object({ name: z.string() });
  export type TPayloadSchema = z.infer<typeof payloadSchema>;
  ```
- Error pada `catch` harus di-narrow:
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
- **Jangan gunakan non-null assertion operator `!`**. Selalu lakukan type narrowing yang proper:

  ```ts
  // ❌ hindari
  const value = props.data!.id;
  const item = items[0]!;
  await fetchData(props.id!);

  // ✅ parameter di dalam if block setelah guard
  if (props.boardDocumentId) {
    queryFn: async () => await getBoard(props.boardDocumentId ?? "");
  }
  ```

- **Khusus props komponen di `apps/next/src/components/**`**: konvensi project menggunakan single-letter `interface I { ... }`. Jika ada lebih dari satu interface lokal pada file yang sama, gunakan nama yang lebih spesifik dengan prefix `I`.

  ```tsx
  interface I {
    label: string;
    onClick: () => void;
  }

  export const SubmitButton: FC<I> = (props): ReactElement => <button onClick={props.onClick}>{props.label}</button>;
  ```

---

## 3. Style & ESLint

Konfigurasi ESLint menggunakan `--max-warnings 0`, jadi semua warning akan membuat build gagal. Aturan utama yang paling sering terkena:

- `prefer-const`, `prefer-template`, `prefer-arrow-callback`, `arrow-body-style: as-needed`, `func-style: expression` → selalu gunakan arrow function expression dengan `const`.

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

- `no-nested-ternary` → pecah ternary menjadi variabel atau early return.

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

- `complexity: 25`, `max-params: 4` → jika melebihi batas, pisahkan menjadi helper atau gunakan single object param `{ ... }`.

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
- **Jangan gunakan `void`** — baik untuk membuang Promise maupun untuk tipe return. Panggil fungsi async langsung tanpa `void`, atau gunakan `await` jika hasil/error-nya perlu ditunggu.

  ```ts
  // ❌
  void publishEvent(data);

  // ✅ — fire and forget
  publishEvent(data);

  // ✅ — jika perlu menunggu hasilnya
  await publishEvent(data);
  ```

- `@typescript-eslint/no-unused-vars`: argumen/variabel/catch yang sengaja unused harus diawali `_`.
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
- **Tailwind**: gunakan helper `twm` untuk komponen reusable (terutama di `components/**`) atau saat ada potensi class utility bertabrakan/override. Jika hanya conditional class sederhana tanpa bentrok utility, utamakan `className={[...].join(" ")}`. Untuk layout/page/module yang non-reusable, className biasa tetap diperbolehkan. Plugin `better-tailwindcss` tetap aktif (`callees: ["twm"]`, variabel `*TWM`).

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

### Urutan dan Grup Import

Diurutkan otomatis oleh `perfectionist/sort-imports`. Urutannya:

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

Setiap grup dipisahkan oleh satu baris kosong. Jangan gunakan `import type` maupun `import { type ... }`; cukup `import` biasa agar konsisten dengan aturan project. Jangan mencampur urutan manual, biarkan ESLint melakukan auto-fix.

### Preferensi Import via Barrel

- Jika sebuah folder sudah menyediakan barrel export (`index.ts`), **utamakan import dari level folder** dan hindari direct import ke file internal.
- Contoh: gunakan `@/src/libs` alih-alih `@/src/libs/pino`, selama symbol yang dibutuhkan sudah di-export dari barrel.
- Direct import ke file internal hanya dipakai jika symbol tersebut memang belum di-export dari `index.ts`. Jika dibutuhkan lintas file, tambahkan export di barrel terlebih dahulu.
- Pengecualian: untuk kebutuhan **lazy loading / `next/dynamic`** atau kebutuhan framework lain yang memang mengharuskan referensi module file spesifik, direct import ke file internal diperbolehkan.

### Barrel Export (`index.ts`)

- **Jangan gunakan `export type`** di barrel export. Gunakan `export * from` saja.
- Untuk deklarasi lokal di file non-barrel, gunakan inline named export (contoh: `export const startKanbanRedisSubscriber = ...`) dan hindari pola `export { startKanbanRedisSubscriber };` di bagian bawah file.
- Pengecualian: `export { ... }` tetap boleh untuk kebutuhan re-export antar module atau compatibility tertentu yang memang membutuhkan export list.

  ```ts
  // ✅ di barrel (index.ts)
  export * from "./audit";
  export * from "./types";
  export * from "./users";

  // ❌ jangan
  export type { TSomeType } from "./types";
  export type * from "./types";
  export { someFunction } from "./utils";
  ```

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

Setiap folder yang sudah memiliki `index.ts` adalah barrel export. Pertahankan pola tersebut saat menambah file baru.

---

## 5. React / Next.js (`apps/next/src`)

### Komponen

- **Selalu** `FC` dengan return type eksplisit (`ReactElement`, `null | ReactElement`, `Promise<ReactElement>`, `ReactNode` sesuai kebutuhan).

- **Jangan gunakan namespace `React.`** (contoh: `React.Ref`, `React.FormEvent`). Import tipe yang dibutuhkan langsung dari `react` (contoh: `Ref`, `SyntheticEvent`).

  ```tsx
  // ✅
  import { Ref, SyntheticEvent } from "react";
  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => e.preventDefault();
  const elRef = ref as Ref<HTMLElement>;

  // ❌
  const onSubmit = (e: React.FormEvent) => e.preventDefault();
  const elRef = ref as React.Ref<HTMLElement>;
  ```

- Page/layout/server component App Router: jangan destructure props di parameter. Pola wajib:

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

- Komponen di `components/templates/**` dengan props sederhana boleh diakses lewat `props.X`:

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

- Komponen di `components/elements/**` (interaktif/banyak prop) boleh destructure di parameter:

  ```tsx
  interface I extends ButtonHTMLAttributes<HTMLButtonElement> {
    color?: TExampleAColor;
    size?: TExampleASize;
  }

  export const ExampleA: FC<I> = ({ className, color = "blue", size = "md", ...rest }): ReactElement => (
    <button className={twm(ExampleATWM({ color, size }), className)} {...rest} />
  );
  ```

- **Variant component**: ekspor daftar opsi `const` + union type + helper `<Name>TWM` + komponen utama:

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
- Reusable component di `components/**` **dilarang** menggunakan `export default` kecuali memang harus di-`next/dynamic`. Gunakan named export.

### Routing & Layout

- Halaman: `app/<route>/page.tsx`. Judul menggunakan `metadata.title`.
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

- Global state ringan: gunakan Jotai atom di `context/`.

  ```ts
  import { atom, useAtom } from "jotai";

  const userAtom = atom<IUsersModel | null>(null);

  export const useGlobalContext = () => {
    const [user, setUser] = useAtom(userAtom);
    return { setUser, user };
  };
  ```

- Form: `react-hook-form` + `zodResolver`. Jika schema berasal dari package shared, import langsung dari `@repo/schemas` (jangan re-export lagi via file schema lokal).
- File `_layout/modules/schema.ts` hanya untuk schema yang benar-benar spesifik fitur lokal dan tidak tersedia di shared package.
  ```tsx
  const form = useForm<TLoginFormSchema>({ resolver: zodResolver(loginFormSchema(true)) });
  ```
- Server state: `@tanstack/react-query` (`useMutation`, `useQuery`).
- HTTP client: **wajib** melalui helper di `apps/next/src/utils/api/`. Jangan panggil `axios` langsung di komponen, kecuali untuk health check.

### API Client Pattern (`apps/next/src/utils/api/`)

- File per domain: `users.ts`, `upload.ts`, `audit.ts`, `example.ts`. Domain dengan banyak endpoint (auth) menggunakan folder + `index.ts` (barrel) + file per endpoint (`login.ts`, `logout.ts`, `me.ts`, dst.).
- Function naming **UPPERCASE method prefix**: `GETUsers`, `GETUsersById`, `POSTLogin`, `PUTUsers`, `PATCHExample`, `DELETEUpload`.
- Semua endpoint daftar / `getAll` **wajib** menerima pagination query yang sudah distandardisasi. Gunakan tipe query pagination yang sesuai contract backend.
- Helper dasar: `getApi`, `postApi`, `putApi`, `patchApi`, `deleteApi` dari `./base`. Gunakan `auth: false` hanya untuk endpoint publik (login/register).
- Definisikan interface payload (`I<Name>Payload`) dan response (`I<Name>Response` atau `IXxxModel` dari `@repo/types`) di file yang sama.
- Tambahkan konstanta `const label = "..."` pada tiap file untuk logging.

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

- Gunakan `twm(...)` untuk komponen reusable atau class composition yang dipakai lintas tempat, khususnya saat ada potensi utility bertabrakan (contoh `px-*`, `text-*`, `bg-*` saling override).
- Jika class hanya conditional sederhana dan tidak berpotensi bentrok, gunakan `className={[...].join(" ")}` agar intent lebih jelas.
- Hindari class `transition*` secara default. Tambahkan hanya jika benar-benar dibutuhkan oleh UX atau diminta eksplisit.
- **Jangan gunakan atribut `aria-*`** (contoh: `aria-label`, `aria-hidden`, `aria-expanded`, dll.) kecuali diminta eksplisit.
- Konvensi prop `className` untuk reusable component:
  - Jika komponen hanya punya satu wrapper utama, gunakan `className?: string`.
  - Jika komponen punya beberapa slot yang perlu di-override terpisah, gunakan `className?: { <slotA>?: string; <slotB>?: string }`.
  - Hindari membuat beberapa prop class terpisah seperti `inputClassName`, `labelClassName`, dll. untuk kasus reusable; satukan lewat `className` object per slot.
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

- Jika schema berasal dari shared package, import langsung dari `@repo/schemas` di file yang membutuhkan (frontend maupun backend).
- File schema lokal (`app/<route>/_layout/modules/schema.ts` atau `apps/elysia/src/api/<domain>/schema.ts`) hanya untuk schema yang benar-benar lokal fitur/domain, bukan sebagai lapisan re-export dari package.

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
- Semua endpoint daftar / `getAll` **wajib** memakai pagination query yang tervalidasi dan **wajib** mengembalikan `meta` paginasi. Jangan kirim list tanpa `meta` untuk response koleksi.
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

- Tambahkan ke `packages/<x>` hanya jika kode **dipakai oleh ≥2 app** atau jelas-jelas reusable lintas konteks.
- Export wajib melalui `src/index.ts` (barrel).
- Schema lintas app → `@repo/schemas`. Jika memakai schema dari packages, gunakan import langsung dari package tersebut (frontend maupun backend) dan jangan re-export lagi lewat file schema lokal.
- Type yang membungkus Prisma model → `@repo/types`:

  ```ts
  // packages/types/src/users.ts
  import { UsersModel } from "@/elysia/src/generated/prisma/models";

  export const USER_OMIT_FIELDS = { password: true } as const;
  export interface IUsersModel extends Omit<UsersModel, "password"> {}
  ```

- Util murni JS/TS yang tidak bergantung pada Bun/Node-only API → `@repo/utils`.

---

## 8. Environment

- Backend: `apps/elysia/src/environment.ts` divalidasi via Zod. Tambahkan variabel baru di sini, lalu update `turbo.json` (`globalEnv`) dan `.env.example`.
- Frontend: `apps/next/src/environments/env.client.ts` (`NEXT_PUBLIC_*`) dan `env.server.ts`. Public env diakses lewat `clientEnv`.
- Jangan akses `process.env` langsung di kode aplikasi. Selalu gunakan object hasil parse.

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
- **Teks UI frontend** (label, placeholder, judul, tombol, copy text): gunakan kapitalisasi natural sesuai konteks tampilan (Title Case/sentence case). Contoh: "Change Password", "UPDATE", "Confirm Password". Jangan all lowercase.

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

## 11. File yang Tidak Boleh Diedit Manual

- `apps/elysia/src/generated/**` (Prisma client generated).
- `apps/next/storybook-static/**` (build Storybook).
- `node_modules/**`, `.next/**`, `.turbo/**`, `dist/**`, build artifact lain.
- `pnpm-lock.yaml` (kecuali via `pnpm install`).

---

## 12. Gaya Perubahan

- **Sekecil mungkin.** Jangan refactor area yang tidak terkait, dan jangan melakukan bersih-bersih kosmetik di luar scope task.
- Jangan ubah public API yang sudah ada, kecuali memang dibutuhkan oleh task.
- **Reuse dulu** sebelum membuat baru: cek `@repo/utils`, `@repo/schemas`, `@repo/types`, `@repo/constants`, lalu folder `utils/`, `hooks/`, `components/`, `libs/` per app. Buat kode baru hanya jika belum tersedia.
- Cakupan penempatan kode baru:
  - Lintas app → `packages/*`.
  - Satu app saja → `apps/<app>/src/<utils|hooks|components|...>`.
  - Spesifik 1 fitur/route → lokal di folder fitur (mis. `app/<route>/_layout/modules/...`).
- Sesuaikan style penamaan, typing, struktur return, dan urutan property dengan file sekitar. Jika ragu, cari file paling mirip lalu ikuti strukturnya.

---

## 13. Checklist Sebelum Selesai

- [ ] Jalankan `pnpm lint:fix`, `pnpm prettier`, `pnpm lint` dan `pnpm check-types`.
