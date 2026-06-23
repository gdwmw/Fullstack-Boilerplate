import { DetailedHTMLProps, FC, forwardRef, ReactElement, TextareaHTMLAttributes } from "react";

import { twm } from "@/src/libs/twm";

import { ExampleErrorMessage } from "./elements/ExampleErrorMessage";
import { ExampleInputsContainer } from "./elements/ExampleInputsContainer";
import { ExampleLabel, IExampleLabel } from "./elements/ExampleLabel";

interface I
  extends
    DetailedHTMLProps<Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "color">, HTMLTextAreaElement>,
    Omit<IExampleLabel, "children" | "className"> {
  className?: {
    container?: string;
    textarea?: string;
  } & IExampleLabel["className"];
  rows?: number;
}

const ExampleTextareaTWM = ({ className, disabled }: Omit<I, "color" | "label">) =>
  twm(
    "max-h-50 min-h-30 w-full rounded-xs bg-transparent px-1 outline-hidden disabled:cursor-not-allowed",
    disabled && "text-gray-400",
    className?.textarea,
  );

export const ExampleTextarea: FC<I> = forwardRef<HTMLTextAreaElement, I>(
  ({ className, color, disabled, errorMessage, label, rows, ...props }, ref): ReactElement => (
    <ExampleInputsContainer className={className?.container}>
      <ExampleLabel
        className={{ fieldset: className?.fieldset, legend: className?.legend }}
        color={color}
        disabled={disabled}
        errorMessage={errorMessage}
        label={label}
      >
        <textarea
          className={ExampleTextareaTWM({ className, disabled })}
          data-testid="example-textarea"
          disabled={disabled}
          ref={ref}
          rows={rows ?? 5}
          {...props}
        />
      </ExampleLabel>

      {errorMessage && !disabled && <ExampleErrorMessage errorMessage={errorMessage} />}
    </ExampleInputsContainer>
  ),
);

ExampleTextarea.displayName = "ExampleTextarea";
