import { User } from "lucide-react";
import Link from "next/link";
import { FC, ReactElement } from "react";

import { ChangeThemeButton, Container, ExampleATWM, Header, LogoutButton } from "@/src/components";
import { getCookie, getSession } from "@/src/utils";

export const Main: FC = async (): Promise<ReactElement> => {
  const session = await getSession("status");
  const themeCookie = await getCookie("theme");

  return (
    <main>
      <Container className={{ innerContainer: "max-w-100 items-center gap-3" }} href="" label="">
        <Header
          className={{ description: "text-center", label: "text-center" }}
          description="This is the home page of the application"
          label="Home Page"
        />

        <nav className={`w-full ${session ? "space-y-3" : "flex gap-3"}`}>
          {session ? (
            <div className="flex flex-wrap justify-center gap-3">
              <ChangeThemeButton className="min-w-16" color="blue" cookie={themeCookie?.value ?? ""} size="sm" variant="outline" />

              <Link className={ExampleATWM({ className: "min-w-16", color: "black", size: "sm", variant: "solid" })} href={"/profile"}>
                <User size={17} />
              </Link>

              <LogoutButton className="min-w-16" color="gray" size="sm" variant="solid" />
            </div>
          ) : (
            <ChangeThemeButton className="min-w-10" color="blue" cookie={themeCookie?.value ?? ""} size="sm" variant="outline" />
          )}

          {session ? (
            <div className="flex flex-wrap gap-3">
              <Link className={ExampleATWM({ className: "grow", color: "black", size: "sm", variant: "solid" })} href={"/user-example"}>
                USER
              </Link>

              <Link className={ExampleATWM({ className: "grow", color: "gray", size: "sm", variant: "solid" })} href={"/admin-example"}>
                ADMIN
              </Link>

              <Link className={ExampleATWM({ className: "grow", color: "blue", size: "sm", variant: "solid" })} href={"/audit"}>
                AUDIT
              </Link>
            </div>
          ) : (
            <Link className={ExampleATWM({ className: "w-full", color: "black", size: "sm", variant: "solid" })} href={"/authentication/login"}>
              LOGIN
            </Link>
          )}
        </nav>
      </Container>
    </main>
  );
};
