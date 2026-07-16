import type { UploadedFileMeta } from "@/types";
import { UploadFileItem } from "./UploadFileItem";

export function UploadFileList({ files, progressById, onRemove }: { files: UploadedFileMeta[]; progressById: Record<string, number>; onRemove: (id: string) => void }) {
  if (!files.length) {
    return <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Belum ada file yang diupload.</p>;
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <UploadFileItem key={file.id} file={file} progress={progressById[file.id]} onRemove={() => onRemove(file.id)} />
      ))}
    </div>
  );
}
