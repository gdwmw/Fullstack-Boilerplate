import { Metadata } from "next";
import { FC, ReactElement } from "react";

import { ProfileModules } from "./_src/modules";

export const metadata: Metadata = {
  title: "Profile",
};

const ProfilePage: FC = (): ReactElement => <ProfileModules />;

export default ProfilePage;
