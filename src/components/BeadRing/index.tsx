import { View, Text } from '@tarojs/components'
import type { DesignItem } from '@/types'
import './index.less'

interface BeadRingProps {
  beads: DesignItem[]
  size?: number
  interactive?: boolean
  onRemoveBead?: (index: number) => void
}

interface FlatBead {
  color: string
  name: string
  beadIndex: number  // index in beads array
  subIndex: number   // which copy within that bead
}

const MAX_BEADS = 40

export default function BeadRing({
  beads,
  size = 280,
  interactive = false,
  onRemoveBead,
}: BeadRingProps) {
  // Expand each DesignItem's quantity into individual beads (cap at MAX_BEADS total)
  const flatBeads: FlatBead[] = []
  for (let i = 0; i < beads.length; i++) {
    const bead = beads[i]
    const qty = Math.min(bead.quantity, 30)
    for (let j = 0; j < qty; j++) {
      if (flatBeads.length >= MAX_BEADS) break
      flatBeads.push({ color: bead.color, name: bead.name, beadIndex: i, subIndex: j })
    }
    if (flatBeads.length >= MAX_BEADS) break
  }

  const totalBeads = flatBeads.length
  const cx = size / 2
  const cy = size / 2
  const ringRadius = size * 0.35
  const beadSize = totalBeads > 30 ? 10 : totalBeads > 20 ? 12 : totalBeads > 10 ? 14 : 16

  // Convert size in px to rpx string (design width 750, so multiply by 2)
  const toPx = (v: number) => `${v}px`

  return (
    <View
      className='bead-ring'
      style={{ width: toPx(size), height: toPx(size), position: 'relative' }}
    >
      {/* Ring track */}
      <View
        className='bead-ring__track'
        style={{
          width: toPx(ringRadius * 2),
          height: toPx(ringRadius * 2),
          borderRadius: '50%',
          position: 'absolute',
          left: toPx(cx - ringRadius),
          top: toPx(cy - ringRadius),
          border: '2px dashed #CAC4D0',
        }}
      />

      {/* Center logo */}
      <View
        className='bead-ring__center'
        style={{
          position: 'absolute',
          left: toPx(cx - 30),
          top: toPx(cy - 30),
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

      {/* Beads */}
      {totalBeads === 0 && (
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: toPx(cy + ringRadius + 10),
            transform: 'translateX(-50%)',
            color: '#CAC4D0',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          <Text>点击下方珠子开始设计</Text>
        </View>
      )}

      {flatBeads.map((fb, idx) => {
        const angle = (idx / totalBeads) * 2 * Math.PI - Math.PI / 2
        const x = cx + ringRadius * Math.cos(angle) - beadSize / 2
        const y = cy + ringRadius * Math.sin(angle) - beadSize / 2

        return (
          <View
            key={`${fb.beadIndex}-${fb.subIndex}`}
            className={`bead-ring__bead ${interactive ? 'bead-ring__bead--interactive' : ''}`}
            style={{
              position: 'absolute',
              left: toPx(x),
              top: toPx(y),
              width: toPx(beadSize),
              height: toPx(beadSize),
              borderRadius: '50%',
              backgroundColor: fb.color,
              boxShadow: `0 1px 3px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)`,
              cursor: interactive ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (interactive && onRemoveBead) {
                onRemoveBead(fb.beadIndex)
              }
            }}
          />
        )
      })}
    </View>
  )
}
