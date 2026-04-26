import { useState } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import BeadRing from '@/components/BeadRing'
import { createDesign, updateDesign } from '@/api/design'
import { useDesignerStore } from '@/store/designer'
import { formatPrice } from '@/utils/format'
import './index.less'

export default function PublishPage() {
  const {
    beads,
    designName,
    designId,
    wristSize,
    totalPrice,
    setDesignName,
  } = useDesignerStore()

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const buildDesignData = (isPublished: boolean) => ({
    name: designName,
    tags,
    wrist_size: wristSize,
    total_price: totalPrice,
    status: 'completed' as const,
    is_published: isPublished ? 1 : 0,
    items: beads.map((b, i) => ({
      material_id: b.material_id,
      quantity: b.quantity,
      position: i,
    })),
  })

  const doSave = async (isPublished: boolean) => {
    if (beads.length === 0) {
      Taro.showToast({ title: '请先添加珠子', icon: 'none' })
      return false
    }

    setSaving(true)
    Taro.showLoading({ title: isPublished ? '发布中...' : '保存中...' })
    try {
      const data = buildDesignData(isPublished)
      if (designId) {
        await updateDesign(designId, data)
      } else {
        await createDesign(data)
      }
      return true
    } catch {
      return false
    } finally {
      Taro.hideLoading()
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const ok = await doSave(true)
    if (ok) {
      Taro.showToast({ title: '发布成功！', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)
    }
  }

  const handleOrder = async () => {
    const ok = await doSave(false)
    if (ok) {
      Taro.showToast({ title: '下单功能即将上线', icon: 'none' })
    }
  }

  const totalBeadCount = beads.reduce((s, b) => s + b.quantity, 0)

  return (
    <View className='publish-page'>
      <ScrollView className='publish-page__scroll' scrollY>
        {/* Ring Preview */}
        <View className='publish-page__preview-section'>
          <View className='publish-page__preview-bg'>
            <BeadRing beads={beads} size={240} interactive={false} />
          </View>
        </View>

        {/* Design Info Card */}
        <View className='publish-page__card'>
          <Text className='publish-page__card-title'>设计信息</Text>

          {/* Name */}
          <View className='publish-page__field'>
            <Text className='publish-page__field-label'>设计名称</Text>
            <Input
              className='publish-page__field-input'
              value={designName}
              placeholder='给你的手串起个名字'
              maxlength={32}
              onInput={(e) => setDesignName(e.detail.value)}
            />
          </View>

          {/* Stats row */}
          <View className='publish-page__stats'>
            <View className='publish-page__stat-item'>
              <Text className='publish-page__stat-value'>{formatPrice(totalPrice)}</Text>
              <Text className='publish-page__stat-label'>估算总价</Text>
            </View>
            <View className='publish-page__stat-divider' />
            <View className='publish-page__stat-item'>
              <Text className='publish-page__stat-value'>约 {wristSize.toFixed(1)} cm</Text>
              <Text className='publish-page__stat-label'>手围估算</Text>
            </View>
            <View className='publish-page__stat-divider' />
            <View className='publish-page__stat-item'>
              <Text className='publish-page__stat-value'>{totalBeadCount}</Text>
              <Text className='publish-page__stat-label'>珠子颗数</Text>
            </View>
          </View>

          {/* Tags */}
          <View className='publish-page__field'>
            <Text className='publish-page__field-label'>风格标签（最多5个）</Text>
            <View className='publish-page__tags-row'>
              {tags.map((tag) => (
                <View key={tag} className='publish-page__tag' onClick={() => handleRemoveTag(tag)}>
                  <Text className='publish-page__tag-text'>{tag}</Text>
                  <Text className='publish-page__tag-remove'>×</Text>
                </View>
              ))}
              {tags.length < 5 && (
                <View className='publish-page__tag-input-wrap'>
                  <Input
                    className='publish-page__tag-input'
                    value={tagInput}
                    placeholder='添加标签'
                    maxlength={10}
                    onInput={(e) => setTagInput(e.detail.value)}
                    onConfirm={handleAddTag}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Material List Card */}
        <View className='publish-page__card'>
          <Text className='publish-page__card-title'>材料清单</Text>
          <View className='publish-page__materials'>
            {beads.length === 0 ? (
              <View className='publish-page__empty-materials'>
                <Text className='publish-page__empty-materials-text'>暂无材料，请返回设计器添加珠子</Text>
              </View>
            ) : (
              beads.map((bead, i) => (
                <View key={i} className='publish-page__material-row'>
                  <View
                    className='publish-page__material-dot'
                    style={{ backgroundColor: bead.color }}
                  />
                  <Text className='publish-page__material-name'>{bead.name}</Text>
                  <Text className='publish-page__material-size'>{bead.size_mm}mm</Text>
                  <Text className='publish-page__material-qty'>× {bead.quantity}</Text>
                  <Text className='publish-page__material-price'>
                    {formatPrice(bead.price * bead.quantity)}
                  </Text>
                </View>
              ))
            )}
          </View>
          <View className='publish-page__total-row'>
            <Text className='publish-page__total-label'>合计</Text>
            <Text className='publish-page__total-price'>{formatPrice(totalPrice)}</Text>
          </View>
        </View>

        <View style={{ height: '180rpx' }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View className='publish-page__actions'>
        <View
          className={`publish-page__action-btn publish-page__action-btn--outline ${saving ? 'publish-page__action-btn--disabled' : ''}`}
          onClick={saving ? undefined : handlePublish}
        >
          <Text className='publish-page__action-text publish-page__action-text--primary'>
            发布到广场
          </Text>
        </View>
        <View
          className={`publish-page__action-btn publish-page__action-btn--fill ${saving ? 'publish-page__action-btn--disabled' : ''}`}
          onClick={saving ? undefined : handleOrder}
        >
          <Text className='publish-page__action-text publish-page__action-text--white'>
            下单购买
          </Text>
        </View>
      </View>
    </View>
  )
}
