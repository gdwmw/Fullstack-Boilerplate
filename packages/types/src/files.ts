import { FilesModel } from "@/elysia/src/generated/prisma/models";

export interface IFormats {
  filename: string;
  height: number;
  mimetype: string;
  path: string;
  size: number;
  url: string;
  width: number;
}

export const FORMAT_OPTIONS = ["large", "medium", "small", "thumbnail"] as const;

export type TFormatKey = (typeof FORMAT_OPTIONS)[number];

export type TFormats = Partial<Record<TFormatKey, IFormats>>;

export interface IFilesModel extends Omit<FilesModel, "formats"> {
  formats: null | TFormats;
}
