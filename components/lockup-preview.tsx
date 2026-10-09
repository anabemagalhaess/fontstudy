"use client"

import { useRef } from "react"
import type { StudyLayout } from "@/components/font-manager-types"

type GuideKey = "guideTop" | "guideName" | "guideTagline" | "guideBottom" | "guideLeft" | "guideRight"
type GuideAxis = "x" | "y"
type GuideDrag = { pointerId: number; startCoordinate: number; startValue: number; trackSize: number }
type ObjectDrag = { pointerId: number; startY: number; startValue: number }
type PositionKey = "nameOffset" | "taglineOffset"

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
  draggablePositions?: boolean
  onLayoutChange?: (key: keyof StudyLayout, value: number) => void
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
  draggablePositions = false,
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
    "--guide-top": `${layout?.guideTop ?? 12}%`,
    "--guide-name": `${layout?.guideName ?? 44}%`,
    "--guide-tagline": `${layout?.guideTagline ?? 62}%`,
    "--guide-bottom": `${layout?.guideBottom ?? 88}%`,
    "--guide-left": `${layout?.guideLeft ?? 8}%`,
    "--guide-right": `${layout?.guideRight ?? 92}%`,
  } as React.CSSProperties

  const guideDrag = useRef<GuideDrag | null>(null)
  const objectDrag = useRef<ObjectDrag | null>(null)

  const renderGuide = (label: string, key: GuideKey, value: number, min: number, max: number, axis: GuideAxis, className: string) => (
    <button
      key={key}
      type="button"
      role="slider"
      aria-label={`${label}, ${value} por cento. Arrasta para ajustar a referência.`}
      aria-orientation={axis === "y" ? "vertical" : "horizontal"}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`preview-guide ${axis === "y" ? "preview-guide--horizontal" : "preview-guide--vertical"} ${className}`}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
        if (!bounds) return
        const trackSize = axis === "y" ? bounds.height : bounds.width
        event.currentTarget.setPointerCapture(event.pointerId)
        guideDrag.current = {
          pointerId: event.pointerId,
          startCoordinate: axis === "y" ? event.clientY : event.clientX,
          startValue: value,
          trackSize,
        }
      }}
      onPointerMove={(event) => {
        const activeDrag = guideDrag.current
        if (!activeDrag || activeDrag.pointerId !== event.pointerId) return
        const coordinate = axis === "y" ? event.clientY : event.clientX
        const valueDelta = ((coordinate - activeDrag.startCoordinate) / activeDrag.trackSize) * 100
        onLayoutChange?.(key, Math.max(min, Math.min(max, Math.round(activeDrag.startValue + valueDelta))))
      }}
      onPointerUp={(event) => {
        if (guideDrag.current?.pointerId === event.pointerId) guideDrag.current = null
      }}
      onPointerCancel={() => { guideDrag.current = null }}
      onKeyDown={(event) => {
        const negativeKey = axis === "y" ? "ArrowUp" : "ArrowLeft"
        const positiveKey = axis === "y" ? "ArrowDown" : "ArrowRight"
        if (event.key !== negativeKey && event.key !== positiveKey) return
        event.preventDefault()
        const step = event.shiftKey ? 5 : 1
        const delta = event.key === negativeKey ? -step : step
        onLayoutChange?.(key, Math.max(min, Math.min(max, value + delta)))
      }}
    >
      <span>{label}</span>
    </button>
  )

  const beginObjectDrag = (event: React.PointerEvent<HTMLSpanElement>, startValue: number) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    objectDrag.current = { pointerId: event.pointerId, startY: event.clientY, startValue }
  }

  const moveObject = (event: React.PointerEvent<HTMLSpanElement>, key: PositionKey) => {
    const activeDrag = objectDrag.current
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return
    onLayoutChange?.(key, Math.max(-180, Math.min(180, Math.round(activeDrag.startValue + event.clientY - activeDrag.startY))))
  }

  const endObjectDrag = (pointerId: number) => {
    if (objectDrag.current?.pointerId === pointerId) objectDrag.current = null
  }

  const handleObjectKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>, key: PositionKey, value: number) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
    event.preventDefault()
    const step = event.shiftKey ? 10 : 1
    const delta = event.key === "ArrowUp" ? -step : step
    onLayoutChange?.(key, Math.max(-180, Math.min(180, value + delta)))
  }

  const nameOffset = layout?.nameOffset ?? 0
  const taglineOffset = layout?.taglineOffset ?? 0

  return (
    <div className={`lockup-preview${compact ? " lockup-preview--compact" : ""}${showGuides ? " has-guides" : ""}`} style={styles}>
      {showGuides && <>
        {renderGuide("margem superior", "guideTop", layout?.guideTop ?? 12, 3, 97, "y", "preview-guide--top")}
        {renderGuide("linha do nome", "guideName", layout?.guideName ?? 44, 3, 97, "y", "preview-guide--name")}
        {renderGuide("linha da tagline", "guideTagline", layout?.guideTagline ?? 62, 3, 97, "y", "preview-guide--tagline")}
        {renderGuide("margem inferior", "guideBottom", layout?.guideBottom ?? 88, 3, 97, "y", "preview-guide--bottom")}
        {renderGuide("guia vertical esquerda", "guideLeft", layout?.guideLeft ?? 8, 3, 47, "x", "preview-guide--left")}
        {renderGuide("guia vertical direita", "guideRight", layout?.guideRight ?? 92, 53, 97, "x", "preview-guide--right")}
      </>}
      <div className="lockup-preview__content">
        {showLogo && logoData && (
          <img
            className="lockup-preview__logo"
            src={logoData}
            alt="Logótipo do estudo"
            style={{ width: layout ? `${layout.logoSize}px` : undefined, marginBottom: layout ? `${layout.logoGap}px` : undefined, transform: `translateY(${layout?.logoOffset ?? 0}px)` }}
          />
        )}
        <span
          className={`lockup-preview__name${draggablePositions ? " lockup-preview__positionable" : ""}`}
          style={{ fontFamily: `"${fontFamily}", sans-serif`, fontWeight, transform: `translateY(${nameOffset}px)` }}
          role={draggablePositions ? "slider" : undefined}
          tabIndex={draggablePositions ? 0 : undefined}
          aria-label={draggablePositions ? "Posição vertical do nome. Usa as setas ou arrasta para ajustar." : undefined}
          aria-orientation={draggablePositions ? "vertical" : undefined}
          aria-valuemin={draggablePositions ? -180 : undefined}
          aria-valuemax={draggablePositions ? 180 : undefined}
          aria-valuenow={draggablePositions ? nameOffset : undefined}
          onPointerDown={draggablePositions ? (event) => beginObjectDrag(event, nameOffset) : undefined}
          onPointerMove={draggablePositions ? (event) => moveObject(event, "nameOffset") : undefined}
          onPointerUp={draggablePositions ? (event) => endObjectDrag(event.pointerId) : undefined}
          onPointerCancel={draggablePositions ? () => { objectDrag.current = null } : undefined}
          onKeyDown={draggablePositions ? (event) => handleObjectKeyDown(event, "nameOffset", nameOffset) : undefined}
        >
          {title || "O teu nome"}
        </span>
        {showTagline && tagline && (
          <span
            className={`lockup-preview__tagline${draggablePositions ? " lockup-preview__positionable" : ""}`}
            style={{ fontFamily: `"${taglineFontFamily || fontFamily}", sans-serif`, transform: `translateY(${taglineOffset}px)` }}
            role={draggablePositions ? "slider" : undefined}
            tabIndex={draggablePositions ? 0 : undefined}
            aria-label={draggablePositions ? "Posição vertical da tagline. Usa as setas ou arrasta para ajustar." : undefined}
            aria-orientation={draggablePositions ? "vertical" : undefined}
            aria-valuemin={draggablePositions ? -180 : undefined}
            aria-valuemax={draggablePositions ? 180 : undefined}
            aria-valuenow={draggablePositions ? taglineOffset : undefined}
            onPointerDown={draggablePositions ? (event) => beginObjectDrag(event, taglineOffset) : undefined}
            onPointerMove={draggablePositions ? (event) => moveObject(event, "taglineOffset") : undefined}
            onPointerUp={draggablePositions ? (event) => endObjectDrag(event.pointerId) : undefined}
            onPointerCancel={draggablePositions ? () => { objectDrag.current = null } : undefined}
            onKeyDown={draggablePositions ? (event) => handleObjectKeyDown(event, "taglineOffset", taglineOffset) : undefined}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  )
}
