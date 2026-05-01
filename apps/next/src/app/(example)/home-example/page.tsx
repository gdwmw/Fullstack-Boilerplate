import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { Main } from "../../_layout/modules/main/index-example";

export const metadata: Metadata = {
  title: "Home (Example)",
};

const HomePage: FC = (): ReactElement => <Main />;

export default HomePage;
