type Props = {
  html: string;
  className?: string;
};

/**
 * The page title is the only <h1>. When a post's content uses h1 too, shift
 * every heading down one level (h1→h2 … h5→h6) so the outline stays intact.
 */
function demoteHeadings(html: string): string {
  if (!/<h1[\s>]/i.test(html)) return html;
  return html.replace(/<(\/?)h([1-6])(?=[\s>])/gi, (_, slash: string, level: string) => {
    return `<${slash}h${Math.min(Number(level) + 1, 6)}`;
  });
}

export function MarkdownContent({ html, className = "" }: Props) {
  return (
    <div
      dir="auto"
      className={`prose-showcase ${className}`}
      dangerouslySetInnerHTML={{ __html: demoteHeadings(html) }}
    />
  );
}
