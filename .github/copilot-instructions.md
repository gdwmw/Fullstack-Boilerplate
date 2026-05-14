# Copilot Instructions for Fullstack-Boilerplate

Gunakan panduan ini untuk semua perubahan kode agar konsisten dengan pola repository ini.

## Scope Project

- Monorepo memakai Turborepo + pnpm workspace.
- Frontend ada di `apps/next` (Next.js App Router).
- Backend ada di `apps/elysia` (Elysia + Prisma + Redis).
- Shared code ada di `packages/*` (`constants`, `schemas`, `types`, `utils`, `eslint-config`).

## Pelajari Aturan Dulu

- Sebelum menulis kode, pahami dulu `packages/eslint-config/src/base.js`, `packages/eslint-config/src/next.js`, `packages/eslint-config/src/elysia.js`, `tsconfig.base.json`, `apps/next/tsconfig.json`, dan `apps/elysia/tsconfig.json`.
- Ikuti aturan import dari config: type import dulu, lalu builtin/external, lalu internal alias, lalu relative, dengan 1 baris kosong antar grup.
- Ikuti aturan style dari config: code harus simpel, hindari nested ternary, prefer `const`, prefer arrow function, jaga kompleksitas tetap kecil, dan jangan bikin function terlalu banyak parameter.
- `any` jangan dipakai kalau ada alternatif yang lebih jelas.
- Gunakan typing yang aman karena TypeScript aktif dalam mode strict.

## Wajib Konsisten

- Jangan ubah struktur folder tanpa alasan kuat.
- Ikuti naming komponen React: PascalCase (`ExampleInput.tsx`, `Header.tsx`).
- Ikuti naming hooks/utility/function: camelCase (`useToggle.ts`, `parseDurationToMs.ts`).
- Ikuti naming test file: akhiran `.spec.ts` atau `.spec.tsx`.
- Gunakan TypeScript strict style, hindari `any` kecuali benar-benar terpaksa.
- Untuk `interface`, ikuti pola project yang memakai prefix `I` untuk object shape yang jelas (`IResponseSet`, `IUsersModel`).
- Untuk `type`, ikuti pola project yang memakai prefix `T` untuk alias/shape turunan (`TRegisterSchema`, `THeadersMap`) atau gunakan nama deskriptif tanpa prefix jika itu sudah menjadi pola file terkait.
- Pilih `interface` untuk object contract yang akan di-extend atau di-implement, dan `type` untuk union, mapped type, utility type, atau hasil infer schema.
- Semua pesan, label, message, dan copy text yang ditulis oleh AI harus lowercase semua, kecuali singkatan, akronim, nama produk, atau proper noun yang memang perlu kapital.
- Ikuti pola pesan yang sudah ada di project seperti `responseMessage.ts` dan `schemaMessage.ts`.

## Aturan Import

- Gunakan alias internal app: `@/`.
- Gunakan alias package workspace: `@repo/...`.
- Ikuti urutan import yang konsisten: type import dulu, lalu external/builtin, lalu internal alias (`@/` dan `@repo/`), lalu relative import.
- Pertahankan 1 baris kosong antar grup import.

## Penempatan File

### Backend (`apps/elysia/src`)

- Endpoint berbasis domain di `api/<domain>/`.
- Untuk domain API baru, ikuti pola file berikut bila relevan: `route.ts`, `service.ts`, `schema.ts`, `type.ts`, `swagger.ts`, `index.ts` (barrel export).
- Gunakan konstanta response dari `constants/responseTemplate.ts` dan message dari `constants/responseMessage.ts`.
- Logging pakai util yang sudah ada di `libs/pino.ts` dan plugin request logger yang tersedia.

### Frontend (`apps/next/src`)

- Route/page ikuti App Router (`app/**`).
- Komponen reusable taruh di `components/`, dengan primitive/element di `components/elements/**` dan template/layout di `components/templates/**`.
- Helper styling class wajib pakai `twm` dari `libs/twm.ts` untuk gabung class Tailwind.
- Utility function di `utils/**`, hooks di `hooks/**`, context di `context/**`.
- Pertahankan pola barrel export (`index.ts`) jika folder tersebut sudah memakai barrel.

### Shared Packages (`packages/*`)

- Simpan reusable schema/type/constant lintas app di package yang tepat.
- Hindari duplikasi logic yang sudah ada di `packages/utils`, `packages/schemas`, `packages/types`, atau `packages/constants`.

## Testing

- Gunakan Vitest.
- Pertahankan pola lokasi test dalam folder `test/` yang dekat dengan modul yang diuji.
- Nama file test konsisten dengan modul (`feature.spec.ts`).
- Saat menambah fitur/bugfix, tambahkan atau update test yang relevan.

## Environment dan Validasi

- Validasi environment berbasis schema (Zod) sesuai pola file environment masing-masing app.
- Untuk validasi input/business rule, prioritaskan schema di `@repo/schemas` bila bisa dipakai lintas app.

## File/Folder yang Tidak Boleh Diedit Manual

- `apps/elysia/src/generated/**` (hasil generate Prisma).
- `apps/next/storybook-static/**` (build output Storybook).
- `node_modules/**`, `.turbo/**`, dan artefak build lain.

## Gaya Perubahan

- Buat perubahan sekecil mungkin yang langsung menyelesaikan masalah.
- Bikin kode sesederhana mungkin, jangan ribet atau overengineering.
- Utamakan reuse: pakai komponen, type, helper, schema, atau util yang sudah ada kalau relevan, dan jangan copy-paste logic yang sama berulang.
- Kalau belum ada, baru buat yang baru dengan scope paling tepat:
- Global repo (`packages/*`) kalau dipakai lintas app.
- Per app (`apps/next` atau `apps/elysia`) kalau hanya dipakai dalam satu app.
- Lokal (dekat modul/fitur) kalau kebutuhan hanya spesifik di satu area kecil.
- Jangan refactor area tidak terkait tanpa diminta.
- Jangan ubah public API existing kecuali memang dibutuhkan task.
- Saat menambah kode baru, sesuaikan style penamaan, typing, dan struktur return dengan file sekitar.

## Contoh Keputusan Scope

- Simpan di `packages/schemas` kalau schema dipakai backend dan frontend sekaligus.
- Simpan di `apps/next/src/components` kalau komponen hanya dipakai oleh halaman Next.js.
- Simpan lokal di folder fitur kalau helper hanya dipakai satu modul dan tidak dipakai lintas domain.

## Checklist Sebelum Selesai

- Import rapi sesuai urutan.
- Tidak ada path placement yang melanggar struktur project.
- TypeScript dan lint tidak menambah error baru.
- Test relevan sudah ditambah/diupdate sesuai perubahan.
- Jalankan `pnpm lint` sebelum menutup task.
- Jalankan `pnpm check-types` sebelum menutup task.
