import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button, Tag, Avatar, Empty, Skeleton, CalendarCard } from '@nutui/nutui-react-taro'
import { Edit, People, Clock, User, ArrowLeft, ArrowRight } from '@nutui/icons-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import dayjs from 'dayjs'
import { useProjectStore } from '../../../store/projectStore'
import { workRecordService, WorkRecord } from '../../../services/workRecordService'
import './index.scss'

// Define types locally if missing from 2.x types
type CalendarCardValue = Date | Date[]
interface CalendarCardDay {
  year: number
  month: number
  date: number
  type?: string
  isCurrMonth?: boolean
}

function ProjectDetail() {
  const router = useRouter()
  const { currentProject } = useProjectStore()
  
  // State
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [monthStats, setMonthStats] = useState<string[]>([])
  
  // Mock current user ID (In real app, get from userStore)
  const currentUserId = 'u1' 
  
  // Permission Logic
  // TODO: Check org owner role from orgStore
  const isOrgOwner = false 
  const isProjectOwner = currentProject?.role === 'owner'
  const canEdit = isProjectOwner || isOrgOwner
  const canViewAll = isProjectOwner || isOrgOwner

  // Fallback
  if (!currentProject) {
    return <View className="p-4">Loading...</View>
  }

  // Effects
  useEffect(() => {
    fetchMonthStats(dayjs().format('YYYY-MM'))
    fetchRecords(selectedDate)
  }, [])

  const fetchRecords = async (date: string) => {
    setLoadingRecords(true)
    try {
      const res = await workRecordService.getProjectWorkRecords(currentProject.id, date)
      // Filter records based on permission
      const filtered = canViewAll ? res : res.filter(r => r.userId === currentUserId)
      setRecords(filtered)
    } catch (error) {
      console.error(error)
      Taro.showToast({ title: '获取记录失败', icon: 'error' })
    } finally {
      setLoadingRecords(false)
    }
  }

  const fetchMonthStats = async (month: string) => {
    try {
      const res = await workRecordService.getProjectMonthStats(currentProject.id, month)
      console.log(res);
      setMonthStats(res)
    } catch (error) {
      console.error(error)
    }
  }

  // Handlers
  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/project/edit/index?id=${currentProject.id}` })
  }

  const handlePrevMonth = () => {
    const newMonth = currentMonth.subtract(1, 'month')
    setCurrentMonth(newMonth)
    fetchMonthStats(newMonth.format('YYYY-MM'))
  }

  const handleDateChange = (val: CalendarCardValue) => {
    let dateStr = ''
    if (val instanceof Date) {
        dateStr = dayjs(val).format('YYYY-MM-DD')
    } else if (Array.isArray(val) && val.length > 0) {
        dateStr = dayjs(val[0]).format('YYYY-MM-DD')
    }
    
    if (dateStr && dateStr !== selectedDate) {
      setSelectedDate(dateStr)
      fetchRecords(dateStr)
    }
  }

  return (
    <View className="project-detail-page">
      {/* Header Section */}
      <View className="header-section">
        <View className="title-row">
          <View className="project-name">{currentProject.name}</View>
          {canEdit && (
            <View className="edit-btn" onClick={handleEdit}>
              <Edit size={18} color="#666" />
            </View>
          )}
        </View>
        
        <View className="project-desc">{currentProject.description || '暂无描述'}</View>
        
        {/* Compact Stats Row */}
        <View className="stats-row">
          <View className="stat-item">
            <People size={14} color="#666" className="icon" />
            <Text className="text">{currentProject.memberCount}人</Text>
          </View>
          <View className="divider" />
          <View className="stat-item">
            <Clock size={14} color="#666" className="icon" />
            <Text className="text">{currentProject.totalHours}小时</Text>
          </View>
          <View className="divider" />
          <View className="stat-item">
            <User size={14} color="#666" className="icon" />
            <Text className="text">{isProjectOwner ? '我负责' : '其他负责人'}</Text>
          </View>
        </View>
      </View>

      {/* Calendar Section */}
      <View className="calendar-section">

        {/* @ts-ignore */}
        <CalendarCard
          value={new Date(selectedDate)}
          onChange={handleDateChange}
          renderDayBottom={(day: CalendarCardDay) => {
             // Check if day has records
             const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
            //  console.log(day);
            //  console.log(dateStr);
             const hasRecord = monthStats.includes(dateStr)
             console.log(hasRecord);
             
             return hasRecord ? <View className="dot" /> : null
          }}
        />
      </View>

      {/* Work Records List */}
      <View className="records-section">
        <View className="section-title">用工记录 ({selectedDate})</View>
        
        {loadingRecords ? (
           <View className="skeleton-wrapper">
             <Skeleton rows={3} title animated />
           </View>
        ) : (
          records.length > 0 ? (
            <View className="record-list">
              {records.map(record => (
                <View key={record.id} className="record-card">
                   <View className="user-info">
                     <Avatar size="small" className="avatar">{record.userName[0]}</Avatar>
                     <View className="name-role">
                       <Text className="name">{record.userName}</Text>
                       {record.userRole === 'owner' && <Tag type="primary" plain className="role-tag">负责人</Tag>}
                     </View>
                     <View className="duration">
                       <Text className="num">{record.duration}</Text>
                       <Text className="unit">小时</Text>
                     </View>
                   </View>
                   <View className="content">{record.content}</View>
                </View>
              ))}
            </View>
          ) : (
            <Empty description="暂无用工记录" imageSize={80} />
          )
        )}
      </View>
    </View>
  )
}

export default ProjectDetail
