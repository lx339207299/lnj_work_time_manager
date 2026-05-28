import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { ActionSheet, Avatar, Button, Cell, CellGroup, Dialog } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import { request } from '../../utils/request'
import './index.scss'
import { UserInfo } from '../../../types/global'

import { userService } from '../../services/userService'

import { authService } from '../../services/authService'

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
          if (user) {
            Taro.setStorageSync('userInfo', user)
          }
          if (!user?.currentOrg) {
            Taro.showTabBarRedDot({ index: 2 })
          } else {
            Taro.hideTabBarRedDot({ index: 2 })
          }
        })
        .catch(console.error)
    } else {
        setUserInfo(null)
        Taro.removeStorageSync('userInfo')
        Taro.hideTabBarRedDot({ index: 2 })
    }
  })

  const isManager = React.useMemo(() => {
    return userInfo?.role === 'owner' || userInfo?.role === 'admin' || userInfo?.role === 'leader'
  }, [userInfo])

  const handleLogout = () => {
    Taro.removeStorageSync('token')
    // 清理组织ID缓存
    // No need to relaunch, just stay on mine page and UI updates
    Taro.showToast({ title: '已退出', icon: 'success' })
    setUserInfo(null)
    setToken(null)
    Taro.hideTabBarRedDot({ index: 2 })
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

  const openAgreement = (code: string, title: string) => {
    Taro.navigateTo({
      url: '/pages/agreement/index?type=' + code
    })
  }

  const handleBindWechat = async () => {
    try {
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        Taro.showToast({ title: '获取微信授权失败', icon: 'none' })
        return
      }
      await authService.bindWechat(loginRes.code)
      Taro.showToast({ title: '绑定成功', icon: 'success' })
      
      // 刷新用户信息
      userService.getUserInfo({ignoreTokenInvalid: true}).then(user => {
        setUserInfo(user)
        if (user) Taro.setStorageSync('userInfo', user)
      })
    } catch (error: any) {
      Taro.showToast({ title: error.message || '绑定失败', icon: 'none' })
    }
  }

  return (
    <View className="mine-page">
      {/* 个人信息区 */}
      <View className="user-header" onClick={!token ? handleLogin : undefined}>
        <Avatar size="large" src={userInfo?.avatar || ''} />
        <View className="user-info">
          <Text className="user-name">{token ? (userInfo?.name || '用户') : '点击登录/注册'}</Text>
          <View className="user-phone-wrap" style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
            <Text className="user-phone" style={{ marginRight: 8 }}>{token ? (userInfo?.phone || '') : '登录后体验更多功能'}</Text>
            {token && userInfo && !userInfo.isWechatBound && (
              <Button 
                size="mini" 
                type="primary" 
                plain 
                style={{ margin: 0, height: 20, lineHeight: '18px', padding: '0 8px', fontSize: 10, borderColor: 'rgba(255,255,255,0.6)', color: '#fff', backgroundColor: 'transparent' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleBindWechat()
                }}
              >
                绑定微信
              </Button>
            )}
          </View>
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
                    {token && !userInfo?.currentOrg && (
                        <View style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fa2c19', marginRight: 4 }} />
                    )}
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

            <Cell 
                title="修改密码" 
                align="center"
                extra={<ArrowRight size={12} />}
                clickable 
                onClick={() => handleProtectedClick('/pages/mine/change-password/index')}
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
          <View className="menu-list">
            <CellGroup>
              <Cell
                title="用户协议"
                align="center"
                extra={<ArrowRight size={12} />}
                clickable
                onClick={() => openAgreement('yhxy', '用户协议')}
              />
              <Cell
                title="隐私协议"
                align="center"
                extra={<ArrowRight size={12} />}
                clickable
                onClick={() => openAgreement('ysxy', '隐私协议')}
              />
            </CellGroup>
          </View>

      {token && (
          <>
          <View className="logout-section">
            <Button block type="danger" onClick={handleLogout}>
              退出登录
            </Button>
          </View>
          </>
      )}

      <Dialog id="no-org" />
    </View>
  )
}

export default Mine
