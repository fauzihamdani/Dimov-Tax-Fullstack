import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/projects";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = Object.fromEntries(searchParams.entries());
  const { data, error } = await getAllProjects(q);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}