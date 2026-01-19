import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Cell, CellGroup, Button, Avatar, ActionSheet } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/userStore'
import { useOrgStore, Organization } from '../../store/orgStore'
import './index.scss'

function Mine() {
  const { userInfo, logout } = useUserStore()
  const { currentOrg, orgList, setCurrentOrg } = useOrgStore()
  const [isVisible, setIsVisible] = useState(false)

  const handleLogout = () => {
    logout()
    Taro.reLaunch({
      url: '/pages/login/index'
    })
  }

  const handleSwitchOrg = () => {
    if (orgList.length > 0) {
      setIsVisible(true)
    }
  }

  const handleChooseOrg = (item: any) => {
    const org = orgList.find(o => o.id === item.id)
    if (org) {
      setCurrentOrg(org)
    }
    setIsVisible(false)
  }

  const menuOptions = orgList.map(org => ({
    name: org.name,
    id: org.id
  }))

  return (
    <View className="mine-page">
      {/* 个人信息区 */}
      <View className="user-header">
        <Avatar size="large" src={userInfo?.avatar || ''} />
        <View className="user-info">
          <Text className="user-name">{userInfo?.name || '未登录'}</Text>
          <Text className="user-phone">{userInfo?.phone || ''}</Text>
        </View>
      </View>

      <View className="menu-list">
        <CellGroup>
          <Cell 
            title="当前组织" 
            align="center"
            extra={
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text style={{ marginRight: 4 }}>{currentOrg?.name || '未选择组织'}</Text>
                <ArrowRight size={12} />
              </View>
            } 
            clickable 
            onClick={handleSwitchOrg}
          />
          <Cell 
            title="员工管理" 
            align="center"
            extra={<ArrowRight size={12} />}
            clickable 
            onClick={() => Taro.navigateTo({ url: '/pages/employee/index' })}
          />
        </CellGroup>
      </View>

      <View className="logout-section">
        <Button block type="danger" onClick={handleLogout}>
          退出登录
        </Button>
      </View>

      <ActionSheet
        visible={isVisible}
        options={menuOptions}
        onSelect={handleChooseOrg}
        onCancel={() => setIsVisible(false)}
      />
    </View>
  )
}

export default Mine
