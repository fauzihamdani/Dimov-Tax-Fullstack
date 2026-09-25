"use client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName?: string;
  loading?: boolean;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, projectName, loading }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg dark:bg-neutral-800">
        <h3 className="text-base font-bold text-black dark:text-white">Delete Project</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          {projectName ? <span className="font-semibold">{projectName}</span> : "this project"}?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}