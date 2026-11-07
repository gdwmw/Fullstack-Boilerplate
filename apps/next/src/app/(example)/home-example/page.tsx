import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { HomeModules } from "./_modules";

export const metadata: Metadata = {
  title: "Home (Example)",
};

const HomePage: FC = (): ReactElement => <HomeModules />;

export default HomePage;
