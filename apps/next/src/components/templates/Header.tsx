import { FC, ReactElement } from "react";

import { twm } from "@/src/libs/twm";

interface I {
  className?: {
    description?: string;
    label?: string;
  };
  description: string;
  label: string;
}

export const Header: FC<I> = (props): ReactElement => (
  <header>
    <h1 className={twm("text-2xl font-semibold text-blue-500", props.className?.label)}>{props.label}</h1>
    <p className={twm("text-sm tracking-wide", props.className?.description)}>{props.description}</p>
  </header>
);
