import { auth } from "@/lib/auth/server";
export const proxy = auth.middleware({ loginUrl: "/auth/login" });
export const config = {
  matcher: ["/watching", "/history", "/stats", "/profile"],
};
