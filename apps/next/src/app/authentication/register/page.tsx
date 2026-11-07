import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { RegisterModules } from "./_src/modules";

export const metadata: Metadata = {
  title: "Register",
};

const RegisterPage: FC = (): ReactElement => <RegisterModules />;

export default RegisterPage;
