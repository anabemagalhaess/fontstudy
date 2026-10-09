"use client"

import { FolderUp, Upload, X } from "lucide-react"

type ClassifyDialogProps = {
  open: boolean
  categories: string[]
  onClose: () => void
  onUploadCategory: (category: string, files: FileList | null) => void
  onUploadAll: (files: FileList | null) => void
}

export function ClassifyDialog({ open, categories, onClose, onUploadCategory, onUploadAll }: ClassifyDialogProps) {
  if (!open) return null

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="manager-dialog classify-dialog" role="dialog" aria-modal="true" aria-labelledby="classify-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">Organização automática</p><h2 id="classify-title">Classificar fontes</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar classificação"><X /></button>
        </div>
        <p className="dialog-hint">Escolhe uma pasta para cada estilo. O seletor inclui subpastas e a app associa os ficheiros OTF/TTF às famílias já instaladas, sem importar nem duplicar ficheiros.</p>
        <label className="secondary-button classify-all-button"><FolderUp /> Classificar pasta com subpastas<input type="file" multiple accept=".otf,.ttf,.ttc,.woff,.woff2" {...{ webkitdirectory: "" } as Record<string, string>} onChange={(event) => { onUploadAll(event.target.files); event.currentTarget.value = "" }} /></label>
        <div className="classify-category-list">
          {categories.map((category) => (
            <div className="classify-category-row" key={category}>
              <span className="classify-category-name">{category}</span>
              <label className="icon-button classify-upload" title={`Escolher pasta para ${category}`} aria-label={`Escolher pasta para ${category}`}>
                <Upload />
                <input type="file" multiple accept=".otf,.ttf,.ttc,.woff,.woff2" {...{ webkitdirectory: "" } as Record<string, string>} onChange={(event) => { onUploadCategory(category, event.target.files); event.currentTarget.value = "" }} />
              </label>
            </div>
          ))}
        </div>
        <div className="dialog-footer"><button className="secondary-button" onClick={onClose}>Fechar</button></div>
      </section>
    </div>
  )
}
