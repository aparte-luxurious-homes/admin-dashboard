"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { UploadBlogImage } from "@/src/lib/request-handlers/blogMgt";
import styles from "./RichTextEditor.module.css";

/**
 * The article body editor. What it can produce is exactly what the API's
 * sanitiser keeps (services/blog/content.py): headings 2-4, text styles,
 * lists, quotes, links, images (https), tables, alignment and YouTube embeds.
 * Anything else pasted in is dropped on save.
 */

interface Props {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
}

function ToolButton({
    label,
    icon,
    onClick,
    active = false,
    disabled = false,
}: {
    label: string;
    icon: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-30 ${
                active ? "bg-gray-200 text-gray-900" : ""
            }`}
        >
            <Icon icon={icon} width={18} />
        </button>
    );
}

const Divider = () => <span className="w-px h-6 bg-gray-200 mx-1" aria-hidden />;

function Group({ children }: { children: ReactNode }) {
    return <div className="flex items-center gap-0.5">{children}</div>;
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage: () => void; uploading: boolean }) {
    const chain = () => editor.chain().focus();
    const inTable = editor.isActive("table");

    const setLink = () => {
        const previous = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link address (leave empty to remove the link)", previous ?? "https://");
        if (url === null) return;
        if (url.trim() === "" || url.trim() === "https://") {
            chain().extendMarkRange("link").unsetLink().run();
            return;
        }
        const href = /^(https?:|mailto:|tel:|\/)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
        const internal = href.startsWith("/") || /^https?:\/\/(www\.)?aparte\.ng/i.test(href);
        chain()
            .extendMarkRange("link")
            .setLink({ href, target: internal ? null : "_blank" })
            .run();
    };

    const addVideo = () => {
        const url = window.prompt("Paste a YouTube video link");
        if (!url) return;
        const ok = editor.commands.setYoutubeVideo({ src: url.trim() });
        if (!ok) toast.error("That doesn't look like a YouTube link.");
    };

    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-white rounded-t-xl">
            <Group>
                <select
                    aria-label="Text style"
                    className="text-sm border border-gray-200 rounded-md px-1.5 py-1 bg-white"
                    value={
                        editor.isActive("heading", { level: 2 })
                            ? "h2"
                            : editor.isActive("heading", { level: 3 })
                              ? "h3"
                              : "p"
                    }
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === "p") chain().setParagraph().run();
                        else chain().toggleHeading({ level: v === "h2" ? 2 : 3 }).run();
                    }}
                >
                    <option value="p">Normal text</option>
                    <option value="h2">Heading</option>
                    <option value="h3">Subheading</option>
                </select>
            </Group>
            <Divider />
            <Group>
                <ToolButton label="Bold" icon="lucide:bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()} />
                <ToolButton label="Italic" icon="lucide:italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()} />
                <ToolButton label="Underline" icon="lucide:underline" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()} />
                <ToolButton label="Strikethrough" icon="lucide:strikethrough" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()} />
            </Group>
            <Divider />
            <Group>
                <ToolButton label="Bulleted list" icon="lucide:list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()} />
                <ToolButton label="Numbered list" icon="lucide:list-ordered" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()} />
                <ToolButton label="Quote" icon="lucide:quote" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()} />
                <ToolButton label="Divider line" icon="lucide:minus" onClick={() => chain().setHorizontalRule().run()} />
            </Group>
            <Divider />
            <Group>
                <ToolButton label="Align left" icon="lucide:align-left" active={editor.isActive({ textAlign: "left" })} onClick={() => chain().setTextAlign("left").run()} />
                <ToolButton label="Align centre" icon="lucide:align-center" active={editor.isActive({ textAlign: "center" })} onClick={() => chain().setTextAlign("center").run()} />
                <ToolButton label="Align right" icon="lucide:align-right" active={editor.isActive({ textAlign: "right" })} onClick={() => chain().setTextAlign("right").run()} />
            </Group>
            <Divider />
            <Group>
                <ToolButton label="Link" icon="lucide:link" active={editor.isActive("link")} onClick={setLink} />
                <ToolButton label={uploading ? "Uploading image..." : "Image"} icon={uploading ? "line-md:loading-loop" : "lucide:image-plus"} disabled={uploading} onClick={onImage} />
                <ToolButton label="YouTube video" icon="lucide:youtube" onClick={addVideo} />
                <ToolButton
                    label="Table"
                    icon="lucide:table"
                    active={inTable}
                    onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    disabled={inTable}
                />
            </Group>
            {inTable && (
                <>
                    <Divider />
                    <Group>
                        <ToolButton label="Add row below" icon="lucide:between-horizontal-end" onClick={() => chain().addRowAfter().run()} />
                        <ToolButton label="Add column right" icon="lucide:between-vertical-end" onClick={() => chain().addColumnAfter().run()} />
                        <ToolButton label="Delete row" icon="lucide:rows-3" onClick={() => chain().deleteRow().run()} />
                        <ToolButton label="Delete column" icon="lucide:columns-3" onClick={() => chain().deleteColumn().run()} />
                        <ToolButton label="Delete table" icon="lucide:trash-2" onClick={() => chain().deleteTable().run()} />
                    </Group>
                </>
            )}
            <span className="flex-1" />
            <Group>
                <ToolButton label="Undo" icon="lucide:undo-2" disabled={!editor.can().undo()} onClick={() => chain().undo().run()} />
                <ToolButton label="Redo" icon="lucide:redo-2" disabled={!editor.can().redo()} onClick={() => chain().redo().run()} />
            </Group>
        </div>
    );
}

export default function RichTextEditor({ value, onChange, disabled = false }: Props) {
    const fileInput = useRef<HTMLInputElement>(null);
    const { mutateAsync: upload, isPending: uploading } = UploadBlogImage();
    const lastEmitted = useRef(value);

    const editor = useEditor({
        // Next renders on the server first; rendering the editor there would
        // not match the browser and React would complain.
        immediatelyRender: false,
        editable: !disabled,
        extensions: [
            StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
            Image.configure({ inline: false }),
            Youtube.configure({ nocookie: true, controls: true, modestBranding: true, width: 640, height: 360 }),
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({ placeholder: "Write your article here..." }),
        ],
        content: value,
        onUpdate: ({ editor: e }) => {
            const html = e.isEmpty ? "" : e.getHTML();
            lastEmitted.current = html;
            onChange(html);
        },
    });

    // Content loaded after the editor mounted (opening an existing article).
    useEffect(() => {
        if (!editor || value === lastEmitted.current) return;
        lastEmitted.current = value;
        editor.commands.setContent(value || "", false);
    }, [editor, value]);

    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [editor, disabled]);

    const onPickImage = async (file: File | undefined) => {
        if (!file || !editor) return;
        try {
            const url = await upload(file);
            const alt = window.prompt("Describe this image for people who can't see it (and for Google)", "") ?? "";
            editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Could not upload the image"));
        } finally {
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    return (
        <div className={`border border-gray-300 rounded-xl bg-white ${disabled ? "opacity-70" : ""}`}>
            {editor && !disabled && (
                <Toolbar editor={editor} uploading={uploading} onImage={() => fileInput.current?.click()} />
            )}
            <div className={styles.content}>
                <EditorContent editor={editor} />
            </div>
            <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
            />
        </div>
    );
}
