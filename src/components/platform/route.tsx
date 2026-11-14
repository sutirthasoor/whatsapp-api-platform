'use client'
import { createContext, useContext } from 'react'
/** `base` = URL of the page, `sub` = remaining path segments after it (e.g. ['new'] or [id,'edit']). */
export const RouteCtx = createContext<{ base: string; sub: string[] }>({ base: '', sub: [] })
export const useRoute = () => useContext(RouteCtx)
