import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Route,
  Layers,
  Users,
  BarChart3,
  ScrollText,
  ShieldCheck,
  Stamp,
  GraduationCap,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** short hint surfaced in the command palette */
  description: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      {
        label: 'Overview',
        href: '/overview',
        icon: LayoutDashboard,
        description: 'Recovery command center summary',
      },
      {
        label: 'Revenue Recovery',
        href: '/recovery',
        icon: TrendingUp,
        description: 'Recovered revenue and active flows',
      },
      {
        label: 'At-Risk Payments',
        href: '/at-risk',
        icon: AlertTriangle,
        description: 'Payments predicted to fail',
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        label: 'AI Agent',
        href: '/agent',
        icon: Sparkles,
        description: 'Autonomous recovery agent activity',
      },
      {
        label: 'Recovery Strategies',
        href: '/strategies',
        icon: Route,
        description: 'Retry logic and playbooks',
      },
      {
        label: 'Batch Recovery',
        href: '/batch',
        icon: Layers,
        description: 'Bulk recovery campaigns',
      },
      {
        label: 'Outcome Learning',
        href: '/learning',
        icon: GraduationCap,
        description: 'How the model improves over time',
      },
    ],
  },
  {
    label: 'Records',
    items: [
      {
        label: 'Customers',
        href: '/customers',
        icon: Users,
        description: 'Customer accounts and mandates',
      },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Recovery performance analytics',
      },
      {
        label: 'Audit Trail',
        href: '/audit',
        icon: ScrollText,
        description: 'Every agent and system action',
      },
    ],
  },
  {
    label: 'Governance',
    items: [
      {
        label: 'Policy & Safety',
        href: '/policy',
        icon: ShieldCheck,
        description: 'Guardrails and limits',
      },
      {
        label: 'Approvals',
        href: '/approvals',
        icon: Stamp,
        description: 'Actions awaiting human sign-off',
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Workspace configuration',
      },
    ],
  },
]

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items)
