"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, Eye, EyeOff, FolderUp, Heart, ImagePlus, Moon, Search, Star, Sun, Type, X } from "lucide-react"
import { CategoriesDialog } from "@/components/categories-dialog"
import { ClassifyDialog } from "@/components/classify-dialog"
import { FontCard } from "@/components/font-card"
import { LibraryDialog } from "@/components/library-dialog"
import { LockupPreview } from "@/components/lockup-preview"
import { DEFAULT_CATEGORIES, UNCATEGORIZED, type FavoriteCombo, type FontFamily, type FontLibrary, type StudyLayout, type StudySettings, type ViewMode } from "@/components/font-manager-types"

type LocalFont = { family: string; style: string }
type LocalFontHandle = {
  name: string
  queryPermission: (options: { mode: "readwrite" }) => Promise<PermissionState>
  requestPermission: (options: { mode: "readwrite" }) => Promise<PermissionState>
  getFile: () => Promise<File>
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>
}
type FontManagerWindow = Window & {
  queryLocalFonts?: () => Promise<LocalFont[]>
  showOpenFilePicker?: (options?: unknown) => Promise<LocalFontHandle[]>
  showSaveFilePicker?: (options?: unknown) => Promise<LocalFontHandle>
}
type FontFile = File & { webkitRelativePath?: string }

type ViewOption = { id: ViewMode; label: string }
const VIEW_OPTIONS: ViewOption[] = [
  { id: "grid", label: "Grelha 1" },
  { id: "tagline", label: "Grelha 2" },
  { id: "logo", label: "Grelha Logo" },
  { id: "list", label: "Lista vertical" },
  { id: "study", label: "Logo Study" },
]
const INITIAL_LAYOUT: StudyLayout = { logoSize: 86, logoGap: 24, logoOffset: 0, taglineGap: 22, nameOffset: 0, taglineOffset: 0, margin: 52 }
const INITIAL_STUDY_SETTINGS: StudySettings = { columns: 5, layout: INITIAL_LAYOUT, fontSize: 58, taglineSize: 24, fontWeight: 400 }
const NOT_INSTALLED = "Não instaladas"
const EMPTY_LIBRARY: FontLibrary = {
  app: "fontes-biblioteca",
  version: 1,
  categories: DEFAULT_CATEGORIES,
  tags: {},
  favs: [],
  tfavs: [],
  tfont: "",
  nfont: "",
  combos: [],
  uninstalledFonts: [],
}

export function FontManager() {
  const [fonts, setFonts] = useState<FontFamily[]>([])
  const [uninstalledFonts, setUninstalledFonts] = useState<FontFamily[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [tags, setTags] = useState<Record<string, string>>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [taglineFavorites, setTaglineFavorites] = useState<string[]>([])
  const [favoriteCombos, setFavoriteCombos] = useState<FavoriteCombo[]>([])
  const [studyFamilies, setStudyFamilies] = useState<string[]>([])
  const [nameFont, setNameFont] = useState("")
  const [taglineFont, setTaglineFont] = useState("")
  const [view, setView] = useState<ViewMode>("grid")
  const [filter, setFilter] = useState("Todas")
  const [query, setQuery] = useState("")
  const [title, setTitle] = useState("Ana Magalhães")
  const [tagline, setTagline] = useState("organic designs")
  const [fontSize, setFontSize] = useState(58)
  const [taglineSize, setTaglineSize] = useState(24)
  const [fontWeight, setFontWeight] = useState(400)
  const [columns, setColumns] = useState(5)
  const [logoData, setLogoData] = useState("")
  const [layout, setLayout] = useState<StudyLayout>(INITIAL_LAYOUT)
  const [studySettings, setStudySettings] = useState<StudySettings>(INITIAL_STUDY_SETTINGS)
  const [showGuides, setShowGuides] = useState(true)
  const [studioExpanded, setStudioExpanded] = useState(true)
  const [dark, setDark] = useState(false)
  const [fontStatus, setFontStatus] = useState("Carrega as fontes instaladas para começar")
  const [notice, setNotice] = useState("")
  const [libraryStatus, setLibraryStatus] = useState("Sem ficheiro ligado. Os dados ficam guardados neste browser.")
  const [libraryHandle, setLibraryHandle] = useState<LocalFontHandle | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [classifyOpen, setClassifyOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const logoInput = useRef<HTMLInputElement>(null)

  const applyLibrary = useCallback((value: unknown) => {
    if (!value || typeof value !== "object" || (value as FontLibrary).app !== "fontes-biblioteca") {
      throw new Error("Ficheiro de biblioteca inválido.")
    }
    const library = value as Partial<FontLibrary>
    setCategories(Array.isArray(library.categories) && library.categories.length ? library.categories : DEFAULT_CATEGORIES)
    setTags(library.tags && typeof library.tags === "object" ? library.tags : {})
    setFavorites(Array.isArray(library.favs) ? library.favs : [])
    setTaglineFavorites(Array.isArray(library.tfavs) ? library.tfavs : [])
    setFavoriteCombos(Array.isArray(library.combos) ? library.combos : [])
    setUninstalledFonts(Array.isArray(library.uninstalledFonts) ? library.uninstalledFonts : [])
    setTaglineFont(typeof library.tfont === "string" ? library.tfont : "")
    setNameFont(typeof library.nfont === "string" ? library.nfont : "")
    const preferences = library.preferences
    if (preferences) {
      if (VIEW_OPTIONS.some((item) => item.id === preferences.view)) setView(preferences.view)
      if (typeof preferences.filter === "string") setFilter(preferences.filter)
      if (typeof preferences.query === "string") setQuery(preferences.query)
      if (Number.isFinite(preferences.columns)) setColumns(Math.max(1, Math.min(12, preferences.columns)))
      if (Array.isArray(preferences.studyFamilies)) setStudyFamilies(preferences.studyFamilies)
      if (preferences.layout && typeof preferences.layout === "object") setLayout({ ...INITIAL_LAYOUT, ...preferences.layout })
      if (preferences.studySettings && typeof preferences.studySettings === "object") {
        setStudySettings({ ...INITIAL_STUDY_SETTINGS, ...preferences.studySettings, layout: { ...INITIAL_LAYOUT, ...preferences.studySettings.layout } })
      } else {
        setStudySettings({
          columns: preferences.columns ?? INITIAL_STUDY_SETTINGS.columns,
          layout: { ...INITIAL_LAYOUT, ...preferences.layout },
          fontSize: preferences.fontSize ?? INITIAL_STUDY_SETTINGS.fontSize,
          taglineSize: preferences.taglineSize ?? INITIAL_STUDY_SETTINGS.taglineSize,
          fontWeight: preferences.fontWeight ?? INITIAL_STUDY_SETTINGS.fontWeight,
        })
      }
      if (typeof preferences.dark === "boolean") setDark(preferences.dark)
      if (typeof preferences.title === "string") setTitle(preferences.title)
      if (typeof preferences.tagline === "string") setTagline(preferences.tagline)
      if (Number.isFinite(preferences.fontSize)) setFontSize(preferences.fontSize)
      if (Number.isFinite(preferences.taglineSize)) setTaglineSize(preferences.taglineSize)
      if (Number.isFinite(preferences.fontWeight)) setFontWeight(preferences.fontWeight)
      if (typeof preferences.logoData === "string") setLogoData(preferences.logoData)
      if (typeof preferences.showGuides === "boolean") setShowGuides(preferences.showGuides)
      if (typeof preferences.studioExpanded === "boolean") setStudioExpanded(preferences.studioExpanded)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      try {
        const saved = localStorage.getItem("fontes-lib")
        if (saved) applyLibrary(JSON.parse(saved))
        const preferences = JSON.parse(localStorage.getItem("fontes-preferencias") || "{}") as {
          view?: ViewMode; filter?: string; query?: string; columns?: number; studyFamilies?: string[]; layout?: StudyLayout; dark?: boolean
          title?: string; tagline?: string; fontSize?: number; taglineSize?: number; fontWeight?: number
          logoData?: string; showGuides?: boolean; studioExpanded?: boolean; studySettings?: StudySettings
        }
        if (preferences.view && VIEW_OPTIONS.some((item) => item.id === preferences.view)) setView(preferences.view)
        if (typeof preferences.filter === "string") setFilter(preferences.filter)
        if (typeof preferences.query === "string") setQuery(preferences.query)
        if (preferences.columns) setColumns(Math.max(1, Math.min(12, preferences.columns)))
        if (Array.isArray(preferences.studyFamilies)) setStudyFamilies(preferences.studyFamilies)
        if (preferences.layout) setLayout({ ...INITIAL_LAYOUT, ...preferences.layout })
        if (preferences.studySettings) {
          setStudySettings({ ...INITIAL_STUDY_SETTINGS, ...preferences.studySettings, layout: { ...INITIAL_LAYOUT, ...preferences.studySettings.layout } })
        } else {
          setStudySettings({
            columns: preferences.columns ?? INITIAL_STUDY_SETTINGS.columns,
            layout: { ...INITIAL_LAYOUT, ...preferences.layout },
            fontSize: preferences.fontSize ?? INITIAL_STUDY_SETTINGS.fontSize,
            taglineSize: preferences.taglineSize ?? INITIAL_STUDY_SETTINGS.taglineSize,
            fontWeight: preferences.fontWeight ?? INITIAL_STUDY_SETTINGS.fontWeight,
          })
        }
        if (typeof preferences.dark === "boolean") setDark(preferences.dark)
        if (typeof preferences.title === "string") setTitle(preferences.title)
        if (typeof preferences.tagline === "string") setTagline(preferences.tagline)
        if (Number.isFinite(preferences.fontSize)) setFontSize(preferences.fontSize!)
        if (Number.isFinite(preferences.taglineSize)) setTaglineSize(preferences.taglineSize!)
        if (Number.isFinite(preferences.fontWeight)) setFontWeight(preferences.fontWeight!)
        if (typeof preferences.logoData === "string") setLogoData(preferences.logoData)
        if (typeof preferences.showGuides === "boolean") setShowGuides(preferences.showGuides)
        if (typeof preferences.studioExpanded === "boolean") setStudioExpanded(preferences.studioExpanded)
        const dbRequest = indexedDB.open("fontes-lib", 1)
        dbRequest.onupgradeneeded = () => dbRequest.result.createObjectStore("k")
        dbRequest.onsuccess = async () => {
          try {
            const tx = dbRequest.result.transaction("k", "readonly")
            const getRequest = tx.objectStore("k").get("h")
            getRequest.onsuccess = async () => {
              const handle = getRequest.result as LocalFontHandle | undefined
              if (!handle || cancelled) return
              if (await handle.queryPermission({ mode: "readwrite" }) === "granted") {
                const data = JSON.parse(await (await handle.getFile()).text())
                applyLibrary(data)
                setLibraryHandle(handle)
                setLibraryStatus(`Ligada a ${handle.name}. As alterações são gravadas automaticamente.`)
              } else {
                setLibraryHandle(handle)
                setLibraryStatus(`Biblioteca ${handle.name} guardada. Reativa o acesso para continuar a sincronizar.`)
              }
            }
          } catch {
            setLibraryStatus("Biblioteca local disponível. Liga um ficheiro JSON para sincronização permanente.")
          }
        }
        dbRequest.onerror = () => setLibraryStatus("Biblioteca local disponível. Liga um ficheiro JSON para sincronização permanente.")
      } catch {
        setNotice("Não foi possível recuperar as preferências guardadas neste browser.")
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }
    restore()
    return () => { cancelled = true }
  }, [applyLibrary])

  const snapshot = useMemo<FontLibrary>(() => ({
    app: "fontes-biblioteca",
    version: 1,
    categories,
    tags,
    favs: favorites,
    tfavs: taglineFavorites,
    tfont: taglineFont,
    nfont: nameFont,
    combos: favoriteCombos,
    uninstalledFonts,
    preferences: {
      view,
      filter,
      query,
      columns,
      studyFamilies,
      layout,
      dark,
      title,
      tagline,
      fontSize,
      taglineSize,
      fontWeight,
      logoData,
      showGuides,
      studioExpanded,
      studySettings,
    },
  }), [categories, tags, favorites, taglineFavorites, taglineFont, nameFont, favoriteCombos, uninstalledFonts, view, filter, query, columns, studyFamilies, layout, dark, title, tagline, fontSize, taglineSize, fontWeight, logoData, showGuides, studioExpanded, studySettings])

  useEffect(() => {
    if (!hydrated) return
    const preferences = { view, filter, query, columns, studyFamilies, layout, dark, title, tagline, fontSize, taglineSize, fontWeight, showGuides, studioExpanded, studySettings }
    try {
      localStorage.setItem("fontes-lib", JSON.stringify(snapshot))
      localStorage.setItem("fontes-preferencias", JSON.stringify(preferences))
    } catch {
      setNotice("O armazenamento do browser está cheio. Exporta uma cópia da biblioteca para não perderes os dados.")
    }
    const timeout = window.setTimeout(async () => {
      if (!libraryHandle) return
      try {
        if (await libraryHandle.queryPermission({ mode: "readwrite" }) !== "granted") return
        const writable = await libraryHandle.createWritable()
        await writable.write(JSON.stringify(snapshot, null, 1))
        await writable.close()
        setLibraryStatus(`Ligada a ${libraryHandle.name}. As alterações são gravadas automaticamente.`)
      } catch {
        setLibraryStatus(`Não foi possível gravar ${libraryHandle.name}. Reativa o acesso à biblioteca.`)
      }
    }, 450)
    return () => window.clearTimeout(timeout)
  }, [snapshot, hydrated, libraryHandle, view, filter, query, columns, studyFamilies, layout, dark, title, tagline, fontSize, taglineSize, fontWeight, logoData, showGuides, studioExpanded, studySettings])

  const loadFonts = async () => {
    const fontWindow = window as FontManagerWindow
    if (!fontWindow.queryLocalFonts) {
      setFontStatus("Este browser não suporta a leitura de fontes locais. Abre a app num separador do Chrome ou Edge.")
      return
    }
    setFontStatus("A pedir acesso às fontes instaladas…")
    setNotice("")
    try {
      const families = new Map<string, FontFamily>()
      for (const font of await fontWindow.queryLocalFonts()) {
        const current = families.get(font.family) || { family: font.family, styles: [] }
        if (font.style && !current.styles.includes(font.style)) current.styles.push(font.style)
        families.set(font.family, current)
      }
      const list = [...families.values()].sort((a, b) => a.family.localeCompare(b.family, "pt-PT"))
      setFonts(list)
      if (!nameFont && list[0]) setNameFont(list[0].family)
      setFontStatus(`${list.length} ${list.length === 1 ? "família encontrada" : "famílias encontradas"}`)
      if (!list.length) setNotice("Não foram encontradas fontes. Confirma as permissões do browser e tenta novamente.")
    } catch {
      setFontStatus("Sem permissão para ler as fontes. Autoriza o acesso no Chrome ou Edge e tenta novamente.")
    }
  }

  const fontMap = useMemo(() => new Map(fonts.map((font) => [font.family, font])), [fonts])
  const activeFont = fontMap.get(nameFont) || fonts[0]
  const activeColumns = view === "study" ? studySettings.columns : columns
  const activeLayout = view === "study" ? studySettings.layout : layout
  const activeFontSize = view === "study" ? studySettings.fontSize : fontSize
  const activeTaglineSize = view === "study" ? studySettings.taglineSize : taglineSize
  const activeFontWeight = view === "study" ? studySettings.fontWeight : fontWeight
  const selectedFamilies = view === "study" ? studyFamilies : fonts.map((font) => font.family)
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-PT")
  const visibleItems = useMemo<Array<{ font: FontFamily; combo?: FavoriteCombo }>>(() => {
    if (view === "study") {
      return selectedFamilies
        .map((family) => fontMap.get(family))
        .filter((font): font is FontFamily => Boolean(font))
        .map((font) => ({ font, combo: undefined }))
    }
    if (filter === "Composições") {
      return favoriteCombos
        .filter((combo) => !normalizedQuery || `${combo.n} ${combo.t}`.toLocaleLowerCase("pt-PT").includes(normalizedQuery))
        .map((combo) => ({ font: fontMap.get(combo.n), combo }))
        .filter((item): item is { font: FontFamily; combo: FavoriteCombo } => Boolean(item.font))
    }
    if (filter === NOT_INSTALLED) {
      const installedNames = new Set(fonts.map((font) => compactName(font.family)))
      return uninstalledFonts
        .filter((font) => !installedNames.has(compactName(font.family)))
        .filter((font) => !normalizedQuery || font.family.toLocaleLowerCase("pt-PT").includes(normalizedQuery))
        .map((font) => ({ font, combo: undefined }))
    }
    return fonts.filter((font) => {
      if (normalizedQuery && !font.family.toLocaleLowerCase("pt-PT").includes(normalizedQuery)) return false
      if (filter === "Favoritos do nome") return favorites.includes(font.family)
      if (filter === "Favoritos da tagline") return taglineFavorites.includes(font.family)
      if (filter === "Sem classificar") return categoryFor(font.family, tags, categories) === UNCATEGORIZED
      if (filter !== "Todas") return categoryFor(font.family, tags, categories) === filter
      return true
    }).map((font) => ({ font, combo: undefined }))
  }, [view, selectedFamilies, filter, favoriteCombos, normalizedQuery, fontMap, fonts, uninstalledFonts, favorites, taglineFavorites, tags, categories])

  const updateLibraryHandle = async (handle: LocalFontHandle) => {
    const permission = await handle.queryPermission({ mode: "readwrite" })
    const allowed = permission === "granted" || await handle.requestPermission({ mode: "readwrite" }) === "granted"
    if (!allowed) {
      setLibraryStatus(`O acesso a ${handle.name} não foi autorizado.`)
      return
    }
    try {
      const file = await handle.getFile()
      if (file.size > 0) applyLibrary(JSON.parse(await file.text()))
      setLibraryHandle(handle)
      const request = indexedDB.open("fontes-lib", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("k")
      request.onsuccess = () => {
        const transaction = request.result.transaction("k", "readwrite")
        transaction.objectStore("k").put(handle, "h")
        transaction.oncomplete = () => setLibraryStatus(`Ligada a ${handle.name}. As alterações são gravadas automaticamente.`)
      }
      setLibraryOpen(false)
    } catch {
      setLibraryStatus("O ficheiro não contém uma biblioteca de fontes válida. Podes criar um ficheiro novo ou importar uma cópia JSON.")
    }
  }

  const openLibrary = async () => {
    const fontWindow = window as FontManagerWindow
    if (!fontWindow.showOpenFilePicker) {
      setLibraryStatus("O seletor de ficheiros requer Chrome ou Edge num separador próprio. Também podes importar uma cópia JSON.")
      return
    }
    try {
      const [handle] = await fontWindow.showOpenFilePicker({ types: [{ description: "Biblioteca de fontes", accept: { "application/json": [".json"] } }] })
      if (handle) await updateLibraryHandle(handle)
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setLibraryStatus("Não foi possível abrir o ficheiro selecionado.")
    }
  }

  const createLibrary = async () => {
    const fontWindow = window as FontManagerWindow
    if (!fontWindow.showSaveFilePicker) {
      setLibraryStatus("O seletor de ficheiros requer Chrome ou Edge num separador próprio.")
      return
    }
    try {
      const handle = await fontWindow.showSaveFilePicker({ suggestedName: "fontes-biblioteca.json", types: [{ description: "Biblioteca de fontes", accept: { "application/json": [".json"] } }] })
      setLibraryHandle(handle)
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(snapshot, null, 1))
      await writable.close()
      const request = indexedDB.open("fontes-lib", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("k")
      request.onsuccess = () => request.result.transaction("k", "readwrite").objectStore("k").put(handle, "h")
      setLibraryStatus(`Ligada a ${handle.name}. As alterações são gravadas automaticamente.`)
      setLibraryOpen(false)
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setLibraryStatus("Não foi possível criar a biblioteca.")
    }
  }

  const exportLibrary = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 1)], { type: "application/json" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "fontes-biblioteca.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importLibrary = async (file: File) => {
    try {
      applyLibrary(JSON.parse(await file.text()))
      setNotice("Biblioteca importada.")
    } catch {
      setLibraryStatus("Ficheiro inválido. Importa um JSON exportado pelo Gestor de fontes.")
    }
  }

  const toggleValue = (values: string[], setValues: (next: string[]) => void, value: string) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  const toggleCombo = (font: string, tag: string) => {
    setFavoriteCombos((current) => current.some((combo) => combo.n === font && combo.t === tag)
      ? current.filter((combo) => combo.n !== font || combo.t !== tag)
      : [...current, { n: font, t: tag }])
  }

  const setCategory = (font: string, category: string) => {
    setTags((current) => ({ ...current, [font]: category }))
  }

  const addCategory = (value: string) => {
    const name = value.trim()
    if (!name || name === UNCATEGORIZED || categories.some((category) => category.toLocaleLowerCase() === name.toLocaleLowerCase())) return
    setCategories((current) => [...current, name])
  }

  const renameCategory = (current: string, nextValue: string) => {
    const next = nextValue.trim()
    if (!next || next === current || next === UNCATEGORIZED || categories.some((category) => category.toLocaleLowerCase() === next.toLocaleLowerCase())) return
    setCategories((items) => items.map((item) => item === current ? next : item))
    setTags((currentTags) => Object.fromEntries(Object.entries(currentTags).map(([font, category]) => [font, category === current ? next : category])))
    if (filter === current) setFilter(next)
  }

  const deleteCategory = (category: string) => {
    setCategories((items) => items.filter((item) => item !== category))
    setTags((current) => Object.fromEntries(Object.entries(current).filter(([, value]) => value !== category)))
    if (filter === category) setFilter("Todas")
  }

  const moveCategory = (index: number, direction: -1 | 1) => {
    setCategories((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const importFolder = (files: FileList | null, selectedCategory?: string) => {
    if (!files?.length) return
    const categoryByName = new Map(categories.map((category) => [normalize(category), category]))
    const fontByName = [...fonts].sort((a, b) => compactName(b.family).length - compactName(a.family).length)
    const matchedFamilies = new Set<string>()
    const nextUninstalledFonts = new Map(uninstalledFonts.map((font) => [compactName(font.family), font]))
    let unmatched = 0
    let scanned = 0
    const nextTags = { ...tags }
    const fileList = Array.from(files) as FontFile[]
    for (const file of fileList) {
      if (!/\.(ttf|otf)$/i.test(file.name)) continue
      scanned += 1
      const path = (file.webkitRelativePath || file.name).split("/")
      const folderCategory = selectedCategory || [...path.slice(0, -1)].reverse().map((part) => resolveFolderCategory(part, categoryByName)).find(Boolean)
      const familyName = cleanFontFileName(file.name)
      const compactFamily = compactName(familyName)
      const match = fontByName.find((font) => {
        const installed = compactName(font.family)
        return installed === compactFamily || (installed.length >= 5 && compactFamily.startsWith(installed))
      })
      if (!match) {
        unmatched += 1
        if (familyName) {
          const key = compactName(familyName)
          const current = nextUninstalledFonts.get(key)
          nextUninstalledFonts.set(key, current ?? { family: familyName, styles: [] })
          nextTags[familyName] = folderCategory || nextTags[familyName] || UNCATEGORIZED
        }
        continue
      }
      if (!folderCategory) { unmatched += 1; continue }
      nextTags[match.family] = folderCategory
      matchedFamilies.add(match.family)
    }
    setTags(nextTags)
    setUninstalledFonts([...nextUninstalledFonts.values()].sort((a, b) => a.family.localeCompare(b.family, "pt-PT")))
    const matched = matchedFamilies.size
    const newlyUninstalled = [...nextUninstalledFonts.keys()].filter((key) => !uninstalledFonts.some((font) => compactName(font.family) === key)).length
    const destination = selectedCategory ? ` em “${selectedCategory}”` : " nas categorias correspondentes às pastas"
    const resultParts = [
      matched ? `${matched} família${matched === 1 ? " classificada" : "s classificadas"}${destination}` : "",
      newlyUninstalled ? `${newlyUninstalled} família${newlyUninstalled === 1 ? " adicionada" : "s adicionadas"} a “${NOT_INSTALLED}”` : "",
    ].filter(Boolean)
    setNotice(scanned === 0
      ? "A pasta selecionada não contém ficheiros OTF ou TTF."
      : `${resultParts.join(". ") || "Nenhuma família nova encontrada"}. Foram lidos ${scanned} ficheiros OTF/TTF; as fontes não instaladas ficam guardadas como referência e não são instaladas.${unmatched > newlyUninstalled ? ` ${unmatched - newlyUninstalled} ficheiro(s) não corresponderam a uma família instalada nem acrescentaram uma família nova.` : ""}`)
  }

  const handleLogoFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoData(typeof reader.result === "string" ? reader.result : "")
    reader.readAsDataURL(file)
  }

  const changeView = (next: ViewMode) => {
    setView(next)
    if (next === "study") setFilter("Todas")
  }

  const updateLayout = (key: keyof StudyLayout, value: number) => {
    if (view === "study") {
      setStudySettings((current) => ({ ...current, layout: { ...current.layout, [key]: value } }))
      return
    }
    setLayout((current) => ({ ...current, [key]: value }))
  }
  const updateColumns = (value: number) => view === "study"
    ? setStudySettings((current) => ({ ...current, columns: value }))
    : setColumns(value)
  const updateNameSize = (value: number) => view === "study"
    ? setStudySettings((current) => ({ ...current, fontSize: value }))
    : setFontSize(value)
  const updateTaglineSize = (value: number) => view === "study"
    ? setStudySettings((current) => ({ ...current, taglineSize: value }))
    : setTaglineSize(value)
  const updateFontWeight = (value: number) => view === "study"
    ? setStudySettings((current) => ({ ...current, fontWeight: value }))
    : setFontWeight(value)
  const resetViewControls = () => {
    if (view === "study") {
      setStudySettings(INITIAL_STUDY_SETTINGS)
      return
    }
    setColumns(5)
    setFontSize(58)
    setTaglineSize(24)
    setFontWeight(400)
    setLayout(INITIAL_LAYOUT)
  }
  const categoryFilters = ["Todas", "Favoritos do nome", "Favoritos da tagline", "Composições", ...categories, UNCATEGORIZED, NOT_INSTALLED]
  const chipCount = (item: string) => {
    if (item === "Todas") return fonts.length
    if (item === NOT_INSTALLED) {
      const installedNames = new Set(fonts.map((font) => compactName(font.family)))
      return uninstalledFonts.filter((font) => !installedNames.has(compactName(font.family))).length
    }
    if (item === "Favoritos do nome") return favorites.length
    if (item === "Favoritos da tagline") return taglineFavorites.length
    if (item === "Composições") return favoriteCombos.length
    return fonts.filter((font) => categoryFor(font.family, tags, categories) === item).length
  }

  return (
    <div className={`font-app${dark ? " font-app--dark" : ""}`}>
      <header className="app-header">
        <div className="header-main">
          <div className="brand-lockup"><span className="brand-mark">F</span><div><h1>Gestor de fontes</h1><p>Biblioteca tipográfica & estudos de identidade</p></div></div>
          <div className="header-actions">
            <button className="primary-button" onClick={loadFonts}><Type /> Carregar fontes do Mac</button>
            <label className="header-input"><span className="sr-only">Nome do cliente</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do cliente" /></label>
            <label className="header-input"><span className="sr-only">Tagline</span><input value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="Tagline" /></label>
            <button className="secondary-button" onClick={() => logoInput.current?.click()}><ImagePlus /> {logoData ? "Alterar logo" : "Adicionar logo"}</button>
            {logoData && <button className="icon-button remove-logo" onClick={() => { setLogoData(""); if (logoInput.current) logoInput.current.value = "" }} aria-label="Remover logo" title="Remover logo"><X /></button>}
            <input ref={logoInput} className="sr-only" type="file" accept="image/*" onChange={(event) => handleLogoFile(event.target.files?.[0])} />
            <button className="secondary-button" onClick={() => setLibraryOpen(true)}>Biblioteca</button>
          </div>
          <div className="header-meta"><span className="font-status" role="status">{fontStatus}</span><span className="family-count">{fonts.length} famílias</span></div>
        </div>

        <div className="view-row">
          <div className="view-tabs" role="tablist" aria-label="Modo de visualização">
            {VIEW_OPTIONS.map((option) => <button key={option.id} role="tab" aria-selected={view === option.id} className={`view-tab${view === option.id ? " is-active" : ""}`} onClick={() => changeView(option.id)}>{option.label}</button>)}
          </div>
          <button className="secondary-button theme-toggle" onClick={() => setDark((current) => !current)} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"} title={dark ? "Modo claro" : "Modo escuro"}>{dark ? <Sun /> : <Moon />}<span>Claro/Escuro</span></button>
        </div>

        {view !== "study" && <div className="filter-row">
          <label className="search-box"><Search /><span className="sr-only">Pesquisar família</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar família" /></label>
          <div className="filter-chips" aria-label="Filtros de fontes">
            {categoryFilters.map((item) => <button key={item} className={`filter-chip${filter === item ? " is-active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>
              {item === "Favoritos do nome" ? <><Star fill="currentColor" /> Nome</> : item === "Favoritos da tagline" ? <><Type /> Tagline</> : item === "Composições" ? <><Heart /> Happy</> : item} <span>{chipCount(item)}</span>
            </button>)}
          </div>
          <button className="secondary-button" onClick={() => setCategoriesOpen(true)}>Categorias</button>
        </div>}
        <div className="settings-row" aria-label="Controlos da grelha e do estudo">
          {view !== "list" && <label className="range-control"><span>Grelha</span><input type="range" min="1" max="12" value={activeColumns} onChange={(event) => updateColumns(Number(event.target.value))} /><output>{activeColumns}</output></label>}
          {(view === "logo" || view === "study") && <label className="range-control"><span>Logo</span><input type="range" min="30" max="600" value={activeLayout.logoSize} onChange={(event) => updateLayout("logoSize", Number(event.target.value))} /><output>{activeLayout.logoSize}px</output></label>}
          <label className="range-control"><span>Name</span><input type="range" min="20" max="160" value={activeFontSize} onChange={(event) => updateNameSize(Number(event.target.value))} /><output>{activeFontSize}px</output></label>
          {view !== "grid" && <label className="range-control"><span>Tagline</span><input type="range" min="10" max="120" value={activeTaglineSize} onChange={(event) => updateTaglineSize(Number(event.target.value))} /><output>{activeTaglineSize}px</output></label>}
          {(view === "tagline" || view === "logo" || view === "study") && <>
            {(view === "logo" || view === "study") && <label className="range-control"><span>Espaço Logo</span><input type="range" min="-120" max="420" value={activeLayout.logoOffset} onChange={(event) => updateLayout("logoOffset", Number(event.target.value))} /><output>{activeLayout.logoOffset}px</output></label>}
            <label className="range-control"><span>Espaço Name</span><input type="range" min="-180" max="180" value={activeLayout.nameOffset} onChange={(event) => updateLayout("nameOffset", Number(event.target.value))} /><output>{activeLayout.nameOffset}px</output></label>
            <label className="range-control"><span>Espaço Tagline</span><input type="range" min="-180" max="180" value={activeLayout.taglineOffset} onChange={(event) => updateLayout("taglineOffset", Number(event.target.value))} /><output>{activeLayout.taglineOffset}px</output></label>
          </>}
          <label className="range-control"><span>Peso</span><input type="range" min="100" max="900" step="100" value={activeFontWeight} onChange={(event) => updateFontWeight(Number(event.target.value))} /><output>{activeFontWeight}</output></label>
          <button type="button" className="secondary-button reset-controls-button" onClick={resetViewControls}>Reset</button>
        </div>
        {view !== "grid" && <div className="settings-row settings-row--sources" aria-label="Fontes dos exemplos">
          <label className="font-select-control"><span>Fonte do nome</span><select value={nameFont} onChange={(event) => setNameFont(event.target.value)}><option value="">Fonte de cada cartão</option>{fonts.map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}</select></label>
          <label className="font-select-control"><span>Fonte da tagline</span><select value={taglineFont} onChange={(event) => setTaglineFont(event.target.value)}><option value="">Fonte de cada cartão</option>{fonts.map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}</select></label>
          {view !== "study" && <button className="secondary-button classify-button" onClick={() => setClassifyOpen(true)}><FolderUp /> Classificar</button>}
        </div>}
      </header>

      <main className="font-main">
        {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon-button" onClick={() => setNotice("")} aria-label="Fechar aviso"><X /></button></div>}
        {(view === "logo" || view === "study") && <section className="studio-section" aria-labelledby="studio-heading">
          <div className="studio-heading"><div><p className="eyebrow">{view === "study" ? "Seleção de marca" : "Pré-visualização"}</p><h2 id="studio-heading">{view === "study" ? "Logo Study" : "Estudo de identidade"}</h2></div><div className="studio-heading__meta">{view === "logo" && <button className="icon-button studio-visibility-toggle" aria-label={studioExpanded ? "Ocultar estudo de identidade" : "Mostrar estudo de identidade"} title={studioExpanded ? "Ocultar estudo" : "Mostrar estudo"} aria-expanded={studioExpanded} aria-controls="identity-study-content" onClick={() => setStudioExpanded((current) => !current)}>{studioExpanded ? <EyeOff /> : <Eye />}</button>}<span>{activeFont?.family || "Escolhe uma fonte"}</span>{view === "study" && <span className="study-count">{studyFamilies.length} selecionadas</span>}</div></div>
          <div id="identity-study-content" hidden={view === "logo" && !studioExpanded} className={`studio-layout${view === "study" ? " studio-layout--study" : ""}`}>
            <div className="studio-canvas" style={{ "--studio-margin": `${activeLayout.margin}px` } as React.CSSProperties}>
              <LockupPreview title={title} tagline={tagline} fontFamily={activeFont?.family || nameFont || "sans-serif"} taglineFontFamily={taglineFont || activeFont?.family || "sans-serif"} fontSize={activeFontSize} fontWeight={activeFontWeight} taglineSize={activeTaglineSize} logoData={logoData} showLogo={view === "study" || view === "logo"} showTagline={view === "study" || view === "logo"} layout={activeLayout} showGuides={view === "study" && showGuides} onLayoutChange={updateLayout} />
              <div className="canvas-caption"><span>Pré-visualização em tempo real</span><span>{activeFont?.family || "Sem fonte selecionada"}</span></div>
            </div>
            <aside className="studio-controls" aria-label="Ajustes do estudo">
              <div className="studio-control-heading"><div><p className="eyebrow">Ajustes manuais</p><h3>Composição</h3></div><button className={`guide-toggle${showGuides ? " is-active" : ""}`} aria-pressed={showGuides} onClick={() => setShowGuides((current) => !current)}>Linhas-guia</button></div>
              <label className="range-control range-control--wide"><span>Margem da área</span><input type="range" min="16" max="220" value={layout.margin} onChange={(event) => updateLayout("margin", Number(event.target.value))} /><output>{layout.margin}px</output></label>
              <p className="control-note">Arrasta as linhas do nome, tagline e margens para ajustar a composição. Também podes usar as setas do teclado quando uma linha estiver selecionada.</p>
            </aside>
          </div>
        </section>}

        <section className="font-library" aria-label={view === "study" ? "Designs selecionados para Logo Study" : "Biblioteca de fontes"}>
          <div className="library-section-heading">
            <div><p className="eyebrow">{view === "study" ? "Prancheta" : "Biblioteca local"}</p><h2>{view === "study" ? "Designs selecionados" : filter === "Composições" ? "Composições favoritas" : filter === "Todas" ? "Famílias tipográficas" : filter}</h2></div>
            <span>{view === "study" ? `${visibleItems.length} de ${fonts.length} fontes` : `${visibleItems.length} resultados`}</span>
          </div>

          {view === "study" && visibleItems.length === 0 ? (
            <div className="empty-state"><span className="empty-state__icon"><Heart /></span><h3>Ainda não há designs no Logo Study</h3><p>Escolhe uma fonte na biblioteca e marca o ícone de sorriso para a acrescentar a esta prancheta.</p><button className="secondary-button" onClick={() => changeView("grid")}>Voltar à biblioteca</button></div>
          ) : view !== "study" && !fonts.length && filter !== NOT_INSTALLED ? (
            <div className="empty-state"><span className="empty-state__icon"><Type /></span><h3>Começa pelas fontes instaladas</h3><p>Carrega as fontes do teu computador para ver as famílias, atribuir estilos e criar combinações. Também podes classificar pastas para guardar referências de fontes não instaladas.</p><button className="primary-button" onClick={loadFonts}><Type /> Carregar fontes do Mac</button></div>
          ) : visibleItems.length === 0 ? (
            <div className="empty-state empty-state--small"><h3>{filter === NOT_INSTALLED ? "Ainda não há fontes não instaladas" : "Nada por aqui"}</h3><p>{filter === NOT_INSTALLED ? "Usa Classificar para carregar uma pasta de fontes; os ficheiros sem correspondência com fontes instaladas aparecem aqui como referência." : "Experimenta outro filtro ou pesquisa. As composições Happy aparecem depois de guardares um coração num cartão."}</p></div>
          ) : (
            <div className={`font-grid${view === "list" ? " font-grid--list" : ""}`} style={{ "--font-cols": activeColumns } as React.CSSProperties}>
              {visibleItems.map((item, index) => {
                const { font, combo } = item
                const comboTagline = combo?.t || tagline
                const comboFont = combo?.n || font.family
                const comboIsFavorite = favoriteCombos.some((saved) => saved.n === comboFont && saved.t === comboTagline)
                return <FontCard
                  key={`${font.family}-${combo?.t || "library"}-${index}`}
                  font={font}
                  title={title}
                  tagline={comboTagline}
                  category={categoryFor(font.family, tags, categories)}
                  categories={categories}
                  view={view}
                  fontSize={activeFontSize}
                  fontWeight={activeFontWeight}
                  taglineSize={activeTaglineSize}
                  nameFontFamily={view === "grid" ? "" : nameFont}
                  taglineFontFamily={taglineFont}
                  layout={activeLayout}
                  logoData={logoData}
                  favoriteName={favorites.includes(font.family)}
                  favoriteTagline={taglineFavorites.includes(font.family)}
                  favoriteCombo={comboIsFavorite}
                  inStudy={studyFamilies.includes(font.family)}
                  selected={nameFont === font.family}
                  onSelect={() => setNameFont(font.family)}
                  onToggleName={() => toggleValue(favorites, setFavorites, font.family)}
                  onToggleTagline={() => toggleValue(taglineFavorites, setTaglineFavorites, font.family)}
                  onToggleCombo={() => toggleCombo(font.family, comboTagline)}
                  onToggleStudy={() => toggleValue(studyFamilies, setStudyFamilies, font.family)}
                  onCategoryChange={(category) => setCategory(font.family, category)}
                />
              })}
            </div>
          )}
          {view !== "study" && fonts.length > 0 && <div className="import-help"><FolderUp /><span>Carrega pastas por estilo para classificar fontes instaladas. Famílias sem correspondência ficam em “Não instaladas” como referência; os ficheiros não são instalados nem guardados.</span><button className="text-button" onClick={() => setClassifyOpen(true)}>Classificar</button></div>}
        </section>
        <footer className="app-footer"><span>Gestor de fontes</span><span>{libraryStatus}</span></footer>
      </main>

      <CategoriesDialog open={categoriesOpen} categories={categories} onClose={() => setCategoriesOpen(false)} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} onMove={moveCategory} />
      <ClassifyDialog open={classifyOpen} categories={categories} onClose={() => setClassifyOpen(false)} onUploadCategory={(category, files) => { importFolder(files, category); setClassifyOpen(false) }} onUploadAll={(files) => { importFolder(files); setClassifyOpen(false) }} />
      <LibraryDialog open={libraryOpen} status={libraryStatus} onClose={() => setLibraryOpen(false)} onOpen={openLibrary} onCreate={createLibrary} onExport={exportLibrary} onImport={importLibrary} />
    </div>
  )
}

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-PT").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

function cleanFontFileName(filename: string) {
  return filename
    .replace(/\.(ttf|otf)$/i, "")
    .replace(/(?:[\s_-]*(regular|normal|book|medium|light|bold|black|thin|italic|oblique|semibold|demibold|extrabold|ultrabold|condensed|expanded|variable|roman|wght|weight|static))+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactName(value: string) {
  return normalize(value).replace(/\s+/g, "")
}

function resolveFolderCategory(folder: string, categoryByName: Map<string, string>) {
  const normalized = normalize(folder).replace(/^\d+\s*/, "")
  const exact = categoryByName.get(normalized)
  if (exact) return exact
  const aliases: Record<string, string[]> = {
    "serif": ["serif", "serifas"],
    "sem serif": ["sans serif", "sansserif", "sans", "grotesk", "grotesque"],
    "manuscrita": ["script", "handwriting", "handwritten", "cursive", "cursiva", "calligraphy"],
    "mono": ["monospace", "monospaced", "typewriter", "coding"],
  }
  for (const [category, names] of Object.entries(aliases)) {
    const existing = categoryByName.get(normalize(category))
    if (existing && names.some((name) => normalize(name) === normalized)) return existing
  }
  return undefined
}

function categoryFor(family: string, tags: Record<string, string>, categories: string[]) {
  const saved = tags[family]
  if (saved === UNCATEGORIZED || (saved && categories.includes(saved))) return saved
  return guessCategory(family, categories)
}

function guessCategory(family: string, categories: string[]) {
  const name = family.toLocaleLowerCase("pt-PT")
  const patterns: Array<[RegExp, string]> = [
    [/mono|code|courier|consolas|typewriter|menlo/, "Mono"],
    [/script|hand|brush|signature|cursive|callig|marker|pen\b/, "Manuscrita"],
    [/sans|grotesk|grotesque|helvet|arial|gothic|futura|avenir|inter\b|roboto|gill|verdana|tahoma|din\b|akzidenz/, "Sem serif"],
    [/serif|times|georgia|garamond|baskerville|bodoni|didot|playfair|caslon|palatino|minion|cambria|book|roman/, "Serif"],
    [/display|poster|black|stencil|decor|shadow|outline|inline/, "Display"],
  ]
  const match = patterns.find(([pattern]) => pattern.test(name))?.[1]
  return match && categories.includes(match) ? match : UNCATEGORIZED
}

export default FontManager
export type { StudyLayout }
export { EMPTY_LIBRARY }

export function HeartFilterIcon({ filled = false }: { filled?: boolean }) {
  return <Heart aria-hidden="true" fill={filled ? "currentColor" : "none"} />
}

export function DownloadIcon() {
  return <Download aria-hidden="true" />
}

export function ThemeIcon({ darkMode }: { darkMode: boolean }) {
  return darkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />
}

export function FolderImportIcon() {
  return <FolderUp aria-hidden="true" />
}

export function SearchIcon() {
  return <Search aria-hidden="true" />
}

export function FontActionIcons() {
  return <><Heart aria-hidden="true" /><Type aria-hidden="true" /></>
}

export function DismissIcon() {
  return <X aria-hidden="true" />
}

export function TopIconSet() {
  return <><Type aria-hidden="true" /><ImagePlus aria-hidden="true" /></>
}

export function SunIcon() {
  return <Sun aria-hidden="true" />
}

export function MoonIcon() {
  return <Moon aria-hidden="true" />
}

export function FolderUpIcon() {
  return <FolderUp aria-hidden="true" />
}

export function HeartIcon() {
  return <Heart aria-hidden="true" />
}
