"use server";

import { IFilesModel } from "@repo/types";
import { getServerSession, Session, User } from "next-auth";

import { options } from "@/configs/authentication";

type T = keyof User;

export const getSession = async (props: T): Promise<Date | IFilesModel | null | number | string | undefined> => {
  const session = await getServerSession(options);
  return session?.user?.[props];
};

export const getAllSession = async (): Promise<null | Session> => await getServerSession(options);
