import { supabase } from "@/lib/supabase"
import DashboardClient from "@/components/DashboardClient"

export const dynamic = "force-dynamic"


export default async function DashboardPage(){

  const {data: projects} = await supabase
    .from("projects")
    .select("*, team_members(id, name, email)")
    .eq("is_deleted", false)
    .order("name")

  const {data: team_members} = await supabase
    .from("team_members")
    .select("*")
    .order("name")

  return(
    <DashboardClient 
      initialProjects={projects ?? []} 
      teamMembers={team_members ?? []} 
    />
  )
  
}