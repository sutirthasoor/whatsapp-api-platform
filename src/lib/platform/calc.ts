export interface Line { desc: string; qty: number; rate: number; tax: number; hsn?: string }
export const lineAmount = (l: Line) => (Number(l.qty) || 0) * (Number(l.rate) || 0)

/** Recomputes subtotal / discount / tax / total of a quotation or invoice from its line items. */
export function computeTotals(v: Record<string, any>) {
  const lines: Line[] = Array.isArray(v.lineItems) ? v.lineItems : []
  const subtotal = lines.reduce((a, l) => a + lineAmount(l), 0)
  const discount = Math.min(subtotal, subtotal * ((Number(v.discountPercent) || 0) / 100) + (Number(v.discountAmount) || 0))
  const ratio = subtotal ? (subtotal - discount) / subtotal : 1
  const taxAmount = lines.reduce((a, l) => a + lineAmount(l) * ((Number(l.tax) || 0) / 100), 0) * ratio
  const shipping = Number(v.shipping) || 0
  const raw = subtotal - discount + taxAmount + shipping
  const total = v.roundOff === false ? raw : Math.round(raw)
  const r2 = (n: number) => Math.round(n * 100) / 100
  return { amount: r2(subtotal), discountTotal: r2(discount), taxAmount: r2(taxAmount), total: r2(total), roundAdjust: r2(total - raw) }
}
