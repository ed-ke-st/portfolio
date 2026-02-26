import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          p: ({ ...props }) => <p className="leading-relaxed mb-3" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
          a: ({ ...props }) => (
            <a
              className="text-[var(--app-accent)] underline underline-offset-2 hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-2 border-[var(--app-border)] pl-3 italic my-3" {...props} />
          ),
          code: ({ ...props }) => (
            <code className="px-1 py-0.5 rounded bg-[var(--app-card)] text-[var(--app-text)]" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
