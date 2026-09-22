import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data, error } = await supabase
        .from("projects")
        .select("*, team_members(id, name, email)")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { data, error } = await supabase
        .from("projects")
        .update(body)
        .eq("id", id)
        .select("*, team_members(id, name, email)")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(req:NextRequest, {params} : {params: {id:string}}){
    const {error} = await supabase
        .from("projects")
        .update({is_deleted:true})
        .eq("id", params.id)
    
    if (error) return NextResponse.json({error:error.message}, {status:500});
    return NextResponse.json({success:true});
    
}