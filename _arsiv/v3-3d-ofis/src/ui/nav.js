// Sol menü öğeleri; view: tıklanınca açılan ekran ('genel' = 3D ofis)
import {
  BookOpen, Bot, BrainCircuit, Building2, ChartLine, FileChartColumn, Folder, FolderKanban, Globe, LayoutDashboard,
  ListChecks, Network, Puzzle, Settings, SquareTerminal, Workflow,
} from 'lucide-react'
import { OPEN_TASKS } from '../data.js'

export const NAV = [
  { label: 'Genel Bakış', icon: LayoutDashboard, view: 'genel' },
  { label: 'Şirketim', icon: Building2, view: 'sirketim' },
  { label: 'Departmanlar', icon: Network, view: 'departmanlar' },
  { label: 'AI Çalışanlar', icon: Bot, view: 'ajanlar' },
  { label: 'Projeler', icon: FolderKanban, view: 'projeler' },
  { label: 'Görevler', icon: ListChecks, view: 'gorevler', count: OPEN_TASKS },
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
