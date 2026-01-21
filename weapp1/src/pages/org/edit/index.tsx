
import React, { useState } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Cell, Input, Dialog } from '@nutui/nutui-react-taro'
import { orgService } from '../../../services/orgService'
import { useOrgStore } from '../../../store/orgStore'
import './index.scss'

export default function OrgEdit() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { setCurrentOrg, setOrgList, orgList } = useOrgStore()

  const handleCreate = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入组织名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      // Mock create API
      const newOrg = await orgService.createOrg(name)
      
      // Update Store
      // In real app, fetchOrgList again is better
      // @ts-ignore
      const newList = [...orgList, newOrg]
      // @ts-ignore
      setOrgList(newList)
      // @ts-ignore
      setCurrentOrg(newOrg) // Auto switch to new org

      Taro.showToast({ title: '创建成功', icon: 'success' })
      
      setTimeout(() => {
        // Go back to mine page or list page
        // If from mine (no org), back to mine
        // If from list, back to list
        Taro.navigateBack()
      }, 1000)

    } catch (error) {
      Taro.showToast({ title: '创建失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="org-edit-page">
      <View className="form-card">
        <Cell.Group>
            <Cell title="组织名称">
                <Input 
                    placeholder="请输入组织名称" 
                    value={name} 
                    onChange={(val) => setName(val)}
                    align="right"
                    maxLength={20}
                />
            </Cell>
        </Cell.Group>
      </View>

      <View className="form-footer">
        <Button block type="primary" loading={loading} onClick={handleCreate}>
            立即创建
        </Button>
      </View>
    </View>
  )
}
