"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Project, ProjectStatus } from "@/types/project";
import { TeamMember } from "@/types/team-member";
import ProjectTable from "./ProjectTable";
import ProjectModal from "./ProjectModal";
import { MIN_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constans";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Download, ChevronDown, Plus, LogOut } from "lucide-react";

interface Props {
  projects: Project[];
  teamMembers: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}

const inputCls =
  "border rounded-lg px-3 py-1.5 text-sm text-black dark:text-white dark:bg-neutral-800 dark:border-neutral-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

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

  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  //loading state for download button
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

  //dropdown export
  useEffect(() => {
  const handleClickOutside = () => setExportOpen(false);
  if (exportOpen) {
    document.addEventListener("click", handleClickOutside);
  }
  return () => document.removeEventListener("click", handleClickOutside);
}, [exportOpen]);

  //save handler
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilter = searchInput || filterStatus || filterMember || filterMonth;
  const sizes = Array.from(
    { length: (MAX_PAGE_SIZE - MIN_PAGE_SIZE) / 10 + 1 },
    (_, i) => MIN_PAGE_SIZE + i * 10
  );

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh()
  }

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
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF2563EB" },
                };
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
    <main className="max-w-8xl px-11 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">Project List</h2>
        <div className="flex gap-2">
            
            <button
                onClick={handleLogout}
                className=" px-2.5 py-1 rounded-lg text-xs text-black dark:text-white dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
            >
                 <LogOut size={15} />
            </button>
        </div>
        
    </div>

        {/* Filter */}
        <div className=" flex justify-between mb-4">
            <div className="flex flex-wrap gap-3">
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

            <div className="flex gap-3">
                <div className="relative">
                    <button
                        onClick={() => setExportOpen((prev) => !prev)}
                        disabled={exportLoading !== null}
                        className="text-black bg-slate-50 font-bold px-4 py-1 rounded-lg text-xs hover:bg-slate-200 transition h-full disabled:opacity-50"
                    >
                        {exportLoading ? (
                            <span className="h-3.5 w-3.5 inline-block animate-spin rounded-full border-2 border-gray-400 border-t-black" />
                        ) : (
                            <Download size={15} />
                        )}
                    </button>

                    {exportOpen && (
                        <div className="absolute mt-1 w-36 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-20">
                            <button
                                onClick={() => {
                                    handleExportCSV();
                                    setExportOpen(false);
                                }}
                                disabled={exportLoading !== null}
                                className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50"
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
                                className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50"
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
                                className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50"
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
                        className="bg-green-600 text-white font-bold px-4 py-1 rounded-lg text-xs hover:bg-green-700 transition"
                    >
                        <Plus size={15} />
                    </button>
            </div>
            
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
            page={page}
            pageSize={pageSize}
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