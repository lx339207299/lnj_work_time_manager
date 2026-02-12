import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import { Button, Tag, Empty, Skeleton, Dialog } from '@nutui/nutui-react-taro'
import { Plus, Horizontal } from '@nutui/icons-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import classNames from 'classnames'
import { projectService } from '../../services/projectService'
import { invitationService } from '../../services/invitationService'
import { orgManager } from '../../utils/orgManager'
import './index.scss'

import { request } from '../../utils/request'
import type { Project } from '../../../types/global'
import { userService } from '../../services/userService'

function ProjectList() {
  const [loading, setLoading] = useState(false)
  const [projectList, setProjectList] = useState<any[]>([])
  const [token, setToken] = useState<string>('')
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [needFetchData, setNeedFetchData] = useState<boolean>(false)
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await projectService.getProjects()
      // Ensure res is an array
      setProjectList(Array.isArray(res) ? res : [])
    } catch (error) {
      console.error(error)
      setProjectList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!needFetchData) {
        setLoading(false)
        setProjectList([]) // Clear list if not logged in
        return
    }
    fetchData()
  }, [needFetchData])

  const dealInvitation = async () => {
    if (token) {
        const inviteCode = Taro.getStorageSync('pending_invite_code')
        if (inviteCode) {
            // Remove immediately to prevent loop if error, or keep until handled? 
            // Better keep until handled, but remove if invalid.
            
            try {
                Taro.showLoading({ title: '处理邀请...' })
                const invite = await invitationService.get(inviteCode)
                Taro.hideLoading()
                
                Dialog.open('invite', {
                    title: '邀请加入',
                    content: `“${invite.organization?.name || '未知组织'}”邀请您加入，是否同意？`,
                    onConfirm: async () => {
                        try {
                            await invitationService.accept(inviteCode)
                            Taro.showToast({ title: '已加入组织', icon: 'success' })
                            Taro.removeStorageSync('pending_invite_code')
                            Dialog.close('invite')
                            
                            // Refresh org list
                            // We can't import orgService here easily if circular, but we can try
                            // Or just let user switch manually. 
                            // But better to switch to new org if it's the first one?
                        } catch (err: any) {
                            Taro.showToast({ title: err.message || '加入失败', icon: 'error' })
                        }
                    },
                    onCancel: () => {
                        Taro.removeStorageSync('pending_invite_code')
                        Dialog.close('invite')
                    }
                })
            } catch (error) {
                Taro.hideLoading()
                console.error('Invite error', error)
                // Invalid invite
                Taro.removeStorageSync('pending_invite_code')
            }
        }
    }
  }

  useDidShow(async () => {
    // 请求接口更新本地组织id和token
    // let newOrgId = ''
    // try {
    //   const userInfo = await userService.getUserInfo({ ignoreTokenInvalid: true })
    //   newOrgId = userInfo?.currentOrg?.id ?? ''
    // } catch(e) {
      
    // }
    const newToken = Taro.getStorageSync('token') ?? ''
    
    // Check if we need to refresh (e.g., coming back from create/edit page)
    // We can just always refresh if we have a token, or use a flag.
    // For now, let's refresh if token exists, to ensure list is up to date (e.g. after create)
    // To avoid flickering, we can check if data is already loaded or just rely on needFetchData logic.
    
    if (newToken) {
        if (newToken != token) {
            setToken(newToken)
            setNeedFetchData(true)
        } else {
            // Token same, but maybe data changed?
            // Let's force fetch if we are already logged in
            fetchData()
        }
    }
    
    // Check for pending invite
    dealInvitation()
  })

  const handleCreate = () => {
    if (!token) {
        Taro.navigateTo({ url: '/pages/login/index' })
        return
    }
    
    // Check if has organization
    if (!Taro.getStorageSync('currentOrgId')) {
        Dialog.open('no-org-create', {
            title: '需要创建组织',
            content: '创建项目前，您需要先创建一个组织或加入一个现有组织。',
            confirmText: '去创建组织',
            cancelText: '取消',
            onConfirm: () => {
                Dialog.close('no-org-create')
                Taro.navigateTo({ url: '/pages/org/edit/index' })
            },
            onCancel: () => {
                Dialog.close('no-org-create')
            }
        })
        return
    }

    Taro.navigateTo({ url: '/pages/project/edit/index' })
  }

  const handleCardClick = (project: Project) => {
    Taro.navigateTo({ url: `/pages/project/detail/index?id=${project.id}` })
  }

  const renderSkeleton = () => (
    <View className="skeleton-container">
       {[1, 2, 3].map(i => <Skeleton key={i} rows={3} title animated className="mb-4" />)}
    </View>
  )

  return (
    <View className="project-list-page">
      <View className="list-container">
        {loading ? renderSkeleton() : (
          projectList.length > 0 ? (
            projectList.map(project => (
              <View 
                key={project.id} 
                className="project-card"
                onClick={() => handleCardClick(project)}
              >
                <View className="card-header">
                  <View className="title-row">
                    <View className="title">{project.name}</View>
                    {project.role === 'owner' && (
                        <View className="role-tag manager">项目负责人</View>
                    )}
                  </View>
                </View>
                
                {project.description && (
                    <View className="card-desc">{project.description || '暂无描述'}</View>
                )}
                
                <View className="card-footer">
                  <View className="stat-item">
                    <View className="value">{project.memberCount}</View>
                    <View className="label">成员</View>
                  </View>
                  <View className="divider" />
                  <View className="stat-item">
                    <View className="value">
                        {project.totalDaysHours > 0 ? `${Math.ceil(project.totalDaysHours / 8)}天` : ''}
                        {project.totalDaysHours > 0 && project.totalHours > 0 ? ' / ' : ''}
                        {project.totalHours > 0 ? `${project.totalHours}时` : ''}
                        {project.totalDaysHours == 0 && project.totalHours == 0 ? '0' : ''}
                    </View>
                    <View className="label">总工时</View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Empty 
                description={token ? "暂无项目" : "登录后管理项目"} 
                actions={token ? [] : [{ text: '去登录', onClick: () => Taro.navigateTo({ url: '/pages/login/index' }) }]}
            />
          )
        )}
      </View>

      {/* Floating Action Button for Create (Only for allowed roles, check later) */}
      <View className="fab-container" onClick={handleCreate}>
        <View className="fab-button-text">
            <Plus size={18} color="#fff" style={{ marginRight: 4 }} />
            <View>创建项目</View>
        </View>
      </View>

      <Dialog id="invite" />
      <Dialog id="no-org-create" />
    </View>
  )
}

export default ProjectList
