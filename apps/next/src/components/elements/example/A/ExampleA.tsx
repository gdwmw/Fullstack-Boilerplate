import { ButtonHTMLAttributes, DetailedHTMLProps, FC, ReactElement } from "react";

import { twm } from "@/src/libs";

export const EXAMPLEA_VARIANT_OPTIONS = ["ghost", "outline", "solid"] as const;
export const EXAMPLEA_COLOR_OPTIONS = ["red", "green", "blue", "black", "white", "gray"] as const;
export const EXAMPLEA_SIZE_OPTIONS = ["lg", "md", "sm"] as const;

export type TExampleAVariant = (typeof EXAMPLEA_VARIANT_OPTIONS)[number];
export type TExampleAColor = (typeof EXAMPLEA_COLOR_OPTIONS)[number];
export type TExampleASize = (typeof EXAMPLEA_SIZE_OPTIONS)[number];

export interface IExampleA extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  color: TExampleAColor;
  size: TExampleASize;
  variant: TExampleAVariant;
}

// ⭐ COLOR MAP
const colorMap: Record<TExampleAVariant, Partial<Record<TExampleAColor, string>>> = {
  ghost: {
    black: "text-black dark:text-white",
    blue: "text-blue-500",
    gray: "text-gray-200 dark:text-gray-500",
    green: "text-green-500",
    red: "text-red-500",
    white: "text-white dark:text-black",
  },
  outline: {
    black:
      "bg-transparent text-black ring-1 ring-black ring-inset hover:bg-black hover:text-white dark:text-white dark:ring-white dark:hover:bg-white dark:hover:text-black",
    blue: "bg-transparent text-blue-500 ring-1 ring-blue-500 ring-inset hover:bg-blue-500 hover:text-white",
    gray: "bg-transparent text-gray-200 ring-1 ring-gray-200 ring-inset hover:bg-gray-200 hover:text-black dark:text-gray-500 dark:ring-gray-500 dark:hover:bg-gray-500 dark:hover:text-white",
    green: "bg-transparent text-green-500 ring-1 ring-green-500 ring-inset hover:bg-green-500 hover:text-white",
    red: "bg-transparent text-red-500 ring-1 ring-red-500 ring-inset hover:bg-red-500 hover:text-white",
    white:
      "bg-transparent text-white ring-1 ring-white ring-inset hover:bg-white hover:text-black dark:text-black dark:ring-black dark:hover:bg-black dark:hover:text-white",
  },
  solid: {
    black: "bg-black text-white dark:bg-white dark:text-black",
    blue: "bg-blue-500 text-white",
    gray: "bg-gray-200 text-black dark:bg-gray-500 dark:text-white",
    green: "bg-green-500 text-white",
    red: "bg-red-500 text-white",
    white: "bg-white text-black dark:bg-black dark:text-white",
  },
};

// ⭐ DISABLED MAP
const disabledMap: Record<TExampleAVariant, string> = {
  ghost: "text-gray-400",
  outline: "bg-transparent text-gray-400 ring-1 ring-gray-400 ring-inset",
  solid: "bg-gray-400 text-white",
};

// ⭐ SIZE MAP
const sizeMap: Record<TExampleAVariant, Record<TExampleASize, string>> = {
  ghost: { lg: "text-xl", md: "text-lg", sm: "text-base" },
  outline: { lg: "h-12 min-h-12 min-w-36 px-5 text-xl", md: "h-11 min-h-11 min-w-32 px-4 text-lg", sm: "h-10 min-h-10 min-w-28 px-3 text-base" },
  solid: { lg: "h-12 min-h-12 min-w-36 px-5 text-xl", md: "h-11 min-h-11 min-w-32 px-4 text-lg", sm: "h-10 min-h-10 min-w-28 px-3 text-base" },
};

export const ExampleATWM = ({ className, color, disabled, size, variant }: IExampleA) =>
  twm(
    "flex items-center gap-2 font-semibold",
    variant !== "ghost" && "justify-center rounded-md",
    disabled ? "cursor-not-allowed" : "cursor-pointer active:scale-95",
    !disabled && colorMap[variant]?.[color],
    disabled && disabledMap[variant],
    sizeMap[variant]?.[size],
    className,
  );

export const ExampleA: FC<IExampleA> = ({ className, color, disabled, size, type = "button", variant, ...props }): ReactElement => (
  <button className={ExampleATWM({ className, color, disabled, size, variant })} data-testid="example-a" disabled={disabled} type={type} {...props}>
    {props.children}
  </button>
);
