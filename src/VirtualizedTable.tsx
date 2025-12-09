import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { RichTextCell } from './RichTextCell'

type TableRow = {
  key: string
  value: string
  keyText: string
  valueText: string
}
type ColumnKey = 'key' | 'value'
type ActiveCell = { rowIndex: number; column: ColumnKey } | null

type VirtualizedTableProps = {
  data: TableRow[]
  activeCell: ActiveCell
  onCellChange: (rowIndex: number, column: ColumnKey, html: string) => void
  onCellFocus: (rowIndex: number, column: ColumnKey) => void
  rowIndexes?: number[]
}

export function VirtualizedTable({
  data,
  activeCell,
  onCellChange,
  onCellFocus,
  rowIndexes,
}: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())

  const measureElement = useCallback((el: HTMLTableRowElement | null) => {
    if (el) {
      const index = Number(el.dataset.index)
      rowRefs.current.set(index, el)
      virtualizer.measureElement(el)
    }
  }, [])

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  const items = virtualizer.getVirtualItems()

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th className="col-key">Item</th>
            <th className="col-value">Body</th>
          </tr>
        </thead>
      </table>
      <div ref={parentRef} className="virtual-scroll-container">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="data-table virtual-table">
            <tbody>
              {items.map((virtualRow) => {
                const displayIndex = virtualRow.index
                const row = data[displayIndex]
                const originalIndex = rowIndexes ? rowIndexes[displayIndex] : displayIndex

                return (
                  <tr
                    key={originalIndex}
                    data-index={originalIndex}
                    ref={measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td className="col-num">{displayIndex + 1}</td>
                    <RichTextCell
                      className="col-key"
                      value={row.key}
                      onChange={(html) => onCellChange(originalIndex, 'key', html)}
                      onFocus={() => onCellFocus(originalIndex, 'key')}
                      isActive={activeCell?.rowIndex === originalIndex && activeCell?.column === 'key'}
                    />
                    <RichTextCell
                      className="col-value"
                      value={row.value}
                      onChange={(html) => onCellChange(originalIndex, 'value', html)}
                      onFocus={() => onCellFocus(originalIndex, 'value')}
                      isActive={activeCell?.rowIndex === originalIndex && activeCell?.column === 'value'}
                    />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
