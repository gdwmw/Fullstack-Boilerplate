import { Metadata } from "next";
import { FC, ReactElement } from "react";

import AuditLayout from "./_layout";

export const metadata: Metadata = {
  title: "Audit Logs",
};

const AuditPage: FC = (): ReactElement => <AuditLayout />;

export default AuditPage;
