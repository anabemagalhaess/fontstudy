export type FontFamily = { family: string; styles: string[] }
export type ViewMode = "grid" | "tagline" | "logo" | "list" | "study"
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
    studySettings?: StudySettings
  }
}
export const UNCATEGORIZED = "Sem classificar"
export const DEFAULT_CATEGORIES = ["Serif", "Sem serif", "Manuscrita", "Display", "Mono"]
