import { FC, ReactElement } from "react";

import { Aside } from "./aside";
import { Footer } from "./footer";
import { Header } from "./header";
import { Main } from "./main";
import { Nav } from "./nav";

export const ExampleModules: FC = (): ReactElement => (
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
