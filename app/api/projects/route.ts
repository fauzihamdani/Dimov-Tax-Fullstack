import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(){
    const {data, error} = await supabase
        .from("projects")
        .select("*, team_members(id, name, email)")
        .eq("is_deleted", false)
        .order("created_at", {ascending:false});

        if(error) return NextResponse.json({error:error.message}, {status:500});
        return NextResponse.json(data)
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