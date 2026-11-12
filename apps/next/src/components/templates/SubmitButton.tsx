import Image from "next/image";
import { FC, ReactElement } from "react";

import loadingWhite from "@/public/assets/animations/loadings/Loading-W.svg";
import { ExampleA, IExampleA } from "@/src/components/elements/example/A/ExampleA";

interface I {
  label: string;
}

export const SubmitButton: FC<I & IExampleA> = ({ disabled, label, ...props }): ReactElement => (
  <ExampleA disabled={disabled} type="submit" {...props}>
    {disabled ? <Image alt="Loading..." height={20} src={loadingWhite} width={20} /> : label}
  </ExampleA>
);
