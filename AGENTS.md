# AGENTS.md

## Commands
- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs tsc + vite build)
- **Lint:** `npm run lint`
- **No test framework configured**

## Architecture
React 19 + Vite + TypeScript app for extracting/editing tables from Word documents.
- `src/App.tsx` - Main app: file upload (mammoth), table state, docx export
- `src/RichTextCell.tsx` - Tiptap-based rich text editor cell component
- `src/VirtualizedTable.tsx` - Virtualized table rendering (@tanstack/react-virtual)
- Data persisted to localStorage under `docs-table-data`

## Code Style
- Modern typescript
- Use `type` keyword for type definitions (not `interface`)
- Named exports for components (except `App` which is default)
- Prefer `const` arrow functions for internal helpers
- Import types with `type` keyword: `import { type Foo } from 'bar'`
- ESLint: typescript-eslint recommended + react-hooks + react-refresh
- No semicolons optional (codebase uses semicolons)
