import { Metadata } from "next";
import { FC, ReactElement } from "react";

import ProfileLayout from "./_layout";

export const metadata: Metadata = {
  title: "Profile",
};

const ProfilePage: FC = (): ReactElement => <ProfileLayout />;

export default ProfilePage;
