"use client"

import { Download, FilePlus2, FolderOpen, Upload, X } from "lucide-react"

type LibraryDialogProps = {
  open: boolean
  status: string
  onClose: () => void
  onOpen: () => void
  onCreate: () => void
  onExport: () => void
  onImport: (file: File) => void
}

export function LibraryDialog({ open, status, onClose, onOpen, onCreate, onExport, onImport }: LibraryDialogProps) {
  if (!open) return null

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="manager-dialog library-dialog" role="dialog" aria-modal="true" aria-labelledby="library-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">Ficheiro partilhado</p><h2 id="library-title">Biblioteca</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar biblioteca"><X /></button>
        </div>
        <p className="library-status">{status}</p>
        <div className="library-actions">
          <button className="secondary-button" onClick={onOpen}><FolderOpen /> Abrir ficheiro existente</button>
          <button className="primary-button" onClick={onCreate}><FilePlus2 /> Criar novo ficheiro</button>
          <button className="secondary-button" onClick={onExport}><Download /> Exportar cópia</button>
          <label className="secondary-button file-label"><Upload /> Importar cópia<input type="file" accept=".json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.currentTarget.value = "" }} /></label>
        </div>
        <p className="dialog-hint">As categorias, estilos e favoritos ficam guardados neste browser e, quando ligares um ficheiro, sincronizados automaticamente com a biblioteca JSON.</p>
        <div className="dialog-footer"><button className="secondary-button" onClick={onClose}>Fechar</button></div>
      </section>
    </div>
  )
}
