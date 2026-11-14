export type FieldType = 'lines' | 'text' | 'number' | 'email' | 'tel' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'switch' | 'url' | 'color' | 'password'
export interface Field { key: string; label: string; type?: FieldType; options?: string[]; required?: boolean; full?: boolean; placeholder?: string; secret?: boolean }
export interface Section { title: string; description?: string; fields: Field[] }
export interface Schema {
  collection: string; title: string; singular: string; description?: string
  sections: Section[]
  /** table columns: `key` text · `key!` badge · `key$` money · `key@` date · `key#` date-time */
  cols: string[]
  filter?: string; titleKey?: string; subtitleKey?: string; defaults?: Record<string, any>
}

const T: Record<string, FieldType> = { ln: 'lines', n: 'number', e: 'email', p: 'tel', d: 'date', dt: 'datetime-local', s: 'select', x: 'textarea', b: 'switch', u: 'url', c: 'color', pw: 'password' }
/**  'key*:Label:type:opt1,opt2'  — `*` after key = required; type codes: n e p d dt s x b u c pw (default text) */
export function f(def: string): Field {
  const [k, label, t, opts] = def.split(':')
  const required = k.endsWith('*'), key = required ? k.slice(0, -1) : k
  const type = t ? T[t] : undefined
  return { key, label: label ?? key, ...(type ? { type } : {}), ...(opts ? { options: opts.split(',') } : {}), ...(required ? { required } : {}), ...(type === 'textarea' || type === 'lines' ? { full: true } : {}), ...(type === 'password' ? { secret: true } : {}) }
}
export const sec = (title: string, defs: string[], description?: string): Section => ({ title, description, fields: defs.map(f) })

// Re-usable field groups -------------------------------------------------------------------
export const ADDRESS = ['addressLine1:Address line 1', 'addressLine2:Address line 2', 'city:City', 'state:State / Province', 'postalCode:Postal code', 'country:Country']
export const SOCIAL = ['website:Website:u', 'linkedin:LinkedIn:u', 'instagram:Instagram:u', 'facebook:Facebook:u', 'twitter:X / Twitter:u']
export const UTM = ['utmSource:UTM source', 'utmMedium:UTM medium', 'utmCampaign:UTM campaign', 'utmTerm:UTM term', 'utmContent:UTM content', 'landingPage:Landing page URL:u', 'referrer:Referrer URL:u']
export const CONSENT = ['whatsappOptIn:WhatsApp opt-in:b', 'emailOptIn:Email opt-in:b', 'smsOptIn:SMS opt-in:b', 'optOut:Do not contact:b', 'consentSource:Consent source', 'consentDate:Consent date:d']
export const META = ['tags:Tags (comma separated)', 'notes:Internal notes:x', 'internalRef:Internal reference', 'externalId:External / CRM ID']
export const CUSTOM = ['custom1:Custom field 1', 'custom2:Custom field 2', 'custom3:Custom field 3', 'custom4:Custom field 4']
export const LANGS = 'English,Hindi,Bengali,Odia,Tamil,Telugu,Marathi,Gujarati,Kannada,Malayalam,Punjabi,Other'
export const OWNERS = 'owner:Owner / assigned to'
export const PLANS = ['Automation', 'Flow', 'ATS', 'HRMS', 'Social Media', 'Unified']
export const PLAN_OPT = PLANS.join(',')
