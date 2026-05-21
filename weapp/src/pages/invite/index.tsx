import React, { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { invitationService } from '../../services/invitationService'
import './index.scss'

const InvitePage: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    createInvitation()
  }, [])

  const createInvitation = async () => {
    setLoading(true)
    setError('')
    try {
      const invite = await invitationService.create()
      setInviteCode(invite.code)
      setOrgName(invite.organization?.name || '')
    } catch (e: any) {
      setError(e.message || '创建邀请失败')
      Taro.showToast({ title: e.message || '创建失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useShareAppMessage(() => {
    return {
      title: orgName ? `${orgName} 邀请您加入` : '邀请您加入工时管理',
      path: `/pages/project/index?inviteCode=${inviteCode}`,
      imageUrl: '',
    }
  })

  if (loading) {
    return (
      <View className='invite-page'>
        <View className='loading-state'>
          <View className='pulse-ring' />
          <Text className='loading-text'>正在生成邀请...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View className='invite-page'>
        <View className='error-card'>
          <View className='error-icon-wrap'>
            <Text className='error-emoji'>😞</Text>
          </View>
          <Text className='error-title'>创建失败</Text>
          <Text className='error-desc'>{error}</Text>
          <Button className='retry-btn' onClick={createInvitation}>重新生成</Button>
        </View>
      </View>
    )
  }

  return (
    <View className='invite-page'>
      {/* 背景装饰 */}
      <View className='bg-decor'>
        <View className='bg-blob bg-blob-1' />
        <View className='bg-blob bg-blob-2' />
        <View className='bg-blob bg-blob-3' />
      </View>

      {/* 主卡片 */}
      <View className='main-card'>
        {/* 顶部图标区 */}
        <View className='hero-section'>
          <View className='icon-circle'>
            <Text className='icon-emoji'>🎉</Text>
          </View>
          <View className='sparkle sparkle-1'>✨</View>
          <View className='sparkle sparkle-2'>💫</View>
        </View>

        {/* 信息区 */}
        <View className='info-section'>
          <Text className='title-label'>邀请加入</Text>
          <Text className='org-name'>{orgName || '工时管理'}</Text>
          <View className='divider'>
            <View className='divider-line' />
            <View className='divider-dot' />
            <View className='divider-line' />
          </View>
          <Text className='invite-desc'>
            和团队成员一起高效协作
          </Text>
        </View>

        {/* 按钮区 */}
        <View className='action-section'>
          <Button
            className='share-button'
            openType='share'
          >
            <Text className='share-btn-icon'>💬</Text>
            <Text className='share-btn-text'>分享给微信好友</Text>
          </Button>
          <Text className='hint-text'>分享卡片邀请团队成员加入组织</Text>
        </View>
      </View>

      {/* 底部 */}
      <View className='footer-note'>
        <Text className='footer-text'>邀请码 7 天内有效，到期需重新生成</Text>
      </View>
    </View>
  )
}

export default InvitePage
