import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Deletion | Pilot 2 Finale",
  description: "How to request deletion of your Pilot 2 Finale account and personal data.",
};

export default function AccountDeletionPage() {
  return (
    <main className="min-h-full overflow-y-auto bg-slate-950 px-5 py-8 text-slate-100">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-blue-300">Pilot 2 Finale</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Account Deletion</h1>
          <p className="leading-7 text-slate-300">
            You can request deletion of your Pilot 2 Finale account and associated personal tracking
            data at any time.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">How To Request Account Deletion</h2>
          <ol className="list-decimal space-y-2 pl-5 leading-7 text-slate-300">
            <li>Sign in to Pilot 2 Finale.</li>
            <li>Open the Profile tab.</li>
            <li>Review the deletion disclaimer.</li>
            <li>Type DELETE in the confirmation field.</li>
            <li>Press Request account deletion.</li>
          </ol>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Data Deleted</h2>
          <p className="leading-7 text-slate-300">
            When you submit the request, Pilot 2 Finale immediately deletes app-owned tracking data
            associated with your account, including saved shows, show statuses, episode logs,
            ratings, notes, stats, and achievement progress. The remaining authentication account
            record is reviewed and deleted or anonymized after verification.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Data That May Be Retained</h2>
          <p className="leading-7 text-slate-300">
            Limited records may be retained when required for security, fraud prevention, legal
            compliance, or backup integrity. Backup copies may remain for up to 30 days. A deletion
            request record may be retained for up to 1 year to document that the request was received
            and processed.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Processing Time</h2>
          <p className="leading-7 text-slate-300">
            We aim to process the remaining account deletion steps within 30 days after receiving the
            request. If additional verification is needed, processing may pause until ownership of the
            account can be confirmed.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
          <p className="leading-7 text-slate-300">
            For more information about how Pilot 2 Finale handles data, read the
            <a className="ml-1 text-blue-300 underline underline-offset-4" href="/privacy">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}