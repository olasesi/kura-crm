import { Link } from "react-router-dom";

import { env } from "@/config/env";

export const HomePage = () => (
  <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center">
    <div className="max-w-2xl space-y-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-sky-400">{env.appName}</p>
      <h1 className="text-4xl font-extrabold text-slate-100 sm:text-5xl">
        Enterprise customer relationships, under control.
      </h1>
      <p className="text-lg text-slate-400">
        A production-grade React frontend with testing, observability, security, and CI/CD — wired
        to the Kura CRM API.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to="/login"
          className="inline-flex h-11 items-center rounded-lg bg-sky-500 px-6 font-semibold text-white transition-colors hover:bg-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Sign in
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex h-11 items-center rounded-lg bg-slate-800 px-6 font-semibold text-slate-100 transition-colors hover:bg-slate-700"
        >
          Dashboard
        </Link>
      </div>
    </div>
  </main>
);

export default HomePage;
