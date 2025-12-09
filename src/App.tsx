import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import mammoth from 'mammoth'
import { Document, Packer, Table, TableRow as DocxTableRow, TableCell, Paragraph, TextRun, WidthType } from 'docx'
import { saveAs } from 'file-saver'
import { VirtualizedTable } from './VirtualizedTable'
import './App.css'

type TableRow = {
  key: string
  value: string
  keyText: string
  valueText: string
}
type TableData = TableRow[]
type ColumnKey = 'key' | 'value'
type ActiveCell = { rowIndex: number; column: ColumnKey } | null
type ScoredIndex = { index: number; score: number }

const STORAGE_KEY = 'docs-table-data'

function htmlToPlainText(html: string): string {
  if (!html) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  return doc.body.textContent?.trim() ?? ''
}

function countOccurrences(text: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let pos = text.indexOf(needle)
  while (pos !== -1) {
    count++
    pos = text.indexOf(needle, pos + needle.length)
  }
  return count
}

function searchRows(data: TableData, rawQuery: string): ScoredIndex[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) {
    return data.map((_, index) => ({ index, score: 0 }))
  }

  const tokens = query.split(/\s+/).filter(Boolean)
  const results: ScoredIndex[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const keyText = row.keyText.toLowerCase()
    const valueText = row.valueText.toLowerCase()
    const combined = `${keyText} ${valueText}`

    let score = 0

    const phraseCount = countOccurrences(combined, query)
    if (phraseCount > 0) {
      score += phraseCount * 10
    }

    for (const token of tokens) {
      if (!token) continue
      const keyCount = countOccurrences(keyText, token)
      const valueCount = countOccurrences(valueText, token)
      score += keyCount * 4 + valueCount * 2
    }

    if (score > 0) {
      results.push({ index: i, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

function parseHtmlToTextRuns(html: string): TextRun[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const runs: TextRun[] = []

  const processNode = (node: Node, styles: { bold?: boolean; italic?: boolean; underline?: boolean }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text) {
        runs.push(new TextRun({
          text,
          bold: styles.bold,
          italics: styles.italic,
          underline: styles.underline ? {} : undefined,
        }))
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()
      const newStyles = { ...styles }

      if (tag === 'strong' || tag === 'b') newStyles.bold = true
      if (tag === 'em' || tag === 'i') newStyles.italic = true
      if (tag === 'u') newStyles.underline = true

      el.childNodes.forEach((child) => processNode(child, newStyles))
    }
  }

  doc.body.firstChild?.childNodes.forEach((node) => processNode(node, {}))

  if (runs.length === 0) {
    runs.push(new TextRun(''))
  }

  return runs
}

function App() {
  const [tableData, setTableData] = useState<TableData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as Array<{ key?: string; value?: string; keyText?: string; valueText?: string }>
    return parsed.map((row) => ({
      key: row.key ?? '',
      value: row.value ?? '',
      keyText: row.keyText ?? htmlToPlainText(row.key ?? ''),
      valueText: row.valueText ?? htmlToPlainText(row.value ?? ''),
    }))
  })
  const [activeCell, setActiveCell] = useState<ActiveCell>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const updateCell = (rowIndex: number, column: ColumnKey, html: string) => {
    setTableData(prev =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row
        if (column === 'key') {
          return { ...row, key: html, keyText: htmlToPlainText(html) }
        }
        return { ...row, value: html, valueText: htmlToPlainText(html) }
      })
    )
  }

  const scored = useMemo(
    () => searchRows(tableData, searchQuery),
    [tableData, searchQuery]
  )

  const displayIndexes = useMemo(
    () => searchQuery.trim()
      ? scored.map((r) => r.index)
      : tableData.map((_, i) => i),
    [scored, searchQuery, tableData]
  )

  const displayData = useMemo(
    () => displayIndexes.map((i) => tableData[i]),
    [displayIndexes, tableData]
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tableData))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, data not saved')
      }
    }
  }, [tableData])
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const tables = doc.querySelectorAll('table')

      const rows: TableData = []

      tables.forEach((table) => {
        const tableRows = table.querySelectorAll('tr')
        tableRows.forEach((row) => {
          const cells = row.querySelectorAll('td, th')
          if (cells.length >= 2) {
            const key = cells[0].innerHTML.trim()
            const value = cells[1].innerHTML.trim()
            rows.push({
              key,
              value,
              keyText: htmlToPlainText(key),
              valueText: htmlToPlainText(value),
            })
          }
        })
      })

      setTableData(rows)
    } catch (err) {
      setError('Failed to parse document')
      console.error(err)
    }
  }

  const handleDownload = async () => {
    const rows = tableData.map(
      ({ key, value }) =>
        new DocxTableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: parseHtmlToTextRuns(key) })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: parseHtmlToTextRuns(value) })],
            }),
          ],
        })
    )

    const doc = new Document({
      sections: [
        {
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows,
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, 'table-export.docx')
  }

  return (
    <div className="app">
      <h1>Template Search</h1>
      <input
        type="file"
        accept=".docx"
        onChange={handleFileUpload}
      />

      {tableData.length > 0 && (
        <button className="download-btn" onClick={handleDownload}>
          Download as Word
        </button>
      )}

      {error && <p className="error">{error}</p>}

      {tableData.length > 0 && (
        <>
          <div className="search-bar">
            <input
              type="search"
              placeholder="Search all columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span className="search-results-count">
                {displayData.length} of {tableData.length} rows
              </span>
            )}
          </div>
          <VirtualizedTable
            data={displayData}
            rowIndexes={displayIndexes}
            activeCell={activeCell}
            onCellChange={updateCell}
            onCellFocus={(rowIndex, column) => setActiveCell({ rowIndex, column })}
          />
        </>
      )}
    </div>
  )
}

export default App
