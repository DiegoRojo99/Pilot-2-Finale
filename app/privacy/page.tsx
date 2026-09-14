import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Pilot 2 Finale",
  description: "Privacy policy for Pilot 2 Finale.",
};

const lastUpdated = "September 14, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-full overflow-y-auto bg-slate-950 px-5 py-8 text-slate-100">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-blue-300">Pilot 2 Finale</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Last updated: {lastUpdated}</p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Overview</h2>
          <p className="leading-7 text-slate-300">
            Pilot 2 Finale helps you track TV shows, episodes, ratings, notes, and viewing progress.
            This policy explains what information the app collects, how it is used, and the choices
            you have when using the web and mobile versions of Pilot 2 Finale.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Information We Collect</h2>
          <p className="leading-7 text-slate-300">We may collect the following information:</p>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-slate-300">
            <li>Account information used to create and authenticate your account.</li>
            <li>Your saved shows, show statuses, episode watch history, ratings, and notes.</li>
            <li>Basic technical information needed to operate the service, such as request logs.</li>
            <li>Usage analytics for understanding app performance and product usage.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">How We Use Information</h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-slate-300">
            <li>To provide your personal show library, episode tracking, history, stats, and achievements.</li>
            <li>To authenticate your account and keep your data scoped to your user account.</li>
            <li>To maintain, debug, protect, and improve the app.</li>
            <li>To understand aggregate product usage and app reliability.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Third-Party Services</h2>
          <p className="leading-7 text-slate-300">
            Pilot 2 Finale uses third-party services to operate the app. These may include hosting,
            database, authentication, analytics, and TV metadata providers. TV show information,
            posters, and catalog metadata may come from TMDB-powered services. These providers may
            process information according to their own privacy policies.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Data Sharing</h2>
          <p className="leading-7 text-slate-300">
            We do not sell your personal information. We may share information only when needed to
            operate the app, comply with legal obligations, protect the service, or work with service
            providers that help run Pilot 2 Finale.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Data Retention</h2>
          <p className="leading-7 text-slate-300">
            We keep your account and tracking data for as long as your account is active or as needed
            to provide the service. You may request deletion of your account or personal tracking data
            by contacting us.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Children's Privacy</h2>
          <p className="leading-7 text-slate-300">
            Pilot 2 Finale is not intended for children under 13. We do not knowingly collect personal
            information from children under 13.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Your Choices</h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-slate-300">
            <li>You can update or remove shows and episode logs in the app.</li>
            <li>You can sign out of your account from the app.</li>
            <li>You can request access, correction, or deletion of your personal data.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p className="leading-7 text-slate-300">
            For privacy questions or data requests, contact the Pilot 2 Finale team at
            <a className="ml-1 text-blue-300 underline underline-offset-4" href="mailto:privacy@pilot2finale.com">
              privacy@pilot2finale.com
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}