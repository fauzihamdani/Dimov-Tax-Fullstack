"use client";
// Butuh "use client" karena ada useState, useEffect, form controlled input

import { useState, useEffect } from "react";
import { Project, ProjectStatus } from "@/types/project";
import { TeamMember } from "@/types/team-member";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    status: ProjectStatus;
    deadline: string;
    assigned_to: string;
    budget: number;
  }) => void;
  initialData?: Project | null;
  teamMembers: TeamMember[];
}

export default function ProjectModal({ isOpen, onClose, onSave, initialData, teamMembers }: Props) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStatus(initialData.status);
      setDeadline(initialData.deadline?.split("T")[0] ?? "");
      setAssignedTo(initialData.assigned_to);
      setBudget(String(initialData.budget));
    } else {
      setName("");
      setStatus("active");
      setDeadline("");
      setAssignedTo(teamMembers[0]?.id ?? "");
      setBudget("");
    }
  }, [initialData, isOpen, teamMembers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, status, deadline, assigned_to: assignedTo, budget: Number(budget) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">
          {initialData ? "Edit Project" : "Add Project"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-600"
            placeholder="Nama project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select
            className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-600"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            <option value="active">Active</option>
            <option value="on hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-600"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
          <select
            className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-600"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
          >
            <option value="" disabled>Choose Team Member</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 bg-white dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-600"
            placeholder="Budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border text-black dark:text-white">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}