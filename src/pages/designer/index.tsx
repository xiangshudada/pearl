import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
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

  const loadMaterials = async () => {
    setMaterialsLoading(true)
    try {
      const params: Parameters<typeof getMaterials>[0] = {
        per_page: 50,
      }
      if (activeCategoryId !== ALL_CATEGORY_ID) {
        params.category_id = activeCategoryId
      }
      if (searchName) params.name = searchName
      if (filterWuxing) params.wuxing = filterWuxing
      if (filterSize) params.size_mm = filterSize

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
  }

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
        />
        {beads.length > 0 && (
          <View className='designer-page__finish-btn' onClick={handleFinish}>
            <Text className='designer-page__finish-text'>完成设计</Text>
          </View>
        )}
      </View>

      {/* Material Panel */}
      <View className='designer-page__panel'>
        {/* Tab + Search row */}
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
          <View className='designer-page__search-icon' onClick={() => setShowSearch(true)}>
            <Text>🔍</Text>
          </View>
        </View>

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
                    <View key={i} className='designer-page__using-item'>
                      <View
                        className='designer-page__using-dot'
                        style={{ backgroundColor: bead.color }}
                      />
                      <View className='designer-page__using-info'>
                        <Text className='designer-page__using-name'>{bead.name}</Text>
                        <Text className='designer-page__using-detail'>
                          {bead.size_mm}mm · × {bead.quantity}
                        </Text>
                      </View>
                      <Text className='designer-page__using-price'>
                        {formatPrice(bead.price * bead.quantity)}
                      </Text>
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
              <Text className='designer-page__search-title'>搜索与筛选</Text>
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
