export type FontFamily = { family: string; styles: string[] }
export type ViewMode = "grid" | "tagline" | "logo" | "list" | "study"

export function getFontWeightFromStyle(style?: string): number | undefined {
  if (!style) return undefined
  const value = style.toLocaleLowerCase("en-US")
  if (/\b(thin|hairline)\b/.test(value)) return 100
  if (/\b(extra|ultra)[ -]?light\b|\b(extralight|ultralight)\b/.test(value)) return 200
  if (/\blight\b/.test(value)) return 300
  if (/\b(regular|normal|roman|book)\b/.test(value)) return 400
  if (/\bmedium\b/.test(value)) return 500
  if (/\b(semi|demi)[ -]?bold\b|\b(semibold|demibold)\b/.test(value)) return 600
  if (/\b(extra|ultra)[ -]?bold\b|\b(extrabold|ultrabold)\b/.test(value)) return 800
  if (/\b(black|heavy)\b/.test(value)) return 900
  if (/\bbold\b/.test(value)) return 700
  return undefined
}

export function getFontStyleFromStyle(style?: string): "normal" | "italic" | "oblique" {
  const value = style?.toLocaleLowerCase("en-US") ?? ""
  if (/\boblique\b/.test(value)) return "oblique"
  if (/\bitalic\b/.test(value)) return "italic"
  return "normal"
}
export type StudyLayout = { logoSize: number; logoGap: number; logoOffset: number; taglineGap: number; nameOffset: number; taglineOffset: number; margin: number; guideTop: number; guideName: number; guideTagline: number; guideBottom: number; guideLeft: number; guideRight: number }
export type StudySettings = { columns: number; layout: StudyLayout; fontSize: number; taglineSize: number; fontWeight: number }
export type FavoriteCombo = { n: string; t: string }
export type FontLibrary = {
  app: "fontes-biblioteca"
  version: 1
  categories: string[]
  tags: Record<string, string>
  favs: string[]
  tfavs: string[]
  tfont: string
  nfont: string
  combos: FavoriteCombo[]
  uninstalledFonts?: FontFamily[]
  preferences?: {
    view: ViewMode
    filter: string
    query: string
    columns: number
    studyFamilies: string[]
    layout: StudyLayout
    dark: boolean
    title: string
    tagline: string
    fontSize: number
    taglineSize: number
    fontWeight: number
    logoData: string
    showGuides: boolean
    studioExpanded: boolean
    selectedFontStyles?: Record<string, string>
    studySettings?: StudySettings
  }
}
export const UNCATEGORIZED = "Sem classificar"
export const DEFAULT_CATEGORIES = ["Serif", "Sem serif", "Manuscrita", "Display", "Mono"]
