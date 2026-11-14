import crypto from 'node:crypto'

/** scrypt password hashing — no external dependency. Format: scrypt$<salt>$<hash> */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false
  const [alg, salt, hash] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  const test = crypto.scryptSync(password, salt, 64)
  const real = Buffer.from(hash, 'hex')
  return real.length === test.length && crypto.timingSafeEqual(real, test)
}

export const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('hex')
