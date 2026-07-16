"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { detectUploadCategory, validateFile } from "@/lib/upload/config";
import { deleteFileFromStorage, saveFileToStorage } from "@/services/storage/storageService";
import { createId } from "@/utils/id";
import { nowISO } from "@/utils/date";

export function useFileUpload() {
  const uploadedFiles = useAppStore((state) => state.uploadedFiles);
  const addUploadedFile = useAppStore((state) => state.addUploadedFile);
  const updateUploadedFile = useAppStore((state) => state.updateUploadedFile);
  const removeUploadedFileFromStore = useAppStore((state) => state.removeUploadedFile);
  const [isDragging, setIsDragging] = useState(false);
  const [progressById, setProgressById] = useState<Record<string, number>>({});

  const processFile = useCallback((file: File) => {
    const id = createId("file");
    const validation = validateFile(file);

    if (!validation.valid) {
      addUploadedFile({
        id,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        category: detectUploadCategory(file) ?? "document",
        status: "error",
        errorMessage: validation.reason,
        createdAt: nowISO()
      });
      return;
    }

    addUploadedFile({
      id,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      category: detectUploadCategory(file)!,
      status: "uploading",
      createdAt: nowISO()
    });

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgressById((current) => ({ ...current, [id]: Math.round((event.loaded / event.total) * 100) }));
      }
    };

    reader.onload = async () => {
      try {
        await saveFileToStorage(id, file);
        updateUploadedFile(id, { status: "ready" });
      } catch {
        updateUploadedFile(id, { status: "error", errorMessage: "Gagal menyimpan file." });
      } finally {
        setProgressById((current) => {
          const { [id]: _removed, ...rest } = current;
          return rest;
        });
      }
    };

    reader.onerror = () => {
      updateUploadedFile(id, { status: "error", errorMessage: "Gagal membaca file." });
    };

    reader.readAsArrayBuffer(file);
  }, [addUploadedFile, updateUploadedFile]);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    Array.from(fileList).forEach(processFile);
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) processFiles(event.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) processFiles(event.target.files);
    event.target.value = "";
  }, [processFiles]);

  const removeFile = useCallback(async (id: string) => {
    removeUploadedFileFromStore(id);
    await deleteFileFromStorage(id);
  }, [removeUploadedFileFromStore]);

  return {
    uploadedFiles,
    progressById,
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange,
    removeFile
  };
}
