import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Dialog, Cell, CellGroup, Button, Avatar, ActionSheet } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '../../store/userStore'
import { request } from '../../utils/request'
import './index.scss'

function Mine() {
  const { userInfo, token, logout } = useUserStore()
  const [currentOrg, setCurrentOrg] = useState<any>(null)
  const [orgList, setOrgList] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useDidShow(() => {
    if (token) {
      request({ url: '/auth/profile', method: 'GET' })
        .then((user: any) => {
          useUserStore.getState().setUserInfo(user)
          const orgs = (user.memberships || []).map((m: any) => ({
            id: m.organization.id,
            name: m.organization.name,
            role: m.role
          }))
          setOrgList(orgs)
          const current = orgs.find((o: any) => o.id === user.currentOrgId) || orgs[0] || null
          setCurrentOrg(current)
        })
        .catch(console.error)
    }
  })

  const isManager = React.useMemo(() => {
    return currentOrg?.role === 'owner' || currentOrg?.role === 'admin' || currentOrg?.role === 'leader'
  }, [currentOrg])

  const handleLogout = () => {
    logout()
    // No need to relaunch, just stay on mine page and UI updates
    Taro.showToast({ title: '已退出', icon: 'success' })
  }
  
  const handleLogin = () => {
      Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleOrgClick = () => {
    if (!token) {
        handleLogin()
        return
    }
    // Scenario 1: No Org
    if (!orgList || orgList.length === 0) {
        Dialog.open('no-org', {
            title: '暂无组织',
            content: '您暂未加入任何组织。\n如果您是团队负责人，请创建新组织；\n如果您是团队成员，请联系负责人邀请您加入。',
            confirmText: '创建组织',
            cancelText: '我知道了',
            onConfirm: () => {
                Dialog.close('no-org')
                Taro.navigateTo({ url: '/pages/org/edit/index' })
            },
            onCancel: () => {
                Dialog.close('no-org')
            }
        })
    } else {
        // Scenario 2: Has Org -> Go to List
        Taro.navigateTo({ url: '/pages/org/list/index' })
    }
  }
  
  const handleProtectedClick = (url: string) => {
      if (!token) {
          handleLogin()
          return
      }
      Taro.navigateTo({ url })
  }

  return (
    <View className="mine-page">
      {/* 个人信息区 */}
      <View className="user-header" onClick={!token ? handleLogin : undefined}>
        <Avatar size="large" src={userInfo?.avatar || ''} />
        <View className="user-info">
          <Text className="user-name">{token ? (userInfo?.name || '用户') : '点击登录/注册'}</Text>
          <Text className="user-phone">{token ? (userInfo?.phone || '') : '登录后体验更多功能'}</Text>
        </View>
        {!token && <ArrowRight color="#fff" />}
      </View>

      <View className="menu-list">
        <CellGroup>
            {/* Common Menu for Everyone */}
            <Cell 
                title="当前组织" 
                align="center"
                extra={
                <View style={{ display: 'flex', alignItems: 'center' }}>
                    <Text style={{ marginRight: 4, color: currentOrg ? '#333' : '#999' }}>
                        {currentOrg?.name || '暂无组织'}
                    </Text>
                    <ArrowRight size={12} />
                </View>
                } 
                clickable 
                onClick={handleOrgClick}
            />

            <Cell 
                title="个人资料" 
                align="center"
                extra={<ArrowRight size={12} />}
                clickable 
                onClick={() => handleProtectedClick('/pages/mine/profile/index')}
            />

            {token && isManager && (
            /* Manager View */
            <>
                <Cell 
                    title="员工管理" 
                    align="center"
                    extra={<ArrowRight size={12} />}
                    clickable 
                    onClick={() => handleProtectedClick('/pages/employee/index')}
                />
            </>
            )}
        </CellGroup>
      </View>

      {token && (
          <View className="logout-section">
            <Button block type="danger" onClick={handleLogout}>
              退出登录
            </Button>
          </View>
      )}

      <Dialog id="no-org" />
    </View>
  )
}

export default Mine
