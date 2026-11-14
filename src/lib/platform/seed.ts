// Default platform configuration (NOT sample/fake business data).
import type { Row } from '@/lib/server/store'
const PLAN_DEF: [string, number, number, number, number, string][] = [
  ['Automation', 999, 9990, 3, 5000, 'Chatbot builder,Keyword triggers,Auto replies,Workflow logs'],
  ['Flow', 1499, 14990, 5, 10000, 'Visual flow builder,WhatsApp Forms,Webhooks,Run history'],
  ['ATS', 1999, 19990, 8, 15000, 'Job posts,Candidate pipeline,Resume parsing,Interview scheduling'],
  ['HRMS', 2499, 24990, 25, 20000, 'Attendance,Payroll,Leave management,Employee portal'],
  ['Social Media', 1299, 12990, 4, 8000, 'Post scheduler,Unified comments,Analytics,Brand kit'],
  ['Unified', 4999, 49990, 50, 100000, 'Everything in all plans,Priority support,SSO,Custom domain'],
]
export const SEED_PLANS = (): Row[] => PLAN_DEF.map((p, i) => ({
  id: `plan_${i + 1}`, name: p[0], code: p[0].toLowerCase().replace(/\W+/g, '-'), tagline: '', description: '', priceMonthly: p[1], priceYearly: p[2], currency: 'INR', setupFee: 0, trialDays: 14,
  seats: p[3], messages: p[4], contacts: 5000 * (i + 1), storageGb: 5 + i * 5, automations: 5 + i * 5, apiAccess: i > 1, customDomain: i === 5, prioritySupport: i === 5,
  features: p[5], badge: i === 5 ? 'Best value' : '', sortOrder: i + 1, taxPercent: 18, status: 'Active', visibility: 'Public', highlighted: i === 5, createdAt: new Date().toISOString(),
}))
export const SEED_GATEWAYS = (): Row[] => [
  { id: 'gw_razorpay', provider: 'razorpay', name: 'Razorpay', mode: 'Test', enabled: false, isDefault: false, keyId: '', secret: '', webhookSecret: '', fee: 2, currency: 'INR', supportedMethods: 'UPI,Card,Net Banking,Wallet', webhook: '' },
  { id: 'gw_stripe', provider: 'stripe', name: 'Stripe', mode: 'Test', enabled: false, isDefault: false, keyId: '', secret: '', webhookSecret: '', fee: 2.9, currency: 'INR', supportedMethods: 'Card', webhook: '' },
  { id: 'gw_offline', provider: 'offline', name: 'Bank transfer / Offline', mode: 'Live', enabled: true, isDefault: true, keyId: '', secret: '', fee: 0, currency: 'INR', supportedMethods: 'Bank Transfer,UPI,Cheque,Cash', instructions: 'Transfer the amount and share the reference with support. The admin will activate your plan after verifying the payment.', webhook: '' },
]
