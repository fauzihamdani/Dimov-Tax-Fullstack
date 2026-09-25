import { supabase } from "@/lib/supabase";
import { MIN_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "@/lib/constans";
import type { Project, ProjectStatus } from "@/types/project";

export interface ProjectQuery {
  search?: string;
  status?: string;
  assigned_to?: string;
  deadline_month?: string;
  budget_min?: string;
  budget_max?: string;
  page?: string;
  page_size?: string;
}

export interface ProjectStats {
  statusCounts: { status: ProjectStatus; count: number }[];
  budgetByMember: { name: string; budget: number }[];
  upcoming: {
    id: string;
    name: string;
    deadline: string;
    assignee: string;
  }[];
}

function applyFilters(query: any, q: ProjectQuery) {
  if (q.search) query = query.ilike("name", `%${q.search}%`);
  if (q.status) query = query.eq("status", q.status);
  if (q.assigned_to) query = query.eq("assigned_to", q.assigned_to);
  if (q.deadline_month && /^\d{4}-\d{2}$/.test(q.deadline_month)) {
    const [y, m] = q.deadline_month.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    query = query.gte("deadline", `${q.deadline_month}-01`).lt("deadline", `${next}-01`);
  }
  if (q.budget_min && !isNaN(Number(q.budget_min))) {
    query = query.gte("budget", Number(q.budget_min));
  }
  if (q.budget_max && !isNaN(Number(q.budget_max))) {
    query = query.lte("budget", Number(q.budget_max));
  }
  return query;
}

export async function getProjects(q: ProjectQuery) {
  const page = Math.max(1, parseInt(q.page ?? "1") || 1);
  const rawSize = parseInt(q.page_size ?? "") || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("projects")
    .select("*, team_members(id, name, email)", { count: "exact" })
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  query = applyFilters(query, q);

  const { data, error, count } = await query;
  return { data: data ?? [], total: count ?? 0, page, pageSize, error };
}

export async function getAllProjects(q: Omit<ProjectQuery, "page" | "page_size">) {
  let query = supabase
    .from("projects")
    .select("*, team_members(id, name, email)")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  query = applyFilters(query, q);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function getProjectStats(
  q: Omit<ProjectQuery, "page" | "page_size">
): Promise<ProjectStats> {
  const { data } = await getAllProjects(q);
  const projects = data as Project[];

  const statuses: ProjectStatus[] = ["active", "on hold", "completed"];
  const statusCounts = statuses.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));

  const budgetMap = new Map<string, number>();
  for (const p of projects) {
    const name = p.team_members?.name ?? "Unassigned";
    budgetMap.set(name, (budgetMap.get(name) ?? 0) + Number(p.budget));
  }
  const budgetByMember = [...budgetMap]
    .map(([name, budget]) => ({ name, budget }))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8);

  const serverLimit = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10);
  const upcoming = projects
    .filter((p) => p.status !== "completed" && p.deadline.slice(0, 10) <= serverLimit)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      name: p.name,
      deadline: p.deadline.slice(0, 10),
      assignee: p.team_members?.name ?? "Unassigned",
    }));

  return { statusCounts, budgetByMember, upcoming };
}