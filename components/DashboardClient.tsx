"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Project, ProjectStatus } from "@/types/project";
import { TeamMember } from "@/types/team-member";
import ProjectTable from "./ProjectTable";
import ProjectModal from "./ProjectModal";
import { MIN_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constans";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Download, Plus, Filter } from "lucide-react";

interface Props {
  projects: Project[];
  teamMembers: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}

const inputCls =
  "border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-black dark:text-white dark:bg-neutral-800 dark:border-neutral-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition w-full";

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
  const filterBudgetMin = searchParams.get("budget_min") ?? "";
  const filterBudgetMax = searchParams.get("budget_max") ?? "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const [isPending, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLDivElement>(null);

  const [draftSearch, setDraftSearch] = useState(search);
  const [draftStatus, setDraftStatus] = useState(filterStatus);
  const [draftMember, setDraftMember] = useState(filterMember);
  const [draftMonth, setDraftMonth] = useState(filterMonth);
  const [draftBudgetMin, setDraftBudgetMin] = useState(filterBudgetMin);
  const [draftBudgetMax, setDraftBudgetMax] = useState(filterBudgetMax);

  const [exportLoading, setExportLoading] = useState<"csv" | "pdf" | "xlsx" | null>(null);

  const updateParams = (updates: Record<string, string>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (resetPage) params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  useEffect(() => {
    setDraftSearch(search);
    setDraftStatus(filterStatus);
    setDraftMember(filterMember);
    setDraftMonth(filterMonth);
    setDraftBudgetMin(filterBudgetMin);
    setDraftBudgetMax(filterBudgetMax);
  }, [search, filterStatus, filterMember, filterMonth, filterBudgetMin, filterBudgetMax]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportBtnRef.current && !exportBtnRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    if (exportOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportOpen]);

  const handleSave = async (data: {
    name: string;
    status: ProjectStatus;
    deadline: string;
    assigned_to: string;
    budget: number;
    description: string;
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
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const handleConfirmFilter = () => {
    updateParams({
      search: draftSearch,
      status: draftStatus,
      assigned_to: draftMember,
      deadline_month: draftMonth,
      budget_min: draftBudgetMin,
      budget_max: draftBudgetMax,
    });
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setDraftSearch("");
    setDraftStatus("");
    setDraftMember("");
    setDraftMonth("");
    setDraftBudgetMin("");
    setDraftBudgetMax("");
    updateParams({
      search: "",
      status: "",
      assigned_to: "",
      deadline_month: "",
      budget_min: "",
      budget_max: "",
    });
    setFilterOpen(false);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasFilter =
    search || filterStatus || filterMember || filterMonth || filterBudgetMin || filterBudgetMax;

  const sizes = Array.from(
    { length: (MAX_PAGE_SIZE - MIN_PAGE_SIZE) / 10 + 1 },
    (_, i) => MIN_PAGE_SIZE + i * 10
  );

  const handleExportCSV = async () => {
    setExportLoading("csv");
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      params.delete("page_size");
      const res = await fetch(`/api/projects/export?${params.toString()}`);
      const data = await res.json();
      const headers = ["No", "Name", "Status", "Deadline", "Assigned To", "Budget"];
      const rows = data.map((p: any, index: number) => [
        index + 1,
        p.name,
        p.status,
        p.deadline,
        p.team_members?.name ?? "",
        `$${Number(p.budget).toLocaleString("en-US")}`,
      ]);
      const csv = [headers, ...rows]
        .map((r) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "projects.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading("pdf");
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      params.delete("page_size");
      const res = await fetch(`/api/projects/export?${params.toString()}`);
      const data = await res.json();
      const doc = new jsPDF();
      doc.text("Project List", 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [["No", "Name", "Status", "Deadline", "Assigned To", "Budget"]],
        body: data.map((p: any, index: number) => [
          index + 1,
          p.name,
          p.status,
          p.deadline,
          p.team_members?.name ?? "",
          `$${Number(p.budget).toLocaleString("en-US")}`,
        ]),
        rowPageBreak: "avoid",
        showHead: "everyPage",
        margin: { top: 20 },
      });
      doc.save("projects.pdf");
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportXLSX = async () => {
    setExportLoading("xlsx");
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      params.delete("page_size");
      const res = await fetch(`/api/projects/export?${params.toString()}`);
      const data = await res.json();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Projects");
      sheet.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "Name", key: "name", width: 28 },
        { header: "Status", key: "status", width: 15 },
        { header: "Deadline", key: "deadline", width: 15 },
        { header: "Assigned To", key: "assigned_to", width: 22 },
        { header: "Budget", key: "budget", width: 18 },
      ];
      data.forEach((p: any, index: number) => {
        sheet.addRow({
          no: index + 1,
          name: p.name,
          status: p.status,
          deadline: p.deadline,
          assigned_to: p.team_members?.name ?? "",
          budget: Number(p.budget),
        });
      });
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: "middle", horizontal: colNumber === 1 ? "left" : "center" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });
        row.getCell("budget").numFmt = '"$"#,##0';
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "projects.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <main className="max-w-8xl px-4 sm:px-6 lg:px-11 py-6">
      <div className="flex justify-center items-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">Project List</h2>
      </div>

      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div className="relative" ref={filterBtnRef}>
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              hasFilter
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-50 text-black hover:bg-slate-200"
            }`}
          >
            <Filter size={15} />
            Filter
          </button>

          {filterOpen && (
            <div className="absolute left-0 z-20 mt-1 w-[calc(100vw-2rem)] max-w-72 space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Search</label>
                <input
                  type="text"
                  placeholder="Search project..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Status</label>
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="on hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Assigned To</label>
                <select
                  value={draftMember}
                  onChange={(e) => setDraftMember(e.target.value)}
                  className={inputCls}
                >
                  <option value="">All Members</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Deadline Month</label>
                <input
                  type="month"
                  value={draftMonth}
                  onChange={(e) => setDraftMonth(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Budget Range</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={draftBudgetMin}
                    onChange={(e) => setDraftBudgetMin(e.target.value)}
                    className={inputCls}
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max $"
                    value={draftBudgetMax}
                    onChange={(e) => setDraftBudgetMax(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-1">
                <button
                  onClick={handleClearFilter}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  Clear
                </button>
                <button
                  onClick={handleConfirmFilter}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="relative" ref={exportBtnRef}>
            <button
              onClick={() => setExportOpen((prev) => !prev)}
              disabled={exportLoading !== null}
              className="h-full rounded-lg bg-slate-50 px-4 py-1 text-xs font-bold text-black transition hover:bg-slate-200 disabled:opacity-50"
            >
              {exportLoading ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-black" />
              ) : (
                <Download size={15} />
              )}
            </button>

            {exportOpen && (
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <button
                  onClick={() => {
                    handleExportCSV();
                    setExportOpen(false);
                  }}
                  disabled={exportLoading !== null}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-black hover:bg-gray-100 disabled:opacity-50 dark:text-white dark:hover:bg-neutral-700"
                >
                  Export CSV
                  {exportLoading === "csv" && (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => {
                    handleExportPDF();
                    setExportOpen(false);
                  }}
                  disabled={exportLoading !== null}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-black hover:bg-gray-100 disabled:opacity-50 dark:text-white dark:hover:bg-neutral-700"
                >
                  Export PDF
                  {exportLoading === "pdf" && (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => {
                    handleExportXLSX();
                    setExportOpen(false);
                  }}
                  disabled={exportLoading !== null}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-black hover:bg-gray-100 disabled:opacity-50 dark:text-white dark:hover:bg-neutral-700"
                >
                  Export XLSX
                  {exportLoading === "xlsx" && (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-green-600 px-4 py-1 text-xs font-bold text-white transition hover:bg-green-700"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className={`transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[640px]">
              <ProjectTable
                projects={projects}
                onEdit={(p) => {
                  setEditing(p);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                page={page}
                pageSize={pageSize}
              />
            </div>
          </div>
        </div>
        {isPending && (
          <div className="absolute inset-0 flex items-start justify-center pt-16">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-black dark:text-white">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => updateParams({ page_size: e.target.value })}
            className="w-auto border rounded-lg px-3 py-1.5 text-sm text-black dark:text-white dark:bg-neutral-800 dark:border-neutral-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
            disabled={page <= 1 || isPending}
            onClick={() => updateParams({ page: String(page - 1) }, false)}
            className="border px-3 py-1 rounded disabled:opacity-40 dark:border-neutral-700 flex items-center gap-1.5"
          >
            {isPending && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            )}
            Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages || isPending}
            onClick={() => updateParams({ page: String(page + 1) }, false)}
            className="border px-3 py-1 rounded disabled:opacity-40 dark:border-neutral-700 flex items-center gap-1.5"
          >
            {isPending && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            )}
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