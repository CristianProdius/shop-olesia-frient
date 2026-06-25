"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Link as LinkIcon,
    Undo2,
    Redo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    disabled,
}) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    if (!editor) {
        return (
            <div className="rounded-md border border-input bg-background">
                <div className="min-h-40 p-3" />
            </div>
        );
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const toolbarButton = "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50";
    const activeButton = "bg-accent text-accent-foreground";

    return (
        <div className="rounded-md border border-input bg-background">
            <div className="flex flex-wrap items-center gap-1 border-b p-1">
                <button
                    type="button"
                    aria-label="Bold"
                    aria-pressed={editor.isActive('bold')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(toolbarButton, editor.isActive('bold') && activeButton)}
                >
                    <Bold className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Italic"
                    aria-pressed={editor.isActive('italic')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(toolbarButton, editor.isActive('italic') && activeButton)}
                >
                    <Italic className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Heading 2"
                    aria-pressed={editor.isActive('heading', { level: 2 })}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn(toolbarButton, editor.isActive('heading', { level: 2 }) && activeButton)}
                >
                    <Heading2 className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Heading 3"
                    aria-pressed={editor.isActive('heading', { level: 3 })}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={cn(toolbarButton, editor.isActive('heading', { level: 3 }) && activeButton)}
                >
                    <Heading3 className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Bullet list"
                    aria-pressed={editor.isActive('bulletList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(toolbarButton, editor.isActive('bulletList') && activeButton)}
                >
                    <List className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Ordered list"
                    aria-pressed={editor.isActive('orderedList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(toolbarButton, editor.isActive('orderedList') && activeButton)}
                >
                    <ListOrdered className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Link"
                    aria-pressed={editor.isActive('link')}
                    disabled={disabled}
                    onClick={setLink}
                    className={cn(toolbarButton, editor.isActive('link') && activeButton)}
                >
                    <LinkIcon className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Undo"
                    disabled={disabled}
                    onClick={() => editor.chain().focus().undo().run()}
                    className={toolbarButton}
                >
                    <Undo2 className="size-4" />
                </button>
                <button
                    type="button"
                    aria-label="Redo"
                    disabled={disabled}
                    onClick={() => editor.chain().focus().redo().run()}
                    className={toolbarButton}
                >
                    <Redo2 className="size-4" />
                </button>
            </div>
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none min-h-40 p-3 focus:outline-none"
            />
        </div>
    );
};

export default RichTextEditor;
