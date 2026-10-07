// Sol menü öğeleri; view: tıklanınca açılan ekran ('genel' = ofis). Rozet sayıları Sidebar'da canlı hesaplanır.
import {
  BookOpen, Bot, BrainCircuit, Building2, ChartLine, FileChartColumn, Folder, FolderKanban, Globe, LayoutDashboard,
  ListChecks, Network, Puzzle, Settings, SquareTerminal, Workflow,
} from 'lucide-react'
export const NAV = [
  { label: 'Genel Bakış', icon: LayoutDashboard, view: 'genel' },
  { label: 'Şirketim', icon: Building2, view: 'sirketim' },
  { label: 'Departmanlar', icon: Network, view: 'departmanlar' },
  { label: 'AI Çalışanlar', icon: Bot, view: 'ajanlar' },
  { label: 'Projeler', icon: FolderKanban, view: 'projeler' },
  { label: 'Görevler', icon: ListChecks, view: 'gorevler' },
  { label: 'Workflow’lar', icon: Workflow, view: 'workflow' },
  { label: 'Bilgi Bankası', icon: BookOpen, view: 'bilgi' },
  { label: 'Memory', icon: BrainCircuit, view: 'memory' },
  { label: 'Tarayıcı', icon: Globe, view: 'tarayici' },
  { label: 'Terminal', icon: SquareTerminal, view: 'terminal' },
  { label: 'Dosyalar', icon: Folder, view: 'dosyalar' },
  { label: 'Raporlar', icon: FileChartColumn, view: 'raporlar' },
  { label: 'Analitik', icon: ChartLine, view: 'analitik' },
  { label: 'Entegrasyonlar', icon: Puzzle, view: 'entegrasyonlar' },
  { label: 'Ayarlar', icon: Settings, view: 'ayarlar' },
]
