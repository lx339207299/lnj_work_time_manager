
import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Dialog, Tag, Empty, ActionSheet } from '@nutui/nutui-react-taro'
import { Check, Plus, More } from '@nutui/icons-react-taro'
import { useOrgStore, Organization } from '../../../store/orgStore'
import { orgService } from '../../../services/orgService'
import './index.scss'

const roleMap: Record<string, { text: string, type: string }> = {
    owner: { text: '负责人', type: 'primary' },
    admin: { text: '管理员', type: 'primary' },
    leader: { text: '组长', type: 'success' },
    member: { text: '成员', type: 'default' }
}

function OrgList() {
  const { orgList, currentOrg, setCurrentOrg, setOrgList } = useOrgStore()
  const [loading, setLoading] = useState(false)
  const [actionVisible, setActionVisible] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)

  useDidShow(() => {
    fetchOrgs()
  })

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const list = await orgService.getUserOrgs()
      setOrgList(list as Organization[])
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

  const handleMoreClick = (e: any, org: any) => {
      e.stopPropagation()
      setSelectedOrg(org)
      setActionVisible(true)
  }

  const handleExitOrg = () => {
      if (!selectedOrg) return

      Dialog.open('exit-org', {
          title: '退出组织',
          content: `确定要退出“${selectedOrg.name}”吗？`,
          onConfirm: async () => {
              // Mock exit logic
              const newList = orgList.filter(o => o.id !== selectedOrg.id)
              setOrgList(newList)
              
              // If exiting current org
              if (currentOrg?.id === selectedOrg.id) {
                  if (newList.length > 0) {
                      setCurrentOrg(newList[0]) // Auto switch to first available
                  } else {
                      setCurrentOrg(null as any) // No org left
                  }
              }

              Taro.showToast({ title: '已退出', icon: 'success' })
              Dialog.close('exit-org')
              setActionVisible(false)
          },
          onCancel: () => {
              Dialog.close('exit-org')
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
                className={`org-card`}
                onClick={() => handleSwitch(org)}
            >
              <View className="info">
                <View className="name-row">
                    <Text className="name">{org.name}</Text>
                    {currentOrg?.id === org.id && <Tag type="success">当前使用</Tag>}
                </View>
                <View className="tags">
                    <Tag 
                        type={roleMap[org.role]?.type as any || 'default'} 
                        plain
                    >
                        {roleMap[org.role]?.text || org.role}
                    </Tag>
                </View>
              </View>
              <View className="actions">
                <View className="more-btn" onClick={(e) => handleMoreClick(e, org)}>
                    <More color="#999" />
                </View>
              </View>
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
      <Dialog id="exit-org" />
      
      <ActionSheet 
        visible={actionVisible} 
        options={[{ name: '退出组织', color: '#fa2c19' }]} 
        onSelect={handleExitOrg}
        onCancel={() => setActionVisible(false)}
      />
    </View>
  )
}


export default OrgList
