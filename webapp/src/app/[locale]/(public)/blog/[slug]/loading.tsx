// Skeleton in the shape of a post: date, two-line title, excerpt, then body
// lines. Mirrors the page's container so nothing jumps when it streams in.
export default function BlogPostLoading() {
  const bar = "bg-gray-100 motion-safe:animate-pulse";

  return (
    <div aria-busy="true" className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
      <div aria-hidden>
        <div className={`h-4 w-32 ${bar}`} />
        <div className={`mt-5 h-10 w-11/12 md:h-12 ${bar}`} />
        <div className={`mt-3 h-10 w-2/3 md:h-12 ${bar}`} />
        <div className={`mt-8 h-5 w-full ${bar}`} />
        <div className={`mt-3 h-5 w-4/5 ${bar}`} />
        <div className="mt-12 space-y-4 border-t border-gray-200 pt-12">
          {["w-full", "w-full", "w-11/12", "w-full", "w-3/4", "w-full", "w-5/6"].map(
            (width, index) => (
              <div key={index} className={`h-4 ${width} ${bar}`} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
