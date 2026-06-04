"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { uploadFile, type UploadResult } from "@/lib/admin-api";

type UploadProgressContextValue = {
  percent: number | null;
  isUploading: boolean;
  uploadImage: (file: File) => Promise<UploadResult>;
};

const UploadProgressContext = createContext<UploadProgressContextValue | null>(
  null,
);

export function UploadProgressProvider({ children }: { children: ReactNode }) {
  const [percent, setPercent] = useState<number | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    setPercent(0);
    try {
      return await uploadFile(file, setPercent);
    } finally {
      setPercent(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      percent,
      isUploading: percent !== null,
      uploadImage,
    }),
    [percent, uploadImage],
  );

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) {
    throw new Error("useUploadProgress must be used within UploadProgressProvider");
  }
  return ctx;
}
