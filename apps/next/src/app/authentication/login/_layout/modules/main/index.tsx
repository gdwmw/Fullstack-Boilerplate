"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { templateLog } from "@repo/utils";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeftRight, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, ReactElement, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { ExampleATWM, ExampleInput, FormContainer, SubmitButton } from "@/src/components";
import { IErrorResponse, POSTLogin } from "@/src/utils";

import { loginSchema, TLoginSchema } from "../schema";

export const Main: FC = (): ReactElement => {
  const router = useRouter();
  const [loginWithEmail, setLoginWithEmail] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema(loginWithEmail)),
  });

  const loginMutation = useMutation({
    mutationFn: async (dt: TLoginSchema) => {
      const method = loginWithEmail ? "email" : "username";
      await POSTLogin({ identifier: dt.identifier, method, password: dt.password });

      const res = await signIn("credentials", {
        identifier: dt.identifier,
        method,
        password: dt.password,
        redirect: false,
      });

      if (!res?.ok) {
        throw new Error("authentication failed. please try again.");
      }

      return true;
    },
    onError: (error) => {
      const axiosError = error as AxiosError<IErrorResponse>;
      setErrorMessage(axiosError.response?.data?.message ?? "login failed. please try again.");
      templateLog.WARN("login failed!", "auth/login");
    },
    onMutate: () => {
      setLoading(true);
    },
    onSettled: () => {
      setLoading(false);
    },
    onSuccess: () => {
      templateLog.SUCCESS("login success!", "auth/login");
      router.push("/");
      router.refresh();
      reset();
    },
  });

  const onSubmit: SubmitHandler<TLoginSchema> = (dt) => {
    setErrorMessage("");
    loginMutation.mutate(dt);
  };

  return (
    <main>
      <FormContainer className={{ innerContainer: "max-w-75" }} href={"/"} label={"Home"}>
        <form className="flex w-full flex-col gap-3 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          <ExampleInput
            color="default"
            disabled={loading}
            errorMessage={errors.identifier?.message}
            icon={<ArrowLeftRight size={18} />}
            iconOnClick={() => {
              setPasswordVisibility(false);
              setErrorMessage("");
              setLoginWithEmail((prev) => !prev);
              reset();
            }}
            label={loginWithEmail ? "Email" : "Username"}
            type="text"
            {...register("identifier")}
          />

          <ExampleInput
            color="default"
            disabled={loading}
            errorMessage={errors.password?.message}
            icon={passwordVisibility ? <Eye size={18} /> : <EyeOff size={18} />}
            iconOnClick={() => setPasswordVisibility((prev) => !prev)}
            label="Password"
            type={passwordVisibility ? "text" : "password"}
            {...register("password")}
          />

          <span className="text-center text-xs text-red-600">{errorMessage}</span>

          <SubmitButton color="black" disabled={loading} label="LOGIN" size="sm" variant="solid" />

          <div className="mx-auto text-center">
            <span className="text-xs">Don&apos;t have an account yet? </span>
            <Link
              className={ExampleATWM({
                className: "inline text-xs",
                color: "blue",
                disabled: loading,
                size: "sm",
                variant: "ghost",
              })}
              href={"/authentication/register"}
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
              Register!
            </Link>
          </div>
        </form>
      </FormContainer>
    </main>
  );
};
