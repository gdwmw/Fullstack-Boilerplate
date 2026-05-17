"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IErrorResponse } from "@repo/types";
import { logTemplate } from "@repo/utils";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { signOut } from "next-auth/react";
import { FC, HTMLInputTypeAttribute, ReactElement, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { Container, ExampleInput, SubmitButton } from "@/src/components";
import { POSTChangePassword, POSTLogout } from "@/src/utils";

import { changePasswordSchema, TChangePasswordSchema } from "../schema";

interface IFormField {
  label: string;
  maxLength?: number;
  name: keyof TChangePasswordSchema;
  type: HTMLInputTypeAttribute;
}

const FORM_FIELDS_DATA: IFormField[] = [
  {
    label: "Current Password",
    name: "oldPassword",
    type: "password",
  },
  {
    label: "New Password",
    maxLength: 72,
    name: "newPassword",
    type: "password",
  },
  {
    label: "Confirm Password",
    name: "confirmPassword",
    type: "password",
  },
];

export const Main: FC = (): ReactElement => {
  const [passwordVisibility, setPasswordVisibility] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
  } = useForm<TChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (dt: TChangePasswordSchema) => {
      const { confirmPassword: _confirmPassword, ...changePasswordPayload } = dt;
      await POSTChangePassword(changePasswordPayload);
      await POSTLogout();
      signOut();
      return true;
    },
    onError: (error) => {
      const axiosError = error as AxiosError<IErrorResponse>;
      setErrorMessage(axiosError.response?.data?.message ?? "failed to change password");
      logTemplate.WARN("change password failed!", "auth/change-password");
    },
    onSuccess: () => {
      logTemplate.SUCCESS("change password success!", "auth/change-password");
      reset();
    },
  });

  const onSubmit: SubmitHandler<TChangePasswordSchema> = (dt) => {
    setErrorMessage("");

    if (getValues("newPassword") !== getValues("confirmPassword")) {
      setErrorMessage("confirm password does not match new password");
      return;
    }

    changePasswordMutation.mutate(dt);
  };

  return (
    <main>
      <Container className={{ innerContainer: "max-w-87.5" }} href={"/profile"} label={"Back"}>
        <form className="flex w-full flex-col gap-3 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          {FORM_FIELDS_DATA.map((dt) => (
            <ExampleInput
              color="default"
              disabled={changePasswordMutation.isPending}
              errorMessage={errors[dt.name]?.message}
              icon={passwordVisibility ? <Eye size={18} /> : <EyeOff size={18} />}
              iconOnClick={() => setPasswordVisibility((prev) => !prev)}
              key={dt.name}
              label={dt.label}
              maxLength={dt.maxLength}
              type={passwordVisibility ? "text" : "password"}
              {...register(dt.name)}
            />
          ))}

          <span className="text-center text-xs text-red-600">{errorMessage}</span>

          <SubmitButton color="black" disabled={changePasswordMutation.isPending} label="UPDATE" size="sm" variant="solid" />
        </form>
      </Container>
    </main>
  );
};
