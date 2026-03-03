import React, { useState } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Input, Cell } from '@nutui/nutui-react-taro'
import './index.scss'
import { authService } from '../../../services/authService'

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!oldPassword) {
      Taro.showToast({ title: '请输入原密码', icon: 'none' })
      return
    }
    if (!newPassword) {
      Taro.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }
    if (newPassword.length < 6) {
      Taro.showToast({ title: '新密码长度至少6位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await authService.changePassword(oldPassword, newPassword)
      Taro.showToast({ title: '密码修改成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error: any) {
      // 密码复杂度校验失败等情况，使用 duration: 3000 和 icon: 'none' 来完整显示长文本
      const errorMessage = error.message || '修改失败'
      Taro.showToast({ 
        title: errorMessage, 
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="change-password-page">
      <View className="form-card">
        <Cell.Group>
          <Cell 
            title="原密码"
            align="center"
            extra={
              <Input
                type="password"
                placeholder="请输入原密码"
                value={oldPassword}
                onChange={(val) => setOldPassword(val)}
                align="right"
                style={{ border: 'none', padding: 0, textAlign: 'right' }}
              />
            }
          />
          <Cell 
            title="新密码"
            align="center"
            extra={
              <Input
                type="password"
                placeholder="请输入新密码(大小写英文+数字)"
                value={newPassword}
                onChange={(val) => setNewPassword(val)}
                align="right"
                style={{ border: 'none', padding: 0, textAlign: 'right' }}
              />
            }
          />
          <Cell 
            title="确认新密码"
            align="center"
            extra={
              <Input
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(val) => setConfirmPassword(val)}
                align="right"
                style={{ border: 'none', padding: 0, textAlign: 'right' }}
              />
            }
          />
        </Cell.Group>
      </View>

      <View className="action-section">
        <Button block type="primary" loading={loading} onClick={handleSubmit}>
          确认修改
        </Button>
      </View>
    </View>
  )
}

export default ChangePassword
