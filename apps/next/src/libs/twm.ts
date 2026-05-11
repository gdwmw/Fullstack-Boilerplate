import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const twm = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
