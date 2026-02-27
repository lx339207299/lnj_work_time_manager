import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Avatar, Empty, Skeleton } from '@nutui/nutui-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { workRecordService, ProjectMemberStat } from '../../../services/workRecordService'
import './index.scss'

function ProjectStats() {
  const router = useRouter()
  const projectId = Number(router.params.projectId || '-1')
  const projectName = router.params.projectName ? decodeURIComponent(router.params.projectName) : '项目'
  
  const [memberStats, setMemberStats] = useState<ProjectMemberStat[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projectId) {
        fetchMemberStats()
    }
  }, [projectId])

  const fetchMemberStats = async () => {
    setLoading(true)
    try {
      const list = await workRecordService.getProjectMemberStats(projectId)
      setMemberStats(list)
    } catch (error) {
      Taro.showToast({ title: '获取列表失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Update navigation bar title
  useEffect(() => {
    if (projectName) {
      Taro.setNavigationBarTitle({
        title: '工时统计'
      })
    }
  }, [projectName])

  return (
    <View className="project-stats-page">
      <View className="records-section">
        {loading ? (
            <View className="skeleton-wrapper">
                <Skeleton rows={3} title animated />
            </View>
        ) : (
            memberStats.length > 0 ? (
                <View className="record-list">
                    {memberStats.map(stat => (
                        <View key={stat.userId} className="record-card">
                            <View className="user-info">
                                {/* <Avatar size="small" className="avatar">{stat.userName[0]}</Avatar> */}
                                <View className="name-role">
                                    <Text className="name">{stat.userName}</Text>
                                    {stat.userRole === 'owner' && <View className="role-tag manager">项目负责人</View>}
                                </View>
                                <View className="duration">
                                    <Text className="num">{stat.totalDuration}</Text>
                                    <Text className="unit">{stat.wageType === 'hour' ? '小时' : '天'}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <Empty description="暂无工时统计" imageSize={80} />
            )
        )}
      </View>
    </View>
  )
}

export default ProjectStats
