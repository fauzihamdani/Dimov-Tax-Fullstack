"use client";
// Butuh "use client" karena ada onClick (tombol Edit/Delete)

import { Project } from "@/types/project";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  page: number;
  pageSize: number;

}

function getDeadlineInfo(deadline: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(deadline.split("T")[0]);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let badgeClass = "";
  let tooltip = "";

  if (diffDays < 0) {
    badgeClass = "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
    tooltip = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`;
  } else if (diffDays === 0) {
    badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400";
    tooltip = "Due today";
  } else if (diffDays <= 7) {
    badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400";
    tooltip = `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
  } else {
    badgeClass = "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400";
    tooltip = `${diffDays} days left, still plenty of time`;
  }

  return { badgeClass, tooltip };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return "bg-blue-600 text-white font-bold border border-blue-600";
    case "on hold":
      return "bg-red-600 text-white font-bold border border-red-600";
    case "completed":
      return "bg-green-600 text-white font-bold border border-green-600";
    default:
      return "";
  }
}

export default function ProjectTable({ projects, onEdit, onDelete, page, pageSize }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-lg overflow-hidden border-gray-200 dark:border-neutral-700">
        <thead className="bg-gray-100 dark:bg-neutral-800">
          <tr>
            <th className="text-left px-4 py-2 text-black dark:text-white">No</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Name</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Status</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Deadline</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Assigned To</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Budget</th>
            <th className="text-left px-4 py-2 text-black dark:text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {(projects ?? []).map((p, index) => (
            <tr key={p.id} className="border-t border-gray-200 dark:border-neutral-700">
              <td className="px-4 py-2 text-black dark:text-white">{(page - 1) * pageSize + index + 1}</td>
              <td className="px-4 py-2 text-black dark:text-white">{p.name}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex items-center justify-center min-w-[90px] px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                    p.status
                  )}`}
                >
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-2">
                {(() => {
                  const { badgeClass, tooltip } = getDeadlineInfo(p.deadline);
                  return (
                    <div className="relative inline-block group">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-default ${badgeClass}`}
                      >
                        {p.deadline?.split("T")[0]}
                      </span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                        {tooltip}
                      </div>
                    </div>
                  );
                })()}
              </td>
              <td className="px-4 py-2 text-black dark:text-white">{p.team_members?.name ?? "-"}</td>
              <td className="px-4 py-2 text-black dark:text-white">${p.budget.toLocaleString()}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEdit(p)}
                    title="Edit"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    title="Delete"
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {(projects ?? []).length === 0 && (
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