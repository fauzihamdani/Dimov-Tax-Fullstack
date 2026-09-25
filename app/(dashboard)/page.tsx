import { supabase } from "@/lib/supabase";
import { getProjects, getProjectStats, ProjectQuery } from "@/lib/projects";
import DashboardClient from "@/components/DashboardClient";
import DashboardStats from "@/components/DashboardStats";
import ChatWidget from "@/components/ChatWidget";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<ProjectQuery>;
}) {
  const q = await searchParams;

  const [{ data: projects, total, page, pageSize }, { data: teamMembers }, stats] =
    await Promise.all([
      getProjects(q),
      supabase.from("team_members").select("*").order("name"),
      getProjectStats({})
    ]);

  return (
    <>
      <DashboardStats stats={stats} />
      <DashboardClient
        projects={projects}
        teamMembers={teamMembers ?? []}
        total={total}
        page={page}
        pageSize={pageSize}
      />
      <ChatWidget />
    </>
    
  );
}