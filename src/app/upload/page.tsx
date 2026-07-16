"use client";

import { AppShell } from "@/components/layout/AppShell";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

export default function UploadPage() {
  return (
    <AppShell title="Upload Dokumen" subtitle="Upload gambar, dokumen, atau spreadsheet untuk diproses nanti.">
      <UploadDropzone />
    </AppShell>
  );
}
