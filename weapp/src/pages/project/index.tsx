import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import { Button, Dialog, Empty, Skeleton, Tag } from '@nutui/nutui-react-taro'
import { Plus, Horizontal } from '@nutui/icons-react-taro'
import Taro, { useDidShow, useLoad, usePullDownRefresh } from '@tarojs/taro'
import classNames from 'classnames'
import { projectService } from '../../services/projectService'
import { invitationService } from '../../services/invitationService'
import './index.scss'

import { request } from '../../utils/request'
import type { Project } from '../../../types/global'
import { userService } from '../../services/userService'

function ProjectList() {
  const [loading, setLoading] = useState(false)
  const [projectList, setProjectList] = useState<any[]>([])
  const [token, setToken] = useState<string>('')
  const [currentOrgId, setCurrentOrgId] = useState<number | null>(null)
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await projectService.getProjects()
      // Ensure res is an array
      setProjectList(Array.isArray(res) ? res : [])
    } catch (error) {
      setProjectList([])
    } finally {
      setLoading(false)
    }
  }

  const dealInvitation = async (currentToken: string) => {
    if (currentToken) {
        const inviteCode = Taro.getStorageSync('pending_invite_code')
        if (inviteCode) {
            // Remove immediately to prevent loop if error, or keep until handled? 
            // Better keep until handled, but remove if invalid.
            
            try {
                Taro.showLoading({ title: '处理邀请...' })
                const invite = await invitationService.get(inviteCode)
                Taro.hideLoading()
                
                // 成功展示后即可清空，避免每次返回页面都弹窗
                Taro.removeStorageSync('pending_invite_code')

                Dialog.open('invite', {
                    title: '邀请加入',
                    content: `“${invite.organization?.name || '未知组织'}”邀请您加入，是否同意？`,
                    onConfirm: async () => {
                        try {
                            await invitationService.accept(inviteCode)
                            Taro.showToast({ title: '已加入组织', icon: 'success' })
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
                        Dialog.close('invite')
                    }
                })
            } catch (error) {
                Taro.hideLoading()
                Taro.removeStorageSync('pending_invite_code')
            }
        }
    }
  }

  useLoad((options: any) => {
    // 仅在页面首次加载时获取一次邀请码参数
    if (options?.inviteCode) {
      Taro.setStorageSync('pending_invite_code', options.inviteCode)
    }
  })

  useEffect(() => {
    // Initial fetch on component mount if token exists
    if (Taro.getStorageSync('token')) {
        fetchData()
    }
  }, [])

  useDidShow(() => {
    const newToken = Taro.getStorageSync('token') ?? ''
    
    if (newToken) {
        if (newToken !== token) {
            setToken(newToken)
            fetchData()
        }
        
        // Check dirty flag set by project/edit page
        const dirty = Taro.getStorageSync('project_list_dirty')
        if (dirty) {
            Taro.removeStorageSync('project_list_dirty')
            fetchData()
        }
        
        // Check if returning from project detail — refresh single item
        const refreshId = Taro.getStorageSync('project_refresh_id')
        if (refreshId) {
            Taro.removeStorageSync('project_refresh_id')
            projectService.getProjectDetail(refreshId).then((updated) => {
                if (updated) {
                    setProjectList(prev => prev.map(p => p.id === refreshId ? updated : p))
                } else {
                    // Project was deleted — remove from list
                    setProjectList(prev => prev.filter(p => p.id !== refreshId))
                }
            }).catch(() => {})
        }
        
        // Fetch user info to detect org changes + tab red dot
        userService.getUserInfo({ ignoreTokenInvalid: true }).then((user) => {
          if (user) {
            Taro.setStorageSync('userInfo', user)
            
            // Org changed → refresh project list (handle both null and non-null)
            const newOrgId = user.currentOrg?.id ?? null
            if (newOrgId !== currentOrgId) {
              setCurrentOrgId(newOrgId)
              if (!newOrgId) {
                setProjectList([])
              }
              fetchData()
            }
            
            if (!user.currentOrg) {
              Taro.showTabBarRedDot({ index: 2 })
            } else {
              Taro.hideTabBarRedDot({ index: 2 })
            }
          }
        }).catch(console.error)
    } else {
        if (token) {
            setToken('')
        }
        setProjectList([])
        Taro.hideTabBarRedDot({ index: 2 })
    }
    
    // Check for pending invite
    dealInvitation(newToken)
  })

  usePullDownRefresh(async () => {
    await fetchData()
    Taro.stopPullDownRefresh()
  })

  const handleCreate = async () => {
    if (!token) {
        Taro.navigateTo({ url: '/pages/login/index' })
        return
    }
    
    // Check if has organization — try cache first, fallback to API
    let hasOrg = !!Taro.getStorageSync('userInfo')?.currentOrg?.id
    if (!hasOrg) {
      try {
        const user = await userService.getUserInfo({ ignoreTokenInvalid: true })
        hasOrg = !!user?.currentOrg?.id
      } catch {}
    }
    
    if (!hasOrg) {
        Dialog.open('no-org-create', {
            title: '温馨提示',
            content: '创建项目前，您需要先创建一个组织或加入一个现有组织。\n老板请创建组织、普通员工联系老板邀请您加入组织。',
            confirmText: '去创建组织',
            cancelText: '联系老板',
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
