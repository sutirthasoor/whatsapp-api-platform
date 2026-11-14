'use client'
import type { ReactElement } from 'react'
import { PANEL_CRUD, crudPage } from './panel-crud'
import * as P from './panel-special'
import { Inbox } from './inbox'
import * as A from './admin-pages'

/** Route → page. Keys are matched against the longest URL prefix; sub-routes (new / <id> / <id>/edit …) are handled inside each page. */
export const PANEL_PAGES: Record<string, () => ReactElement> = {
  dashboard: P.UserDashboard,
  'sales/pipeline': P.Pipeline,
  'conversation/inbox': Inbox,
  'conversation/records': P.ChatRecords,
  'marketing/media-library': P.MediaLibrary,
  'whatsapp/api': P.WhatsAppApi,
  'whatsapp/api-docs': P.ApiDocs,
  'automation/ai-assistant': P.AiAssistant,
  'automation/ai-settings': P.AiSettings,
  'billing/reports': P.BillingReports,
  'settings/business': P.SettingsBusiness,
  'settings/billing': P.PlanBilling,
  'settings/security': P.Security,
  ...Object.fromEntries(Object.keys(PANEL_CRUD).map(k => [k, crudPage(k)])),
}

export const ADMIN_PAGES: Record<string, () => ReactElement> = {
  dashboard: A.AdminDashboard,
  'billing-usage': A.BillingUsage,
  'payment-gateway': A.adminCrud('gateways'),
  'main-site/theming': A.SiteTheming,
  'flow/overview': () => <A.PlatformOverview p="flow" />,
  'automation/overview': () => <A.PlatformOverview p="automation" />,
  account: P.Security,
  ...Object.fromEntries(Object.keys(A.ADMIN_CRUD).map(k => [k, A.adminCrud(k)])),
}
// route aliases whose key differs from the collection key
ADMIN_PAGES['payment-gateway'] = A.adminCrud('gateways')
ADMIN_PAGES['users'] = A.adminCrud('users'); ADMIN_PAGES['payments'] = A.adminCrud('payments'); ADMIN_PAGES['plans'] = A.adminCrud('plans')
ADMIN_PAGES['subscriptions'] = A.adminCrud('subscriptions'); ADMIN_PAGES['support'] = A.adminCrud('support'); ADMIN_PAGES['enquiries'] = A.adminCrud('enquiries')
