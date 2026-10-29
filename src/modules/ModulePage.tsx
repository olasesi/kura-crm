import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/store/authStore";

import { ModuleForm } from "./ModuleForm";
import {
  computeStats,
  downloadCsv,
  filterRecords,
  formatDay,
  formatValue,
  getStatusOptions,
  sortRecords,
  statusTone,
  toCsv,
} from "./moduleUtils";
import { createRecord, deleteRecords, resetModule, updateRecord } from "./repository";
import type { FieldDef, ModuleDef, ModuleRecord, RecordValues } from "./types";
import { useModuleRecords } from "./useModuleRecords";

const PAGE_SIZE = 8;

const initials = (value: string): string =>
  value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

interface ModulePageProps {
  module: ModuleDef;
}

export const ModulePage = ({ module }: ModulePageProps) => {
  const { t } = useI18n();
  const role = useAuthStore((state) => state.user?.role);
  const records = useModuleRecords(module);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: module.fields[0]?.key ?? "createdAt",
    direction: "asc",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleRecord | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const columns = useMemo(
    () => module.fields.filter((fieldDef) => fieldDef.inTable !== false).slice(0, 6),
    [module.fields],
  );
  const statusOptions = useMemo(() => getStatusOptions(module), [module]);
  const stats = useMemo(() => computeStats(module, records), [module, records]);
  const valueField = useMemo(
    () =>
      module.fields.find(
        (fieldDef) =>
          fieldDef.type === "currency" ||
          /amount|value|price|cost|salary|budget|balance/i.test(fieldDef.key),
      ),
    [module.fields],
  );

  const filtered = useMemo(
    () => sortRecords(filterRecords(records, query, status), sort.key, sort.direction),
    [records, query, status, sort],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  useEffect(() => {
    if (!module.fields.some((fieldDef) => fieldDef.key === sort.key)) {
      setSort({ key: module.fields[0]?.key ?? "createdAt", direction: "asc" });
    }
  }, [module.fields, sort.key]);

  const toggleSort = (key: string) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record: ModuleRecord) => {
    setEditing(record);
    setFormOpen(true);
  };

  const handleSubmit = (values: RecordValues) => {
    if (editing) {
      updateRecord(module, editing.id, values);
      setToast(t("module.saved"));
    } else {
      createRecord(module, values);
      setToast(t("module.saved"));
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!confirmIds) {
      return;
    }
    deleteRecords(module, confirmIds);
    setSelected((current) => current.filter((id) => !confirmIds.includes(id)));
    setConfirmIds(null);
    setToast(t("module.deleted"));
  };

  const handleExport = () => {
    downloadCsv(`${module.id}.csv`, toCsv(module, filtered));
    setToast(t("module.exported"));
    logger.info(`Exported ${filtered.length} records from "${module.id}".`);
  };

  const handleReset = () => {
    resetModule(module);
    setToast(t("module.saved"));
  };

  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((current) => current.filter((id) => !pageRows.some((row) => row.id === id)));
      return;
    }
    setSelected((current) => [...new Set([...current, ...pageRows.map((row) => row.id)])]);
  };

  const toggleSelect = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const renderCell = (record: ModuleRecord, fieldDef: FieldDef) => {
    const value = record[fieldDef.key];

    if (fieldDef.key === "status" || fieldDef.key === "priority" || fieldDef.key === "stage") {
      return <span className={`badge ${statusTone(value)}`}>{String(value)}</span>;
    }
    if (fieldDef.key === "progress") {
      const numeric = Math.min(100, Math.max(0, Number(value)));
      return (
        <div className="u-inline" style={{ minWidth: 104 }}>
          <div className="progress" style={{ flex: 1 }}>
            <div className="progress__bar" style={{ width: `${numeric}%` }} />
          </div>
          <span className="u-text-muted" style={{ fontSize: "0.6875rem" }}>
            {numeric}%
          </span>
        </div>
      );
    }
    if (fieldDef.type === "date") {
      return formatDay(value);
    }
    if (
      fieldDef.type === "currency" ||
      /amount|value|price|cost|salary|budget|balance/i.test(fieldDef.key)
    ) {
      return formatValue(value, fieldDef);
    }
    if (
      ["owner", "assignee", "employee", "candidate", "author", "manager"].includes(fieldDef.key) &&
      value
    ) {
      return (
        <span className="u-inline">
          <span className="avatar avatar--sm">{initials(String(value))}</span>
          <span className="u-truncate">{String(value)}</span>
        </span>
      );
    }
    return <span className="u-truncate">{formatValue(value, fieldDef)}</span>;
  };

  const moduleName = t(`modules.${module.id}`, module.name);

  return (
    <main className="page page--wide">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">
            {t(module.group === "overview" ? "nav.overview" : `nav.${module.group}`, module.group)}
          </p>
          <h1 className="page__title">
            {moduleName} <span className="badge badge--accent">{records.length}</span>
          </h1>
          <p className="page__description">{module.description}</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleReset}>
            <span className="btn__icon">
              <Icon name="repeat" />
            </span>
            {t("module.demoData")}
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleExport}>
            <span className="btn__icon">
              <Icon name="download" />
            </span>
            {t("common.export")}
          </button>
          <button type="button" className="btn" onClick={openCreate}>
            <span className="btn__icon">
              <Icon name="plus" />
            </span>
            {t("module.newRecord")}
          </button>
        </div>
      </header>

      {module.kind === "crud" ? (
        <section className="module__stats" aria-label={t("reports.summary")}>
          <article className="module__stat">
            <p className="module__stat-label">{t("module.totalRecords")}</p>
            <p className="module__stat-value">{stats.total}</p>
            <p className="module__stat-meta">{t("module.demoData")}</p>
          </article>
          <article className="module__stat">
            <p className="module__stat-label">{t("module.activeRecords")}</p>
            <p className="module__stat-value">{stats.active}</p>
            <p className="module__stat-meta">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
            </p>
          </article>
          <article className="module__stat">
            <p className="module__stat-label">{t("module.createdThisMonth")}</p>
            <p className="module__stat-value">{stats.createdThisMonth}</p>
            <p className="module__stat-meta">{t("dashboard.thisMonth")}</p>
          </article>
          {valueField ? (
            <article className="module__stat">
              <p className="module__stat-label">{t("module.totalValue")}</p>
              <p className="module__stat-value">
                {formatValue(Math.round(stats.totalValue), valueField)}
              </p>
              <p className="module__stat-meta">{t(`fields.${valueField.key}`, valueField.label)}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="card module__card">
        <div className="toolbar">
          <div className="search-box">
            <span className="search-box__icon">
              <Icon name="search" />
            </span>
            <input
              type="search"
              className="input"
              placeholder={t("module.searchPlaceholder")}
              aria-label={t("common.search")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {statusOptions.length > 0 ? (
            <select
              className="select"
              style={{ maxWidth: 170 }}
              aria-label={t("common.status")}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">{t("common.all")}</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}

          <span className="toolbar__spacer" />

          {selected.length > 0 ? (
            <button
              type="button"
              className="btn btn--danger-ghost btn--sm"
              onClick={() => setConfirmIds(selected)}
            >
              <span className="btn__icon">
                <Icon name="trash" />
              </span>
              {t("module.deleteSelected")} ({selected.length})
            </button>
          ) : null}

          <div className="segmented" role="group" aria-label={t("common.view")}>
            <button
              type="button"
              className={`segmented__item ${view === "table" ? "segmented__item--active" : ""}`}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              {t("common.table")}
            </button>
            <button
              type="button"
              className={`segmented__item ${view === "cards" ? "segmented__item--active" : ""}`}
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              {t("common.cards")}
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div className="table-wrap">
            <table className="table">
              <caption className="u-visually-hidden">
                {moduleName} — {t("module.totalRecords")}
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="checkbox__input"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label={t("module.selectAll")}
                    />
                  </th>
                  {columns.map((fieldDef) => (
                    <th key={fieldDef.key} scope="col">
                      <button
                        type="button"
                        className="table__sort"
                        onClick={() => toggleSort(fieldDef.key)}
                      >
                        {t(`fields.${fieldDef.key}`, fieldDef.label)}
                        <span className="table__sort-indicator" aria-hidden="true">
                          {sort.key === fieldDef.key ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="table__cell--right">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox__input"
                        checked={selected.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                        aria-label={`${t("common.selectAll")}: ${String(record[columns[0]?.key ?? "id"])}`}
                      />
                    </td>
                    {columns.map((fieldDef, index) => (
                      <td key={fieldDef.key} className={index === 0 ? "table__primary" : undefined}>
                        {renderCell(record, fieldDef)}
                      </td>
                    ))}
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm btn--icon"
                          aria-label={`${t("common.edit")}: ${String(record[columns[0]?.key ?? "id"])}`}
                          onClick={() => openEdit(record)}
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger-ghost btn--sm btn--icon"
                          aria-label={`${t("common.delete")}: ${String(record[columns[0]?.key ?? "id"])}`}
                          onClick={() => setConfirmIds([record.id])}
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pageRows.length === 0 ? (
              <div className="table__empty">
                <p className="table__empty-title">
                  {records.length === 0 ? t("module.emptyTitle") : t("module.noMatchTitle")}
                </p>
                <p className="u-text-muted">
                  {records.length === 0 ? t("module.emptyText") : t("module.noMatchText")}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="module__cards">
            {pageRows.map((record) => (
              <article key={record.id} className="module__card-item">
                <div className="u-spread">
                  <p className="module__card-item-title">
                    {String(record[columns[0]?.key ?? "id"])}
                  </p>
                  {record.status ? (
                    <span className={`badge ${statusTone(record.status)}`}>
                      {String(record.status)}
                    </span>
                  ) : null}
                </div>
                {columns.slice(1, 4).map((fieldDef) => (
                  <p key={fieldDef.key} className="module__card-item-meta">
                    <span className="u-text-muted">
                      {t(`fields.${fieldDef.key}`, fieldDef.label)}:
                    </span>{" "}
                    {fieldDef.type === "date"
                      ? formatDay(record[fieldDef.key])
                      : formatValue(record[fieldDef.key], fieldDef)}
                  </p>
                ))}
                <div className="table__actions">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => openEdit(record)}
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger-ghost btn--sm"
                    onClick={() => setConfirmIds([record.id])}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </article>
            ))}
            {pageRows.length === 0 ? (
              <div className="empty">
                <div className="empty__icon">
                  <Icon name="search" />
                </div>
                <p className="empty__title">{t("module.noMatchTitle")}</p>
                <p className="empty__text">{t("module.noMatchText")}</p>
              </div>
            ) : null}
          </div>
        )}

        <div className="pagination">
          <p className="pagination__info">
            {t("common.showing")} {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("common.of")} {filtered.length}{" "}
            {t("common.results")}
            {role ? ` · ${role}` : ""}
          </p>
          <div className="pagination__controls">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
            >
              {t("common.previous")}
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter(
                (pageNumber) =>
                  pageNumber === 1 ||
                  pageNumber === pageCount ||
                  Math.abs(pageNumber - currentPage) <= 1,
              )
              .map((pageNumber, index, items) => (
                <span key={pageNumber} className="u-inline">
                  {index > 0 && pageNumber - items[index - 1] > 1 ? (
                    <span className="u-text-muted">…</span>
                  ) : null}
                  <button
                    type="button"
                    className={`pagination__page ${pageNumber === currentPage ? "pagination__page--active" : ""}`}
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </span>
              ))}
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={currentPage >= pageCount}
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      </section>

      {formOpen ? (
        <ModuleForm
          module={module}
          record={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      ) : null}

      {confirmIds ? (
        <ConfirmDialog
          title={t("module.deleteRecord")}
          message={t("module.deleteConfirm")}
          onConfirm={handleDelete}
          onCancel={() => setConfirmIds(null)}
        />
      ) : null}

      {toast ? (
        <div className="toast-stack">
          <div className="toast toast--success" role="status">
            <span className="alert__icon">✓</span>
            <span>{toast}</span>
            <button
              type="button"
              className="toast__close"
              aria-label={t("common.close")}
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default ModulePage;
