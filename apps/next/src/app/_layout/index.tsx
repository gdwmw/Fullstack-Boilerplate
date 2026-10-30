import { FC, ReactElement } from "react";

import { Aside } from "./modules/aside";
import { Footer } from "./modules/footer";
import { Header } from "./modules/header";
import { Main } from "./modules/main";
import { Nav } from "./modules/nav";

const HomeLayout: FC = (): ReactElement => (
  <>
    <Header>
      <Nav />
    </Header>
    <Main>
      <Aside />
    </Main>
    <Footer />
  </>
);

export default HomeLayout;
