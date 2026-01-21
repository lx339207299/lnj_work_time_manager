
import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Cell, Dialog, Tag, Empty } from '@nutui/nutui-react-taro'
import { Check, Plus } from '@nutui/icons-react-taro'
import { useOrgStore } from '../../../store/orgStore'
import { orgService } from '../../../services/orgService'
import './index.scss'

function OrgList() {
  const { orgList, currentOrg, setCurrentOrg, setOrgList } = useOrgStore()
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    fetchOrgs()
  })

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const list = await orgService.getUserOrgs()
      setOrgList(list)
    } catch (error) {
      Taro.showToast({ title: '获取组织列表失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = (org: any) => {
    if (org.id === currentOrg?.id) return

    Dialog.open('switch-org', {
      title: '切换组织',
      content: `确定要切换到“${org.name}”吗？`,
      onConfirm: () => {
        setCurrentOrg(org)
        Taro.showToast({ title: '切换成功', icon: 'success' })
        Dialog.close('switch-org')
        setTimeout(() => {
            Taro.navigateBack()
        }, 500)
      },
      onCancel: () => {
        Dialog.close('switch-org')
      }
    })
  }

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/org/edit/index' })
  }

  return (
    <View className="org-list-page">
      <View className="list-container">
        {orgList.length > 0 ? (
          orgList.map(org => (
            <View 
                key={org.id} 
                className={`org-card ${currentOrg?.id === org.id ? 'active' : ''}`}
                onClick={() => handleSwitch(org)}
            >
              <View className="info">
                <Text className="name">{org.name}</Text>
                <View className="tags">
                    {org.role === 'owner' && <Tag type="primary" plain size="small">负责人</Tag>}
                    {currentOrg?.id === org.id && <Tag type="success" size="small">当前使用</Tag>}
                </View>
              </View>
              {currentOrg?.id === org.id && <Check color="#1989fa" />}
            </View>
          ))
        ) : (
          <Empty description="暂无组织" />
        )}
      </View>

      <View className="footer-action">
        <Button block type="primary" icon={<Plus />} onClick={handleCreate}>
            创建新组织
        </Button>
      </View>

      <Dialog id="switch-org" />
    </View>
  )
}

export default OrgList
