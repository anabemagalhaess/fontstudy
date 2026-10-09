"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, FolderUp, Heart, ImagePlus, Moon, Search, Sun, Type, X } from "lucide-react"
import { CategoriesDialog } from "@/components/categories-dialog"
import { FontCard } from "@/components/font-card"
import { LibraryDialog } from "@/components/library-dialog"
import { LockupPreview } from "@/components/lockup-preview"
import { DEFAULT_CATEGORIES, UNCATEGORIZED, type FavoriteCombo, type FontFamily, type FontLibrary, type ViewMode } from "@/components/font-manager-types"

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
type StudyLayout = { logoSize: number; logoGap: number; taglineGap: number; nameOffset: number; taglineOffset: number; margin: number }
type FontFile = File & { webkitRelativePath?: string }

type ViewOption = { id: ViewMode; label: string }
const VIEW_OPTIONS: ViewOption[] = [
  { id: "grid", label: "Grelha 1" },
  { id: "tagline", label: "Grelha 2" },
  { id: "logo", label: "Grelha Logo" },
  { id: "list", label: "Lista vertical" },
  { id: "study", label: "Logo Study" },
]
const INITIAL_LAYOUT: StudyLayout = { logoSize: 86, logoGap: 24, taglineGap: 22, nameOffset: 0, taglineOffset: 0, margin: 52 }
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
}

export function FontManager() {
  const [fonts, setFonts] = useState<FontFamily[]>([])
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
  const [showGuides, setShowGuides] = useState(true)
  const [dark, setDark] = useState(false)
  const [fontStatus, setFontStatus] = useState("Carrega as fontes instaladas para começar")
  const [notice, setNotice] = useState("")
  const [libraryStatus, setLibraryStatus] = useState("Sem ficheiro ligado. Os dados ficam guardados neste browser.")
  const [libraryHandle, setLibraryHandle] = useState<LocalFontHandle | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const folderInput = useRef<HTMLInputElement>(null)
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
    setTaglineFont(typeof library.tfont === "string" ? library.tfont : "")
    setNameFont(typeof library.nfont === "string" ? library.nfont : "")
  }, [])

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      try {
        const saved = localStorage.getItem("fontes-lib")
        if (saved) applyLibrary(JSON.parse(saved))
        const preferences = JSON.parse(localStorage.getItem("fontes-preferencias") || "{}") as {
          view?: ViewMode; columns?: number; studyFamilies?: string[]; layout?: StudyLayout; dark?: boolean
        }
        if (preferences.view && VIEW_OPTIONS.some((item) => item.id === preferences.view)) setView(preferences.view)
        if (preferences.columns) setColumns(Math.max(1, Math.min(12, preferences.columns)))
        if (Array.isArray(preferences.studyFamilies)) setStudyFamilies(preferences.studyFamilies)
        if (preferences.layout) setLayout({ ...INITIAL_LAYOUT, ...preferences.layout })
        if (typeof preferences.dark === "boolean") setDark(preferences.dark)
        const dbRequest = indexedDB.open("fontes-lib", 1)
        dbRequest.onupgradeneeded = () => dbRequest.result.createObjectStore("k")
        dbRequest.onsuccess = async () => {
          try {
            const tx = dbRequest.result.transaction("k", "readonly")
            const getRequest = tx.objectStore("k").get("h")
            getRequest.onsuccess = async () => {
              const handle = getRequest.result as LocalFontHandle | undefined
              if (!handle || cancelled) return
              setLibraryHandle(handle)
              if (await handle.queryPermission({ mode: "readwrite" }) === "granted") {
                const data = JSON.parse(await (await handle.getFile()).text())
                applyLibrary(data)
                setLibraryStatus(`Ligada a ${handle.name}. As alterações são gravadas automaticamente.`)
              } else {
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
  }), [categories, tags, favorites, taglineFavorites, taglineFont, nameFont, favoriteCombos])

  useEffect(() => {
    if (!hydrated) return
    const preferences = { view, columns, studyFamilies, layout, dark }
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
  }, [snapshot, hydrated, libraryHandle, view, columns, studyFamilies, layout, dark])

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
      setFontStatus(`${list.length} ${list.length === 1 ? "família encontrada" : "famílias encontradas"}")
      if (!list.length) setNotice("Não foram encontradas fontes. Confirma as permissões do browser e tenta novamente.")
    } catch {
      setFontStatus("Sem permissão para ler as fontes. Autoriza o acesso no Chrome ou Edge e tenta novamente.")
    }
  }

  const fontMap = useMemo(() => new Map(fonts.map((font) => [font.family, font])), [fonts])
  const activeFont = fontMap.get(nameFont) || fonts[0]
  const selectedFamilies = view === "study" ? studyFamilies : fonts.map((font) => font.family)
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-PT")
  const visibleItems = useMemo(() => {
    if (view === "study") return selectedFamilies
    if (filter === "Composições") {
      return favoriteCombos
        .filter((combo) => !normalizedQuery || `${combo.n} ${combo.t}`.toLocaleLowerCase("pt-PT").includes(normalizedQuery))
        .map((combo) => ({ font: fontMap.get(combo.n), combo }))
        .filter((item): item is { font: FontFamily; combo: FavoriteCombo } => Boolean(item.font))
    }
    return fonts.filter((font) => {
      if (normalizedQuery && !font.family.toLocaleLowerCase("pt-PT").includes(normalizedQuery)) return false
      if (filter === "Favoritos do nome") return favorites.includes(font.family)
      if (filter === "Favoritos da tagline") return taglineFavorites.includes(font.family)
      if (filter === "Sem classificar") return categoryFor(font.family, tags, categories) === UNCATEGORIZED
      if (filter !== "Todas") return categoryFor(font.family, tags, categories) === filter
      return true
    }).map((font) => ({ font, combo: undefined }))
  }, [view, selectedFamilies, filter, favoriteCombos, normalizedQuery, fontMap, fonts, favorites, taglineFavorites, tags, categories])

  const updateLibraryHandle = async (handle: LocalFontHandle) => {
    setLibraryHandle(handle)
    const permission = await handle.queryPermission({ mode: "readwrite" })
    const allowed = permission === "granted" || await handle.requestPermission({ mode: "readwrite" }) === "granted"
    if (!allowed) {
      setLibraryStatus(`O acesso a ${handle.name} não foi autorizado.`)
      return
    }
    try {
      const file = await handle.getFile()
      if (file.size > 0) applyLibrary(JSON.parse(await file.text()))
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

  const importFolder = (files: FileList | null) => {
    if (!files?.length) return
    if (!fonts.length) {
      setNotice("Carrega primeiro as fontes instaladas. O carregamento por pastas só classifica famílias existentes; não instala nem duplica fontes.")
      return
    }
    const categoryByName = new Map(categories.map((category) => [normalize(category), category]))
    const fontByName = [...fonts].sort((a, b) => normalize(b.family).length - normalize(a.family).length)
    let matched = 0
    let unmatched = 0
    const nextTags = { ...tags }
    const fileList = Array.from(files) as FontFile[]
    for (const file of fileList) {
      if (!/\.(ttf|otf|woff2?|ttc)$/i.test(file.name)) continue
      const path = (file.webkitRelativePath || file.name).split("/")
      const folderCategory = path.slice(0, -1).map((part) => categoryByName.get(normalize(part))).find(Boolean)
      const familyName = cleanFontFileName(file.name)
      const normalizedFamily = normalize(familyName)
      const match = fontByName.find((font) => {
        const installed = normalize(font.family)
        return installed === normalizedFamily || normalizedFamily.startsWith(`${installed} `) || installed.startsWith(`${normalizedFamily} `)
      })
      if (!match || !folderCategory) { unmatched += 1; continue }
      nextTags[match.family] = folderCategory
      matched += 1
    }
    setTags(nextTags)
    setNotice(matched
      ? `${matched} ficheiro${matched === 1 ? " associado" : "s associados"} a famílias já instaladas e classificados. Não foram adicionadas fontes duplicadas.${unmatched ? ` ${unmatched} ficheiro(s) não coincidiram com uma família ou categoria existente.` : ""}`
      : "Não encontrei correspondências. Os nomes das pastas devem coincidir com as categorias e os nomes dos ficheiros com as famílias instaladas.")
    if (folderInput.current) folderInput.current.value = ""
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

  const updateLayout = (key: keyof StudyLayout, value: number) => setLayout((current) => ({ ...current, [key]: value }))
  const categoryFilters = ["Todas", "Favoritos do nome", "Favoritos da tagline", "Composições", ...categories, UNCATEGORIZED]
  const chipCount = (item: string) => {
    if (item === "Todas") return fonts.length
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

        {view !== "study" && <>
          <div className="filter-row">
            <label className="search-box"><Search /><span className="sr-only">Pesquisar família</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar família" /></label>
            <div className="filter-chips" aria-label="Filtros de fontes">
              {categoryFilters.map((item) => <button key={item} className={`filter-chip${filter === item ? " is-active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>
                {item === "Favoritos do nome" ? <><Heart fill="currentColor" /> Nome</> : item === "Favoritos da tagline" ? <><Type /> Tagline</> : item === "Composições" ? <><Heart /> N+T</> : item} <span>{chipCount(item)}</span>
              </button>)}
            </div>
            <button className="secondary-button" onClick={() => setCategoriesOpen(true)}>Categorias</button>
          </div>
          <div className="settings-row">
            <label className="range-control"><span>Tamanho</span><input type="range" min="20" max="140" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><output>{fontSize}</output></label>
            {view !== "list" && <label className="range-control"><span>Por linha</span><input type="range" min="1" max="12" value={columns} onChange={(event) => setColumns(Number(event.target.value))} /><output>{columns}</output></label>}
            <label className="range-control"><span>Peso</span><input type="range" min="100" max="900" step="100" value={fontWeight} onChange={(event) => setFontWeight(Number(event.target.value))} /><output>{fontWeight}</output></label>
            {(view === "logo") && <label className="range-control"><span>Espaço do logo</span><input type="range" min="0" max="150" value={layout.logoGap} onChange={(event) => updateLayout("logoGap", Number(event.target.value))} /><output>{layout.logoGap}</output></label>}
            {view !== "grid" && <label className="range-control"><span>Tamanho tagline</span><input type="range" min="10" max="80" value={taglineSize} onChange={(event) => setTaglineSize(Number(event.target.value))} /><output>{taglineSize}</output></label>}
            <label className="font-select-control"><span>Fonte do nome</span><select value={nameFont} onChange={(event) => setNameFont(event.target.value)}><option value="">Escolher fonte principal</option>{fonts.map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}</select></label>
            {view !== "grid" && <label className="font-select-control"><span>Fonte da tagline</span><select value={taglineFont} onChange={(event) => setTaglineFont(event.target.value)}><option value="">Mesma fonte do nome</option>{fonts.map((font) => <option key={font.family} value={font.family}>{font.family}</option>)}</select></label>}
            <label className="folder-upload secondary-button"><FolderUp /> Classificar por pastas<input ref={folderInput} type="file" multiple accept=".ttf,.otf,.woff,.woff2,.ttc" {...{ webkitdirectory: "" } as Record<string, string>} onChange={(event) => importFolder(event.target.files)} /></label>
          </div>
        </>}
      </header>

      <main className="font-main">
        {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon-button" onClick={() => setNotice("")} aria-label="Fechar aviso"><X /></button></div>}
        {(view === "logo" || view === "study") && <section className="studio-section" aria-labelledby="studio-heading">
          <div className="studio-heading"><div><p className="eyebrow">{view === "study" ? "Seleção de marca" : "Pré-visualização"}</p><h2 id="studio-heading">{view === "study" ? "Logo Study" : "Estudo de identidade"}</h2></div><div className="studio-heading__meta"><span>{activeFont?.family || "Escolhe uma fonte"}</span>{view === "study" && <span className="study-count">{studyFamilies.length} selecionadas</span>}</div></div>
          <div className={`studio-layout${view === "study" ? " studio-layout--study" : ""}`}>
            <div className="studio-canvas" style={{ "--studio-margin": `${layout.margin}px` } as React.CSSProperties}>
              <LockupPreview title={title} tagline={tagline} fontFamily={activeFont?.family || nameFont || "sans-serif"} taglineFontFamily={taglineFont || activeFont?.family || "sans-serif"} fontSize={fontSize} fontWeight={fontWeight} taglineSize={taglineSize} logoData={logoData} showLogo={view === "study" || view === "logo"} showTagline={view === "study" || view === "logo"} layout={layout} showGuides={view === "study" && showGuides} />
              <div className="canvas-caption"><span>Pré-visualização em tempo real</span><span>{activeFont?.family || "Sem fonte selecionada"}</span></div>
            </div>
            <aside className="studio-controls" aria-label="Ajustes do estudo">
              <div className="studio-control-heading"><div><p className="eyebrow">Ajustes manuais</p><h3>Composição</h3></div><button className={`guide-toggle${showGuides ? " is-active" : ""}`} aria-pressed={showGuides} onClick={() => setShowGuides((current) => !current)}>Linhas-guia</button></div>
              <label className="range-control range-control--wide"><span>Tamanho do nome</span><input type="range" min="20" max="140" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><output>{fontSize}px</output></label>
              <label className="range-control range-control--wide"><span>Tamanho do logo</span><input type="range" min="40" max="260" value={layout.logoSize} onChange={(event) => updateLayout("logoSize", Number(event.target.value))} /><output>{layout.logoSize}px</output></label>
              <label className="range-control range-control--wide"><span>Espaço logo / nome</span><input type="range" min="0" max="100" value={layout.logoGap} onChange={(event) => updateLayout("logoGap", Number(event.target.value))} /><output>{layout.logoGap}px</output></label>
              <label className="range-control range-control--wide"><span>Posição do nome</span><input type="range" min="-80" max="80" value={layout.nameOffset} onChange={(event) => updateLayout("nameOffset", Number(event.target.value))} /><output>{layout.nameOffset}px</output></label>
              <label className="range-control range-control--wide"><span>Espaço da tagline</span><input type="range" min="0" max="100" value={layout.taglineGap} onChange={(event) => updateLayout("taglineGap", Number(event.target.value))} /><output>{layout.taglineGap}px</output></label>
              <label className="range-control range-control--wide"><span>Posição da tagline</span><input type="range" min="-80" max="80" value={layout.taglineOffset} onChange={(event) => updateLayout("taglineOffset", Number(event.target.value))} /><output>{layout.taglineOffset}px</output></label>
              <label className="range-control range-control--wide"><span>Margem da área</span><input type="range" min="16" max="140" value={layout.margin} onChange={(event) => updateLayout("margin", Number(event.target.value))} /><output>{layout.margin}px</output></label>
              <p className="control-note">As linhas-guia acompanham os ajustes e ajudam a alinhar manualmente o logótipo, o nome e a tagline.</p>
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
          ) : view !== "study" && !fonts.length ? (
            <div className="empty-state"><span className="empty-state__icon"><Type /></span><h3>Começa pelas fontes instaladas</h3><p>Carrega as fontes do teu computador para ver as famílias, atribuir estilos e criar combinações. A leitura depende do Chrome ou Edge e da autorização do browser.</p><button className="primary-button" onClick={loadFonts}><Type /> Carregar fontes do Mac</button></div>
          ) : visibleItems.length === 0 ? (
            <div className="empty-state empty-state--small"><h3>Nada por aqui</h3><p>Experimenta outro filtro ou pesquisa. As composições aparecem depois de guardares um coração N+T num cartão.</p></div>
          ) : (
            <div className={`font-grid${view === "list" ? " font-grid--list" : ""}`} style={{ "--font-cols": columns } as React.CSSProperties}>
              {visibleItems.map((item, index) => {
                const font = "font" in item ? item.font : undefined
                const combo = "combo" in item ? item.combo : undefined
                if (!font) return null
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
                  fontSize={fontSize}
                  fontWeight={fontWeight}
                  taglineSize={taglineSize}
                  taglineFontFamily={taglineFont}
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
          {view !== "study" && fonts.length > 0 && <div className="import-help"><FolderUp /><span>Organizaste as fontes em pastas por estilo? Carrega a pasta para classificar famílias já instaladas. A app associa nomes existentes, não instala nem duplica ficheiros.</span><button className="text-button" onClick={() => folderInput.current?.click()}>Escolher pasta</button></div>}
        </section>
        <footer className="app-footer"><span>Gestor de fontes</span><span>{libraryStatus}</span></footer>
      </main>

      <CategoriesDialog open={categoriesOpen} categories={categories} onClose={() => setCategoriesOpen(false)} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} onMove={moveCategory} />
      <LibraryDialog open={libraryOpen} status={libraryStatus} onClose={() => setLibraryOpen(false)} onOpen={openLibrary} onCreate={createLibrary} onExport={exportLibrary} onImport={importLibrary} />
    </div>
  )
}

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-PT").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

function cleanFontFileName(filename: string) {
  return filename.replace(/\.(ttf|otf|woff2?|ttc)$/i, "").replace(/[_-]+/g, " ").replace(/\b(regular|normal|book|medium|light|bold|black|thin|italic|oblique|semibold|demibold|extrabold|ultrabold|condensed|expanded|variable|roman)\b/gi, " ").replace(/\s+/g, " ").trim()
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
