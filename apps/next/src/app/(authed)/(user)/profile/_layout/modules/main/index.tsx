"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IErrorResponse } from "@repo/types";
import { logTemplate } from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, HTMLInputTypeAttribute, KeyboardEvent, ReactElement, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";

import { ExampleATWM } from "@/src/components/elements/example/A/ExampleA";
import { ExampleInput } from "@/src/components/elements/example/C/ExampleInput";
import { Avatar } from "@/src/components/templates/Avatar";
import { Container } from "@/src/components/templates/Container";
import { SubmitButton } from "@/src/components/templates/SubmitButton";
import { clientEnv } from "@/src/environments/env.client";
import { GETMe } from "@/src/utils/api/authentication/me";
import { DELETEUpload, POSTUpload } from "@/src/utils/api/upload";
import { PUTUsers } from "@/src/utils/api/users";
import { inputValidations } from "@/src/utils/validations";

import { profileSchema, TProfileSchema } from "../schema";

const API_URL = clientEnv.NEXT_PUBLIC_BASE_API_URL;

interface IFormField {
  label: string;
  maxLength?: number;
  name: keyof TProfileSchema;
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
    label: "Image",
    name: "image",
    type: "file",
  },
];

export const Main: FC = (): ReactElement => {
  const session = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [previewImage, setPreviewImage] = useState<null | string>(null);

  const meQuery = useQuery({
    queryFn: async () => {
      const res = await GETMe();
      return res.data;
    },
    queryKey: ["me"],
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TProfileSchema>({
    defaultValues: {
      email: meQuery.data?.email,
      name: meQuery.data?.name,
      phone: meQuery.data?.phone,
      username: meQuery.data?.username,
    },
    resolver: zodResolver(profileSchema),
  });

  const watch = useWatch({ control });

  useEffect(() => {
    if (meQuery.data) {
      reset({
        email: meQuery.data.email,
        name: meQuery.data.name,
        phone: meQuery.data.phone,
        username: meQuery.data.username,
      });
    }
  }, [meQuery.data, reset]);

  useEffect(() => {
    const file = watch?.image?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [watch?.image]);

  const updateProfileMutation = useMutation({
    mutationFn: async (dt: TProfileSchema) => {
      const currentUser = meQuery.data;
      if (!currentUser) {
        throw new Error("failed to load current user");
      }

      if (!currentUser.id) {
        throw new Error("failed to load current user id");
      }

      let imageId: null | string | undefined = currentUser.imageId;

      if (dt.image && dt.image.length > 0) {
        if (currentUser.imageId) {
          await DELETEUpload(currentUser.imageId);
        }

        const uploadResponse = await POSTUpload({
          file: dt.image[0],
        });

        if (!uploadResponse.data) {
          logTemplate.WARN("upload image failed!", "upload");
          throw new Error("failed to upload image");
        }

        imageId = uploadResponse.data.id;
      }

      const userResponse = await PUTUsers(currentUser.id, {
        email: dt.email,
        imageId: imageId,
        name: dt.name,
        phone: dt.phone,
        username: dt.username,
      });

      if (!userResponse.data) {
        throw new Error("failed to update profile");
      }

      return userResponse.data;
    },
    onError: (error) => {
      const axiosError = error as AxiosError<IErrorResponse>;
      setErrorMessage(axiosError.response?.data?.message ?? "failed to update profile");
      logTemplate.WARN("update profile failed!", "auth/profile");
    },
    onSuccess: async (res) => {
      await session.update({
        user: {
          ...session.data?.user,
          email: res.email,
          image: res.image,
          imageId: res.imageId,
          name: res.name,
          phone: res.phone,
          username: res.username,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["me"] });
      logTemplate.SUCCESS("update profile success!", "auth/profile");
      router.refresh();
    },
  });

  const onSubmit: SubmitHandler<TProfileSchema> = (dt) => {
    setErrorMessage("");
    updateProfileMutation.mutate(dt);
  };

  return (
    <main>
      <Container className={{ innerContainer: "max-w-112.5" }} href={"/"} label={"Home"}>
        <form className="flex w-full flex-col gap-3 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          <Avatar
            className="mx-auto min-h-32 min-w-32"
            iconSize={64}
            placeholder={previewImage ? null : meQuery.data?.image?.placeholder}
            src={previewImage || (meQuery.data?.image ? `${API_URL}${meQuery.data?.image?.formats?.thumbnail?.url}` : "")}
          />

          {FORM_FIELDS_DATA.map((dt) => (
            <ExampleInput
              color="default"
              disabled={updateProfileMutation.isPending}
              errorMessage={errors[dt.name]?.message as string | undefined}
              key={dt.name}
              label={dt.label}
              maxLength={dt.maxLength}
              onKeyDown={dt.onKeyDown}
              type={dt.type}
              {...register(dt.name)}
            />
          ))}

          <span className="text-center text-xs text-red-600">{errorMessage}</span>

          <div className="mx-auto text-center">
            <span className="text-xs">Do you want to change your password? </span>
            <Link
              className={ExampleATWM({
                className: "inline text-xs",
                color: "blue",
                disabled: updateProfileMutation.isPending,
                size: "sm",
                variant: "ghost",
              })}
              href={"/password/change"}
              onClick={(e) => {
                if (updateProfileMutation.isPending) {
                  e.preventDefault();
                }
              }}
            >
              Click Here!
            </Link>
          </div>

          <SubmitButton color="black" disabled={updateProfileMutation.isPending} label="UPDATE" size="sm" variant="solid" />
        </form>
      </Container>
    </main>
  );
};
