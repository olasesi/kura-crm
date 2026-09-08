import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center">
    <div className="space-y-4">
      <h1 className="text-6xl font-extrabold text-slate-100">404</h1>
      <p className="text-slate-400">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-flex h-11 items-center rounded-lg bg-sky-500 px-6 font-semibold text-white transition-colors hover:bg-sky-400"
      >
        Back home
      </Link>
    </div>
  </main>
);

export default NotFoundPage;
