import { useState, useRef } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ITouchEvent } from '@tarojs/components'
import type { DesignItem } from '@/types'
import './index.less'

interface BeadRingProps {
  beads: DesignItem[]
  size?: number
  interactive?: boolean
  onRemoveBead?: (index: number) => void
  onMoveBead?: (fromBeadIndex: number, toBeadIndex: number) => void
  onRemoveSingleBead?: (beadIndex: number) => void
}

interface FlatBead {
  color: string
  name: string
  image_url?: string
  size_mm: number
  beadIndex: number
  subIndex: number
}

interface DragState {
  beadIndex: number
  flatIndex: number
  ghostX: number
  ghostY: number
  targetFlatIndex: number
  overDelete: boolean
}

const MAX_BEADS = 40
const RING_ID = 'bead-ring-container'

export default function BeadRing({
  beads,
  size = 280,
  interactive = false,
  onRemoveBead,
  onMoveBead,
  onRemoveSingleBead,
}: BeadRingProps) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const boundsRef = useRef<{ left: number; top: number } | null>(null)

  const flatBeads: FlatBead[] = []
  for (let i = 0; i < beads.length; i++) {
    const bead = beads[i]
    const qty = Math.min(bead.quantity, 30)
    for (let j = 0; j < qty; j++) {
      if (flatBeads.length >= MAX_BEADS) break
      flatBeads.push({ color: bead.color, name: bead.name, image_url: bead.image_url, size_mm: bead.size_mm, beadIndex: i, subIndex: j })
    }
    if (flatBeads.length >= MAX_BEADS) break
  }

  const total = flatBeads.length
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.35
  // base pixel size at 8mm reference, scaled by bead count
  const basePx = total > 30 ? 10 : total > 20 ? 12 : total > 10 ? 14 : 16
  const beadPxOf = (sizeMm: number) => Math.max(8, Math.min(28, Math.round(basePx * sizeMm / 8)))
  const px = (v: number) => `${v}px`

  const fetchBounds = (cb: (b: { left: number; top: number }) => void) => {
    if (boundsRef.current) { cb(boundsRef.current); return }
    Taro.createSelectorQuery()
      .select('#' + RING_ID)
      .boundingClientRect((rect: any) => {
        if (rect) {
          boundsRef.current = { left: rect.left, top: rect.top }
          cb(boundsRef.current)
        }
      })
      .exec()
  }

  const ghostSzOf = (beadIndex: number) => beadPxOf(flatBeads[beadIndex]?.size_mm ?? 8) * 1.5

  const computeInfo = (touchX: number, touchY: number, bounds: { left: number; top: number }, dragBeadIndex: number) => {
    const centerX = bounds.left + cx
    const centerY = bounds.top + cy
    const dx = touchX - centerX
    const dy = touchY - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const overDelete = dist > R * 1.5

    let angle = Math.atan2(dy, dx) + Math.PI / 2
    if (angle < 0) angle += 2 * Math.PI
    if (angle >= 2 * Math.PI) angle -= 2 * Math.PI
    const targetFlatIndex = total === 0 ? 0 : Math.round((angle / (2 * Math.PI)) * total) % total

    const ghostSz = ghostSzOf(dragBeadIndex)
    const ghostX = touchX - bounds.left - ghostSz / 2
    const ghostY = touchY - bounds.top - ghostSz / 2

    return { ghostX, ghostY, targetFlatIndex, overDelete }
  }

  const handleTouchStart = (e: ITouchEvent) => {
    if (!interactive || total === 0) return
    const touch = e.changedTouches[0]
    boundsRef.current = null

    fetchBounds((bounds) => {
      let nearestIdx = -1
      let nearestDist = Infinity

      for (let idx = 0; idx < total; idx++) {
        const fb = flatBeads[idx]
        const hitR = beadPxOf(fb.size_mm) * 1.8
        const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
        const bx = bounds.left + cx + R * Math.cos(angle)
        const by = bounds.top + cy + R * Math.sin(angle)
        const d = Math.sqrt((touch.clientX - bx) ** 2 + (touch.clientY - by) ** 2)
        if (d < hitR && d < nearestDist) {
          nearestDist = d
          nearestIdx = idx
        }
      }

      if (nearestIdx === -1) return
      const fb = flatBeads[nearestIdx]
      const info = computeInfo(touch.clientX, touch.clientY, bounds, fb.beadIndex)
      setDrag({ beadIndex: fb.beadIndex, flatIndex: nearestIdx, ...info })
    })
  }

  const handleTouchMove = (e: ITouchEvent) => {
    if (!drag || !boundsRef.current) return
    const touch = e.changedTouches[0]
    const info = computeInfo(touch.clientX, touch.clientY, boundsRef.current, drag.beadIndex)
    setDrag(prev => prev ? { ...prev, ...info } : null)
  }

  const handleTouchEnd = () => {
    if (!drag) return
    if (drag.overDelete) {
      onRemoveSingleBead?.(drag.beadIndex)
    } else {
      const targetFb = flatBeads[drag.targetFlatIndex]
      if (targetFb && targetFb.beadIndex !== drag.beadIndex) {
        onMoveBead?.(drag.beadIndex, targetFb.beadIndex)
      }
    }
    setDrag(null)
  }

  const isDragging = drag !== null

  return (
    <View
      id={RING_ID}
      className='bead-ring'
      style={{ width: px(size), height: px(size), position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ring track */}
      <View
        className='bead-ring__track'
        style={{
          width: px(R * 2),
          height: px(R * 2),
          borderRadius: '50%',
          position: 'absolute',
          left: px(cx - R),
          top: px(cy - R),
          border: isDragging
            ? `2px dashed rgba(168,114,30,0.6)`
            : '2px dashed #CAC4D0',
          transition: 'border-color 0.2s',
        }}
      />

      {/* Center logo */}
      <View
        className='bead-ring__center'
        style={{
          position: 'absolute',
          left: px(cx - 30),
          top: px(cy - 30),
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EADDff 0%, #D0BCFF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: '18px', color: '#6750A4', fontWeight: '700' }}>珠</Text>
      </View>

      {/* Empty hint */}
      {total === 0 && (
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: px(cy + R + 10),
            transform: 'translateX(-50%)',
            color: '#CAC4D0',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          <Text>点击下方珠子开始设计</Text>
        </View>
      )}

      {/* Beads */}
      {flatBeads.map((fb, idx) => {
        const beadSz = beadPxOf(fb.size_mm)
        const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
        const x = cx + R * Math.cos(angle) - beadSz / 2
        const y = cy + R * Math.sin(angle) - beadSz / 2
        const isSource = isDragging && idx === drag!.flatIndex
        const isTarget = isDragging && !drag!.overDelete && idx === drag!.targetFlatIndex && !isSource

        return (
          <View
            key={`${fb.beadIndex}-${fb.subIndex}`}
            className={`bead-ring__bead ${interactive ? 'bead-ring__bead--interactive' : ''} ${isSource ? 'bead-ring__bead--source' : ''}`}
            style={{
              position: 'absolute',
              left: px(x),
              top: px(y),
              width: px(beadSz),
              height: px(beadSz),
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: isTarget ? 'transparent' : fb.color,
              border: isTarget ? `2px solid ${fb.color}` : 'none',
              boxShadow: isSource
                ? 'none'
                : isTarget
                  ? `0 0 6px ${fb.color}`
                  : '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
              opacity: isSource ? 0.25 : 1,
              zIndex: 3,
              transition: isDragging ? 'none' : 'opacity 0.15s, transform 0.15s',
            }}
            onClick={() => {
              if (interactive && !isDragging && onRemoveBead) {
                onRemoveBead(fb.beadIndex)
              }
            }}
          >
            {!isTarget && fb.image_url ? (
              <Image
                src={fb.image_url}
                style={{ width: '100%', height: '100%', display: 'block' }}
                mode='aspectFill'
              />
            ) : null}
          </View>
        )
      })}

      {/* Ghost bead following finger */}
      {isDragging && drag && (() => {
        const dragBead = beads[drag.beadIndex]
        const ghostSz = ghostSzOf(drag.beadIndex)
        return (
          <View
            className='bead-ring__ghost'
            style={{
              position: 'absolute',
              left: px(drag.ghostX),
              top: px(drag.ghostY),
              width: px(ghostSz),
              height: px(ghostSz),
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: dragBead?.color ?? '#ccc',
              boxShadow: `0 6px 20px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.5)`,
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            {dragBead?.image_url ? (
              <Image
                src={dragBead.image_url}
                style={{ width: '100%', height: '100%', display: 'block' }}
                mode='aspectFill'
              />
            ) : null}
          </View>
        )
      })()}

      {/* Delete zone */}
      <View
        className={`bead-ring__delete-zone ${isDragging ? 'bead-ring__delete-zone--visible' : ''} ${drag?.overDelete ? 'bead-ring__delete-zone--active' : ''}`}
        style={{
          position: 'absolute',
          bottom: px(4),
          left: '50%',
          transform: 'translateX(-50%)',
          width: px(size * 0.55),
          height: '40px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: drag?.overDelete ? 'rgba(192,57,43,0.12)' : 'rgba(0,0,0,0.04)',
          border: drag?.overDelete ? '1.5px solid rgba(192,57,43,0.55)' : '1.5px dashed rgba(0,0,0,0.18)',
          transition: 'background 0.18s, border-color 0.18s',
          opacity: isDragging ? 1 : 0,
          zIndex: 5,
        }}
      >
        <Text style={{ fontSize: '14px' }}>🗑</Text>
        <Text style={{
          fontSize: '11px',
          color: drag?.overDelete ? '#C0392B' : '#aaa',
          fontWeight: drag?.overDelete ? '700' : '400',
          letterSpacing: '0.3px',
          transition: 'color 0.18s',
        }}>
          {drag?.overDelete ? '松手删除' : '拖至此处删除'}
        </Text>
      </View>
    </View>
  )
}
