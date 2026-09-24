import { supabase } from "@/lib/supabase";
import { MIN_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "@/lib/constans";

export interface ProjectQuery {
  search?: string;
  status?: string;
  assigned_to?: string;
  deadline_month?: string;
  page?: string;
  page_size?: string;
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
    .order("created_at", { ascending: false });

  query = applyFilters(query, q);

  const { data, error } = await query;
  return { data: data ?? [], error };
}