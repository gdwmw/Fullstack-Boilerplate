import { decryptToken } from "@repo/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { options } from "@/configs/authentication";
import { serverEnv } from "@/src/environments/env.server";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const session = await getServerSession(options);

  if (!session) {
    return NextResponse.json({ code: null, message: "unauthorized", success: false }, { status: 401 });
  }

  const body = (await request.json()) as { refreshToken?: unknown };
  const encrypted = body?.refreshToken;

  if (!encrypted || typeof encrypted !== "string") {
    return NextResponse.json({ code: null, message: "refresh token is required", success: false }, { status: 400 });
  }

  try {
    const plaintext = await decryptToken(encrypted, serverEnv.REFRESH_TOKEN_COOKIE_SECRET);
    return NextResponse.json({ data: { refreshToken: plaintext }, message: "refresh token decrypted", success: true });
  } catch {
    return NextResponse.json({ code: null, message: "invalid refresh token", success: false }, { status: 401 });
  }
};
