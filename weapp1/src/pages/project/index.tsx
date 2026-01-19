import React, { useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import { Button, Tag, Empty, Skeleton } from '@nutui/nutui-react-taro'
import { Plus, Horizontal } from '@nutui/icons-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import classNames from 'classnames'
import { useProjectStore, Project } from '../../store/projectStore'
import { projectService } from '../../services/projectService'
import './index.scss'

function ProjectList() {
  const [loading, setLoading] = useState(true)
  const { projectList, setProjectList, setCurrentProject } = useProjectStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await projectService.getProjects('current_org_id') // Mock Org ID
      setProjectList(res)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    fetchData()
  })

  const handleCreate = () => {
    setCurrentProject(null as any) // Clear current project for create mode
    Taro.navigateTo({ url: '/pages/project/edit/index' })
  }

  const handleCardClick = (project: Project) => {
    setCurrentProject(project)
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
                    <View className="value">{project.totalHours}</View>
                    <View className="label">总工时</View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Empty description="暂无项目" />
          )
        )}
      </View>

      {/* Floating Action Button for Create (Only for allowed roles, check later) */}
      <View className="fab-container" onClick={handleCreate}>
        <Button icon={<Plus />} shape="round" type="primary" className="fab-button" />
      </View>
    </View>
  )
}

export default ProjectList
