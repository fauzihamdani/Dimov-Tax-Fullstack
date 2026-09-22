"use client";
// Butuh "use client" karena ada onClick (tombol Edit/Delete)

import { Project } from "@/types/project";

interface Props {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;

}

export default function ProjectTable({ projects, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-lg overflow-hidden border-gray-200 dark:border-neutral-700">
        <thead className="bg-gray-100 dark:bg-neutral-800">
          <tr>
            <th className="text-left px-4 py-2 text-black dark:text-white">Name</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Status</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Deadline</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Assigned To</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Budget</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-t border-gray-200 dark:border-neutral-700">
              <td className="px-4 py-2 text-black dark:text-white">{p.name}</td>
              <td className="px-4 py-2 capitalize text-black dark:text-white">{p.status}</td>
              <td className="px-4 py-2 text-black dark:text-white">{p.deadline?.split("T")[0]}</td>
              <td className="px-4 py-2 text-black dark:text-white">{p.team_members?.name ?? "-"}</td>
              <td className="px-4 py-2 text-black dark:text-white">${p.budget.toLocaleString()}</td>
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => onEdit(p)} className="text-blue-600">Edit</button>
                <button onClick={() => onDelete(p.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-400">
                Belum ada project
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}