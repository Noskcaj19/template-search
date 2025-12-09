import { useActiveEditor } from './EditorContext'

export function FormattingToolbar() {
  const { activeEditor } = useActiveEditor()

  if (!activeEditor) {
    return (
      <div className="formatting-toolbar formatting-toolbar--disabled">
        <button type="button" disabled>B</button>
        <button type="button" disabled>I</button>
        <button type="button" disabled>U</button>
      </div>
    )
  }

  return (
    <div className="formatting-toolbar">
      <button
        type="button"
        onClick={() => activeEditor.chain().focus().toggleBold().run()}
        className={activeEditor.isActive('bold') ? 'active' : ''}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => activeEditor.chain().focus().toggleItalic().run()}
        className={activeEditor.isActive('italic') ? 'active' : ''}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => activeEditor.chain().focus().toggleUnderline().run()}
        className={activeEditor.isActive('underline') ? 'active' : ''}
      >
        U
      </button>
    </div>
  )
}
