"use client";

import type { ForwardedRef } from "react";
import { useCallback, useSyncExternalStore } from "react";
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

// MDXEditor styles its toolbar and popups from its own colour scales, not the
// site palette, so follow <html data-theme> (see lib/theme.tsx) and switch on
// its shipped `dark-theme` class. MDXEditor copies `className` onto the popup
// container it portals into <body>, so dropdowns and dialogs follow too.
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.dataset.theme === "dark";

export function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const { uploadImage } = useUploadProgress();
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);

  const handleImageUpload = useCallback(
    async (file: File) => {
      const data = await uploadImage(file);
      return data.url;
    },
    [uploadImage],
  );

  return (
    <div className="rounded-none border border-gray-200 bg-shell">
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
        className={`${dark ? "dark-theme" : ""} ${props.className ?? ""}`.trim()}
        ref={editorRef}
      />
    </div>
  );
}
