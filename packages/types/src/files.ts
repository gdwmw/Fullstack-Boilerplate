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

type TFormatKey = "large" | "medium" | "small" | "thumbnail";

export type TFormats = Record<TFormatKey, IFormats>;

export interface IFilesModel extends Omit<FilesModel, "formats"> {
  formats: null | TFormats;
}
