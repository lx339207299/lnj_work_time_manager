import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Cell, Input, DatePicker } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import { useUserStore } from '../../../store/userStore'
import { employeeService } from '../../../services/employeeService'
import './index.scss'

function ProfileEdit() {
  const router = useRouter()
  const { isNew } = router.params
  const { userInfo, setUserInfo } = useUserStore()
  
  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    // Load initial data from userInfo
    if (userInfo) {
      setName(userInfo.name || '')
      setPhone(userInfo.phone || '')
      setBirthday(userInfo.birthday || '')
    }
  }, [userInfo])

  const handleSave = async () => {
    if (!name) {
      Taro.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      // Assuming employeeService has a method to update profile or we use a user service
      // For now, reuse updateEmployee but only for personal fields
      // In a real app, this might be userService.updateProfile(data)
      const data = {
        name,
        birthday
      }
      
      // Update store
      setUserInfo({ ...userInfo, ...data })
      
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      Taro.showToast({ title: '保存成功', icon: 'success' })
      
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
                    value={name} 
                    onChange={(val) => setName(val)}
                    align="right"
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: '#333' }}
                />
            } />
            <Cell title="手机号" extra={
                <Input 
                    value={phone} 
                    disabled
                    align="right"
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: '#999' }}
                />
            } />
            <Cell 
                title="生日" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: birthday ? '#333' : '#ccc' }}>{birthday || '请选择(选填)'}</Text>
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
            setBirthday(dateStr)
            setShowDatePicker(false)
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  )
}

export default ProfileEdit
