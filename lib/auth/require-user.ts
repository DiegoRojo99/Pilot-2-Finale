import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export type AuthenticatedUser = {
  userId: string;
};

export async function requireAuthenticatedUser(): Promise<
  { context: AuthenticatedUser } | { response: NextResponse }
> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { context: { userId } };
}
