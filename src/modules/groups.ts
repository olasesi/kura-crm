import type { IconName } from "@/components/ui/Icon";

import type { GroupId } from "./types";

export interface ModuleGroup {
  id: GroupId;
  labelKey: string;
  icon: IconName;
}

/**
 * Navigation groups, in display order. The sidebar renders only groups that
 * contain at least one module, so adding/removing modules never leaves an
 * empty heading behind.
 */
export const MODULE_GROUPS: ModuleGroup[] = [
  { id: "overview", labelKey: "nav.overview", icon: "dashboard" },
  { id: "crm", labelKey: "nav.crm", icon: "users" },
  { id: "sales", labelKey: "nav.sales", icon: "handshake" },
  { id: "finance", labelKey: "nav.finance", icon: "bank" },
  { id: "work", labelKey: "nav.work", icon: "project" },
  { id: "hr", labelKey: "nav.hr", icon: "employee" },
  { id: "payroll", labelKey: "nav.payroll", icon: "payroll" },
  { id: "performance", labelKey: "nav.performance", icon: "performance" },
  { id: "recruit", labelKey: "nav.recruit", icon: "recruit" },
  { id: "purchase", labelKey: "nav.purchase", icon: "purchase" },
  { id: "support", labelKey: "nav.support", icon: "ticket" },
  { id: "collaboration", labelKey: "nav.collaboration", icon: "message" },
  { id: "biometric", labelKey: "nav.biometric", icon: "biometric" },
  { id: "monitoring", labelKey: "nav.monitoring", icon: "monitor" },
  { id: "servers", labelKey: "nav.servers", icon: "server" },
  { id: "showroom", labelKey: "nav.showroom", icon: "showroom" },
  { id: "webhooks", labelKey: "nav.webhooks", icon: "webhook" },
  { id: "reports", labelKey: "nav.reports", icon: "report" },
  { id: "documents", labelKey: "nav.documents", icon: "letter" },
  { id: "settings", labelKey: "nav.settings", icon: "settings" },
];
