"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { logTemplate } from "@repo/utils";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, HTMLInputTypeAttribute, KeyboardEvent, ReactElement, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ExampleATWM, ExampleInput, FormContainer, SubmitButton } from "@/src/components";
import { IErrorResponse, inputValidations, POSTRegister } from "@/src/utils";

import { registerSchema, TRegisterSchema } from "../schema";

interface IFormField {
  isPassword?: boolean;
  label: string;
  maxLength?: number;
  name: keyof TRegisterSchema;
  onKeyDown?: (e: KeyboardEvent) => void;
  type: HTMLInputTypeAttribute;
}

const FORM_FIELDS_DATA: IFormField[] = [
  {
    label: "Name",
    maxLength: 50,
    name: "name",
    onKeyDown: (e) => inputValidations.name(e),
    type: "text",
  },
  {
    label: "Username",
    maxLength: 8,
    name: "username",
    onKeyDown: (e) => inputValidations.username(e),
    type: "text",
  },
  {
    label: "Email",
    name: "email",
    type: "email",
  },
  {
    label: "Phone",
    maxLength: 15,
    name: "phone",
    onKeyDown: (e) => inputValidations.phoneNumber(e),
    type: "tel",
  },
  {
    isPassword: true,
    label: "Password",
    maxLength: 72,
    name: "password",
    type: "password",
  },
  {
    isPassword: true,
    label: "Confirm Password",
    name: "confirmPassword",
    type: "password",
  },
];

export const Main: FC = (): ReactElement => {
  const router = useRouter();
  const [passwordVisibility, setPasswordVisibility] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [loading, setLoading] = useState(false);

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
  } = useForm<TRegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (dt: TRegisterSchema) => {
      const { confirmPassword: _confirmPassword, ...registerPayload } = dt;
      await POSTRegister(registerPayload);
      return true;
    },
    onError: (error) => {
      const axiosError = error as AxiosError<IErrorResponse>;
      setErrorMessage(axiosError.response?.data?.message ?? "registration failed. please try again.");
      logTemplate.WARN("register failed!", "auth/register");
    },
    onMutate: () => {
      setLoading(true);
    },
    onSettled: () => {
      setLoading(false);
    },
    onSuccess: () => {
      logTemplate.SUCCESS("register success!", "auth/register");
      router.push("/authentication/login");
      reset();
    },
  });

  const onSubmit: SubmitHandler<TRegisterSchema> = (dt) => {
    setErrorMessage("");

    if (getValues("password") !== getValues("confirmPassword")) {
      setErrorMessage("confirm password does not match password");
      return;
    }

    registerMutation.mutate(dt);
  };

  const getPasswordIcon = (isPassword: boolean) => {
    if (!isPassword) {
      return undefined;
    }
    return passwordVisibility ? <Eye size={18} /> : <EyeOff size={18} />;
  };

  const getInputType = (isPassword: boolean, fieldType: HTMLInputTypeAttribute): HTMLInputTypeAttribute => {
    if (isPassword) {
      return passwordVisibility ? "text" : "password";
    }
    return fieldType;
  };

  return (
    <main>
      <FormContainer className={{ innerContainer: "max-w-112.5" }} href={"/"} label={"Home"}>
        <form className="flex w-full flex-col gap-3 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          {FORM_FIELDS_DATA.map((dt) => (
            <ExampleInput
              color="default"
              disabled={loading}
              errorMessage={errors[dt.name]?.message}
              icon={getPasswordIcon(dt.isPassword ?? false)}
              iconOnClick={dt.isPassword ? () => setPasswordVisibility((prev) => !prev) : undefined}
              key={dt.name}
              label={dt.label}
              maxLength={dt.maxLength}
              onKeyDown={dt.onKeyDown}
              type={getInputType(dt.isPassword ?? false, dt.type)}
              {...register(dt.name)}
            />
          ))}

          <span className="text-center text-xs text-red-600">{errorMessage}</span>

          <SubmitButton color="black" disabled={loading} label="REGISTER" size="sm" variant="solid" />

          <div className="mx-auto text-center">
            <span className="text-xs">Already have an account? </span>
            <Link
              className={ExampleATWM({
                className: "inline text-xs",
                color: "blue",
                disabled: loading,
                size: "sm",
                variant: "ghost",
              })}
              href={"/authentication/login"}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                } else {
                  setPasswordVisibility(false);
                  setErrorMessage("");
                  reset();
                }
              }}
            >
              Login!
            </Link>
          </div>
        </form>
      </FormContainer>
    </main>
  );
};
