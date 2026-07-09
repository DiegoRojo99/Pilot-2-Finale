"use client";

import "@/lib/auth/random-uuid-polyfill";
import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
