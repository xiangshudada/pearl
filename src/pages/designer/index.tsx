import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import BeadRing from '@/components/BeadRing'
import MaterialItem from '@/components/MaterialItem'
import { getCategories, getMaterials } from '@/api/material'
import { createDesign, updateDesign } from '@/api/design'
import { useDesignerStore } from '@/store/designer'
import { useUserStore } from '@/store/user'
import { formatPrice } from '@/utils/format'
import type { MaterialCategory, Material } from '@/types'
import './index.less'

const ALL_CATEGORY_ID = -1
const USING_CATEGORY_ID = -2

export default function DesignerPage() {
  const {
    beads,
    designName,
    designId,
    wristSize,
    totalPrice,
    addBead,
    removeBead,
    removeSingleBead,
    moveBead,
    clearBeads,
    reset,
  } = useDesignerStore()
  const { user, login } = useUserStore()

  // Category state
  const [topCategories, setTopCategories] = useState<MaterialCategory[]>([])
  const [subCategories, setSubCategories] = useState<MaterialCategory[]>([])
  const [activeTabId, setActiveTabId] = useState<number>(0)
  const [activeCategoryId, setActiveCategoryId] = useState<number>(USING_CATEGORY_ID)

  // Materials
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // Search/filter panel
  const [showSearch, setShowSearch] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [filterWuxing, setFilterWuxing] = useState('')
  const [filterSize, setFilterSize] = useState<number>(0)

  useDidShow(() => {
    // Sync tab bar selection
    const tabBar = Taro.getTabBar<{ setSelected: (i: number) => void }>(Taro.getCurrentInstance().page as any)
    tabBar?.setSelected(1)
  })

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (activeCategoryId === USING_CATEGORY_ID) {
      setMaterials([])
      return
    }
    loadMaterials()
  }, [activeCategoryId])

  const loadCategories = async () => {
    try {
      const cats = await getCategories()
      setTopCategories(cats)
      if (cats.length > 0) {
        setActiveTabId(cats[0].id)
        setSubCategories(cats[0].children || [])
        setActiveCategoryId(USING_CATEGORY_ID)
      }
    } catch {
      // ignore
    }
  }

  const handleTabChange = (tabId: number) => {
    setActiveTabId(tabId)
    setActiveCategoryId(USING_CATEGORY_ID)
    const tab = topCategories.find((t) => t.id === tabId)
    setSubCategories(tab?.children || [])
  }

  const loadMaterials = async (overrides?: { name?: string; wuxing?: string; size?: number }) => {
    setMaterialsLoading(true)
    try {
      const name = overrides?.name !== undefined ? overrides.name : searchName
      const wuxing = overrides?.wuxing !== undefined ? overrides.wuxing : filterWuxing
      const size = overrides?.size !== undefined ? overrides.size : filterSize

      const params: Parameters<typeof getMaterials>[0] = { per_page: 50 }
      if (activeCategoryId !== ALL_CATEGORY_ID) params.category_id = activeCategoryId
      if (name) params.name = name
      if (wuxing) params.wuxing = wuxing
      if (size) params.size_mm = size

      const res = await getMaterials(params)
      setMaterials(res.items || [])
    } catch {
      // ignore
    } finally {
      setMaterialsLoading(false)
    }
  }

  const handleAddBead = useCallback(
    (material: Material) => {
      addBead(material)
    },
    [addBead]
  )

  const handleRemoveBead = useCallback(
    (index: number) => {
      removeBead(index)
    },
    [removeBead]
  )

  const handleMoveBead = useCallback(
    (fromIndex: number, toIndex: number) => {
      moveBead(fromIndex, toIndex)
    },
    [moveBead]
  )

  const handleRemoveSingleBead = useCallback(
    (index: number) => {
      removeSingleBead(index)
    },
    [removeSingleBead]
  )

  const handleClear = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有珠子吗？',
      success(res) {
        if (res.confirm) clearBeads()
      },
    })
  }

  const requireLogin = (callback: () => void) => {
    if (!user) {
      Taro.showModal({
        title: '需要登录',
        content: '此功能需要先登录',
        confirmText: '去登录',
        success(res) {
          if (res.confirm) login()
        },
      })
      return
    }
    callback()
  }

  const buildSaveData = (isPublished: boolean) => ({
    name: designName,
    items: beads.map((b, i) => ({
      material_id: b.material_id,
      quantity: b.quantity,
      position: i,
    })),
    total_price: totalPrice,
    wrist_size: wristSize,
    status: 'draft' as const,
    is_published: isPublished ? 1 : 0,
  })

  const handleSave = () => {
    requireLogin(async () => {
      if (beads.length === 0) {
        Taro.showToast({ title: '请先添加珠子', icon: 'none' })
        return
      }

      Taro.showLoading({ title: '保存中...' })
      try {
        const data = buildSaveData(false)
        if (designId) {
          await updateDesign(designId, data)
        } else {
          await createDesign(data)
        }
        Taro.showToast({ title: '保存成功', icon: 'success' })
      } catch {
        // error handled in request.ts
      } finally {
        Taro.hideLoading()
      }
    })
  }

  const handleFinish = () => {
    requireLogin(() => {
      if (beads.length === 0) {
        Taro.showToast({ title: '请先添加珠子', icon: 'none' })
        return
      }
      Taro.navigateTo({ url: '/pages/publish/index' })
    })
  }

  const handleSearchConfirm = () => {
    setShowSearch(false)
    if (activeCategoryId !== USING_CATEGORY_ID) {
      loadMaterials()
    }
  }

  const handleSearchReset = () => {
    setSearchName('')
    setFilterWuxing('')
    setFilterSize(0)
    if (activeCategoryId !== USING_CATEGORY_ID) {
      loadMaterials({ name: '', wuxing: '', size: 0 })
    }
  }

  const clearFilterTag = (field: 'name' | 'wuxing' | 'size') => {
    const next = { name: searchName, wuxing: filterWuxing, size: filterSize }
    if (field === 'name') { setSearchName(''); next.name = '' }
    if (field === 'wuxing') { setFilterWuxing(''); next.wuxing = '' }
    if (field === 'size') { setFilterSize(0); next.size = 0 }
    if (activeCategoryId !== USING_CATEGORY_ID) {
      loadMaterials({ name: next.name, wuxing: next.wuxing, size: next.size })
    }
  }

  const activeFilterCount = [searchName, filterWuxing, filterSize].filter(Boolean).length

  const displayMaterials =
    activeCategoryId === USING_CATEGORY_ID ? [] : materials

  return (
    <View className='designer-page'>
      {/* Top Status Bar */}
      <View className='designer-page__topbar'>
        <View className='designer-page__topbar-info'>
          <Text className='designer-page__wrist'>约 {wristSize.toFixed(1)} cm</Text>
          <Text className='designer-page__price-label'>{formatPrice(totalPrice)}</Text>
        </View>
        <View className='designer-page__topbar-actions'>
          <View className='designer-page__btn-outline' onClick={handleClear}>
            <Text className='designer-page__btn-outline-text'>清空</Text>
          </View>
          <View className='designer-page__btn-outline' onClick={handleSave}>
            <Text className='designer-page__btn-outline-text'>保存</Text>
          </View>
        </View>
      </View>

      {/* Ring Preview Area */}
      <View className='designer-page__ring-area'>
        <BeadRing
          beads={beads}
          size={260}
          interactive
          onRemoveBead={handleRemoveBead}
          onMoveBead={handleMoveBead}
          onRemoveSingleBead={handleRemoveSingleBead}
        />
        {beads.length > 0 && (
          <View className='designer-page__finish-btn' onClick={handleFinish}>
            <Text className='designer-page__finish-text'>完成设计</Text>
          </View>
        )}
      </View>

      {/* Material Panel */}
      <View className='designer-page__panel'>
        {/* Tab + Filter button row */}
        <View className='designer-page__tab-row'>
          <ScrollView className='designer-page__tabs' scrollX showScrollbar={false}>
            <View className='designer-page__tabs-inner'>
              {topCategories.map((cat) => (
                <View
                  key={cat.id}
                  className={`designer-page__tab ${activeTabId === cat.id ? 'designer-page__tab--active' : ''}`}
                  onClick={() => handleTabChange(cat.id)}
                >
                  <Text className='designer-page__tab-text'>{cat.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View
            className={`designer-page__filter-btn ${activeFilterCount > 0 ? 'designer-page__filter-btn--active' : ''}`}
            onClick={() => setShowSearch(true)}
          >
            <Text className='designer-page__filter-btn-icon'>⊟</Text>
            <Text className='designer-page__filter-btn-text'>筛选</Text>
            {activeFilterCount > 0 && (
              <View className='designer-page__filter-btn-badge'>
                <Text className='designer-page__filter-btn-badge-text'>{activeFilterCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Active filter tags bar */}
        {activeFilterCount > 0 && (
          <View className='designer-page__filter-bar'>
            <ScrollView className='designer-page__filter-bar-scroll' scrollX showScrollbar={false}>
              <View className='designer-page__filter-tags'>
                {searchName ? (
                  <View className='designer-page__filter-tag'>
                    <Text className='designer-page__filter-tag-text'>"{searchName}"</Text>
                    <View className='designer-page__filter-tag-close' onClick={() => clearFilterTag('name')}>
                      <Text className='designer-page__filter-tag-close-icon'>×</Text>
                    </View>
                  </View>
                ) : null}
                {filterWuxing ? (
                  <View className='designer-page__filter-tag'>
                    <Text className='designer-page__filter-tag-label'>五行</Text>
                    <Text className='designer-page__filter-tag-text'>{filterWuxing}</Text>
                    <View className='designer-page__filter-tag-close' onClick={() => clearFilterTag('wuxing')}>
                      <Text className='designer-page__filter-tag-close-icon'>×</Text>
                    </View>
                  </View>
                ) : null}
                {filterSize ? (
                  <View className='designer-page__filter-tag'>
                    <Text className='designer-page__filter-tag-label'>尺寸</Text>
                    <Text className='designer-page__filter-tag-text'>{filterSize}mm</Text>
                    <View className='designer-page__filter-tag-close' onClick={() => clearFilterTag('size')}>
                      <Text className='designer-page__filter-tag-close-icon'>×</Text>
                    </View>
                  </View>
                ) : null}
                <View className='designer-page__filter-clear-all' onClick={handleSearchReset}>
                  <Text className='designer-page__filter-clear-all-text'>清除全部</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        <View className='designer-page__panel-body'>
          {/* Left: Sub category sidebar */}
          <ScrollView className='designer-page__sidebar' scrollY>
            <View
              className={`designer-page__sidebar-item ${activeCategoryId === USING_CATEGORY_ID ? 'designer-page__sidebar-item--active' : ''}`}
              onClick={() => setActiveCategoryId(USING_CATEGORY_ID)}
            >
              <Text className='designer-page__sidebar-text'>正在使用</Text>
              {beads.length > 0 && (
                <View className='designer-page__sidebar-badge'>
                  <Text className='designer-page__sidebar-badge-text'>{beads.length}</Text>
                </View>
              )}
            </View>

            <View
              className={`designer-page__sidebar-item ${activeCategoryId === ALL_CATEGORY_ID ? 'designer-page__sidebar-item--active' : ''}`}
              onClick={() => setActiveCategoryId(ALL_CATEGORY_ID)}
            >
              <Text className='designer-page__sidebar-text'>全部</Text>
            </View>

            {subCategories.map((cat) => (
              <View
                key={cat.id}
                className={`designer-page__sidebar-item ${activeCategoryId === cat.id ? 'designer-page__sidebar-item--active' : ''}`}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                <Text className='designer-page__sidebar-text'>{cat.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Right: Material grid */}
          <ScrollView className='designer-page__material-grid-scroll' scrollY>
            {activeCategoryId === USING_CATEGORY_ID ? (
              <View className='designer-page__material-grid'>
                {beads.length === 0 ? (
                  <View className='designer-page__empty'>
                    <Text className='designer-page__empty-text'>还没有选择珠子</Text>
                    <Text className='designer-page__empty-sub'>点击左侧分类开始选择</Text>
                  </View>
                ) : (
                  beads.map((bead, i) => (
                    <View key={i} className='designer-page__material-cell'>
                      <View className='designer-page__using-card'>
                        <View
                          className='designer-page__using-ball'
                          style={{ backgroundColor: bead.color, overflow: 'hidden' }}
                        >
                          {bead.image_url ? (
                            <Image
                              src={bead.image_url}
                              style={{ width: '100%', height: '100%', display: 'block' }}
                              mode='aspectFill'
                            />
                          ) : null}
                        </View>
                        <Text className='designer-page__using-card-name' numberOfLines={1}>{bead.name}</Text>
                        <Text className='designer-page__using-card-size'>{bead.size_mm}mm</Text>
                        <Text className='designer-page__using-card-price'>{formatPrice(bead.price * bead.quantity)}</Text>
                        <View className='designer-page__using-card-footer'>
                          <Text className='designer-page__using-card-qty'>× {bead.quantity}</Text>
                          <View
                            className='designer-page__using-card-remove'
                            onClick={() => handleRemoveBead(i)}
                          >
                            <Text className='designer-page__using-card-remove-text'>−</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : materialsLoading ? (
              <View className='designer-page__loading'>
                <Text className='designer-page__loading-text'>加载中...</Text>
              </View>
            ) : (
              <View className='designer-page__material-grid'>
                {displayMaterials.length === 0 ? (
                  <View className='designer-page__empty'>
                    <Text className='designer-page__empty-text'>暂无材料</Text>
                  </View>
                ) : (
                  displayMaterials.map((m) => (
                    <View key={m.id} className='designer-page__material-cell'>
                      <MaterialItem material={m} mode='grid' onAdd={handleAddBead} />
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Search/Filter Panel Overlay */}
      {showSearch && (
        <View className='designer-page__search-overlay'>
          <View className='designer-page__search-panel'>
            <View className='designer-page__search-header'>
              <View>
                <Text className='designer-page__search-title'>搜索与筛选</Text>
                {activeFilterCount > 0 && (
                  <Text className='designer-page__search-active-hint'>已应用 {activeFilterCount} 个筛选</Text>
                )}
              </View>
              <View onClick={() => setShowSearch(false)}>
                <Text className='designer-page__search-close'>×</Text>
              </View>
            </View>

            <View className='designer-page__search-body'>
              {/* Name search */}
              <View className='designer-page__filter-section'>
                <Text className='designer-page__filter-label'>材料名称</Text>
                <Input
                  className='designer-page__search-input'
                  value={searchName}
                  placeholder='搜索材料名称...'
                  onInput={(e) => setSearchName(e.detail.value)}
                />
              </View>

              {/* Wuxing filter */}
              <View className='designer-page__filter-section'>
                <Text className='designer-page__filter-label'>五行属性</Text>
                <View className='designer-page__filter-chips'>
                  {['', '金', '木', '水', '火', '土'].map((w) => (
                    <View
                      key={w || 'all'}
                      className={`designer-page__chip ${filterWuxing === w ? 'designer-page__chip--active' : ''}`}
                      onClick={() => setFilterWuxing(w)}
                    >
                      <Text className='designer-page__chip-text'>{w || '全部'}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Size filter */}
              <View className='designer-page__filter-section'>
                <Text className='designer-page__filter-label'>尺寸</Text>
                <View className='designer-page__filter-chips'>
                  {[0, 2, 3, 4, 6, 8, 10, 12].map((s) => (
                    <View
                      key={s}
                      className={`designer-page__chip ${filterSize === s ? 'designer-page__chip--active' : ''}`}
                      onClick={() => setFilterSize(s)}
                    >
                      <Text className='designer-page__chip-text'>{s === 0 ? '全部' : `${s}mm`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className='designer-page__search-footer'>
              <View className='designer-page__search-reset' onClick={handleSearchReset}>
                <Text className='designer-page__search-reset-text'>重置筛选</Text>
              </View>
              <View className='designer-page__search-confirm' onClick={handleSearchConfirm}>
                <Text className='designer-page__search-confirm-text'>确认应用</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
