"use client";

import { useRef, useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";
import { Card } from "./ui/card";
import { useTranslatorStore } from "@/store/useTranslatorStore";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const file = useTranslatorStore((state) => state.file);
  const setFile = useTranslatorStore((state) => state.setFile);

  async function acceptFile(nextFile?: File) {
    setLocalError(null);
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith(".md")) {
      setLocalError("Only .md files are accepted.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setLocalError("File must be 2MB or smaller.");
      return;
    }
    setFile(nextFile, await nextFile.text());
  }

  return (
    <Card
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void acceptFile(event.dataTransfer.files[0]);
      }}
      className={`code-grid h-full p-4 transition ${dragging ? "border-primary shadow-glow" : ""}`}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-full min-h-36 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background/35 px-4 py-6 text-center hover:bg-muted/40"
      >
        <FileUp className="h-8 w-8 text-primary" />
        <div>
          <p className="text-sm font-semibold">Drop Markdown or click to upload</p>
          <p className="mt-1 text-sm text-muted-foreground">.md only, 2MB max</p>
        </div>
        {file && (
          <div className="flex max-w-full items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            <span className="truncate">{file.name} · {formatBytes(file.size)}</span>
          </div>
        )}
      </button>
      {localError && <p className="mt-3 text-sm text-rose-300">{localError}</p>}
      <input ref={inputRef} className="hidden" type="file" accept=".md,text/markdown" onChange={(event) => void acceptFile(event.target.files?.[0])} />
    </Card>
  );
}
