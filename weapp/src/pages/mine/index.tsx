import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { ActionSheet, Avatar, Button, Cell, CellGroup, Dialog } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import { request } from '../../utils/request'
import './index.scss'
import { UserInfo } from '../../../types/global'

import { userService } from '../../services/userService'
import { orgManager } from '../../utils/orgManager'

function Mine() {
  const [token, setToken] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useDidShow(() => {
    const t = Taro.getStorageSync('token')
    setToken(t)
    if (t) {
      userService.getUserInfo({ignoreTokenInvalid: true})
        .then((user) => {
          setUserInfo(user)
        })
        .catch(console.error)
    } else {
        setUserInfo(null)
    }
  })

  const isManager = React.useMemo(() => {
    return userInfo?.role === 'owner' || userInfo?.role === 'admin' || userInfo?.role === 'leader'
  }, [userInfo])

  const handleLogout = () => {
    Taro.removeStorageSync('token')
    // 清理组织ID缓存
    orgManager.clearCurrentOrgId()
    // No need to relaunch, just stay on mine page and UI updates
    Taro.showToast({ title: '已退出', icon: 'success' })
    setUserInfo(null)
    setToken(null)
  }
  
  const handleLogin = () => {
      Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleOrgClick = () => {
    if (!Taro.getStorageSync('token')) {
        handleLogin()
        return
    }
    Taro.navigateTo({ url: '/pages/org/list/index' })
  }
  
  const handleProtectedClick = (url: string) => {
      if (!Taro.getStorageSync('token')) {
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
                    <Text style={{ marginRight: 4, color: userInfo?.currentOrg ? '#333' : '#999' }}>
                        {userInfo?.currentOrg?.name || '暂无组织'}
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
