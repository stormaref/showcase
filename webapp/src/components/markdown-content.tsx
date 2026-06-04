type Props = {
  html: string;
  className?: string;
};

export function MarkdownContent({ html, className = "" }: Props) {
  return (
    <div
      dir="auto"
      className={`prose-showcase ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
