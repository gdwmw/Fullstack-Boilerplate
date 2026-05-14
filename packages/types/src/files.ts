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

export type TFormats = Record<TFormatKey, IFormats>;

export const IMAGE_FORMATS: { name: TFormatKey; width: number }[] = [
  { name: "thumbnail", width: 245 },
  { name: "small", width: 500 },
  { name: "medium", width: 750 },
  { name: "large", width: 1000 },
];

export interface IFilesModel extends Omit<FilesModel, "formats"> {
  formats: null | TFormats;
}
