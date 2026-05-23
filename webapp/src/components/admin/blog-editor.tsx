"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";

const Editor = dynamic(
  () =>
    import("./initialized-mdx-editor").then((mod) => mod.InitializedMDXEditor),
  { ssr: false },
);

export const BlogEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />,
);

BlogEditor.displayName = "BlogEditor";
