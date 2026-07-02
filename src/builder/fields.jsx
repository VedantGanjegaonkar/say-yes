import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Basic labeled input ────────────────────────────────────────────────
export function Field({ label, value, onChange, placeholder, textarea, autoFocus, className }) {
  return (
    <label className={className ? `fld ${className}` : 'fld'}>
      <span className="fld-label">{label}</span>
      {textarea ? (
        <textarea
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      )}
    </label>
  )
}

// ── Drag-and-drop sortable wrapper ─────────────────────────────────────
// Uses positional ids (reorder happens only on drop, so they stay stable
// during a drag). renderRow(i) renders everything after the drag handle.
function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 5 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} className={`srow${isDragging ? ' dragging' : ''}`}>
      <button type="button" className="grip" aria-label="Drag to reorder" {...attributes} {...listeners}>
        ⠿
      </button>
      {children}
    </div>
  )
}

export function Sortable({ count, onReorder, renderRow }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = Array.from({ length: count }, (_, i) => `i${i}`)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          onReorder(Number(active.id.slice(1)), Number(over.id.slice(1)))
        }
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {ids.map((id, i) => (
          <SortableRow key={id} id={id}>
            {renderRow(i)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  )
}

// ── Editable list of plain strings (drag to reorder) ───────────────────
export function StringList({ label, items, onChange, placeholder }) {
  return (
    <div className="list">
      <div className="list-head">
        <span>{label}</span>
        <button type="button" className="mini" onClick={() => onChange([...items, ''])}>
          + Add
        </button>
      </div>
      <Sortable
        count={items.length}
        onReorder={(from, to) => onChange(arrayMove(items, from, to))}
        renderRow={(i) => (
          <>
            <input
              value={items[i]}
              placeholder={placeholder}
              onChange={(e) => {
                const a = [...items]
                a[i] = e.target.value
                onChange(a)
              }}
            />
            <button type="button" className="mini danger" onClick={() => onChange(items.filter((_, x) => x !== i))}>
              ✕
            </button>
          </>
        )}
      />
    </div>
  )
}

// ── Editable list of objects (drag to reorder) ─────────────────────────
// columns = [{ key, label, type?: 'text'|'number'|'checkbox', width?: 'sm' }]
export function ObjectList({ label, items, onChange, columns, makeEmpty }) {
  const setField = (i, key, v) => {
    const a = structuredClone(items)
    a[i][key] = v
    onChange(a)
  }
  return (
    <div className="list">
      <div className="list-head">
        <span>{label}</span>
        <button type="button" className="mini" onClick={() => onChange([...items, makeEmpty()])}>
          + Add
        </button>
      </div>
      <Sortable
        count={items.length}
        onReorder={(from, to) => onChange(arrayMove(items, from, to))}
        renderRow={(i) => (
          <>
            {columns.map((col) =>
              col.type === 'checkbox' ? (
                <label key={col.key} className="ck">
                  <input
                    type="checkbox"
                    checked={!!items[i][col.key]}
                    onChange={(e) => setField(i, col.key, e.target.checked)}
                  />
                  {col.label}
                </label>
              ) : (
                <input
                  key={col.key}
                  className={col.width === 'sm' ? 'sm' : ''}
                  type={col.type === 'number' ? 'number' : 'text'}
                  value={items[i][col.key] ?? ''}
                  placeholder={col.label}
                  onChange={(e) =>
                    setField(i, col.key, col.type === 'number' ? Number(e.target.value) : e.target.value)
                  }
                />
              )
            )}
            <button type="button" className="mini danger" onClick={() => onChange(items.filter((_, x) => x !== i))}>
              ✕
            </button>
          </>
        )}
      />
    </div>
  )
}
