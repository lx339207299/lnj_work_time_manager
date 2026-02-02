import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Dialog, Tag, Empty, ActionSheet } from '@nutui/nutui-react-taro'
import { Check, Plus, More } from '@nutui/icons-react-taro'
import { orgService } from '../../../services/orgService'
import { request } from '../../../utils/request'
import { userService } from '../../../services/userService'
import { orgManager } from '../../../utils/orgManager'
import './index.scss'

const roleMap: Record<string, { text: string, type: string, className?: string }> = {
    owner: { text: '负责人', type: 'default', className: 'tag-owner' },
    admin: { text: '管理员', type: 'primary' },
    leader: { text: '组长', type: 'success' },
    member: { text: '成员', type: 'default' }
}

function OrgList() {
  const [orgList, setOrgList] = useState<any[]>([])
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionVisible, setActionVisible] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)

  useDidShow(() => {
    fetchOrgs()
  })

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const profile = await userService.getUserInfo()
      setCurrentOrgId(profile?.currentOrg?.id || null)
      const list = await orgService.getUserOrgs()
      setOrgList(list)
    } catch (error) {
      Taro.showToast({ title: '获取组织列表失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = (org: any) => {
    if (org.id === currentOrgId) return

    Dialog.open('switch-org', {
      title: '切换组织',
      content: `确定要切换到"${org.name}"吗？`,
      onConfirm: async () => {
        try {
          const res: any = await request({ url: `/organizations/switch`, method: 'POST', data: { id: org.id } })
          console.log(1111, res);
          const { data } = res
          if (data != null && data.length > 0 && data[0]?.access_token) {
            Taro.setStorageSync('token', data[0]?.access_token)
          }
          
          // 缓存切换后的组织ID
          orgManager.setCurrentOrgId(org.id)
          setCurrentOrgId(org.id)
          
          Taro.showToast({ title: '切换成功', icon: 'success' })
          Dialog.close('switch-org')
          setTimeout(() => {
            Taro.navigateBack()
          }, 500)
        } catch (e) {
          console.error('Switch org error:', e)
          Taro.showToast({ title: '切换失败', icon: 'none' })
          Dialog.close('switch-org')
        }
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

      // Check if user is owner
      if (selectedOrg.role === 'owner') {
          Dialog.open('owner-exit-warning', {
              title: '无法退出组织',
              content: '您是组织负责人，无法直接退出组织。\n\n如需退出，请先：\n1. 转移负责人权限给其他成员\n2. 或删除整个组织',
              confirmText: '去转移权限',
              cancelText: '我知道了',
              onConfirm: () => {
                  Dialog.close('owner-exit-warning')
                  // Navigate to employee management to transfer ownership
                  Taro.navigateTo({ url: '/pages/employee/index' })
              },
              onCancel: () => {
                  Dialog.close('owner-exit-warning')
              }
          })
          return
      }

      Dialog.open('exit-org', {
          title: '退出组织',
          content: `确定要退出"${selectedOrg.name}"吗？`,
          onConfirm: async () => {
              try {
                  await orgService.exitOrg(selectedOrg.id)
                  
                  const newList = orgList.filter(o => o.id !== selectedOrg.id)
                  setOrgList(newList)
                  
                  // 处理缓存的组织ID
                  if (currentOrgId === selectedOrg.id) {
                      // 如果退出的是当前使用的组织，清理缓存
                      orgManager.clearCurrentOrgId()
                      setCurrentOrgId(null)
                      
                      // 如果还有其他组织，可以设置为第一个组织（可选）
                      if (newList.length > 0) {
                          // 这里可以选择是否自动切换到第一个组织
                          // orgManager.setCurrentOrgId(newList[0].id)
                          // setCurrentOrgId(newList[0].id)
                      }
                  }

                  Taro.showToast({ title: '已退出', icon: 'success' })
                  Dialog.close('exit-org')
                  setActionVisible(false)
              } catch (error: any) {
                  console.error('Exit org error:', error)
                  Taro.showToast({ title: error.message || '退出失败', icon: 'none' })
              }
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
                    {currentOrgId === org.id && <Tag type="success">当前使用</Tag>}
                </View>
                <View className="tags">
                    <Tag 
                        type={roleMap[org.role]?.type as any || 'default'} 
                        plain={org.role !== 'owner'}
                        className={roleMap[org.role]?.className || ''}
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
      <Dialog id="owner-exit-warning" />
      
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
