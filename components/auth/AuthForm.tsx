"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type AuthFormProps = {
  mode: "login" | "register";
};

function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      status?: unknown;
      cause?: { message?: unknown };
    };

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }

    if (typeof maybeError.cause?.message === "string" && maybeError.cause.message.trim()) {
      return maybeError.cause.message;
    }

    if (typeof maybeError.status === "number") {
      return `Request failed with status ${maybeError.status}.`;
    }
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function getSafeRedirectTarget(input: string | null): string {
  if (!input || !input.startsWith("/")) {
    return "/watching";
  }

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
        } catch (signUpError) {
          setError(getAuthErrorMessage(signUpError, "Could not create your account."));
          return;
        }
      }

      let signInResult: Awaited<ReturnType<typeof authClient.signIn.email>>;

      try {
        signInResult = await authClient.signIn.email({ email, password });
      } catch (signInError) {
        setError(getAuthErrorMessage(signInError, "Invalid email or password."));
        return;
      }

      if (signInResult.error) {
        setError(signInResult.error.message ?? "Invalid email or password.");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />

      <div className="mx-auto flex min-h-full w-full max-w-lg items-center px-6 py-10">
        <section className="w-full rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Pilot 2 Finale</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{copy.title}</h1>
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
        </section>
      </div>
    </main>
  );
}