export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Showcase. All rights reserved.
      </div>
    </footer>
  );
}
