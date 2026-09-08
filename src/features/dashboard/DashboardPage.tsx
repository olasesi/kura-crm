import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface HealthResponse {
  success: boolean;
  status: string;
  uptime: number;
  checks: Record<string, string>;
}

const fetchHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
};

const HEALTH_LABELS: Record<string, string> = {
  database: "Database",
  redis: "Redis",
};

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const {
    data: health,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  const checks = Object.entries(health?.checks ?? {});

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between py-4">
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          Sign out
        </Button>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        <Card title="Your account">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Name</dt>
              <dd className="font-medium text-slate-100">
                {user ? `${user.firstName} ${user.lastName}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Email</dt>
              <dd className="font-medium text-slate-100">{user?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Role</dt>
              <dd className="font-medium text-slate-100">{user?.role ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Backend health">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : isError ? (
            <p role="alert" className="text-sm text-rose-400">
              Unable to reach the backend:{" "}
              {error instanceof Error ? error.message : "unknown error"}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-300">
                Status:{" "}
                <span
                  className={
                    health?.status === "healthy"
                      ? "font-semibold text-emerald-400"
                      : "font-semibold text-amber-400"
                  }
                >
                  {health?.status ?? "unknown"}
                </span>
              </p>
              <ul className="space-y-1.5">
                {checks.map(([key, value]) => (
                  <li key={key} className="flex justify-between text-sm">
                    <span className="text-slate-400">{HEALTH_LABELS[key] ?? key}</span>
                    <span className={value === "connected" ? "text-emerald-400" : "text-rose-400"}>
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
};

export default DashboardPage;
