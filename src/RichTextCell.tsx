import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'

type RichTextCellProps = {
  value: string
  className?: string
  onChange: (html: string) => void
  onFocus: () => void
  isActive: boolean
}

function ActiveEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    autofocus: 'end',
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <>
      <EditorContent editor={editor} className="rich-text-cell" />
      {editor && (
        <div className="cell-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
          >
            U
          </button>
        </div>
      )}
    </>
  )
}

export function RichTextCell({ value, className, onChange, onFocus, isActive }: RichTextCellProps) {
  if (isActive) {
    return (
      <td className={className}>
        <ActiveEditor value={value} onChange={onChange} />
      </td>
    )
  }

  return (
    <td
      className={className}
      onClick={onFocus}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  )
}
