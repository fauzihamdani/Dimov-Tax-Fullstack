import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getProjects } from "@/lib/projects";


export async function GET(req: NextRequest) {
  const q = Object.fromEntries(req.nextUrl.searchParams);
  const { data, total, page, pageSize, error } = await getProjects(q);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("projects")
    .insert(body)
    .select("*, team_members(id, name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}