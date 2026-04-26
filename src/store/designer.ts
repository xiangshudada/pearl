import { create } from 'zustand'
import type { DesignItem, Material, Design, ApiDesignItem } from '@/types'
import { getBeadColor } from '@/utils/format'

interface DesignerStore {
  beads: DesignItem[]
  designName: string
  designId: number | null
  wristSize: number
  totalPrice: number
  addBead: (material: Material) => void
  removeBead: (index: number) => void
  clearBeads: () => void
  setDesignName: (name: string) => void
  loadDesign: (design: Design) => void
  reset: () => void
}

function calcWristSize(beads: DesignItem[]): number {
  const total = beads.reduce((sum, b) => sum + b.size_mm * b.quantity, 0)
  return Math.round(total * 10) / 100
}

function calcTotalPrice(beads: DesignItem[]): number {
  const total = beads.reduce((sum, b) => sum + b.price * b.quantity, 0)
  return Math.round(total * 100) / 100
}

function apiItemToDesignItem(item: ApiDesignItem, index: number): DesignItem | null {
  const mat = item.material
  if (!mat) return null
  return {
    material_id: item.material_id,
    name: mat.name,
    size_mm: Number(mat.size_mm),
    color: getBeadColor(mat.name),
    price: Number(mat.price),
    quantity: item.quantity,
    position: item.position !== null ? item.position : index,
  }
}

export const useDesignerStore = create<DesignerStore>((set, get) => ({
  beads: [],
  designName: '我设计的手串',
  designId: null,
  wristSize: 0,
  totalPrice: 0,

  addBead: (material: Material) => {
    const { beads } = get()
    const existing = beads.find((b) => b.material_id === material.id)
    let newBeads: DesignItem[]

    if (existing) {
      newBeads = beads.map((b) =>
        b.material_id === material.id
          ? { ...b, quantity: b.quantity + 1 }
          : b
      )
    } else {
      const newBead: DesignItem = {
        material_id: material.id,
        name: material.name,
        size_mm: Number(material.size_mm),
        color: getBeadColor(material.name),
        price: Number(material.price),
        quantity: 1,
        position: beads.length,
      }
      newBeads = [...beads, newBead]
    }

    set({
      beads: newBeads,
      wristSize: calcWristSize(newBeads),
      totalPrice: calcTotalPrice(newBeads),
    })
  },

  removeBead: (index: number) => {
    const { beads } = get()
    const newBeads = beads.filter((_, i) => i !== index)
    set({
      beads: newBeads,
      wristSize: calcWristSize(newBeads),
      totalPrice: calcTotalPrice(newBeads),
    })
  },

  clearBeads: () => {
    set({ beads: [], wristSize: 0, totalPrice: 0 })
  },

  setDesignName: (name: string) => {
    set({ designName: name })
  },

  loadDesign: (design: Design) => {
    const beads: DesignItem[] = (design.items || [])
      .map((item, i) => apiItemToDesignItem(item, i))
      .filter((b): b is DesignItem => b !== null)

    set({
      beads,
      designName: design.name,
      designId: design.id,
      wristSize: calcWristSize(beads),
      totalPrice: calcTotalPrice(beads),
    })
  },

  reset: () => {
    set({
      beads: [],
      designName: '我设计的手串',
      designId: null,
      wristSize: 0,
      totalPrice: 0,
    })
  },
}))
