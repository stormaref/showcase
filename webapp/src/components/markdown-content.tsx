type Props = {
  html: string;
  className?: string;
};

export function MarkdownContent({ html, className = "" }: Props) {
  return (
    <div
      className={`prose-showcase ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
