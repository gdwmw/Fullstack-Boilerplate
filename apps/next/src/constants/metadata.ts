export const SITE_URL = "https://boilerplate.zettara.com";
export const SITE_NAME = "Next.js";
export const SITE_DESCRIPTION = "Boilerplate by Gede Dewo Wahyu M.W";
export const SITE_IMAGE = `${SITE_URL}/assets/images/logos/Vercel.png`;
export const SITE_CREATOR = "@gdwmw";

export const DEFAULT_ROBOTS = {
  follow: true,
  googleBot: {
    follow: true,
    index: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    noimageindex: false,
  },
  index: true,
  nocache: false,
} as const;
