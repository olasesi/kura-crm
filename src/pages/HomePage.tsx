import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { env } from "@/config/env";

const FEATURES = [
  {
    icon: "dashboard" as const,
    title: "Role-aware dashboards",
    text: "Every role gets a tailored workspace with draggable widgets, saved layouts and three dashboard designs.",
  },
  {
    icon: "users" as const,
    title: "One customer record",
    text: "Leads, contacts, deals and support tickets share a single customer view across every team.",
  },
  {
    icon: "bank" as const,
    title: "Finance in real time",
    text: "Invoices, payments, expenses and payroll reconcile continuously against live workspace data.",
  },
  {
    icon: "employee" as const,
    title: "People operations",
    text: "Recruitment, onboarding, attendance and performance live beside the work they support.",
  },
  {
    icon: "report" as const,
    title: "Reports without spreadsheets",
    text: "Operational reports are generated from the same records the team edits, with CSV export and print.",
  },
  {
    icon: "shield" as const,
    title: "Enterprise foundations",
    text: "Role-based access, audit logging, observability and a swappable data layer built in.",
  },
];

const STATS = [
  { value: "98", label: "Business modules" },
  { value: "7", label: "Role dashboards" },
  { value: "4", label: "Languages" },
  { value: "100%", label: "Type-safe frontend" },
];

export const HomePage = () => (
  <main className="landing">
    <header className="landing__nav">
      <Link to="/" className="landing__brand">
        <span className="landing__brand-mark">K</span>
        <span>{env.appName}</span>
      </Link>
      <span className="landing__nav-tag">Commercial CRM platform</span>
    </header>

    <section className="landing__hero">
      <p className="landing__eyebrow">{env.appName}</p>
      <h1 className="landing__title">Enterprise customer relationships, under control.</h1>
      <p className="landing__text">
        Kura CRM brings sales, finance, people and operations into one workspace — with role-based
        dashboards, live reporting and a data layer you can swap without touching the UI.
      </p>
      <div className="landing__actions">
        <Link to="/login" className="btn btn--lg">
          Sign in
        </Link>
        <Link to="/dashboard" className="btn btn--secondary btn--lg">
          Dashboard
        </Link>
      </div>

      <dl className="landing__stats">
        {STATS.map((stat) => (
          <div key={stat.label} className="landing__stat">
            <dt className="landing__stat-label">{stat.label}</dt>
            <dd className="landing__stat-value">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>

    <section className="landing__features" aria-label="Platform capabilities">
      {FEATURES.map((feature) => (
        <article key={feature.title} className="landing__feature">
          <span className="landing__feature-icon">
            <Icon name={feature.icon} />
          </span>
          <h2 className="landing__feature-title">{feature.title}</h2>
          <p className="landing__feature-text">{feature.text}</p>
        </article>
      ))}
    </section>

    <footer className="landing__footer">
      <p>© {new Date().getFullYear()} Kura CRM. Built for modern operating teams.</p>
      <p className="landing__footer-meta">React · TypeScript · Vite · Vitest</p>
    </footer>
  </main>
);

export default HomePage;
