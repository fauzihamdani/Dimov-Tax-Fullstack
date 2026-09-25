"use client";

import { useSyncExternalStore } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { ProjectStats } from "@/lib/projects";

const COLORS: Record<string, string> = {
  active: "#2563eb",
  "on hold": "#f1160e",
  completed: "#16a34a",
};

const card =
  "rounded-xl border border-slate-300 dark:border-white-300  bg-white dark:bg-neutral-900 dark:border-neutral-700 p-4 shadow-lg shadow-black/10 dark:shadow-black/40 text-black dark:text-white";

const localDate = new Intl.DateTimeFormat("en-CA"); // timezone device, format YYYY-MM-DD
const subscribe = () => () => {};
const getToday = () => localDate.format(new Date());

function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return localDate.format(new Date(y, m - 1, d + n));
}

export default function DashboardStats({ stats }: { stats: ProjectStats }) {
  const total = stats.statusCounts.reduce((s, x) => s + x.count, 0);

  const today = useSyncExternalStore<string | null>(subscribe, getToday, () => null);
  const upcoming = today
    ? stats.upcoming
        .filter((p) => p.deadline <= addDays(today, 7))
        .slice(0, 5)
        .map((p) => ({ ...p, overdue: p.deadline < today }))
    : null;

  return (
    <section className="grid gap-4 px-11 pt-6 md:grid-cols-3">
      <div className={card}>
        <h3 className="mb-2 text-sm font-semibold">Status Distribution</h3>
        {total === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No data</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusCounts}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {stats.statusCounts.map((s) => (
                    <Cell key={s.status} fill={COLORS[s.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className="mb-2 text-sm font-semibold">Budget by Team Member</h3>
        {stats.budgetByMember.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No data</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.budgetByMember} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString("en-US")}`} />
                <Bar dataKey="budget" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className="mb-2 text-sm font-semibold">Upcoming Deadlines (≤ 7 days)</h3>
        {upcoming === null ? (
          <div className="h-40 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
        ) : upcoming.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No upcoming deadlines</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-gray-500">{p.assignee}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.overdue && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">
                      Overdue
                    </span>
                  )}
                  <span>{p.deadline}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}