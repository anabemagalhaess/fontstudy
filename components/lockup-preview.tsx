"use client"

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
  layout?: {
    logoSize: number
    logoGap: number
    taglineGap: number
    nameOffset: number
    taglineOffset: number
    margin: number
  }
  showGuides?: boolean
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

  return (
    <div className={`lockup-preview${compact ? " lockup-preview--compact" : ""}${showGuides ? " has-guides" : ""}`} style={styles}>
      {showGuides && <div className="preview-guide preview-guide--top" aria-hidden="true"><span>margem</span></div>}
      <div className="lockup-preview__content">
        {showLogo && logoData && (
          <img
            className="lockup-preview__logo"
            src={logoData}
            alt="Logótipo do estudo"
            style={{ width: layout ? `${layout.logoSize}px` : undefined, marginBottom: layout ? `${layout.logoGap}px` : undefined }}
          />
        )}
        {showGuides && <div className="preview-guide preview-guide--name" aria-hidden="true"><span>linha do nome</span></div>}
        <span className="lockup-preview__name" style={{ fontFamily: `"${fontFamily}", sans-serif`, transform: `translateY(${layout?.nameOffset ?? 0}px)` }}>
          {title || "O teu nome"}
        </span>
        {showTagline && tagline && (
          <>
            {showGuides && <div className="preview-guide preview-guide--tagline" aria-hidden="true"><span>linha da tagline</span></div>}
            <span className="lockup-preview__tagline" style={{ fontFamily: `"${taglineFontFamily || fontFamily}", sans-serif`, transform: `translateY(${layout?.taglineOffset ?? 0}px)` }}>
              {tagline}
            </span>
          </>
        )}
      </div>
      {showGuides && <div className="preview-guide preview-guide--bottom" aria-hidden="true"><span>área segura</span></div>}
    </div>
  )
}
