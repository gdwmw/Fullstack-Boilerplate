"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { templateLog } from "@repo/utils";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, HTMLInputTypeAttribute, KeyboardEvent, ReactElement, useEffect, useState, useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { Avatar, ExampleATWM, ExampleInput, FormContainer, SubmitButton } from "@/src/components";
import { DELETEUpload, IErrorResponse, IMeResponse, inputValidations, POSTUpload, PUTUsers } from "@/src/utils";

import { ProfileSchema, TProfileSchema } from "./schema";

const API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;

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

interface I {
  user: IMeResponse | null;
}

export const Main: FC<I> = (props): ReactElement => {
  const session = useSession();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [previewImage, setPreviewImage] = useState<null | string>(null);
  const [loading, setTransition] = useTransition();

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<TProfileSchema>({
    defaultValues: {
      email: props.user?.email,
      name: props.user?.name,
      phone: props.user?.phone,
      username: props.user?.username,
    },
    resolver: zodResolver(ProfileSchema),
  });

  useEffect(() => {
    // eslint-disable-next-line
    const file = watch("image")?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    //eslint-disable-next-line
  }, [watch("image")]);

  const onSubmit: SubmitHandler<TProfileSchema> = (dt) => {
    setTransition(async () => {
      try {
        let imageId: null | number | undefined = props.user?.imageId;

        if (dt.image && dt.image.length > 0) {
          if (props.user?.imageId) {
            await DELETEUpload(props.user.imageId);
          }

          const uploadResponse = await POSTUpload({
            file: dt.image[0],
          });

          imageId = uploadResponse.data.id;
        }

        const userResponse = await PUTUsers(props.user?.id ?? 0, {
          email: dt.email,
          imageId: imageId,
          name: dt.name,
          phone: dt.phone,
          username: dt.username,
        });

        await session.update({
          user: {
            ...session.data?.user,
            email: userResponse.data.email,
            image: userResponse.data.image,
            imageId: userResponse.data.imageId,
            name: userResponse.data.name,
            phone: userResponse.data.phone,
            username: userResponse.data.username,
          },
        });

        templateLog.SUCCESS("Profile success!", "auth/profile");
        router.refresh();
      } catch (error) {
        const axiosError = error as AxiosError<IErrorResponse>;
        setErrorMessage(axiosError.response?.data?.message ?? "Failed to update profile");
        templateLog.WARN("Profile failed!", "auth/profile");
      }
    });
  };

  return (
    <main>
      <FormContainer className={{ innerContainer: "max-w-112.5" }} href={"/"} label={"Home"}>
        <form className="flex w-full flex-col gap-3 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          <Avatar
            className="mx-auto min-h-32 min-w-32"
            iconSize={64}
            placeholder={previewImage ? null : props.user?.image?.placeholder}
            src={previewImage ? previewImage : props.user?.image ? `${API_URL}${props.user?.image?.formats?.thumbnail?.url}` : ""}
          />

          {FORM_FIELDS_DATA.map((dt, i) => (
            <ExampleInput
              color="default"
              disabled={loading}
              errorMessage={errors[dt.name]?.message as string | undefined}
              key={i}
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
              className={ExampleATWM({ className: "inline text-xs", color: "blue", disabled: loading, size: "sm", variant: "ghost" })}
              href={"/password/change"}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                }
              }}
            >
              Click Here!
            </Link>
          </div>

          <SubmitButton color="black" disabled={loading} label="UPDATE" size="sm" variant="solid" />
        </form>
      </FormContainer>
    </main>
  );
};
