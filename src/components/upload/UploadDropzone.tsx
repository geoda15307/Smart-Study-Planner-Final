"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB } from "@/lib/upload/config";
import { UploadFileList } from "./UploadFileList";

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadedFiles, progressById, isDragging, handleDrop, handleDragOver, handleDragLeave, handleFileInputChange, removeFile } = useFileUpload();

  return (
    <div className="space-y-5">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition ${isDragging ? "border-primary-500 bg-primary-50" : "border-slate-200 bg-slate-50 hover:border-primary-300"}`}
      >
        <Upload className="h-10 w-10 text-primary-600" />
        <p className="mt-3 font-black text-slate-900">Tarik &amp; lepas file di sini, atau klik untuk pilih</p>
        <p className="mt-1 text-sm text-slate-500">Gambar (PNG, JPG, JPEG), Dokumen (PDF), Spreadsheet (XLSX, XLS, CSV) — maks {MAX_FILE_SIZE_MB}MB per file</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
      <UploadFileList files={uploadedFiles} progressById={progressById} onRemove={removeFile} />
    </div>
  );
}
