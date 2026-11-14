import { BookOpen, Bot, CreditCard, Globe, HeartHandshake, Layers, LayoutDashboard, Megaphone, MessageCircle, Package, Receipt, Settings, Users, Wallet, Workflow, Zap, Mail, UserCog } from 'lucide-react'

export interface NavItem { label: string; icon?: React.ElementType; href?: string; children?: { label: string; href: string }[] }
const L = (b: string, items: [string, string][]) => items.map(([label, h]) => ({ label, href: `${b}/${h}` }))

export const PANEL_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/panel/dashboard' },
  { label: 'Sales', icon: Wallet, children: L('/panel/sales', [['Leads', 'leads'], ['Pipeline', 'pipeline'], ['Customers', 'customers']]) },
  { label: 'Conversation', icon: MessageCircle, children: L('/panel/conversation', [['Inbox', 'inbox'], ['Follow Ups', 'follow-ups'], ['Meetings', 'meetings'], ['Calls', 'calls'], ['Chat Records', 'records']]) },
  { label: 'Marketing', icon: Megaphone, children: L('/panel/marketing', [['Campaign Reports', 'campaign-reports'], ['Lead Forms', 'lead-form'], ['Media Library', 'media-library']]) },
  { label: 'WhatsApp', icon: Mail, children: L('/panel/whatsapp', [['Templates', 'templates'], ['Forms', 'forms'], ['Broadcasts', 'broadcast-logs'], ['WhatsApp API', 'api'], ['API Docs', 'api-docs']]) },
  { label: 'Automation & AI', icon: Bot, children: L('/panel/automation', [['Chatbot', 'chatbot'], ['FAQ Bot', 'faq-bot'], ['AI Assistant', 'ai-assistant'], ['AI Settings', 'ai-settings']]) },
  { label: 'Products / Services', icon: Package, href: '/panel/products' },
  { label: 'Billing', icon: Receipt, children: L('/panel/billing', [['Quotations', 'quotations'], ['Invoices', 'invoices'], ['Reports', 'reports'], ['Reminders', 'reminders']]) },
  { label: 'Support', icon: HeartHandshake, href: '/panel/support' },
  { label: 'Settings', icon: Settings, children: L('/panel/settings', [['Business', 'business'], ['Team', 'team'], ['API Keys', 'api-keys'], ['Plan & Billing', 'billing'], ['Security', 'security']]) },
]

const plat = ['Overview', 'Users', 'Organisation', 'Training', 'Credentials']
export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'User Management', icon: Users, href: '/admin/users' },
  { label: 'Billing & Usage', icon: Receipt, children: L('/admin', [['Usage', 'billing-usage'], ['Payments', 'payments']]) },
  { label: 'Payment Gateway', icon: CreditCard, href: '/admin/payment-gateway' },
  { label: 'Plans', icon: Layers, href: '/admin/plans' },
  { label: 'Subscriptions', icon: Zap, href: '/admin/subscriptions' },
  { label: 'Support', icon: HeartHandshake, href: '/admin/support' },
  { label: 'Enquiries', icon: BookOpen, href: '/admin/enquiries' },
  { label: 'Flow Platform', icon: Workflow, children: plat.map(l => ({ label: l, href: `/admin/flow/${l.toLowerCase()}` })) },
  { label: 'Automation Platform', icon: Bot, children: plat.map(l => ({ label: l, href: `/admin/automation/${l.toLowerCase()}` })) },
  { label: 'Main Site', icon: Globe, children: L('/admin/main-site', [['Theming', 'theming'], ['Credentials', 'credentials']]) },
  { label: 'My Account', icon: UserCog, href: '/admin/account' },
]
