import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Cell, Input, DatePicker } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import { UserInfo } from '../../../../types/global'
import './index.scss'
import { request } from '../../../utils/request'

import { userService } from '../../../services/userService'

function ProfileEdit() {
  const router = useRouter()
  const { isNew } = router.params
  const token = router.params.token ? decodeURIComponent(router.params.token) : undefined
  
  // Form State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    // 从接口获取数据
    const fetchProfile = async () => {
      try {
        const profile = await userService.getUserInfo(token)
        setUserInfo(profile)
      } catch (error) {
        console.error(error)
        Taro.showToast({ title: '获取个人信息失败', icon: 'error' })
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!userInfo?.name) {
      Taro.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const data = {
        name: userInfo?.name,
        birthday: userInfo?.birthday
      }
      
      // Update profile via API
      await userService.updateUserInfo(data, token)
      
      // Update store
      setUserInfo({ ...userInfo, ...data } as UserInfo)

      Taro.showToast({ title: '保存成功', icon: 'success' })
      if (token) {
        Taro.setStorageSync('token', token)
      }
      
      setTimeout(() => {
          if (isNew === 'true') {
              Taro.switchTab({ url: '/pages/project/index' })
          } else {
              Taro.navigateBack()
          }
      }, 1000)
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="profile-edit-page">
      <View className="form-card">
        <Cell.Group>
            <Cell title="姓名" extra={
                <Input 
                    placeholder="请输入姓名" 
                    value={userInfo?.name || ''} 
                    onChange={(val) => setUserInfo({ ...userInfo, name: val } as UserInfo)}
                    align="right"
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: '#333' }}
                />
            } />
            <Cell title="手机号" extra={
                <Input 
                    value={userInfo?.phone || ''} 
                    disabled
                    align="right"
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: '#999' }}
                />
            } />
            <Cell 
                title="生日" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: userInfo?.birthday ? '#333' : '#ccc' }}>{userInfo?.birthday || '请选择(选填)'}</Text>
                        <ArrowRight size={14} color="#999" />
                    </View>
                }
                onClick={() => setShowDatePicker(true)}
            />
        </Cell.Group>
      </View>

      <View className="action-section">
        <Button block type="primary" loading={loading} onClick={handleSave}>
            保存
        </Button>
      </View>

      <DatePicker
        visible={showDatePicker}
        type="date"
        startDate={new Date(1950, 0, 1)}
        endDate={new Date()}
        onConfirm={(list, values) => {
            const dateStr = values.join('-')
            setUserInfo({ ...userInfo, birthday: dateStr } as UserInfo)
            setShowDatePicker(false)
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  )
}

export default ProfileEdit
