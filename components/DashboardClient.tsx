"use client"

import { useState } from "react"
import { Project, ProjectStatus } from "@/types/project"
import { TeamMember } from "@/types/team-member"
import ProjectTable from "./ProjectTable";
import ProjectModal from "./ProjectModal";

interface Props{
    initialProjects : Project[];
    teamMembers: TeamMember[];
}

export default function DashboardClient({initialProjects, teamMembers}:Props){
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [modalOpen, setModalOpen]= useState(false);
    const [editing, setEditing] = useState<Project | null>(null)

    const refresh = async () => {
        const res = await fetch("/api/projects");
        setProjects(await res.json());
    };

    const handleSave = async (data: {
        name: string;
        status: ProjectStatus;
        deadline: string;
        assigned_to: string;
        budget: number;
    }) => {
        if (editing) {
            await fetch(`/api/projects/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } else {
            await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        }
        setModalOpen(false);
        setEditing(null);
        refresh();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus project ini?")) return;
        await fetch(`/api/projects/${id}`, { method: "DELETE" });
        refresh();
    };

    

    return(
        <main className="max-w-8xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black dark:text-white"> Project List</h2>
                <button 
                    onClick={() => { setEditing(null); setModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    + Add Project
                </button>
            </div>

            <ProjectTable 
                projects={projects}
                onEdit={(p) => { setEditing(p); setModalOpen(true); }}
                onDelete={handleDelete}

            />

            <ProjectModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                initialData={editing}
                teamMembers={teamMembers}
            />
        </main>
    )
}