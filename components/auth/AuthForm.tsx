"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type AuthFormProps = { mode: "login" | "register" };
const isString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      status?: unknown;
      cause?: { message?: unknown };
    };

    const message = isString(maybeError.message) ? maybeError.message : isString(maybeError.cause?.message) ? maybeError.cause.message : null;
    if (isString(message)) return message;
    if (typeof maybeError.status === "number") return `Request failed with status ${maybeError.status}.`;
  }

  if (isString(error)) return error;
  return fallback;
}

function getSafeRedirectTarget(input: string | null): string {
  if (!input || !input.startsWith("/")) return "/watching";
  return input;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionQuery = authClient.useSession();

  const copy = useMemo(
    () =>
      mode === "login"
        ? {
            title: "Welcome back",
            subtitle: "Sign in to continue your watch journey.",
            submitLabel: "Sign in",
            switchLabel: "Need an account?",
            switchHref: "/auth/register",
            switchAction: "Create one",
          }
        : {
            title: "Create your account",
            subtitle: "Start tracking every episode from pilot to finale.",
            submitLabel: "Create account",
            switchLabel: "Already have an account?",
            switchHref: "/auth/login",
            switchAction: "Sign in",
          },
    [mode],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const redirectTo =
      typeof window === "undefined"
        ? "/watching"
        : getSafeRedirectTarget(new URLSearchParams(window.location.search).get("next"));

    try {
      if (mode === "register") {
        try {
          const signUpResult = await authClient.signUp.email({
            email,
            password,
            name: name.trim() || email,
          });

          if (signUpResult.error) {
            setError(signUpResult.error.message ?? "Could not create your account.");
            return;
          }
        } 
        catch (signUpError) {
          setError(getAuthErrorMessage(signUpError, "Could not create your account."));
          return;
        }
      }

      let signInResult: Awaited<ReturnType<typeof authClient.signIn.email>>;

      try { signInResult = await authClient.signIn.email({ email, password }); } 
      catch (signInError) {
        setError(getAuthErrorMessage(signInError, "Invalid email or password."));
        return;
      }

      if (signInResult.error) {
        setError(signInResult.error.message ?? "Invalid email or password.");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } 
    finally { setIsSubmitting(false); }
  }

  return (
    <main className="fixed inset-0 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl items-center px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
        <section className="w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/85 shadow-2xl backdrop-blur md:grid md:grid-cols-[1.1fr_1fr]">
          <aside className="hidden border-r border-white/10 bg-slate-900/80 p-8 md:flex md:flex-col md:justify-between">
            <div>
              <img src="/Logo.png" alt="Pilot 2 Finale" className="h-10 w-auto" />
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">Track from first episode to last credit.</h2>
              <p className="mt-4 text-sm text-slate-300">
                Keep your watch progress synced, organized, and ready across devices.
              </p>
            </div>

            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <p>Search TMDB and add shows instantly.</p>
              <p>Organize with flexible status labels.</p>
              <p>Log episodes and keep momentum visible.</p>
            </div>
          </aside>

          <div className="p-5 sm:p-7 md:p-8">
            <img src="/Logo.png" alt="Pilot 2 Finale" className="h-8 w-auto md:hidden" />
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{copy.title}</h1>
            <p className="mt-2 text-sm text-slate-300">{copy.subtitle}</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {mode === "register" ? (
                <label className="block text-sm">
                  <span className="mb-1.5 block text-slate-300">Name</span>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none transition focus:border-cyan-400"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </label>
              ) : null}

              <label className="block text-sm">
                <span className="mb-1.5 block text-slate-300">Email</span>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none transition focus:border-cyan-400"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-slate-300">Password</span>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none transition focus:border-cyan-400"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting || sessionQuery.isPending}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Please wait..." : copy.submitLabel}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-300">
              {copy.switchLabel}{" "}
              <Link href={copy.switchHref} className="font-medium text-cyan-300 hover:text-cyan-200">
                {copy.switchAction}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}