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
    value: string
    onChange: (html: string) => void
    placeholder?: string
    disabled?: boolean
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
            Placeholder.configure({ placeholder: placeholder ?? '' }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px]',
            },
        },
    })

    if (!editor) return null

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('URL', previousUrl ?? '')
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const toolbarButtonClass = (active?: boolean) =>
        cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none',
            active && 'bg-accent text-accent-foreground'
        )

    return (
        <div className="rounded-md border border-input bg-background">
            <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
                <button
                    type="button"
                    aria-label="Bold"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('bold'))}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Italic"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('italic'))}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Heading 2"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Heading 3"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('heading', { level: 3 }))}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <Heading3 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Bullet list"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('bulletList'))}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Ordered list"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('orderedList'))}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Link"
                    disabled={disabled}
                    className={toolbarButtonClass(editor.isActive('link'))}
                    onClick={setLink}
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Undo"
                    disabled={disabled || !editor.can().undo()}
                    className={toolbarButtonClass()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo2 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    aria-label="Redo"
                    disabled={disabled || !editor.can().redo()}
                    className={toolbarButtonClass()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo2 className="w-4 h-4" />
                </button>
            </div>
            <EditorContent editor={editor} className="px-3 py-2" />
        </div>
    )
}

export default RichTextEditor
