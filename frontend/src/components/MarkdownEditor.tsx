"use client";

import { useRef } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}

function insertWrapped(
  current: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  fallback: string,
) {
  const selected = current.slice(start, end);
  const text = selected || fallback;
  const next = `${current.slice(0, start)}${prefix}${text}${suffix}${current.slice(end)}`;
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + text.length;
  return { next, cursorStart, cursorEnd };
}

function insertLinePrefix(current: string, start: number, end: number, prefix: string) {
  const lineStart = current.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = current.indexOf("\n", end);
  const safeLineEnd = lineEnd === -1 ? current.length : lineEnd;
  const block = current.slice(lineStart, safeLineEnd);
  const withPrefix = block
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
  const next = `${current.slice(0, lineStart)}${withPrefix}${current.slice(safeLineEnd)}`;
  return { next, cursorStart: lineStart, cursorEnd: lineStart + withPrefix.length };
}

export default function MarkdownEditor({
  value,
  onChange,
  rows = 5,
  required = false,
  placeholder,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const apply = (mode: "bold" | "h2" | "ul" | "ol" | "link") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    let result: { next: string; cursorStart: number; cursorEnd: number };
    if (mode === "bold") {
      result = insertWrapped(value, start, end, "**", "**", "bold text");
    } else if (mode === "h2") {
      result = insertWrapped(value, start, end, "## ", "", "Heading");
    } else if (mode === "ul") {
      result = insertLinePrefix(value, start, end, "- ");
    } else if (mode === "ol") {
      result = insertLinePrefix(value, start, end, "1. ");
    } else {
      result = insertWrapped(value, start, end, "[", "](https://example.com)", "link text");
    }

    onChange(result.next);
    requestAnimationFrame(() => {
      const target = textareaRef.current;
      if (!target) return;
      target.focus();
      target.setSelectionRange(result.cursorStart, result.cursorEnd);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => apply("bold")} className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600">
          Bold
        </button>
        <button type="button" onClick={() => apply("h2")} className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600">
          H2
        </button>
        <button type="button" onClick={() => apply("ul")} className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600">
          List
        </button>
        <button type="button" onClick={() => apply("ol")} className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600">
          1. List
        </button>
        <button type="button" onClick={() => apply("link")} className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600">
          Link
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
      />
      <p className="text-xs text-zinc-500">
        Supports Markdown: headings, bold, lists, links.
      </p>
    </div>
  );
}
