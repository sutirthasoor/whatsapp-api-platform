import { SCHEMAS_A } from './schemas-a'
import { SCHEMAS_B } from './schemas-b'
import { SCHEMAS_C } from './schemas-c'
import { SCHEMAS_D } from './schemas-d'
import { DOCS as BASE_DOCS } from './schemas-docs'
import { EXTRA } from './schemas-extra'
import type { Schema } from './schema-kit'
export * from './schema-kit'

const withExtra = (s: Schema): Schema => ({ ...s, sections: [...s.sections, ...(EXTRA[s.collection] ?? [])] })
export const SCHEMAS: Record<string, Schema> = Object.fromEntries([...SCHEMAS_A, ...SCHEMAS_B, ...SCHEMAS_C, ...SCHEMAS_D].map(s => [s.collection, withExtra(s)]))
export const DOCS: Record<string, Schema> = Object.fromEntries(Object.values(BASE_DOCS).map(s => [s.collection, withExtra(s)]))
