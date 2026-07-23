"use client";

import type { ForwardedRef } from "react";
import { useCallback } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  imagePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  ListsToggle,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useUploadProgress } from "@/components/admin/upload-progress-context";

export function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const { uploadImage } = useUploadProgress();

  const handleImageUpload = useCallback(
    async (file: File) => {
      const data = await uploadImage(file);
      return data.url;
    },
    [uploadImage],
  );

  return (
    <div className="rounded-none border border-gray-200 bg-white">
      <MDXEditor
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          imagePlugin({
            imageUploadHandler: handleImageUpload,
          }),
          codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              txt: "Plain",
              go: "Go",
              ts: "TypeScript",
              js: "JavaScript",
            },
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <BlockTypeSelect />
                <CreateLink />
                <InsertImage />
                <ListsToggle />
              </>
            ),
          }),
        ]}
        contentEditableClassName="prose-showcase min-h-[320px] px-4 py-3"
        {...props}
        ref={editorRef}
      />
    </div>
  );
}
