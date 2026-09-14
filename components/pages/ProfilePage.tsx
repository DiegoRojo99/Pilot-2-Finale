"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { PageShell } from "@/components/layout/PageShell";

const confirmationText = "DELETE";

type AccountDeletionResponse = {
  success: boolean;
  deletionRequestId: number;
  deleted: {
    watchEntries: number;
    userShows: number;
    achievementProgress: number;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const sessionQuery = authClient.useSession();
  const [confirmation, setConfirmation] = useState("");
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = sessionQuery.data?.user;
  const canDelete = confirmation.trim().toUpperCase() === confirmationText;

  async function signOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      await authClient.signOut();
      router.replace("/auth/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  async function requestAccountDeletion() {
    if (!canDelete) return;

    setIsRequestingDeletion(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as AccountDeletionResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(data && "error" in data ? data.error : "Could not request account deletion.");
      }

      setMessage("Your account deletion request was submitted and your tracking data was deleted. Signing you out now.");
      setConfirmation("");
      await signOut();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not request account deletion.");
    } finally {
      setIsRequestingDeletion(false);
    }
  }

  return (
    <PageShell title="Profile">
      <div className="flex flex-col gap-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="mt-1 break-all text-base font-semibold text-slate-100">
            {user?.email ?? user?.id ?? "Current user"}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={isSigningOut || isRequestingDeletion}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </section>

        <section className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-rose-100">Request account deletion</h2>
              <p className="text-sm leading-6 text-rose-100/80">
                This submits a request to delete your Pilot 2 Finale account and permanently deletes
                your saved shows, episode logs, ratings, notes, stats, and achievement progress. The
                remaining account record is processed after verification.
              </p>
            </div>
          </div>

          <label className="mt-4 block text-sm text-rose-100/80">
            Type DELETE to confirm
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-xl border border-rose-500/30 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-rose-300"
              autoComplete="off"
            />
          </label>

          <button
            type="button"
            onClick={() => void requestAccountDeletion()}
            disabled={!canDelete || isRequestingDeletion || isSigningOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isRequestingDeletion ? "Submitting request..." : "Request account deletion"}
          </button>
        </section>

        {message ? <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
      </div>
    </PageShell>
  );
}