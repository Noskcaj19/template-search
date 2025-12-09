import { createContext, useContext, useState, type ReactNode } from 'react'
import { type Editor } from '@tiptap/react'

type EditorContextType = {
  activeEditor: Editor | null
  setActiveEditor: (editor: Editor | null) => void
}

const EditorContext = createContext<EditorContextType | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)

  return (
    <EditorContext.Provider value={{ activeEditor, setActiveEditor }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useActiveEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useActiveEditor must be used within EditorProvider')
  }
  return context
}
