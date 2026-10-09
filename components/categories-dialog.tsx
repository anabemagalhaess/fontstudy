"use client"

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

type CategoriesDialogProps = {
  open: boolean
  categories: string[]
  onClose: () => void
  onAdd: (name: string) => void
  onRename: (current: string, next: string) => void
  onDelete: (name: string) => void
  onMove: (index: number, direction: -1 | 1) => void
}

export function CategoriesDialog({ open, categories, onClose, onAdd, onRename, onDelete, onMove }: CategoriesDialogProps) {
  const [newCategory, setNewCategory] = useState("")
  if (!open) return null

  const submitNew = () => {
    onAdd(newCategory)
    setNewCategory("")
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="manager-dialog categories-dialog" role="dialog" aria-modal="true" aria-labelledby="categories-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">Organização</p><h2 id="categories-title">Categorias</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar categorias"><X /></button>
        </div>
        <form className="category-add" onSubmit={(event) => { event.preventDefault(); submitNew() }}>
          <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Nova categoria (ex.: Tribal)" aria-label="Nome da nova categoria" />
          <button className="primary-button" type="submit" disabled={!newCategory.trim()}><Plus /> Adicionar</button>
        </form>
        <p className="dialog-hint">Use as setas para ordenar os estilos. Essa ordem também é aplicada aos filtros e às listas de categoria.</p>
        <ol className="category-list">
          {categories.map((category, index) => (
            <li key={category} className="category-row">
              <span className="category-order">{String(index + 1).padStart(2, "0")}</span>
              <span className="category-row__name">{category}</span>
              <div className="category-row__actions">
                <button className="icon-button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Mover ${category} para cima`} title="Mover para cima"><ArrowUp /></button>
                <button className="icon-button" onClick={() => onMove(index, 1)} disabled={index === categories.length - 1} aria-label={`Mover ${category} para baixo`} title="Mover para baixo"><ArrowDown /></button>
                <button className="icon-button" onClick={() => { const next = window.prompt("Novo nome da categoria", category); if (next !== null) onRename(category, next) }} aria-label={`Renomear ${category}`} title="Renomear"><Pencil /></button>
                <button className="icon-button danger-button" onClick={() => { if (window.confirm(`Apagar “${category}”? As fontes voltam a ficar sem classificar.`)) onDelete(category) }} aria-label={`Apagar ${category}`} title="Apagar"><Trash2 /></button>
              </div>
            </li>
          ))}
        </ol>
        <div className="dialog-footer"><button className="secondary-button" onClick={onClose}>Fechar</button></div>
      </section>
    </div>
  )
}
