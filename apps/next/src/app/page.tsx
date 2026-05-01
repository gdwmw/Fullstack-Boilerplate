import { Metadata, Viewport } from "next";
import { FC, ReactElement } from "react";

import { DEFAULT_ROBOTS, DEFAULT_VIEWPORT, SITE_CREATOR, SITE_DESCRIPTION, SITE_IMAGE, SITE_NAME, SITE_URL } from "@/src/constants";

import { Main } from "./_layout/modules/main/index-example";

export const viewport: Viewport = DEFAULT_VIEWPORT;

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  keywords: ["Boilerplate"],
  openGraph: {
    description: SITE_DESCRIPTION,
    images: [{ alt: SITE_NAME, height: 800, url: SITE_IMAGE, width: 800 }],
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Home`,
    type: "website",
    url: SITE_URL,
  },
  robots: DEFAULT_ROBOTS,
  twitter: {
    card: "summary_large_image",
    creator: SITE_CREATOR,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE],
    title: `${SITE_NAME} | Home`,
  },
};

const HomePage: FC = (): ReactElement => <Main />;

export default HomePage;
