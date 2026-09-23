"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Project, ProjectStatus } from "@/types/project";
import { TeamMember } from "@/types/team-member";
import ProjectTable from "./ProjectTable";
import ProjectModal from "./ProjectModal";
import { MIN_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constans";

interface Props {
  projects: Project[];
  teamMembers: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}

const inputCls =
  "border px-3 py-2 rounded text-black dark:text-white dark:bg-neutral-800 dark:border-neutral-700";

export default function DashboardClient({
  projects,
  teamMembers,
  total,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const filterStatus = searchParams.get("status") ?? "";
  const filterMember = searchParams.get("assigned_to") ?? "";
  const filterMonth = searchParams.get("deadline_month") ?? "";

  const [searchInput, setSearchInput] = useState(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const [isPending, startTransition] = useTransition()
  const [isSearching, setIsSearching] = useState(false);

  const updateParams = (updates: Record<string, string>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (resetPage) params.delete("page");
    const qs = params.toString();
    startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
    })
    
  };

  // Debounce search 
  useEffect(() => {
    if (searchInput === search) {
        setIsSearching(false);
        return;
    }
    
    setIsSearching(true);
    const t = setTimeout(() => updateParams({ search: searchInput }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Sync input 
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // turn off loading indicator
  useEffect(() => {
    if (!isPending) setIsSearching(false);
  },[isPending, search])



  const handleSave = async (data: {
    name: string;
    status: ProjectStatus;
    deadline: string;
    assigned_to: string;
    budget: number;
  }) => {
    await fetch(editing ? `/api/projects/${editing.id}` : "/api/projects", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setModalOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus project ini?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter = searchInput || filterStatus || filterMember || filterMonth;
  const sizes = Array.from(
    { length: (MAX_PAGE_SIZE - MIN_PAGE_SIZE) / 10 + 1 },
    (_, i) => MIN_PAGE_SIZE + i * 10
  );

  return (
    <main className="max-w-8xl px-11 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">Project List</h2>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Project
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
            <input
                type="text"
                placeholder="Search project..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${inputCls} pr-9`}
            />
            {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            )}
        </div>
        <select
          value={filterStatus}
          onChange={(e) => updateParams({ status: e.target.value })}
          className={inputCls}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterMember}
          onChange={(e) => updateParams({ assigned_to: e.target.value })}
          className={inputCls}
        >
          <option value="">All Members</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => updateParams({ deadline_month: e.target.value })}
          className={inputCls}
        />

        {hasFilter && (
          <button
            onClick={() => {
              setSearchInput("");
              updateParams({ search: "", status: "", assigned_to: "", deadline_month: "" });
            }}
            title="Clear filter"
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        )}
      </div>

      <div className="relative">
        <div
            className={`transition-opacity ${
            isPending && !isSearching ? "opacity-50 pointer-events-none" : ""
            }`}
        >
            <ProjectTable
            projects={projects}
            onEdit={(p) => {
                setEditing(p);
                setModalOpen(true);
            }}
            onDelete={handleDelete}
            />
        </div>
        {isPending && !isSearching && (
            <div className="absolute inset-0 flex items-start justify-center pt-16">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            </div>
        )}
    </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-black dark:text-white">
        <div className="flex items-center gap-2 text-sm">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => updateParams({ page_size: e.target.value })}
            className={inputCls}
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>{total} total</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) }, false)}
            className="border px-3 py-1 rounded disabled:opacity-40 dark:border-neutral-700"
          >
            Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) }, false)}
            className="border px-3 py-1 rounded disabled:opacity-40 dark:border-neutral-700"
          >
            Next
          </button>
        </div>
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editing}
        teamMembers={teamMembers}
      />
    </main>
  );
}