import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '@/api/address'
import type { Address } from '@/types'
import './index.less'

type AddressForm = {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: boolean
}

const emptyForm: AddressForm = {
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false,
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddressForm>({ ...emptyForm })
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useDidShow(() => {
    fetchAddresses()
  })

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const data = await getAddresses()
      setAddresses(data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openAddForm = () => {
    setForm({ ...emptyForm })
    setEditId(null)
    setShowForm(true)
  }

  const openEditForm = (addr: Address) => {
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      is_default: addr.is_default,
    })
    setEditId(addr.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      Taro.showToast({ title: '请填写收件人姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(form.phone)) {
      Taro.showToast({ title: '请填写正确的手机号', icon: 'none' })
      return
    }
    if (!form.province.trim() || !form.city.trim() || !form.district.trim()) {
      Taro.showToast({ title: '请填写省市区', icon: 'none' })
      return
    }
    if (!form.detail.trim()) {
      Taro.showToast({ title: '请填写详细地址', icon: 'none' })
      return
    }

    setSaving(true)
    Taro.showLoading({ title: '保存中...' })
    try {
      if (editId !== null) {
        await updateAddress(editId, form)
      } else {
        await createAddress(form)
      }
      Taro.hideLoading()
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setShowForm(false)
      fetchAddresses()
    } catch {
      // ignore
    } finally {
      Taro.hideLoading()
      setSaving(false)
    }
  }

  const handleDelete = (addr: Address) => {
    Taro.showModal({
      title: '删除地址',
      content: `确定要删除该地址吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteAddress(addr.id)
            Taro.showToast({ title: '已删除', icon: 'success' })
            fetchAddresses()
          } catch {
            // ignore
          }
        }
      },
    })
  }

  const updateFormField = (field: keyof AddressForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <View className='address-page'>
      <ScrollView className='address-page__scroll' scrollY>
        {loading && (
          <View className='address-page__loading'>
            <Text className='address-page__loading-text'>加载中...</Text>
          </View>
        )}

        {!loading && addresses.length === 0 && (
          <View className='address-page__empty'>
            <Text className='address-page__empty-icon'>📍</Text>
            <Text className='address-page__empty-title'>暂无收货地址</Text>
            <Text className='address-page__empty-desc'>添加地址方便下单配送</Text>
          </View>
        )}

        {addresses.map((addr) => (
          <View key={addr.id} className='address-page__item'>
            <View className='address-page__item-main' onClick={() => openEditForm(addr)}>
              <View className='address-page__item-header'>
                <Text className='address-page__item-name'>{addr.name}</Text>
                <Text className='address-page__item-phone'>{addr.phone}</Text>
                {addr.is_default && (
                  <View className='address-page__default-badge'>
                    <Text className='address-page__default-text'>默认</Text>
                  </View>
                )}
              </View>
              <Text className='address-page__item-address'>
                {addr.province} {addr.city} {addr.district} {addr.detail}
              </Text>
            </View>
            <View className='address-page__item-actions'>
              <View
                className='address-page__item-action address-page__item-action--edit'
                onClick={() => openEditForm(addr)}
              >
                <Text className='address-page__action-text'>编辑</Text>
              </View>
              <View
                className='address-page__item-action address-page__item-action--delete'
                onClick={() => handleDelete(addr)}
              >
                <Text className='address-page__action-text address-page__action-text--danger'>删除</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: '160rpx' }} />
      </ScrollView>

      {/* Add button */}
      <View className='address-page__add-btn' onClick={openAddForm}>
        <Text className='address-page__add-text'>+ 添加新地址</Text>
      </View>

      {/* Form modal */}
      {showForm && (
        <View className='address-page__modal-overlay'>
          <View className='address-page__modal'>
            <View className='address-page__modal-header'>
              <Text className='address-page__modal-title'>
                {editId !== null ? '编辑地址' : '添加地址'}
              </Text>
              <View onClick={() => setShowForm(false)}>
                <Text className='address-page__modal-close'>×</Text>
              </View>
            </View>

            <ScrollView className='address-page__form-scroll' scrollY>
              <View className='address-page__form'>
                {/* Name */}
                <View className='address-page__form-field'>
                  <Text className='address-page__form-label'>收件人</Text>
                  <Input
                    className='address-page__form-input'
                    value={form.name}
                    placeholder='请输入姓名'
                    onInput={(e) => updateFormField('name', e.detail.value)}
                  />
                </View>

                {/* Phone */}
                <View className='address-page__form-field'>
                  <Text className='address-page__form-label'>手机号</Text>
                  <Input
                    className='address-page__form-input'
                    value={form.phone}
                    placeholder='请输入手机号'
                    type='number'
                    maxlength={11}
                    onInput={(e) => updateFormField('phone', e.detail.value)}
                  />
                </View>

                {/* Province */}
                <View className='address-page__form-field'>
                  <Text className='address-page__form-label'>省份</Text>
                  <Input
                    className='address-page__form-input'
                    value={form.province}
                    placeholder='如：广东省'
                    onInput={(e) => updateFormField('province', e.detail.value)}
                  />
                </View>

                {/* City */}
                <View className='address-page__form-field'>
                  <Text className='address-page__form-label'>城市</Text>
                  <Input
                    className='address-page__form-input'
                    value={form.city}
                    placeholder='如：深圳市'
                    onInput={(e) => updateFormField('city', e.detail.value)}
                  />
                </View>

                {/* District */}
                <View className='address-page__form-field'>
                  <Text className='address-page__form-label'>区/县</Text>
                  <Input
                    className='address-page__form-input'
                    value={form.district}
                    placeholder='如：南山区'
                    onInput={(e) => updateFormField('district', e.detail.value)}
                  />
                </View>

                {/* Detail */}
                <View className='address-page__form-field'>
                  <Text className='address-page__form-label'>详细地址</Text>
                  <Input
                    className='address-page__form-input'
                    value={form.detail}
                    placeholder='街道、楼栋、门牌号'
                    onInput={(e) => updateFormField('detail', e.detail.value)}
                  />
                </View>

                {/* Default toggle */}
                <View
                  className='address-page__default-toggle'
                  onClick={() => updateFormField('is_default', !form.is_default)}
                >
                  <View className={`address-page__toggle-track ${form.is_default ? 'address-page__toggle-track--on' : ''}`}>
                    <View className='address-page__toggle-thumb' />
                  </View>
                  <Text className='address-page__default-label'>设为默认地址</Text>
                </View>
              </View>

              <View style={{ height: '32rpx' }} />
            </ScrollView>

            <View className='address-page__modal-footer'>
              <View
                className={`address-page__save-btn ${saving ? 'address-page__save-btn--disabled' : ''}`}
                onClick={handleSave}
              >
                <Text className='address-page__save-text'>保存</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
