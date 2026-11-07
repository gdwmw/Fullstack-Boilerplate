import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { Container } from "@/src/components/templates/Container";
import { Header } from "@/src/components/templates/Header";
import { getAllSession } from "@/src/utils/server/session";

export const metadata: Metadata = {
  title: "Admin (Example)",
};

const AdminPage: FC = async (): Promise<ReactElement> => {
  const session = await getAllSession();

  return (
    <main>
      <Container className={{ innerContainer: "h-159.75 w-full max-w-108.75 items-center gap-3" }} href="/" label="Home">
        <Header
          className={{ description: "text-center", label: "text-center" }}
          description="This is the admin page of the application"
          label="Admin Page"
        />
        <div className="w-full flex-1 overflow-hidden rounded-lg border border-blue-500">
          <pre className="size-full flex-1 overflow-auto rounded-md border border-black/10 bg-black/5 p-3 font-mono text-xs leading-relaxed text-black/90 dark:border-white/10 dark:bg-white/5 dark:text-white/90">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </Container>
    </main>
  );
};

export default AdminPage;
