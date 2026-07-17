"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, Presentation, X } from "lucide-react";
import type { DocumentStatus, UploadedFileMeta } from "@/types";
import { getFileFromStorage } from "@/services/storage/storageService";
import { useAppStore } from "@/store/useAppStore";
import { AIDocumentPanel } from "@/components/ai/AIDocumentPanel";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

const categoryIcon = {
  image: ImageIcon,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation
};

const documentStatusLabel: Record<DocumentStatus, string> = {
  pending: "Menunggu diproses",
  processing: "Memproses...",
  extracted: "Teks terekstrak",
  needs_ocr: "Perlu OCR",
  completed: "Selesai",
  failed: "Gagal"
};

const documentStatusClass: Record<DocumentStatus, string> = {
  pending: "bg-slate-100 text-slate-500",
  processing: "bg-amber-50 text-amber-600",
  extracted: "bg-emerald-50 text-emerald-600",
  needs_ocr: "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-600"
};

// Panel debug Sprint 3 — memverifikasi hasil pipeline OCR/parser, bukan desain final.
function DocumentDebugPanel({ fileId }: { fileId: string }) {
  const record = useAppStore((state) => state.documents[fileId]);
  if (!record) return null;

  // "Belum diimplementasikan" bukan kegagalan sungguhan — jangan tampil merah/alarm
  // seperti HTTP_ERROR/TIMEOUT/dst, supaya user tidak salah kira ada yang rusak.
  const isNotImplemented = record.status === "failed" && record.errorCode === "NOT_IMPLEMENTED";
  const label = isNotImplemented ? "Belum didukung" : documentStatusLabel[record.status];
  const badgeClass = isNotImplemented ? "bg-slate-100 text-slate-500" : documentStatusClass[record.status];

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`rounded-full px-2 py-0.5 font-bold ${badgeClass}`}>{label}</span>
        {record.provider ? <span className="text-slate-400">provider: {record.provider}</span> : null}
        {record.confidence !== undefined ? <span className="text-slate-400">confidence: {record.confidence}%</span> : null}
        {record.processingTimeMs !== undefined ? <span className="text-slate-400">waktu: {formatMs(record.processingTimeMs)}</span> : null}
        {record.content?.pageCount ? <span className="text-slate-400">{record.content.pageCount} halaman</span> : null}
      </div>
      {record.status === "failed" ? (
        <p className={`mt-1 font-bold ${isNotImplemented ? "text-slate-500" : "text-red-600"}`}>
          {isNotImplemented ? record.errorMessage : `${record.errorCode}: ${record.errorMessage}`}
        </p>
      ) : null}
      {record.content?.text ? (
        <details className="mt-1">
          <summary className="cursor-pointer font-bold text-slate-600">Hasil ekstraksi teks</summary>
          <p className="mt-1 whitespace-pre-wrap text-slate-500">{record.content.text}</p>
        </details>
      ) : null}
    </div>
  );
}

export function UploadFileItem({ file, progress, onRemove }: { file: UploadedFileMeta; progress?: number; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const record = useAppStore((state) => state.documents[file.id]);
  const Icon = categoryIcon[file.category];
  // Panel AI hanya untuk dokumen yang teksnya berhasil diekstrak (status completed).
  const canUseAI = file.status === "ready" && record?.status === "completed" && Boolean(record.content?.text);

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
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-3">
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
      {file.status === "ready" ? <DocumentDebugPanel fileId={file.id} /> : null}
      {canUseAI ? <AIDocumentPanel documentId={file.id} filename={file.filename} /> : null}
    </div>
  );
}
