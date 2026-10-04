"use client";

function numberedLines(markdown: string) {
  const lines = (markdown || "").split("\n");
  return lines.map((line, index) => (
    <div key={`${index}-${line}`} className="grid min-w-max grid-cols-[3rem_1fr] gap-4">
      <span className="select-none text-right text-muted-foreground">{index + 1}</span>
      <span>{line || " "}</span>
    </div>
  ));
}

export function RawMarkdown({ markdown, rtl = false }: { markdown: string; rtl?: boolean }) {
  return (
    <pre
      dir={rtl ? "rtl" : "ltr"}
      className="editor-scroll h-[calc(100vh-18rem)] min-h-[34rem] overflow-auto rounded-b-lg bg-background/45 p-5 font-mono text-sm leading-7 text-foreground"
    >
      {numberedLines(markdown || "")}
    </pre>
  );
}
