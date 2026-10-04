"use client";

import Dexie, { type Table } from "dexie";

export type TranslationRecord = {
  id?: number;
  fileName: string;
  originalMarkdown: string;
  translatedMarkdown: string;
  createdAt: number;
};

class HistoryDatabase extends Dexie {
  translations!: Table<TranslationRecord, number>;

  constructor() {
    super("mdtranslate-ai-history");
    this.version(1).stores({
      translations: "++id, fileName, createdAt"
    });
  }
}

export const db = new HistoryDatabase();
