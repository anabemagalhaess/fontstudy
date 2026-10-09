export type FontFamily = { family: string; styles: string[] }
export type ViewMode = "grid" | "tagline" | "logo" | "list" | "study"
export type StudyLayout = { logoSize: number; logoGap: number; logoOffset: number; taglineGap: number; nameOffset: number; taglineOffset: number; margin: number }
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
}
export const UNCATEGORIZED = "Sem classificar"
export const DEFAULT_CATEGORIES = ["Serif", "Sem serif", "Manuscrita", "Display", "Mono"]
