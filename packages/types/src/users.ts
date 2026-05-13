import { UsersModel } from "@prisma/models";

import { IFilesModel } from "./files";

export const USER_OMIT_FIELDS = {
  password: true,
} as const;

export interface IUsersModel extends Omit<UsersModel, keyof typeof USER_OMIT_FIELDS> {
  image: IFilesModel | null;
}
