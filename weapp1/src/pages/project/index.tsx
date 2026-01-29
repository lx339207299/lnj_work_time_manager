import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import { Button, Tag, Empty, Skeleton, Dialog } from '@nutui/nutui-react-taro'
import { Plus, Horizontal } from '@nutui/icons-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import classNames from 'classnames'
import { useProjectStore, Project } from '../../store/projectStore'
import { projectService } from '../../services/projectService'
import { invitationService } from '../../services/invitationService'
import './index.scss'

import { useOrgStore } from '../../store/orgStore'
import { useUserStore } from '../../store/userStore'

function ProjectList() {
  const [loading, setLoading] = useState(true)
  const { token } = useUserStore() // Get token directly
  const { currentOrg, setOrgList, setCurrentOrg } = useOrgStore()
  
  const fetchData = async () => {
    if (!token) {
        setLoading(false)
        setProjectList([]) // Clear list if not logged in
        return
    }

    if (!currentOrg?.id) {
        setLoading(false)
        setProjectList([])
        return
    }

    setLoading(true)
    try {
      const res = await projectService.getProjects(currentOrg.id)
      // Ensure res is an array
      setProjectList(Array.isArray(res) ? res : [])
    } catch (error) {
      console.error(error)
      setProjectList([])
    } finally {
      setLoading(false)
    }
  }

  useDidShow(async () => {
    fetchData()
    
    // Check for pending invite
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
  })

  const handleCreate = () => {
    if (!token) {
        Taro.navigateTo({ url: '/pages/login/index' })
        return
    }
    
    // Check if has organization
    if (!currentOrg || !currentOrg.id) {
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
                  <Horizontal size={16} color="#999" />
                </View>
                
                <View className="card-desc">{project.description || '暂无描述'}</View>
                
                <View className="card-footer">
                  <View className="stat-item">
                    <View className="value">{project.memberCount}</View>
                    <View className="label">成员</View>
                  </View>
                  <View className="divider" />
                  <View className="stat-item">
                    <View className="value">
                        {project.totalDays > 0 ? `${project.totalDays}天` : ''}
                        {project.totalDays > 0 && project.totalHours > 0 ? ' / ' : ''}
                        {project.totalHours > 0 || project.totalDays === 0 ? `${project.totalHours}时` : ''}
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
        <Button icon={<Plus size={24} />} shape="round" type="primary" className="fab-button" />
      </View>

      <Dialog id="invite" />
      <Dialog id="no-org-create" />
    </View>
  )
}

export default ProjectList
