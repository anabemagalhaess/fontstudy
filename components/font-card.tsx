"use client"

import { Download, Heart, Smile, Star, Type } from "lucide-react"
import { LockupPreview } from "@/components/lockup-preview"
import type { FontFamily, StudyLayout, ViewMode } from "@/components/font-manager-types"

type FontCardProps = {
  font: FontFamily
  title: string
  tagline: string
  category: string
  categories: string[]
  view: ViewMode
  fontSize: number
  fontWeight: number
  taglineSize: number
  nameFontFamily: string
  taglineFontFamily: string
  layout: StudyLayout
  logoData: string
  favoriteName: boolean
  favoriteTagline: boolean
  favoriteCombo: boolean
  inStudy: boolean
  selected: boolean
  onSelect: () => void
  onToggleName: () => void
  onToggleTagline: () => void
  onToggleCombo: () => void
  onToggleStudy: () => void
  onCategoryChange: (category: string) => void
}

export function FontCard({
  font,
  title,
  tagline,
  category,
  categories,
  view,
  fontSize,
  fontWeight,
  taglineSize,
  nameFontFamily,
  taglineFontFamily,
  layout,
  logoData,
  favoriteName,
  favoriteTagline,
  favoriteCombo,
  inStudy,
  selected,
  onSelect,
  onToggleName,
  onToggleTagline,
  onToggleCombo,
  onToggleStudy,
  onCategoryChange,
}: FontCardProps) {
  const showLogo = view === "logo" || view === "list" || view === "study"
  const showTagline = view !== "grid"

  const downloadPreview = () => {
    const safeTitle = title || font.family
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520"><rect width="100%" height="100%" fill="white"/><text x="600" y="245" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(nameFontFamily || font.family)}, sans-serif" font-size="${fontSize * 2}" font-weight="${fontWeight}" fill="#17191c">${escapeXml(safeTitle)}</text>${showTagline && tagline ? `<text x="600" y="340" text-anchor="middle" font-family="${escapeXml(taglineFontFamily || font.family)}, sans-serif" font-size="${taglineSize * 1.5}" fill="#626973">${escapeXml(tagline)}</text>` : ""}</svg>`
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${font.family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-estudo.svg`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <article className={`font-card${selected ? " is-selected" : ""}`}>
      <div className="font-card__top">
        <button className="font-card__family" onClick={onSelect} title={`Usar ${font.family} no estudo`}>
          {font.family}
        </button>
        <div className="font-card__actions" aria-label={`Favoritos de ${font.family}`}>
          <button
            className={`icon-button name-star${favoriteName ? " is-active" : ""}`}
            aria-label={`${favoriteName ? "Remover" : "Adicionar"} ${font.family} dos favoritos do nome`}
            aria-pressed={favoriteName}
            title="Favorito do nome"
            onClick={onToggleName}
          >
            <Star fill={favoriteName ? "currentColor" : "none"} />
          </button>
          <button
            className={`icon-button text-favorite${favoriteTagline ? " is-active" : ""}`}
            aria-label={`${favoriteTagline ? "Remover" : "Adicionar"} ${font.family} dos favoritos da tagline`}
            aria-pressed={favoriteTagline}
            title="Favorito da tagline"
            onClick={onToggleTagline}
          >
            <Type />
          </button>
          <button
            className={`icon-button heart-button combo-heart${favoriteCombo ? " is-active" : ""}`}
            aria-label={`${favoriteCombo ? "Remover" : "Guardar"} composição ${font.family} e ${tagline || "tagline"}`}
            aria-pressed={favoriteCombo}
            title="Guardar composição Happy (nome + tagline)"
            onClick={onToggleCombo}
          >
            <Heart fill={favoriteCombo ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <button className="font-card__preview-button" onClick={onSelect} aria-label={`Pré-visualizar ${font.family}`}>
        <LockupPreview
          title={title || font.family}
          tagline={tagline}
          fontFamily={nameFontFamily || font.family}
          taglineFontFamily={taglineFontFamily || font.family}
          fontSize={fontSize}
          fontWeight={fontWeight}
          taglineSize={taglineSize}
          layout={layout}
          logoData={showLogo ? logoData : ""}
          showLogo={showLogo}
          showTagline={showTagline}
          compact
        />
      </button>

      <div className="font-card__footer">
        <label className="category-select-label">
          <span className="sr-only">Categoria de {font.family}</span>
          <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            <option value="Sem classificar">Sem classificar</option>
          </select>
        </label>
        <div className="font-card__footer-actions">
          <button
            className={`icon-button study-button${inStudy ? " is-active" : ""}`}
            aria-label={`${inStudy ? "Retirar" : "Marcar"} ${font.family} para o Logo Study`}
            aria-pressed={inStudy}
            title={inStudy ? "Remover do Logo Study" : "Marcar para o Logo Study"}
            onClick={onToggleStudy}
          >
            <Smile />
          </button>
          <button className="icon-button download-button" aria-label={`Descarregar estudo de ${font.family}`} title="Descarregar SVG" onClick={downloadPreview}>
            <Download />
          </button>
        </div>
      </div>
      {font.styles.length > 0 && <span className="font-card__styles">{font.styles.length} {font.styles.length === 1 ? "estilo" : "estilos"}</span>}
    </article>
  )
}

function escapeXml(value: string) {
  return value.replace(/[<>&\"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;" })[character] ?? character)
}
