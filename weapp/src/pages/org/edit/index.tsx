import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Input } from '@nutui/nutui-react-taro'
import { Shop } from '@nutui/icons-react-taro'
import { orgService } from '../../../services/orgService'
import { orgManager } from '../../../utils/orgManager'
import './index.scss'

export default function OrgEdit() {
  const router = useRouter()
  const { id, name: initialName } = router.params
  const isEdit = !!id

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialName) {
      setName(decodeURIComponent(initialName))
    }
  }, [initialName])

  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入组织名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        await orgService.updateOrg(Number(id), name)
        Taro.showToast({ title: '修改成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1000)
      } else {
        // Create organization
        const res: any = await orgService.createOrg(name)
        if (res?.access_token) {
          Taro.setStorageSync('token', res.access_token)
        }

        Taro.showToast({ title: '创建成功', icon: 'success' })
        
        // Navigate to Home Tab instead of Back, to refresh project list context
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/project/index' })
        }, 1000)
      }

    } catch (error) {
      Taro.showToast({ title: isEdit ? '修改失败' : '创建失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="org-edit-page">
      <View className="header">
        <View className="icon-wrapper">
            <Shop size={32} color="#1989fa" />
        </View>
        <Text className="title">{isEdit ? '修改组织信息' : '创建新组织'}</Text>
        <Text className="subtitle">{isEdit ? '修改当前组织的名称' : '创建一个新的组织来管理项目和成员'}</Text>
      </View>

      <View className="form-section">
          <View className="input-group">
            <Text className="label">组织名称</Text>
            <Input 
                className="custom-input"
                placeholder="请输入组织名称 (2-20个字)" 
                value={name} 
                onChange={(val) => setName(val)}
                maxLength={20}
            />
            <Text className="helper-text">{name.length}/20</Text>
          </View>
      </View>

      <View className="form-footer">
        <Button 
            block 
            type="primary" 
            loading={loading} 
            onClick={handleSave}
            disabled={!name.trim()}
        >
            {isEdit ? '保存修改' : '立即创建'}
        </Button>
      </View>
    </View>
  )
}
