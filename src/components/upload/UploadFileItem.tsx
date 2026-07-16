"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import type { UploadedFileMeta } from "@/types";
import { getFileFromStorage } from "@/services/storage/storageService";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryIcon = {
  image: ImageIcon,
  document: FileText,
  spreadsheet: FileSpreadsheet
};

export function UploadFileItem({ file, progress, onRemove }: { file: UploadedFileMeta; progress?: number; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const Icon = categoryIcon[file.category];

  useEffect(() => {
    if (file.category !== "image" || file.status !== "ready") return;
    let objectUrl: string | null = null;
    getFileFromStorage(file.id).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      }
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.category, file.status]);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic client-only blob: URL, next/image can't fetch this
          <img src={previewUrl} alt={file.filename} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-6 w-6 text-slate-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{file.filename}</p>
        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
        {file.status === "uploading" ? (
          <div className="mt-2 h-1.5 rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-primary-600 transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
        ) : null}
        {file.status === "error" ? <p className="mt-1 text-xs font-bold text-red-600">{file.errorMessage}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {file.status === "uploading" ? <Loader2 className="h-5 w-5 animate-spin text-primary-600" /> : null}
        {file.status === "ready" ? <CircleCheck className="h-5 w-5 text-emerald-600" /> : null}
        {file.status === "error" ? <CircleAlert className="h-5 w-5 text-red-600" /> : null}
        <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Hapus ${file.filename}`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
