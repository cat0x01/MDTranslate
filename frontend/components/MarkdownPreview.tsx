"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ markdown, rtl = false }: { markdown: string; rtl?: boolean }) {
  return (
    <article
      dir={rtl ? "rtl" : "ltr"}
      className="markdown-pane prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-primary"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || "_No content yet._"}</ReactMarkdown>
    </article>
  );
}
