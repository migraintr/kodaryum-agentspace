// Sol menü: gruplanmış öğeler; view: tıklanınca açılan ekran ('genel' = ofis). soon: henüz hazır olmayan modül.
// Rozet sayıları Sidebar'da canlı hesaplanır.
import {
  BookOpen, Bot, BrainCircuit, ChartLine, FileChartColumn, Folder, FolderKanban, Globe, LayoutDashboard,
  ListChecks, Network, Puzzle, Settings, SquareTerminal, Workflow,
} from 'lucide-react'

export const NAV_GROUPS = [
  {
    title: 'Çalışma alanı',
    items: [
      { label: 'Ofis', icon: LayoutDashboard, view: 'genel' },
      { label: 'Görevler', icon: ListChecks, view: 'gorevler' },
      { label: 'Projeler', icon: FolderKanban, view: 'projeler' },
    ],
  },
  {
    title: 'Ekip',
    items: [
      { label: 'AI Çalışanlar', icon: Bot, view: 'ajanlar' },
      { label: 'Departmanlar', icon: Network, view: 'departmanlar', rooms: true },
    ],
  },
  {
    title: 'Yakında',
    collapsible: true,
    items: [
      { label: 'Workflow’lar', icon: Workflow, view: 'workflow', soon: true },
      { label: 'Bilgi Bankası', icon: BookOpen, view: 'bilgi', soon: true },
      { label: 'Memory', icon: BrainCircuit, view: 'memory', soon: true },
      { label: 'Tarayıcı', icon: Globe, view: 'tarayici', soon: true },
      { label: 'Terminal', icon: SquareTerminal, view: 'terminal', soon: true },
      { label: 'Dosyalar', icon: Folder, view: 'dosyalar', soon: true },
      { label: 'Raporlar', icon: FileChartColumn, view: 'raporlar', soon: true },
      { label: 'Analitik', icon: ChartLine, view: 'analitik', soon: true },
      { label: 'Entegrasyonlar', icon: Puzzle, view: 'entegrasyonlar', soon: true },
    ],
  },
]
export const SETTINGS = { label: 'Ayarlar', icon: Settings, view: 'ayarlar', soon: true }
export const NAV = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS]
