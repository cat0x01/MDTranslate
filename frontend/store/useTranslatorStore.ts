"use client";

import { create } from "zustand";
import { db, type TranslationRecord } from "./history";

type ViewMode = "raw" | "rendered" | "diff";

type TranslatorState = {
  file: File | null;
  originalMarkdown: string;
  translatedMarkdown: string;
  status: "idle" | "ready" | "translating" | "done" | "error";
  error: string | null;
  viewMode: ViewMode;
  history: TranslationRecord[];
  setFile: (file: File, markdown: string) => void;
  setViewMode: (mode: ViewMode) => void;
  translate: () => Promise<void>;
  loadHistory: () => Promise<void>;
  restoreRecord: (record: TranslationRecord) => void;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const useTranslatorStore = create<TranslatorState>((set, get) => ({
  file: null,
  originalMarkdown: "",
  translatedMarkdown: "",
  status: "idle",
  error: null,
  viewMode: "raw",
  history: [],
  setFile(file, markdown) {
    set({ file, originalMarkdown: markdown, translatedMarkdown: "", status: "ready", error: null });
  },
  setViewMode(mode) {
    set({ viewMode: mode });
  },
  async translate() {
    const { file, originalMarkdown } = get();
    if (!file || !originalMarkdown) return;

    set({ status: "translating", error: null });
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch(`${apiBase}/api/translate`, {
        method: "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Translation failed.");

      const record: TranslationRecord = {
        fileName: file.name,
        originalMarkdown,
        translatedMarkdown: payload.translatedMarkdown,
        createdAt: Date.now()
      };
      await db.translations.add(record);
      const history = await db.translations.orderBy("createdAt").reverse().limit(8).toArray();
      set({ translatedMarkdown: payload.translatedMarkdown, status: "done", history });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Translation failed." });
    }
  },
  async loadHistory() {
    const history = await db.translations.orderBy("createdAt").reverse().limit(8).toArray();
    set({ history });
  },
  restoreRecord(record) {
    set({
      file: new File([record.originalMarkdown], record.fileName, { type: "text/markdown" }),
      originalMarkdown: record.originalMarkdown,
      translatedMarkdown: record.translatedMarkdown,
      status: "done",
      error: null
    });
  }
}));
