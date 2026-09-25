"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Download, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";

const AGENT_API_URL =
  process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:8000";

interface ProjectRow {
  id: string;
  name: string;
  status: string;
  deadline: string;
  assigned_to: string;
  assigned_to_name?: string;
  budget: string | number;
  created_at?: string;
  is_deleted?: boolean;
  description?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool_results?: ProjectRow[];
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${AGENT_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: { reply: string; tool_results: ProjectRow[] } = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          tool_results: data.tool_results?.length ? data.tool_results : undefined,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, an error occurred while connecting to the server. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExportXLSX = async (rows: ProjectRow[], index: number) => {
    setExportingIndex(index);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Projects");
      sheet.columns = [
        { header: "No", key: "no", width: 6 },
        { header: "Name", key: "name", width: 30 },
        { header: "Status", key: "status", width: 14 },
        { header: "Deadline", key: "deadline", width: 14 },
        { header: "Assigned To", key: "assigned_to", width: 22 },
        { header: "Budget", key: "budget", width: 16 },
      ];
      rows.forEach((p, i) => {
        sheet.addRow({
          no: i + 1,
          name: p.name,
          status: p.status,
          deadline: p.deadline,
          assigned_to: p.assigned_to_name ?? "-",
          budget: Number(p.budget),
        });
      });
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      });
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
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
      setExportingIndex(null);
    }
  };

  return (
    <>
      {/* Tombol mengambang */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
        aria-label="Buka chat"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Panel chat */}
      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[32rem] w-[24rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
            <span className="text-sm font-bold text-black dark:text-white">
              Project Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400">
                Ask about project data — for example: "Which projects have an 'active' status?"
              </p>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-black dark:bg-neutral-800 dark:text-white"
                  }`}
                >
                  {m.content}
                </div>

                {m.tool_results && m.tool_results.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-neutral-800">
                          <tr>
                            <th className="px-2 py-1 font-semibold">Name</th>
                            <th className="px-2 py-1 font-semibold">Status</th>
                            <th className="px-2 py-1 font-semibold">Deadline</th>
                            <th className="px-2 py-1 font-semibold">Assigned To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.tool_results.map((p) => (
                            <tr key={p.id} className="border-t border-gray-100 dark:border-neutral-700">
                              <td className="px-2 py-1">{p.name}</td>
                              <td className="px-2 py-1">{p.status}</td>
                              <td className="px-2 py-1">{p.deadline}</td>
                              <td className="px-2 py-1">{p.assigned_to_name ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      onClick={() => handleExportXLSX(m.tool_results!, i)}
                      disabled={exportingIndex === i}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-black hover:bg-gray-100 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                    >
                      {exportingIndex === i ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      Download as Excel
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:bg-neutral-800">
                  <Loader2 size={13} className="animate-spin" />
                  Typing...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-gray-200 p-3 dark:border-neutral-700">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about project data"
              className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}