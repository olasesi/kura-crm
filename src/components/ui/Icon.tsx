import type { ReactNode, SVGProps } from "react";

/**
 * Lightweight inline icon set (stroke-based, 24x24 viewBox).
 * Keeping icons local avoids an extra runtime dependency and lets the
 * design system control sizing/colour through currentColor.
 */
const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  tools: (
    <>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-3-3 2.3-2.3Z" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17 14.5a5 5 0 0 1 4 4.8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  contact: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0M15 7h6M15 11h6M15 15h4" />
    </>
  ),
  handshake: (
    <>
      <path d="m8 12 3-3 3 3 3-3 4 4-6 6-2-2-2 2-6-6Z" />
      <path d="M8 12 3 7l4-3 3 2M16 8l3-3" />
    </>
  ),
  form: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  request: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v5h4M9 13h6M9 17h4" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v6h6M9 13h6M9 17h6" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.5 11h11L21 7H6" />
    </>
  ),
  proposal: (
    <>
      <path d="M6 2h9l4 4v16H6z" />
      <path d="M15 2v6h5M9 12h6M9 16h6M9 8h2" />
    </>
  ),
  estimate: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h4M8 15h2M12 15h4M8 18h5" />
    </>
  ),
  invoice: (
    <>
      <path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  payment: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  credit: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M16 15h4M6 15h2" />
    </>
  ),
  expense: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" />
      <circle cx="7" cy="6" r="1.2" fill="currentColor" />
      <circle cx="13" cy="12" r="1.2" fill="currentColor" />
      <circle cx="17" cy="18" r="1.2" fill="currentColor" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10 12 3l9 7M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18" />
    </>
  ),
  project: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M8 14h8M8 17h4" />
    </>
  ),
  roadmap: (
    <>
      <path d="M4 4v16M4 8h6M4 14h10M4 19h14" />
      <circle cx="10" cy="8" r="2" />
      <circle cx="14" cy="14" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  task: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M7 12l2 2 4-4M7 17h6" />
    </>
  ),
  timesheet: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  employee: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22a8 8 0 0 1 16 0" />
    </>
  ),
  department: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  designation: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="m8 12-2 9 6-3 6 3-2-9" />
    </>
  ),
  leave: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  shift: (
    <>
      <path d="M3 12h18M12 3a9 9 0 0 1 0 18M12 3a9 9 0 0 0 0 18" />
    </>
  ),
  attendance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  holiday: (
    <>
      <path d="M12 3v18M5 7l14 10M19 7 5 17" />
    </>
  ),
  appreciation: (
    <>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" />
    </>
  ),
  payroll: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  salary: (
    <>
      <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  overtime: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </>
  ),
  performance: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  objective: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </>
  ),
  okr: (
    <>
      <path d="M3 17 9 11l4 4 8-9" />
      <path d="M16 6h5v5" />
      <path d="M3 21h18" />
    </>
  ),
  meeting: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18M8 14h3M8 17h6" />
    </>
  ),
  recruit: (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M2 22a8 8 0 0 1 13-6M17 16v6M14 19h6" />
    </>
  ),
  job: (
    <>
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 12h20M10 12v2h4v-2" />
    </>
  ),
  application: (
    <>
      <path d="M6 2h9l4 4v16H6z" />
      <path d="M15 2v6h5M9 13h6M9 17h4" />
    </>
  ),
  interview: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M9 8h6M9 12h4" />
    </>
  ),
  offer: (
    <>
      <path d="M3 8h18v12H3zM3 8l4-4h10l4 4M12 4v16" />
    </>
  ),
  skill: (
    <>
      <path d="m12 2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8Z" />
    </>
  ),
  candidate: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22a8 8 0 0 1 16 0M17 3l2 2-2 2" />
    </>
  ),
  career: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  vendor: (
    <>
      <path d="M3 9h18l-2-5H5Z" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </>
  ),
  product: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7Z" />
      <path d="m3 7 9 5 9-5M12 12v10" />
    </>
  ),
  purchase: (
    <>
      <path d="M6 6h15l-2 8H8L6 3H3" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
    </>
  ),
  bill: (
    <>
      <path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  inventory: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <path d="M17 13v8M13 17h8" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M13 6v12" />
    </>
  ),
  event: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18" />
      <circle cx="12" cy="15" r="2" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </>
  ),
  notice: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </>
  ),
  asset: (
    <>
      <rect x="2" y="7" width="20" height="12" rx="2" />
      <path d="M8 7V4h8v3M2 12h20" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </>
  ),
  biometric: (
    <>
      <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
      <path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3" />
    </>
  ),
  device: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M10 18h4" />
    </>
  ),
  log: (
    <>
      <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" />
    </>
  ),
  mapping: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M9 6h6a3 3 0 0 1 3 3v6M15 18H9a3 3 0 0 1-3-3V9" />
    </>
  ),
  command: (
    <>
      <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="m6 10 3-3 3 3 3-4 3 4" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 5-6" />
      <circle cx="19" cy="8" r="1" fill="currentColor" />
    </>
  ),
  screenshot: (
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  report: (
    <>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M15 2v6h6M10 18v-5M13 18v-8M16 18v-3" />
    </>
  ),
  agent: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4M8 12h.01M16 12h.01M9 16h6" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="3" width="18" height="7" rx="2" />
      <rect x="3" y="14" width="18" height="7" rx="2" />
      <path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" />
    </>
  ),
  hosting: (
    <>
      <path d="M4 6h16v4H4zM4 14h16v4H4z" />
      <path d="M7 8h.01M7 16h.01" />
    </>
  ),
  domain: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  provider: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4M9 11h.01M15 11h.01" />
    </>
  ),
  showroom: (
    <>
      <path d="M3 21h18M4 21V9l8-6 8 6v12" />
      <path d="M9 21v-6h6v6M4 9h16" />
    </>
  ),
  webhook: (
    <>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M8.5 15.5 15.5 8.5M9 6H6M18 18h-3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  letter: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9 6 6 6-6 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="15" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="18" r="1" fill="currentColor" />
      <circle cx="15" cy="18" r="1" fill="currentColor" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v14M18 13l-6 6-6-6" />
    </>
  ),
  check: (
    <>
      <path d="m4 12 5 5L20 6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  filter: (
    <>
      <path d="M3 4h18l-7 8v7l-4 2v-9Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v10H3Z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 3 5v7c0 5 4 8 9 10 5-2 9-5 9-10V5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 22v-4h4v4" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export const Icon = ({ name, size = 18, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {ICONS[name]}
  </svg>
);
