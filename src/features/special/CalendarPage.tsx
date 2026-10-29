import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { statusTone } from "@/modules/moduleUtils";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader } from "./ui";

interface CalendarPageProps {
  module: ModuleDef;
}

interface CalendarEntry {
  id: string;
  title: string;
  meta: string;
  tone: string;
}

const dayKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const parseDate = (value: string | number | undefined): Date | null => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value: string | number | undefined): string => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)
    : String(value ?? "—");
};

export const CalendarPage = ({ module }: CalendarPageProps) => {
  const { t } = useI18n();
  const [cursor, setCursor] = useState(() => new Date());
  const events = useRecords("events");
  const tasks = useRecords("tasks");
  const leaves = useRecords("leaves");

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    const push = (date: Date | null, entry: CalendarEntry) => {
      if (!date) {
        return;
      }
      const key = dayKey(date);
      map.set(key, [...(map.get(key) ?? []), entry]);
    };

    for (const event of events) {
      push(parseDate(event.startDate), {
        id: event.id,
        title: String(event.title),
        meta: t("modules.events"),
        tone: "accent",
      });
    }
    for (const task of tasks) {
      push(parseDate(task.dueDate), {
        id: task.id,
        title: String(task.title),
        meta: t("modules.tasks"),
        tone: "info",
      });
    }
    for (const leave of leaves) {
      const from = parseDate(leave.from);
      const to = parseDate(leave.to) ?? from;
      if (from && to && to.getTime() >= from.getTime()) {
        for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
          push(new Date(date), {
            id: `${leave.id}-${date.toISOString().slice(0, 10)}`,
            title: String(leave.employee),
            meta: `${String(leave.type ?? "")} ${t("modules.leaves").toLowerCase()}`,
            tone: "warning",
          });
        }
      }
    }
    return map;
  }, [events, leaves, tasks, t]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const upcoming = [...events]
    .filter((event) => {
      const date = parseDate(event.startDate);
      return date ? date.getTime() >= Date.now() : false;
    })
    .sort((left, right) => String(left.startDate).localeCompare(String(right.startDate)))
    .slice(0, 6);

  const deadlines = [...tasks]
    .filter((task) => String(task.status ?? "").toLowerCase() !== "done")
    .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
    .slice(0, 5);

  const shift = (offset: number) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const entriesFor = (day: number): CalendarEntry[] =>
    entriesByDay.get(`${year}-${month}-${day}`) ?? [];

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.overview")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.calendarText")}
        actions={
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setCursor(new Date())}
          >
            <span className="btn__icon">
              <Icon name="calendar" />
            </span>
            {t("common.reset")}
          </button>
        }
      />

      <div className="calendar-layout">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{monthLabel}</h2>
              <p className="card__subtitle">{t("special.calendarText")}</p>
            </div>
            <div className="calendar-nav">
              <button
                type="button"
                className="btn btn--ghost btn--sm btn--icon"
                onClick={() => shift(-1)}
                aria-label={t("common.previous")}
              >
                <Icon name="chevronRight" style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm btn--icon"
                onClick={() => shift(1)}
                aria-label={t("common.next")}
              >
                <Icon name="chevronRight" />
              </button>
            </div>
          </div>
          <div className="card__body">
            <div className="calendar-grid">
              {weekdays.map((weekday) => (
                <span key={weekday} className="calendar-grid__weekday">
                  {weekday}
                </span>
              ))}
              {cells.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} className="calendar-grid__empty" />;
                }
                const entries = entriesFor(day);
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
                return (
                  <div
                    key={`${month}-${day}`}
                    className={`calendar-grid__day ${isToday ? "calendar-grid__day--today" : ""}`}
                  >
                    <span className="calendar-grid__number">{day}</span>
                    {entries.slice(0, 2).map((entry) => (
                      <span
                        key={entry.id}
                        className={`calendar-grid__event calendar-grid__event--${entry.tone}`}
                        title={`${entry.title} · ${entry.meta}`}
                      >
                        {entry.title}
                      </span>
                    ))}
                    {entries.length > 2 ? (
                      <span className="calendar-grid__more">+{entries.length - 2}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="special-stack">
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">{t("modules.events")}</h2>
            </div>
            <div className="card__body">
              {upcoming.length === 0 ? (
                <p className="u-text-muted">{t("module.emptyTitle")}</p>
              ) : (
                <ul className="event-list">
                  {upcoming.map((event: ModuleRecord) => (
                    <li key={event.id} className="event-list__item">
                      <span className="event-list__date">{formatDate(event.startDate)}</span>
                      <div>
                        <p className="event-list__title">{String(event.title)}</p>
                        <p className="event-list__meta">
                          {String(event.type ?? "")} · {String(event.location ?? "")}
                        </p>
                      </div>
                      <span className={`badge ${statusTone(event.status)}`}>
                        {String(event.status ?? "")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">{t("dashboard.tasks")}</h2>
            </div>
            <div className="card__body">
              <ul className="event-list">
                {deadlines.map((task) => (
                  <li key={task.id} className="event-list__item">
                    <span className="event-list__date">{formatDate(task.dueDate)}</span>
                    <div>
                      <p className="event-list__title">{String(task.title)}</p>
                      <p className="event-list__meta">{String(task.project ?? "")}</p>
                    </div>
                    <span className={`badge ${statusTone(task.priority)}`}>
                      {String(task.priority ?? "")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CalendarPage;
