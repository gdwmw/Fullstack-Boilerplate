import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { DEFAULT_ROBOTS, SITE_CREATOR, SITE_DESCRIPTION, SITE_IMAGE, SITE_NAME, SITE_URL } from "@/src/constants/metadata";

import { HomeModules } from "./(example)/home-example/_modules";

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

const HomePage: FC = (): ReactElement => <HomeModules />;

export default HomePage;
