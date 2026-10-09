"use client"

import { useRef } from "react"
import type { StudyLayout } from "@/components/font-manager-types"

type GuideKey = "nameOffset" | "taglineOffset" | "margin"
type GuideDrag = { pointerId: number; startY: number; startValue: number }

type LockupPreviewProps = {
  title: string
  tagline: string
  fontFamily: string
  taglineFontFamily?: string
  fontSize: number
  fontWeight: number
  taglineSize: number
  logoData?: string
  showLogo?: boolean
  showTagline?: boolean
  compact?: boolean
  layout?: StudyLayout
  showGuides?: boolean
  onLayoutChange?: (key: GuideKey, value: number) => void
}

export function LockupPreview({
  title,
  tagline,
  fontFamily,
  taglineFontFamily,
  fontSize,
  fontWeight,
  taglineSize,
  logoData,
  showLogo = false,
  showTagline = false,
  compact = false,
  layout,
  showGuides = false,
  onLayoutChange,
}: LockupPreviewProps) {
  const styles = {
    "--preview-name-size": `${fontSize}px`,
    "--preview-tagline-size": `${taglineSize}px`,
    "--preview-name-offset": `${layout?.nameOffset ?? 0}px`,
    "--preview-tagline-offset": `${layout?.taglineOffset ?? 0}px`,
    "--preview-logo-gap": `${layout?.logoGap ?? 24}px`,
    "--preview-tagline-gap": `${layout?.taglineGap ?? 18}px`,
    "--preview-margin": `${layout?.margin ?? 48}px`,
  } as React.CSSProperties

  const renderGuide = (
    label: string,
    key: GuideKey,
    value: number,
    min: number,
    max: number,
    direction: number,
    className: string,
  ) => (
    <button
      type="button"
      role="slider"
      aria-label={`${label}, ${value} píxeis. Arrasta para ajustar.`}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`preview-guide ${className}`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { pointerId: event.pointerId, startY: event.clientY, startValue: value }
      }}
      onPointerMove={(event) => {
        const activeDrag = drag.current
        if (!activeDrag || activeDrag.pointerId !== event.pointerId) return
        const delta = (event.clientY - activeDrag.startY) * direction
        onLayoutChange?.(key, Math.max(min, Math.min(max, Math.round(activeDrag.startValue + delta))))
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId === event.pointerId) drag.current = null
      }}
      onPointerCancel={() => { drag.current = null }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const change = (event.key === "ArrowUp" ? -step : step) * direction
        onLayoutChange?.(key, Math.max(min, Math.min(max, value + change)))
      }}
    >
      <span>{label}</span>
    </button>
  )

  const drag = useRef<GuideDrag | null>(null)

  return (
    <div className={`lockup-preview${compact ? " lockup-preview--compact" : ""}${showGuides ? " has-guides" : ""}`} style={styles}>
      {showGuides && renderGuide("margem superior", "margin", layout?.margin ?? 48, 16, 220, 1, "preview-guide--top")}
      <div className="lockup-preview__content">
        {showLogo && logoData && (
          <img
            className="lockup-preview__logo"
            src={logoData}
            alt="Logótipo do estudo"
            style={{ width: layout ? `${layout.logoSize}px` : undefined, marginBottom: layout ? `${layout.logoGap}px` : undefined, transform: `translateY(${layout?.logoOffset ?? 0}px)` }}
          />
        )}
        {showGuides && renderGuide("linha do nome", "nameOffset", layout?.nameOffset ?? 0, -180, 180, 1, "preview-guide--name")}
        <span className="lockup-preview__name" style={{ fontFamily: `"${fontFamily}", sans-serif`, transform: `translateY(${layout?.nameOffset ?? 0}px)` }}>
          {title || "O teu nome"}
        </span>
        {showTagline && tagline && (
          <>
            {showGuides && renderGuide("linha da tagline", "taglineOffset", layout?.taglineOffset ?? 0, -180, 180, 1, "preview-guide--tagline")}
            <span className="lockup-preview__tagline" style={{ fontFamily: `"${taglineFontFamily || fontFamily}", sans-serif`, transform: `translateY(${layout?.taglineOffset ?? 0}px)` }}>
              {tagline}
            </span>
          </>
        )}
      </div>
      {showGuides && renderGuide("margem inferior", "margin", layout?.margin ?? 48, 16, 220, -1, "preview-guide--bottom")}
    </div>
  )
}
