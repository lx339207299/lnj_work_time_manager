import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button, Cell, Dialog, Tag } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { invitationService, Invitation } from '../../services/invitationService'
import './index.scss'

const InvitePage: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadList = async () => {
    setLoading(true)
    try {
      const list = await invitationService.list()
      setInvitations(list || [])
    } catch (e: any) {
      Taro.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [])

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    try {
      await invitationService.create()
      Taro.showToast({ title: '邀请码已生成', icon: 'success' })
      loadList()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '生成失败', icon: 'none' })
    } finally {
      setCreating(false)
    }
  }

  const handleShare = (invite: Invitation) => {
    Taro.setClipboardData({
      data: invite.code,
      success: () => {
        Taro.showToast({ title: '邀请码已复制', icon: 'success' })
      },
    })
  }

  const getStatusTag = (invite: Invitation) => {
    const isExpired = new Date(invite.expiresAt) < new Date()
    if (isExpired) return { text: '已过期', type: 'danger' as const }
    switch (invite.status) {
      case 'pending': return { text: '有效', type: 'success' as const }
      case 'accepted': return { text: '已接受', type: 'primary' as const }
      case 'expired': return { text: '已过期', type: 'danger' as const }
      default: return { text: invite.status, type: 'default' as const }
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <View className='invite-page'>
      <View className='header'>
        <Button
          type='primary'
          block
          loading={creating}
          onClick={handleCreate}
        >
          ➕ 生成邀请码
        </Button>
        <Text className='tip'>邀请码 7 天内有效，可多次使用</Text>
      </View>

      <View className='list'>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : invitations.length === 0 ? (
          <View className='empty'>暂无邀请码，点击上方按钮生成</View>
        ) : (
          invitations.map((invite) => {
            const status = getStatusTag(invite)
            return (
              <Cell
                key={invite.id}
                title={
                  <View className='cell-title'>
                    <Text className='code'>{invite.code}</Text>
                    <Tag type={status.type} round>{status.text}</Tag>
                  </View>
                }
                description={`创建于 ${formatTime(invite.createdAt)} · 到期 ${formatTime(invite.expiresAt)}`}
                extra={
                  <Button
                    size='small'
                    type='default'
                    onClick={() => handleShare(invite)}
                  >
                    复制
                  </Button>
                }
              />
            )
          })
        )}
      </View>

      <View className='help'>
        <Text className='help-title'>使用说明</Text>
        <Text className='help-item'>1. 生成邀请码后复制发送给成员</Text>
        <Text className='help-item'>2. 成员在小程序首页会自动弹出加入提示</Text>
        <Text className='help-item'>3. 邀请码 7 天内有效，过期需重新生成</Text>
      </View>
    </View>
  )
}

export default InvitePage
