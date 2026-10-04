"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Clipboard, Code2, Columns3, Download, Eye, FileCode2, History, Languages, Moon, Play, Sun } from "lucide-react";
import { DiffView } from "@/components/DiffView";
import { FileDropzone } from "@/components/FileDropzone";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { RawMarkdown } from "@/components/RawMarkdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslatorStore } from "@/store/useTranslatorStore";

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export default function Home() {
  const [light, setLight] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const {
    file,
    originalMarkdown,
    translatedMarkdown,
    status,
    error,
    viewMode,
    history,
    setViewMode,
    translate,
    loadHistory,
    restoreRecord
  } = useTranslatorStore();

  const isTranslating = status === "translating";
  const canTranslate = status !== "idle" && !isTranslating;
  const translatedName = useMemo(() => file?.name.replace(/\.md$/i, ".ar.md") || "translation.ar.md", [file]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function exportPdf() {
    if (!exportRef.current || !translatedMarkdown) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf()
      .set({ margin: 12, filename: translatedName.replace(/\.md$/i, ".pdf"), html2canvas: { scale: 2 } })
      .from(exportRef.current)
      .save();
  }

  const modeOptions = [
    { id: "raw" as const, label: "Raw", icon: Code2 },
    { id: "rendered" as const, label: "Preview", icon: Eye },
    { id: "diff" as const, label: "Diff", icon: Columns3 }
  ];

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-20 border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight">MDTranslate AI</span>
              <span className="block text-xs text-muted-foreground">Markdown to Arabic</span>
            </div>
          </div>
          <Button variant="ghost" aria-label="Toggle theme" onClick={() => setLight((value) => !value)} className="w-10 px-0">
            {light ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      <section className="mx-auto max-w-[1560px] px-4 py-4">
        <div className="mx-auto max-w-[1360px] space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(18rem,1fr)_16rem_14rem]">
            <FileDropzone />
            <Card className="flex flex-col justify-between p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Route</p>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Source</p>
                  <p className="mt-1 font-semibold">Auto-detect</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Target</p>
                  <p className="mt-1 font-semibold" dir="rtl">Arabic · العربية</p>
                </div>
              </div>
            </Card>
            <Card className="flex flex-col justify-between p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                <p className="mt-3 text-lg font-semibold capitalize">{status}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{file?.name || "No file selected"}</p>
              </div>
              <Button disabled={!canTranslate} onClick={() => void translate()} className="mt-5 w-full">
                <Play className="h-4 w-4" />
                {isTranslating ? "Translating..." : "Translate file"}
              </Button>
            </Card>
          </div>

          {error && <Card className="border-rose-400/30 p-4 text-sm text-rose-200">{error}</Card>}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-2">
            <div className="flex rounded-lg bg-muted p-1">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const active = viewMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setViewMode(option.id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                      active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!translatedMarkdown} onClick={() => navigator.clipboard.writeText(translatedMarkdown)}>
                <Clipboard className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" disabled={!translatedMarkdown} onClick={() => downloadFile(translatedName, translatedMarkdown, "text/markdown")}>
                <Download className="h-4 w-4" />
                .md
              </Button>
              <Button variant="outline" disabled={!translatedMarkdown} onClick={() => downloadFile(translatedName.replace(/\.md$/i, ".html"), `<main dir="rtl"><pre>${escapeHtml(translatedMarkdown)}</pre></main>`, "text/html")}>
                <FileCode2 className="h-4 w-4" />
                HTML
              </Button>
              <Button variant="outline" disabled={!translatedMarkdown} onClick={() => void exportPdf()}>
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {viewMode === "diff" ? (
            <Card>
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="font-semibold">Diff mode</h2>
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              <DiffView original={originalMarkdown} translated={translatedMarkdown} />
            </Card>
          ) : (
            <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)]">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h2 className="font-semibold">Original Markdown</h2>
                  <span className="text-xs text-muted-foreground">{file?.name || "Awaiting file"}</span>
                </div>
                {viewMode === "raw" ? <RawMarkdown markdown={originalMarkdown} /> : <div className="editor-scroll h-[calc(100vh-18rem)] min-h-[34rem] overflow-auto bg-background/45 p-5"><MarkdownPreview markdown={originalMarkdown} /></div>}
              </Card>
              <div className="hidden items-center justify-center lg:flex">
                <Button aria-label="Translate" disabled={!canTranslate} onClick={() => void translate()} className="h-10 w-10 rounded-lg px-0">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h2 className="font-semibold">Arabic Translation</h2>
                  <span className="text-xs text-muted-foreground" dir="rtl">RTL enabled</span>
                </div>
                {viewMode === "raw" ? <RawMarkdown markdown={translatedMarkdown} rtl /> : <div ref={exportRef} className="editor-scroll h-[calc(100vh-18rem)] min-h-[34rem] overflow-auto bg-background/45 p-5"><MarkdownPreview markdown={translatedMarkdown} rtl /></div>}
              </Card>
            </div>
          )}
        </div>

        <aside className="mx-auto mt-4 grid max-w-[1360px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Local history</h2>
            </div>
            <div className="mt-4 space-y-2">
              {history.length === 0 && <p className="text-sm text-muted-foreground">Completed translations appear here.</p>}
              {history.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => restoreRecord(record)}
                  className="w-full rounded-lg border border-border bg-muted/35 p-3 text-left text-sm hover:bg-muted"
                >
                  <span className="block font-semibold">{record.fileName}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleString()}</span>
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </section>
    </main>
  );
}
