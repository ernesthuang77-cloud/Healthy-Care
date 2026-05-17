import { create } from 'zustand'

export interface CartItem {
  skuId: string
  qty: number
}

const key = 'yc_cart'

const load = (): CartItem[] => {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => ({ skuId: String(x?.skuId ?? ''), qty: Number(x?.qty ?? 1) }))
      .filter((x) => x.skuId && x.qty > 0)
  } catch {
    return []
  }
}

const save = (items: CartItem[]) => {
  localStorage.setItem(key, JSON.stringify(items))
}

interface CartState {
  items: CartItem[]
  loadFromStorage: () => void
  add: (skuId: string, qty?: number) => void
  setQty: (skuId: string, qty: number) => void
  remove: (skuId: string) => void
  clear: () => void
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  loadFromStorage: () => {
    set({ items: load() })
  },
  add: (skuId: string, qty = 1) => {
    const items = [...get().items]
    const found = items.find((x) => x.skuId === skuId)
    if (found) found.qty += Math.max(1, qty)
    else items.push({ skuId, qty: Math.max(1, qty) })
    save(items)
    set({ items })
  },
  setQty: (skuId: string, qty: number) => {
    const items = [...get().items]
    const found = items.find((x) => x.skuId === skuId)
    if (!found) return
    found.qty = Math.max(1, Math.floor(qty || 1))
    save(items)
    set({ items })
  },
  remove: (skuId: string) => {
    const items = get().items.filter((x) => x.skuId !== skuId)
    save(items)
    set({ items })
  },
  clear: () => {
    save([])
    set({ items: [] })
  },
}))

