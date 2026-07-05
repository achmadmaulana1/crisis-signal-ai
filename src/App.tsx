import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  Download,
  Eye,
  Filter,
  FileText,
  Flame,
  Gauge,
  Globe2,
  Handshake,
  History,
  Languages,
  Layers3,
  ListChecks,
  LockKeyhole,
  MapPin,
  Maximize2,
  Megaphone,
  Minimize2,
  Moon,
  Play,
  RadioTower,
  Search,
  Send,
  RefreshCcw,
  Server,
  ShieldAlert,
  Siren,
  Sun,
  UsersRound,
  X,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  createApproval,
  getDashboard,
  getLiveEvents,
  getSituationReport,
  ingestSignal,
  loginRole,
  pdfReportUrl,
  resetDemo,
  simulateScenario,
  updateApproval,
} from './lib/api'
import type { ApprovalRequest, Category, Dashboard, LiveEvent, RiskLevel, Signal, Situation, Source, User, UserRole } from './lib/types'
import './App.css'

type Theme = 'dark' | 'light'
type Language = 'id' | 'en' | 'ms' | 'ja' | 'ar'

const repoName = 'crisis-signal-ai'
const totalFrames = 320

const languageOptions: Array<{ code: Language; label: string; short: string }> = [
  { code: 'id', label: 'Indonesia', short: 'ID' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ms', label: 'Melayu', short: 'MS' },
  { code: 'ja', label: 'Japanese', short: 'JA' },
  { code: 'ar', label: 'Arabic', short: 'AR' },
]

const copy = {
  id: {
    navMonitor: 'Monitor',
    navResponse: 'Respons',
    command: 'Command',
    theme: 'Ganti tema',
    heroTitle: 'Jangan tunggu krisis viral dulu.',
    heroDescription:
      'AI crisis operating system untuk membaca sinyal awal, menghitung risiko, mengatur tim, menyiapkan statement, dan menjaga jejak keputusan.',
    openSignalRoom: 'Buka signal room',
    viewRecommendation: 'Lihat rekomendasi',
    situationSummary: 'Ringkasan situasi AI',
    metrics: ['sinyal dipantau', 'situasi aktif', 'risiko tinggi', 'jangkauan publik'],
    avg: 'Rata',
    critical: 'kritis',
    scenario: 'Simulator skenario',
    running: 'Berjalan...',
    playbook: 'Progress playbook',
    report: 'Laporan krisis',
    preparing: 'Menyiapkan...',
    warRoom: 'Crisis war room',
    readiness: 'kesiapan',
    teamReady: 'tim siap',
    approvalsOpen: 'approval terbuka',
    freshEvents: 'event baru',
    topLane: 'Lane operasional utama',
    laneHint: 'Pilih incident untuk melihat kesiapan respons.',
    minutesOpen: 'menit berjalan',
    evidenceHealth: 'Kesehatan bukti',
    slaPressure: 'Tekanan SLA',
    nextMove: 'Langkah operasional berikutnya',
    nextMoveHint: 'Keputusan ringkas dari readiness, evidence, SLA, dan approval.',
    monitoring: 'Monitoring real-time',
    monitoringTitle: 'Signal intake, risk engine, dan peta krisis dalam satu sistem.',
    signalIntake: 'Signal intake',
    signalIntakeHint: 'Berita, RSS, social media, weather API, dan laporan warga.',
    title: 'Judul sinyal',
    source: 'Source',
    category: 'Kategori',
    location: 'Lokasi',
    addSignal: 'Tambah sinyal',
    search: 'Cari incident, lokasi, kategori...',
    riskBreakdown: 'Rincian risk score',
    crisisMap: 'Peta krisis',
    whatNext: 'Apa langkah berikutnya?',
    sourceVerification: 'Verifikasi sumber',
    statement: 'Statement otomatis',
    timeline: 'Timeline otomatis',
    collaboration: 'Ruang kolaborasi',
    audit: 'Audit trail',
    approvalTitle: 'Workflow approval statement',
    approvalHint: 'Draft, review, approved, published, rejected.',
    noApproval: 'Belum ada approval untuk incident ini.',
    sendReview: 'Kirim review',
    liveFeed: 'Live command feed',
    liveFeedHint: 'Polling 5 detik dari Prisma live events.',
    languageHint: 'Bahasa interface aktif',
    levels: { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' },
    filters: { all: 'Semua', critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' },
  },
  en: {
    navMonitor: 'Monitor',
    navResponse: 'Response',
    command: 'Command',
    theme: 'Switch theme',
    heroTitle: 'Do not wait until a crisis goes viral.',
    heroDescription:
      'An AI crisis operating system that reads early signals, scores risk, coordinates teams, prepares statements, and preserves decision trails.',
    openSignalRoom: 'Open signal room',
    viewRecommendation: 'View recommendations',
    situationSummary: 'AI situation summary',
    metrics: ['signals monitored', 'active situations', 'high risk', 'public reach'],
    avg: 'Avg',
    critical: 'critical',
    scenario: 'Scenario simulator',
    running: 'Running...',
    playbook: 'Playbook progress',
    report: 'Crisis report',
    preparing: 'Preparing...',
    warRoom: 'Crisis war room',
    readiness: 'readiness',
    teamReady: 'team ready',
    approvalsOpen: 'approvals open',
    freshEvents: 'fresh events',
    topLane: 'Top operating lane',
    laneHint: 'Select an incident to inspect response readiness.',
    minutesOpen: 'minutes open',
    evidenceHealth: 'Evidence health',
    slaPressure: 'SLA pressure',
    nextMove: 'Next operational move',
    nextMoveHint: 'A compact decision from readiness, evidence, SLA, and approval status.',
    monitoring: 'Real-time monitoring',
    monitoringTitle: 'Signal intake, risk engine, and crisis map in one system.',
    signalIntake: 'Signal intake',
    signalIntakeHint: 'News, RSS, social media, weather API, and citizen reports.',
    title: 'Signal title',
    source: 'Source',
    category: 'Category',
    location: 'Location',
    addSignal: 'Add signal',
    search: 'Search incident, location, category...',
    riskBreakdown: 'Risk score breakdown',
    crisisMap: 'Crisis map',
    whatNext: 'What should we do next?',
    sourceVerification: 'Source verification',
    statement: 'Auto-generated statement',
    timeline: 'Auto timeline',
    collaboration: 'Collaboration room',
    audit: 'Audit trail',
    approvalTitle: 'Statement approval workflow',
    approvalHint: 'Draft, review, approved, published, rejected.',
    noApproval: 'No approval yet for this incident.',
    sendReview: 'Send review',
    liveFeed: 'Live command feed',
    liveFeedHint: 'Polling every 5 seconds from Prisma live events.',
    languageHint: 'Active interface language',
    levels: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
    filters: { all: 'All', critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
  },
  ms: {
    navMonitor: 'Pantau',
    navResponse: 'Respons',
    command: 'Command',
    theme: 'Tukar tema',
    heroTitle: 'Jangan tunggu krisis menjadi viral.',
    heroDescription:
      'Sistem operasi krisis AI untuk membaca sinyal awal, menilai risiko, menyelaras pasukan, menyiapkan kenyataan, dan menyimpan jejak keputusan.',
    openSignalRoom: 'Buka bilik sinyal',
    viewRecommendation: 'Lihat cadangan',
    situationSummary: 'Ringkasan situasi AI',
    metrics: ['sinyal dipantau', 'situasi aktif', 'risiko tinggi', 'jangkauan awam'],
    avg: 'Purata',
    critical: 'kritikal',
    scenario: 'Simulator senario',
    running: 'Berjalan...',
    playbook: 'Kemajuan playbook',
    report: 'Laporan krisis',
    preparing: 'Menyediakan...',
    warRoom: 'Bilik krisis',
    readiness: 'kesiapan',
    teamReady: 'pasukan siap',
    approvalsOpen: 'approval terbuka',
    freshEvents: 'event baru',
    topLane: 'Lane operasi utama',
    laneHint: 'Pilih insiden untuk melihat kesiapan respons.',
    minutesOpen: 'minit berjalan',
    evidenceHealth: 'Kualiti bukti',
    slaPressure: 'Tekanan SLA',
    nextMove: 'Langkah operasi seterusnya',
    nextMoveHint: 'Keputusan ringkas dari kesiapan, bukti, SLA, dan approval.',
    monitoring: 'Pemantauan real-time',
    monitoringTitle: 'Signal intake, risk engine, dan peta krisis dalam satu sistem.',
    signalIntake: 'Signal intake',
    signalIntakeHint: 'Berita, RSS, media sosial, weather API, dan laporan warga.',
    title: 'Tajuk sinyal',
    source: 'Source',
    category: 'Kategori',
    location: 'Lokasi',
    addSignal: 'Tambah sinyal',
    search: 'Cari insiden, lokasi, kategori...',
    riskBreakdown: 'Rincian risk score',
    crisisMap: 'Peta krisis',
    whatNext: 'Apa langkah seterusnya?',
    sourceVerification: 'Pengesahan sumber',
    statement: 'Statement automatik',
    timeline: 'Timeline automatik',
    collaboration: 'Ruang kolaborasi',
    audit: 'Audit trail',
    approvalTitle: 'Workflow approval statement',
    approvalHint: 'Draft, review, approved, published, rejected.',
    noApproval: 'Belum ada approval untuk insiden ini.',
    sendReview: 'Hantar review',
    liveFeed: 'Live command feed',
    liveFeedHint: 'Polling 5 saat dari Prisma live events.',
    languageHint: 'Bahasa interface aktif',
    levels: { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritikal' },
    filters: { all: 'Semua', critical: 'Kritikal', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' },
  },
  ja: {
    navMonitor: '監視',
    navResponse: '対応',
    command: 'Command',
    theme: 'テーマ切替',
    heroTitle: '危機が拡散する前に動く。',
    heroDescription:
      '初期シグナルを読み、リスクを採点し、チームを調整し、声明と監査記録を整えるAI危機対応OS。',
    openSignalRoom: 'シグナル室を開く',
    viewRecommendation: '推奨を見る',
    situationSummary: 'AI状況要約',
    metrics: ['監視シグナル', '進行中の状況', '高リスク', '到達範囲'],
    avg: '平均',
    critical: '重大',
    scenario: 'シナリオ',
    running: '実行中...',
    playbook: 'プレイブック進捗',
    report: '危機レポート',
    preparing: '準備中...',
    warRoom: '危機司令室',
    readiness: '準備度',
    teamReady: 'チーム準備',
    approvalsOpen: '未完了承認',
    freshEvents: '新規イベント',
    topLane: '主要オペレーション',
    laneHint: 'インシデントを選択して対応準備を確認。',
    minutesOpen: '分経過',
    evidenceHealth: '証拠健全性',
    slaPressure: 'SLA圧力',
    nextMove: '次の対応',
    nextMoveHint: '準備度、証拠、SLA、承認から判断。',
    monitoring: 'リアルタイム監視',
    monitoringTitle: 'シグナル入力、リスクエンジン、危機マップを一つに。',
    signalIntake: 'シグナル入力',
    signalIntakeHint: 'ニュース、RSS、SNS、天気API、市民報告。',
    title: 'シグナル名',
    source: 'Source',
    category: 'カテゴリ',
    location: '場所',
    addSignal: '追加',
    search: '検索...',
    riskBreakdown: 'リスク内訳',
    crisisMap: '危機マップ',
    whatNext: '次に何をする?',
    sourceVerification: 'ソース確認',
    statement: '自動声明',
    timeline: '自動タイムライン',
    collaboration: '協業ルーム',
    audit: '監査記録',
    approvalTitle: '声明承認フロー',
    approvalHint: 'Draft, review, approved, published, rejected.',
    noApproval: 'このインシデントの承認はありません。',
    sendReview: 'レビュー送信',
    liveFeed: 'ライブ指令フィード',
    liveFeedHint: 'Prisma live eventsを5秒ごとに取得。',
    languageHint: '現在の表示言語',
    levels: { low: '低', medium: '中', high: '高', critical: '重大' },
    filters: { all: 'すべて', critical: '重大', high: '高', medium: '中', low: '低' },
  },
  ar: {
    navMonitor: 'المراقبة',
    navResponse: 'الاستجابة',
    command: 'Command',
    theme: 'تبديل النمط',
    heroTitle: 'لا تنتظر حتى تنتشر الأزمة.',
    heroDescription:
      'نظام تشغيل أزمات بالذكاء الاصطناعي يقرأ الإشارات المبكرة، يقيم المخاطر، ينسق الفرق، ويجهز البيانات وسجل القرارات.',
    openSignalRoom: 'افتح غرفة الإشارات',
    viewRecommendation: 'عرض التوصيات',
    situationSummary: 'ملخص الموقف',
    metrics: ['إشارات مراقبة', 'حالات نشطة', 'خطر مرتفع', 'وصول عام'],
    avg: 'متوسط',
    critical: 'حرج',
    scenario: 'محاكي السيناريو',
    running: 'يعمل...',
    playbook: 'تقدم الخطة',
    report: 'تقرير الأزمة',
    preparing: 'جار التحضير...',
    warRoom: 'غرفة الأزمة',
    readiness: 'الجاهزية',
    teamReady: 'جاهزية الفريق',
    approvalsOpen: 'موافقات مفتوحة',
    freshEvents: 'أحداث جديدة',
    topLane: 'مسار التشغيل الرئيسي',
    laneHint: 'اختر حادثة لفحص جاهزية الاستجابة.',
    minutesOpen: 'دقائق مفتوحة',
    evidenceHealth: 'صحة الأدلة',
    slaPressure: 'ضغط SLA',
    nextMove: 'الخطوة التالية',
    nextMoveHint: 'قرار مختصر من الجاهزية والأدلة وSLA والموافقة.',
    monitoring: 'مراقبة فورية',
    monitoringTitle: 'إدخال الإشارات، محرك المخاطر، وخريطة الأزمة في نظام واحد.',
    signalIntake: 'إدخال الإشارة',
    signalIntakeHint: 'أخبار، RSS، وسائل اجتماعية، طقس، وتقارير مواطنين.',
    title: 'عنوان الإشارة',
    source: 'Source',
    category: 'الفئة',
    location: 'الموقع',
    addSignal: 'إضافة إشارة',
    search: 'بحث...',
    riskBreakdown: 'تفصيل المخاطر',
    crisisMap: 'خريطة الأزمة',
    whatNext: 'ما الخطوة التالية؟',
    sourceVerification: 'تحقق المصدر',
    statement: 'بيان تلقائي',
    timeline: 'خط زمني تلقائي',
    collaboration: 'غرفة التعاون',
    audit: 'سجل التدقيق',
    approvalTitle: 'مسار موافقة البيان',
    approvalHint: 'Draft, review, approved, published, rejected.',
    noApproval: 'لا توجد موافقة لهذه الحادثة.',
    sendReview: 'إرسال للمراجعة',
    liveFeed: 'تغذية الأوامر',
    liveFeedHint: 'تحديث كل 5 ثوان من Prisma live events.',
    languageHint: 'لغة الواجهة الحالية',
    levels: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع', critical: 'حرج' },
    filters: { all: 'الكل', critical: 'حرج', high: 'مرتفع', medium: 'متوسط', low: 'منخفض' },
  },
} as const

const sourceLabels: Record<Source, string> = {
  news: 'News',
  rss: 'RSS',
  x: 'X/Twitter',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  youtube: 'YouTube',
  weather: 'Weather API',
  citizen_report: 'Citizen report',
}

const categoryLabels: Record<Category, string> = {
  weather_extreme: 'Weather extreme',
  scam: 'Scam',
  event_safety: 'Event safety',
  hoax: 'Hoax',
  supply_disruption: 'Supply disruption',
  brand_issue: 'Brand issue',
  social_conflict: 'Social conflict',
}

const filterLevels: Array<'all' | RiskLevel> = ['all', 'critical', 'high', 'medium', 'low']
const scenarioOptions: Array<{ id: 'flood' | 'scam' | 'crowd'; label: string }> = [
  { id: 'flood', label: 'Flood surge' },
  { id: 'scam', label: 'Scam spike' },
  { id: 'crowd', label: 'Crowd risk' },
]
const roleOptions: Array<{ role: UserRole; label: string }> = [
  { role: 'admin', label: 'Admin' },
  { role: 'analyst', label: 'Analyst' },
  { role: 'comms', label: 'Comms' },
  { role: 'field_verifier', label: 'Field' },
  { role: 'viewer', label: 'Viewer' },
]

const seedForm = {
  source: 'citizen_report' as Source,
  title: 'Crowd rumor spreading near venue entrance',
  location: 'Jakarta Selatan',
  lat: -6.24,
  lng: 106.81,
  category: 'event_safety' as Category,
  severity: 72,
  velocity: 78,
  credibility: 66,
  sentiment: -54,
  reach: 180000,
  summary: 'Community volunteers report confusion at a side entrance while short videos begin spreading.',
}

function framePath(frame: number) {
  return `/crisis-frames/frame-${String(frame).padStart(3, '0')}.svg`
}

function formatReach(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value)
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem('crisis-signal-language') as Language | null
    return saved && saved in copy ? saved : 'id'
  })
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [activeId, setActiveId] = useState<Category>('weather_extreme')
  const [frame, setFrame] = useState(0)
  const [form, setForm] = useState(seedForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | RiskLevel>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [commandMode, setCommandMode] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({})
  const [busyAction, setBusyAction] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const flowRef = useRef<HTMLDivElement>(null)
  const preloadedFrames = useRef<HTMLImageElement[]>([])
  const frameProgressValue = useMotionValue(0)
  const smoothFrameProgress = useSpring(frameProgressValue, { stiffness: 170, damping: 28, mass: 0.25 })
  const frameDrift = useTransform(smoothFrameProgress, [0, 1], [-18, 18])
  const frameScale = useTransform(smoothFrameProgress, [0, 1], [0.97, 1.03])
  const frameGlow = useTransform(smoothFrameProgress, [0, 1], [0.18, 0.42])
  const cursorX = useMotionValue(-120)
  const cursorY = useMotionValue(-120)
  const smoothCursorX = useSpring(cursorX, { stiffness: 220, damping: 34, mass: 0.32 })
  const smoothCursorY = useSpring(cursorY, { stiffness: 220, damping: 34, mass: 0.32 })
  const t = copy[language]
  const levelLabels = t.levels
  const activeLanguage = languageOptions.find((item) => item.code === language) ?? languageOptions[0]

  useEffect(() => {
    window.localStorage.setItem('crisis-signal-language', language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  useEffect(() => {
    let animationId = 0

    function updateFrame() {
      const section = flowRef.current

      if (!section) {
        return
      }

      const rect = section.getBoundingClientRect()
      const scrollDistance = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance))
      const nextFrame = Math.round(progress * (totalFrames - 1))

      frameProgressValue.set(progress)
      setFrame((current) => (current === nextFrame ? current : nextFrame))
    }

    function requestUpdate() {
      cancelAnimationFrame(animationId)
      animationId = requestAnimationFrame(updateFrame)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [frameProgressValue])

  useEffect(() => {
    preloadedFrames.current = Array.from({ length: totalFrames }, (_, index) => {
      const image = new Image()
      image.decoding = 'sync'
      image.src = framePath(index)
      return image
    })
  }, [])

  useEffect(() => {
    function updateCursor(event: PointerEvent) {
      cursorX.set(event.clientX)
      cursorY.set(event.clientY)
    }

    window.addEventListener('pointermove', updateCursor, { passive: true })

    return () => {
      window.removeEventListener('pointermove', updateCursor)
    }
  }, [cursorX, cursorY])

  useEffect(() => {
    getDashboard()
      .then((data) => {
        setDashboard(data)
        setActiveId(data.situations[0]?.id ?? 'weather_extreme')
        setCurrentUser(data.users[0] ?? null)
        setLiveEvents(data.liveEvents ?? [])
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      getLiveEvents()
        .then(setLiveEvents)
        .catch(() => undefined)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen((value) => !value)
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const activeSituation = useMemo<Situation | undefined>(
    () => dashboard?.situations.find((item) => item.id === activeId) ?? dashboard?.situations[0],
    [activeId, dashboard],
  )
  const filteredSituations = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return (dashboard?.situations ?? []).filter((situation) => {
      const matchesLevel = levelFilter === 'all' || situation.level === levelFilter
      const matchesCategory = categoryFilter === 'all' || situation.category === categoryFilter
      const matchesQuery =
        !needle ||
        [situation.title, situation.location, situation.summary, situation.category]
          .join(' ')
          .toLowerCase()
          .includes(needle)

      return matchesLevel && matchesCategory && matchesQuery
    })
  }, [categoryFilter, dashboard?.situations, levelFilter, query])
  const activeCompletion = useMemo(() => {
    if (!activeSituation?.playbook.length) return 0
    const done = activeSituation.playbook.filter((item) => completedActions[`${activeSituation.id}-${item.id}`]).length
    return Math.round((done / activeSituation.playbook.length) * 100)
  }, [activeSituation, completedActions])
  const activeApprovals = useMemo(
    () => (dashboard?.approvals ?? []).filter((approval) => approval.situationId === activeSituation?.id),
    [activeSituation?.id, dashboard?.approvals],
  )
  const activeWarLane = useMemo(
    () => dashboard?.warRoom?.lanes.find((lane) => lane.situationId === activeSituation?.id),
    [activeSituation?.id, dashboard?.warRoom?.lanes],
  )
  const commands = [
      {
        id: 'open-monitor',
        label: 'Open signal intake',
        meta: 'Monitoring',
        action: () => {
          document.querySelector('#monitor')?.scrollIntoView({ behavior: 'smooth' })
        },
      },
      {
        id: 'open-response',
        label: 'Open response workspace',
        meta: 'Response',
        action: () => {
          document.querySelector('#response')?.scrollIntoView({ behavior: 'smooth' })
        },
      },
      {
        id: 'toggle-command',
        label: commandMode ? 'Exit compact command mode' : 'Enter compact command mode',
        meta: 'View',
        action: () => setCommandMode((value) => !value),
      },
      {
        id: 'scenario-scam',
        label: 'Run scam spike scenario',
        meta: 'Simulator',
        action: () => runScenario('scam'),
      },
      {
        id: 'scenario-flood',
        label: 'Run flood surge scenario',
        meta: 'Simulator',
        action: () => runScenario('flood'),
      },
      {
        id: 'scenario-crowd',
        label: 'Run crowd risk scenario',
        meta: 'Simulator',
        action: () => runScenario('crowd'),
      },
      {
        id: 'export-report',
        label: 'Export active incident JSON',
        meta: 'Report',
        action: exportReport,
      },
      {
        id: 'reset-demo',
        label: 'Reset demo data',
        meta: 'System',
        action: restoreDemo,
      },
      ...(dashboard?.situations ?? []).map((situation) => ({
        id: `incident-${situation.id}`,
        label: situation.title,
        meta: `${situation.lifecycle} - score ${situation.score}`,
        action: () => selectSituation(situation.id),
      })),
    ]
  const filteredCommands = (() => {
    const needle = commandQuery.trim().toLowerCase()
    if (!needle) return commands.slice(0, 10)
    return commands
      .filter((command) => [command.label, command.meta].join(' ').toLowerCase().includes(needle))
      .slice(0, 12)
  })()

  async function submitSignal() {
    const result = await ingestSignal(form as Partial<Signal>)
    setDashboard(result.dashboard)
    setActiveId(result.signal.category)
    setDetailOpen(true)
  }

  async function restoreDemo() {
    const next = await resetDemo()
    setDashboard(next)
    setActiveId(next.situations[0]?.id ?? 'weather_extreme')
  }

  async function runScenario(scenario: 'flood' | 'scam' | 'crowd') {
    setBusyAction(scenario)
    try {
      const result = await simulateScenario(scenario)
      setDashboard(result.dashboard)
      setActiveId(result.signal.category)
      setDetailOpen(true)
    } finally {
      setBusyAction('')
    }
  }

  async function exportReport() {
    if (!activeSituation) return
    setBusyAction('export')
    try {
      const report = await getSituationReport(activeSituation.id)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `crisis-report-${activeSituation.id}.json`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusyAction('')
    }
  }

  function selectSituation(id: Category, openDrawer = true) {
    setActiveId(id)
    setDetailOpen(openDrawer)
  }

  async function switchRole(role: UserRole) {
    setBusyAction(role)
    try {
      const result = await loginRole(role)
      setCurrentUser(result.user)
      setLiveEvents(await getLiveEvents())
    } finally {
      setBusyAction('')
    }
  }

  async function requestApproval() {
    if (!activeSituation || !currentUser) return
    setBusyAction('approval')
    try {
      const approval = await createApproval({
        situationId: activeSituation.id,
        statement: activeSituation.statement,
        requestedBy: currentUser.role,
      })
      setDashboard((current) =>
        current
          ? {
              ...current,
              approvals: [approval, ...current.approvals.filter((item) => item.id !== approval.id)],
            }
          : current,
      )
      setLiveEvents(await getLiveEvents())
    } finally {
      setBusyAction('')
    }
  }

  async function changeApproval(approval: ApprovalRequest, status: ApprovalRequest['status']) {
    setBusyAction(approval.id)
    try {
      const next = await updateApproval(approval.id, status, `Updated by ${currentUser?.role ?? 'operator'}.`)
      setDashboard((current) =>
        current
          ? {
              ...current,
              approvals: current.approvals.map((item) => (item.id === next.id ? next : item)),
            }
          : current,
      )
      setLiveEvents(await getLiveEvents())
    } finally {
      setBusyAction('')
    }
  }

  if (loading) {
    return (
      <main className="app status-shell" data-theme={theme}>
        <div className="loading-panel">Loading CrisisSignal AI...</div>
      </main>
    )
  }

  if (error || !dashboard) {
    return (
      <main className="app status-shell" data-theme={theme}>
        <div className="loading-panel">API belum aktif: {error || 'dashboard kosong'}</div>
      </main>
    )
  }

  return (
    <main className={`app ${commandMode ? 'command-mode' : ''}`} data-theme={theme}>
      <motion.div
        className="cursor-field"
        style={{
          x: smoothCursorX,
          y: smoothCursorY,
        }}
        aria-hidden="true"
      />
      <AnimatePresence>
        {commandPaletteOpen && (
          <motion.div
            className="command-palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setCommandPaletteOpen(false)}
          >
            <motion.div
              className="command-palette panel"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="command-palette-head">
                <Search size={18} />
                <input
                  autoFocus
                  value={commandQuery}
                  placeholder="Search action, scenario, incident..."
                  onChange={(event) => setCommandQuery(event.target.value)}
                />
                <span>Ctrl K</span>
              </div>
              <div className="command-palette-list">
                {filteredCommands.map((command) => (
                  <button
                    type="button"
                    key={command.id}
                    onClick={() => {
                      command.action()
                      setCommandPaletteOpen(false)
                      setCommandQuery('')
                    }}
                  >
                    <strong>{command.label}</strong>
                    <small>{command.meta}</small>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <section className="hero" id="top">
        <nav className="nav">
          <a className="brand" href="#top" aria-label="CrisisSignal AI">
            <img src="/brand/crisis-signal-logo.png" alt="" />
            <span>
              <strong>CrisisSignal AI</strong>
              <small>{repoName}</small>
            </span>
          </a>
          <div className="nav-actions">
            <div className="language-switcher" title={t.languageHint}>
              <Languages size={15} />
              <span>{activeLanguage.short}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                aria-label={t.languageHint}
              >
                {languageOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="role-switcher" title="Demo role session">
              <LockKeyhole size={15} />
              <select
                value={currentUser?.role ?? 'admin'}
                onChange={(event) => switchRole(event.target.value as UserRole)}
                aria-label="Switch role"
              >
                {roleOptions.map((item) => (
                  <option key={item.role} value={item.role}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="nav-command"
              onClick={() => setCommandPaletteOpen(true)}
              title="Command center"
            >
              {commandPaletteOpen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              {t.command}
            </button>
            <a href="#monitor">{t.navMonitor}</a>
            <a href="#response">{t.navResponse}</a>
            <button
              type="button"
              className="icon-button"
              aria-label={t.theme}
              title={t.theme}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h1>{t.heroTitle}</h1>
            <p>{t.heroDescription}</p>
            <div className="hero-actions">
              <a className="primary-action" href="#monitor">
                {t.openSignalRoom} <RadioTower size={18} />
              </a>
              <a className="secondary-action" href="#response">
                {t.viewRecommendation} <ArrowUpRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            className="command-card panel"
            initial={{ opacity: 0, scale: 0.96, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="command-head">
              <div>
                <span>{t.situationSummary}</span>
                <strong>{activeSituation?.title}</strong>
              </div>
              <Siren />
            </div>
            <div className="risk-orb">
              <motion.div
                className="orb-sweep"
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              />
              <strong>{activeSituation?.score}</strong>
              <span>{activeSituation ? levelLabels[activeSituation.level] : 'Rendah'}</span>
            </div>
            <div className="command-metrics">
              <span>
                <Gauge size={17} /> {t.avg} {dashboard.stats.avgRisk}
              </span>
              <span>
                <Flame size={17} /> {dashboard.stats.critical} {t.critical}
              </span>
              <span>
                <Globe2 size={17} /> {formatReach(dashboard.stats.monitoredReach)}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {dashboard.alerts.length > 0 && (
        <section className="alert-strip" aria-label="Crisis alert rules">
          {dashboard.alerts.slice(0, 3).map((alert) => (
            <button
              key={alert.id}
              type="button"
              className={`alert-rule ${alert.level}`}
              onClick={() => selectSituation(alert.situationId)}
            >
              <Siren size={18} />
              <span>
                <strong>{alert.title}</strong>
                <small>{alert.message}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </section>
      )}

      <section className="metrics-strip">
        <div>
          <strong>{dashboard.stats.totalSignals}</strong>
          <span>{t.metrics[0]}</span>
        </div>
        <div>
          <strong>{dashboard.stats.activeSituations}</strong>
          <span>{t.metrics[1]}</span>
        </div>
        <div>
          <strong>{dashboard.stats.high}</strong>
          <span>{t.metrics[2]}</span>
        </div>
        <div>
          <strong>{formatReach(dashboard.stats.monitoredReach)}</strong>
          <span>{t.metrics[3]}</span>
        </div>
      </section>

      {activeSituation && (
        <section className="ops-deck">
          <div className="ops-card panel">
            <span className="kicker">
              <Play size={16} /> {t.scenario}
            </span>
            <div className="scenario-row">
              {scenarioOptions.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => runScenario(scenario.id)}
                  disabled={busyAction === scenario.id}
                >
                  {busyAction === scenario.id ? t.running : scenario.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ops-card panel">
            <span className="kicker">
              <ListChecks size={16} /> {t.playbook}
            </span>
            <strong>{activeCompletion}% complete</strong>
            <div className="mini-progress" aria-hidden="true">
              <span style={{ width: `${activeCompletion}%` }} />
            </div>
          </div>
          <div className={`ops-card panel sla-card ${activeSituation.sla.state}`}>
            <span className="kicker">
              <Activity size={16} /> Incident lifecycle
            </span>
            <strong>{activeSituation.lifecycle}</strong>
            <small>
              SLA {activeSituation.sla.remainingMinutes >= 0 ? `${activeSituation.sla.remainingMinutes}m left` : `${Math.abs(activeSituation.sla.remainingMinutes)}m late`}
            </small>
            <div className="mini-progress" aria-hidden="true">
              <span style={{ width: `${activeSituation.sla.pressure}%` }} />
            </div>
          </div>
          <div className="ops-card panel">
            <span className="kicker">
              <Download size={16} /> {t.report}
            </span>
            <div className="report-row">
              <button type="button" className="secondary-action report-action" onClick={exportReport}>
                {busyAction === 'export' ? t.preparing : 'JSON'} <ArrowUpRight size={17} />
              </button>
              <a className="primary-action report-action" href={pdfReportUrl(activeSituation.id)}>
                PDF <Download size={17} />
              </a>
            </div>
          </div>
        </section>
      )}

      {dashboard.warRoom && (
        <section className="war-room panel" id="war-room">
          <div className="war-head">
            <div>
              <span className="kicker">
                <Siren size={16} /> {t.warRoom}
              </span>
              <h2>{dashboard.warRoom.operatingMode}</h2>
            </div>
            <div className="war-score">
              <span>{t.readiness}</span>
              <strong>{dashboard.warRoom.averageReadiness}%</strong>
            </div>
          </div>

          <div className="war-metrics">
            <span>
              <UsersRound size={16} />
              <strong>{dashboard.warRoom.teamReadiness}%</strong>
              {t.teamReady}
            </span>
            <span>
              <Send size={16} />
              <strong>{dashboard.warRoom.unresolvedApprovals}</strong>
              {t.approvalsOpen}
            </span>
            <span>
              <RadioTower size={16} />
              <strong>{dashboard.warRoom.freshEvents}</strong>
              {t.freshEvents}
            </span>
          </div>

          <div className="war-layout">
            <div className="war-priority">
              <div className="panel-title">
                <Gauge />
                <div>
                  <strong>{activeWarLane?.title ?? 'Top operating lane'}</strong>
                  <small>{activeWarLane ? `${activeWarLane.minutesOpen} ${t.minutesOpen} - ${activeWarLane.communicationStatus}` : t.laneHint}</small>
                </div>
              </div>
              {activeWarLane && (
                <>
                  <div className="readiness-orbit" aria-label={`Readiness ${activeWarLane.readiness}%`}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                      aria-hidden="true"
                    />
                    <strong>{activeWarLane.readiness}</strong>
                    <small>{levelLabels[activeWarLane.level]}</small>
                  </div>
                  <div className="war-bars">
                    <div>
                      <span>{t.evidenceHealth}</span>
                      <b>{activeWarLane.evidenceHealth}%</b>
                      <i><em style={{ width: `${activeWarLane.evidenceHealth}%` }} /></i>
                    </div>
                    <div>
                      <span>{t.slaPressure}</span>
                      <b>{activeWarLane.slaPressure}%</b>
                      <i><em style={{ width: `${activeWarLane.slaPressure}%` }} /></i>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="war-next">
              <div className="panel-title">
                <ClipboardList />
                <div>
                  <strong>{t.nextMove}</strong>
                  <small>{t.nextMoveHint}</small>
                </div>
              </div>
              <p>{activeWarLane?.nextMove ?? dashboard.warRoom.lanes[0]?.nextMove}</p>
              <div className="blocker-list">
                {(activeWarLane?.blockers ?? dashboard.warRoom.lanes[0]?.blockers ?? []).map((blocker) => (
                  <span key={blocker}>
                    <AlertTriangle size={15} /> {blocker}
                  </span>
                ))}
              </div>
            </div>

            <div className="war-lanes">
              {dashboard.warRoom.lanes.map((lane) => (
                <button
                  type="button"
                  className={`war-lane ${lane.level} ${lane.situationId === activeSituation?.id ? 'active' : ''}`}
                  key={lane.situationId}
                  onClick={() => selectSituation(lane.situationId)}
                >
                  <span>{lane.readiness}%</span>
                  <strong>{lane.title}</strong>
                  <small>{lane.communicationStatus} - SLA {lane.slaPressure}%</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeSituation && (
        <section className="operating-grid">
          <div className="approval-panel panel">
            <div className="panel-title">
              <Send />
              <div>
                <strong>{t.approvalTitle}</strong>
                <small>{t.approvalHint}</small>
              </div>
            </div>
            <div className="approval-current">
              <span>{currentUser?.avatar ?? 'CS'}</span>
              <div>
                <strong>{currentUser?.name ?? 'Demo operator'}</strong>
                <small>{currentUser?.role ?? 'admin'} session</small>
              </div>
              <button
                type="button"
                className="primary-action"
                onClick={requestApproval}
                disabled={currentUser?.role === 'viewer' || busyAction === 'approval'}
              >
                {busyAction === 'approval' ? t.preparing : t.sendReview}
              </button>
            </div>
            <div className="approval-list">
              {activeApprovals.length === 0 ? (
                <span className="approval-empty">{t.noApproval}</span>
              ) : (
                activeApprovals.map((approval) => (
                  <div className={`approval-item ${approval.status}`} key={approval.id}>
                    <span>{approval.status}</span>
                    <strong>{approval.statement}</strong>
                    <small>
                      {approval.requestedBy} to {approval.reviewer} - {approval.note}
                    </small>
                    <div>
                      <button
                        type="button"
                        onClick={() => changeApproval(approval, 'approved')}
                        disabled={busyAction === approval.id || currentUser?.role === 'viewer'}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => changeApproval(approval, 'published')}
                        disabled={busyAction === approval.id || currentUser?.role === 'viewer'}
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => changeApproval(approval, 'rejected')}
                        disabled={busyAction === approval.id || currentUser?.role === 'viewer'}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="live-panel panel">
            <div className="panel-title">
              <RadioTower />
              <div>
                <strong>{t.liveFeed}</strong>
                <small>{t.liveFeedHint}</small>
              </div>
            </div>
            <div className="live-list">
              {liveEvents.slice(0, 8).map((event) => (
                <button
                  type="button"
                  className="live-event"
                  key={event.id}
                  onClick={() => event.situationId && selectSituation(event.situationId)}
                >
                  <span>{event.type}</span>
                  <strong>{event.title}</strong>
                  <small>{event.message}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="scroll-lab" ref={flowRef}>
        <div className="frame-stage panel">
          <div className="frame-hud" aria-hidden="true">
            <span>
              <Server size={15} /> Live pipeline
            </span>
            <strong>Frame {String(frame + 1).padStart(3, '0')} / {totalFrames}</strong>
          </div>
          <motion.div
            className="frame-glow"
            style={{
              opacity: frameGlow,
              x: frameDrift,
            }}
            aria-hidden="true"
          />
          <motion.img
            src={framePath(frame)}
            alt={`CrisisSignal AI animation frame ${frame + 1}`}
            style={{ scale: frameScale }}
            loading="eager"
            decoding="sync"
            draggable={false}
          />
          <div className="frame-progress" aria-hidden="true">
            <span style={{ width: `${((frame + 1) / totalFrames) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="monitor" id="monitor">
        <div className="section-title">
          <span className="kicker">
            <Brain size={16} /> {t.monitoring}
          </span>
          <h2>{t.monitoringTitle}</h2>
        </div>

        <div className="monitor-grid">
          <div className="ingest panel">
            <div className="panel-title">
              <BellRing />
              <div>
                <strong>{t.signalIntake}</strong>
                <small>{t.signalIntakeHint}</small>
              </div>
            </div>
            <label>
              {t.title}
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <div className="form-row">
              <label>
                Source
                <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as Source })}>
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.category}
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as Category })}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                {t.location}
                <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              </label>
              <label>
                Reach
                <input
                  type="number"
                  value={form.reach}
                  onChange={(event) => setForm({ ...form, reach: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="slider-grid">
              <label>
                Severity {form.severity}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.severity}
                  onChange={(event) => setForm({ ...form, severity: Number(event.target.value) })}
                />
              </label>
              <label>
                Velocity {form.velocity}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.velocity}
                  onChange={(event) => setForm({ ...form, velocity: Number(event.target.value) })}
                />
              </label>
              <label>
                Credibility {form.credibility}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.credibility}
                  onChange={(event) => setForm({ ...form, credibility: Number(event.target.value) })}
                />
              </label>
              <label>
                Sentiment {form.sentiment}
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={form.sentiment}
                  onChange={(event) => setForm({ ...form, sentiment: Number(event.target.value) })}
                />
              </label>
            </div>
            <label>
              Summary
              <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            </label>
            <button type="button" className="primary-action submit" onClick={submitSignal}>
              {t.addSignal} <ChevronRight size={18} />
            </button>
          </div>

          <div className="situation-column">
            <div className="filter-panel panel">
              <label className="search-box">
                <Search size={17} />
                <input
                  value={query}
                  placeholder={t.search}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="filter-row" aria-label="Risk level filter">
                <Filter size={16} />
                {filterLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={levelFilter === level ? 'active' : ''}
                    onClick={() => setLevelFilter(level)}
                  >
                    {t.filters[level]}
                  </button>
                ))}
              </div>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | Category)}>
                <option value="all">{t.filters.all} categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="situation-list">
              <AnimatePresence initial={false}>
                {filteredSituations.map((situation) => (
                  <motion.button
                    layout
                    key={situation.id}
                    type="button"
                    className={`situation-card panel ${activeSituation?.id === situation.id ? 'active' : ''}`}
                    onClick={() => selectSituation(situation.id)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                  >
                    <span className={`risk-dot ${situation.level}`} />
                  <span>
                    <strong>{situation.title}</strong>
                    <small>
                        {situation.lifecycle} - {situation.signalCount} signals - {formatReach(situation.reach)} reach
                    </small>
                  </span>
                    <b>{situation.score}</b>
                  </motion.button>
                ))}
              </AnimatePresence>
              {filteredSituations.length === 0 && (
                <div className="empty-state panel">
                  <Eye size={20} />
                  <strong>No matching crisis signal</strong>
                  <span>Ubah filter atau jalankan scenario simulator.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {activeSituation && (
        <section className="response-grid" id="response">
          <div className="breakdown-panel panel">
            <div className="panel-title">
              <Activity />
              <div>
                <strong>{t.riskBreakdown}</strong>
                <small>Kontribusi severity, velocity, credibility, reach, dan sentiment.</small>
              </div>
            </div>
            {Object.entries(activeSituation.scoreBreakdown).map(([label, value]) => (
              <div className="score-line" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <div aria-hidden="true">
                  <i style={{ width: `${Math.min(100, value * 3)}%` }} />
                </div>
              </div>
            ))}
            <div className="score-history" aria-label="Score history">
              {activeSituation.scoreHistory.map((item) => (
                <span key={item.time} style={{ height: `${Math.max(18, item.score)}%` }} title={`${item.score}`} />
              ))}
            </div>
          </div>

          <div className="map-panel panel">
            <div className="panel-title">
              <MapPin />
              <div>
                <strong>{t.crisisMap}</strong>
                <small>Lokasi sinyal aktif dan radius eskalasi.</small>
              </div>
            </div>
            <div className="map-canvas">
              {dashboard.situations.map((situation) => (
                <motion.button
                  type="button"
                  key={situation.id}
                  className={`map-pin ${situation.level}`}
                  style={{
                    left: `${Math.min(86, Math.max(12, ((situation.lng - 106) / 8) * 74 + 16))}%`,
                    top: `${Math.min(84, Math.max(12, (Math.abs(situation.lat) / 9) * 68 + 8))}%`,
                  }}
                  onClick={() => selectSituation(situation.id)}
                  animate={{ scale: situation.level === 'critical' ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 2.4, repeat: situation.level === 'critical' ? Infinity : 0 }}
                >
                  <i aria-hidden="true" />
                  <AlertTriangle size={18} />
                  <span>{situation.score}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="action-panel panel">
            <div className="panel-title">
              <ClipboardList />
              <div>
                <strong>{t.whatNext}</strong>
                <small>{activeSituation.summary}</small>
              </div>
            </div>
            <div className="primary-next">
              <ShieldAlert />
              <strong>{activeSituation.nextAction.primary}</strong>
            </div>
            {activeSituation.playbook.map((step, index) => (
              <button
                type="button"
                className={`step-line checklist-line ${completedActions[`${activeSituation.id}-${step.id}`] ? 'done' : ''}`}
                key={step.id}
                onClick={() =>
                  setCompletedActions((current) => ({
                    ...current,
                    [`${activeSituation.id}-${step.id}`]: !current[`${activeSituation.id}-${step.id}`],
                  }))
                }
              >
                <b>{completedActions[`${activeSituation.id}-${step.id}`] ? <CheckCircle2 size={16} /> : index + 1}</b>
                <span>
                  <strong>{step.label}</strong>
                  <small>
                    {step.owner} - ETA {step.eta} - {step.priority}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <div className="evidence-panel panel">
            <div className="panel-title">
              <Layers3 />
              <div>
                <strong>{t.sourceVerification}</strong>
                <small>Evidence status dari sinyal yang membentuk incident.</small>
              </div>
            </div>
            {activeSituation.evidence.map((item) => (
              <div className={`evidence-item ${item.verification}`} key={item.id}>
                <span>{item.verification.replace('_', ' ')}</span>
                <strong>{item.title}</strong>
                <small>
                  {sourceLabels[item.source]} - credibility {item.credibility} - score {item.score}
                </small>
              </div>
            ))}
          </div>

          <div className="statement-panel panel">
            <div className="panel-title">
              <Megaphone />
              <div>
                <strong>{t.statement}</strong>
                <small>Holding statement untuk brand, komunitas, atau pemerintah daerah.</small>
              </div>
            </div>
            <blockquote>{activeSituation.statement}</blockquote>
          </div>

          <div className="timeline-panel panel">
            <div className="panel-title">
              <History />
              <div>
                <strong>{t.timeline}</strong>
                <small>Urutan kejadian dari sinyal multi-source.</small>
              </div>
            </div>
            {activeSituation.timeline.map((item) => (
              <div className="timeline-item" key={item.id}>
                <span>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <strong>{item.title}</strong>
                <p>{item.note}</p>
              </div>
            ))}
          </div>

          <div className="team-panel panel">
            <div className="panel-title">
              <UsersRound />
              <div>
                <strong>{t.collaboration}</strong>
                <small>PR team, creator, NGO, relawan, dan pemerintah daerah.</small>
              </div>
            </div>
            {dashboard.teams.map((team) => (
              <span className="team-line" key={team.id}>
                <Handshake size={16} /> <strong>{team.name}</strong> {team.role} - {team.status}
              </span>
            ))}
          </div>

          <div className="audit-panel panel">
            <div className="panel-title">
              <FileText />
              <div>
                <strong>{t.audit}</strong>
                <small>Kenapa AI memberi rekomendasi itu.</small>
              </div>
            </div>
            {dashboard.latestAudit.map((audit) => (
              <div className="audit-item" key={audit.id}>
                <BadgeCheck size={16} />
                <p>
                  <strong>{audit.reason}</strong>
                  <span>{audit.recommendation}</span>
                </p>
              </div>
            ))}
            <button type="button" className="reset-button" onClick={restoreDemo}>
              <RefreshCcw size={16} /> Reset demo data
            </button>
          </div>
        </section>
      )}

      <AnimatePresence>
        {detailOpen && activeSituation && (
          <motion.aside
            className="detail-drawer"
            initial={{ x: '110%' }}
            animate={{ x: 0 }}
            exit={{ x: '110%' }}
            transition={{ type: 'spring', stiffness: 210, damping: 28 }}
          >
            <div className="drawer-head">
              <span className={`risk-dot ${activeSituation.level}`} />
              <div>
                <strong>{activeSituation.title}</strong>
                <small>
                  {activeSituation.location} - {levelLabels[activeSituation.level]} - score {activeSituation.score}
                </small>
              </div>
              <button type="button" className="icon-button" onClick={() => setDetailOpen(false)} aria-label="Close detail">
                <X size={18} />
              </button>
            </div>
            <p>{activeSituation.summary}</p>
            <div className="drawer-actions">
              <button type="button" className="primary-action" onClick={exportReport}>
                <Download size={17} /> Export
              </button>
              <a className="secondary-action" href="#response" onClick={() => setDetailOpen(false)}>
                Open response <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="drawer-grid">
              <span>
                <Gauge size={16} /> {activeSituation.score} risk
              </span>
              <span>
                <RadioTower size={16} /> {activeSituation.signalCount} signals
              </span>
              <span>
                <Globe2 size={16} /> {formatReach(activeSituation.reach)} reach
              </span>
            </div>
            <div className="drawer-section">
              <strong>{t.statement}</strong>
              <blockquote>{activeSituation.statement}</blockquote>
            </div>
            <div className="drawer-section">
              <strong>{t.sourceVerification}</strong>
              {activeSituation.evidence.map((item) => (
                <span className="drawer-line" key={item.id}>
                  <BadgeCheck size={15} /> {item.title} - {item.verification.replace('_', ' ')}
                </span>
              ))}
            </div>
            <div className="drawer-section">
              <strong>{t.audit}</strong>
              {activeSituation.audit.length > 0 ? (
                activeSituation.audit.map((item) => (
                  <span className="drawer-line" key={item.id}>
                    <FileText size={15} /> {item.reason}
                  </span>
                ))
              ) : (
                <span className="drawer-line">
                  <FileText size={15} /> No audit event yet for this incident.
                </span>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="site-footer">
        <div className="footer-identity panel">
          <img src="/brand/crisis-signal-logo.png" alt="" />
          <div>
            <span className="footer-kicker">Crisis command layer</span>
            <strong>CrisisSignal AI</strong>
            <p>{t.heroDescription}</p>
          </div>
        </div>

        <div className="footer-ops">
          <div className="footer-status">
            <span>
              <RadioTower size={16} /> {dashboard.stats.totalSignals} signals
            </span>
            <span>
              <ShieldAlert size={16} /> {dashboard.stats.high + dashboard.stats.critical} escalated
            </span>
            <span>
              <Globe2 size={16} /> {formatReach(dashboard.stats.monitoredReach)} reach
            </span>
          </div>

          <div className="footer-stack">
            <span>
              <Database size={16} /> JSON DB
            </span>
            <span>
              <Server size={16} /> API
            </span>
            <span>
              <Brain size={16} /> Risk engine
            </span>
            <span>
              <FileText size={16} /> Audit log
            </span>
          </div>

          <div className="footer-links">
            <a href="#top">Overview</a>
            <a href="#monitor">{t.navMonitor}</a>
            <a href="#response">{t.navResponse}</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
