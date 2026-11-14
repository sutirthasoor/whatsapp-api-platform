/** Which collections exist and who may touch them. Shared by server + client. */
export type Kind = 'org' | 'platform' | 'owned'
export interface CollectionPolicy { kind: Kind; customer?: 'rw' | 'r' | 'none'; doc?: boolean }

const org = (...n: string[]) => Object.fromEntries(n.map(k => [k, { kind: 'org', customer: 'rw' } as CollectionPolicy]))
const platform = (...n: string[]) => Object.fromEntries(n.map(k => [k, { kind: 'platform', customer: 'none' } as CollectionPolicy]))

export const POLICY: Record<string, CollectionPolicy> = {
  ...org('leads', 'deals', 'customers', 'conversations', 'followups', 'meetings', 'calls', 'campaigns', 'leadforms', 'media', 'templates', 'waforms', 'broadcasts', 'chatbot', 'faqs', 'products', 'quotations', 'invoices', 'reminders', 'apikeys'),
  settings: { kind: 'org', customer: 'rw', doc: true }, waapi: { kind: 'org', customer: 'rw', doc: true }, aiconfig: { kind: 'org', customer: 'rw', doc: true },
  ...platform('gateways', 'site_credentials', 'enquiries', 'flow_users', 'flow_orgs', 'flow_training', 'flow_credentials', 'auto_users', 'auto_orgs', 'auto_training', 'auto_credentials'),
  siteTheme: { kind: 'platform', customer: 'none', doc: true },
  plans: { kind: 'platform', customer: 'r' },
  tickets: { kind: 'owned', customer: 'rw' }, subscriptions: { kind: 'owned', customer: 'r' }, payments: { kind: 'owned', customer: 'r' },
}
/** Virtual collections backed by something else (handled specially on the server). */
export const VIRTUAL = ['users', 'team', 'usage'] as const
export const DOC_COLLECTIONS = Object.entries(POLICY).filter(([, p]) => p.doc).map(([k]) => k)
export const STAGES = ['New Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
