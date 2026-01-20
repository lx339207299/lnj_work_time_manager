import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button, Tag, Avatar, Empty, Skeleton, CalendarCard, ActionSheet, Dialog, InputNumber } from '@nutui/nutui-react-taro'
import { Edit, People, Clock, User, ArrowLeft, ArrowRight, Calendar, Order, Plus } from '@nutui/icons-react-taro'
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
  
  // Action Sheet & Dialog State
  const [actionSheetVisible, setActionSheetVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<WorkRecord | null>(null)
  const [editDialogVisible, setEditDialogVisible] = useState(false)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [editDuration, setEditDuration] = useState(0)

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

  const handleGoMembers = () => {
    console.log('Navigate to members', currentProject.id)
    Taro.navigateTo({ 
        url: `/pages/project/member/index?projectId=${currentProject.id}`,
        fail: (err) => {
            console.error('Navigate failed:', err)
            Taro.showToast({ title: '跳转失败', icon: 'none' })
        }
    })
  }

  const handleGoStats = () => {
    console.log('Navigate to stats', currentProject.id)
    Taro.navigateTo({ 
        url: `/pages/project/stats/index?projectId=${currentProject.id}&projectName=${encodeURIComponent(currentProject.name)}`,
        fail: (err) => {
            console.error('Navigate failed:', err)
            Taro.showToast({ title: '跳转失败', icon: 'none' })
        }
    })
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

  const handlePageChange = (data: { year: number, month: number }) => {
    console.log('handlePageChange', data)
    const monthStr = `${data.year}-${String(data.month).padStart(2, '0')}`
    fetchMonthStats(monthStr)
  }

  const handleAddRecord = () => {
    Taro.navigateTo({
      url: `/pages/work-hour/index?projectId=${currentProject.id}&projectName=${encodeURIComponent(currentProject.name)}&date=${selectedDate}`
    })
  }

  const handleRecordClick = (record: WorkRecord) => {
    // Only allow edit if owner or self
    if (canEdit || record.userId === currentUserId) {
        setCurrentRecord(record)
        setActionSheetVisible(true)
    }
  }

  const handleActionSelect = (item: any) => {
    setActionSheetVisible(false)
    if (!currentRecord) return

    if (item.key === 'edit') {
        setEditDuration(currentRecord.duration)
        setEditDialogVisible(true)
    } else if (item.key === 'delete') {
        setDeleteDialogVisible(true)
    }
  }

  const handleEditConfirm = async () => {
    if (!currentRecord) return
    
    try {
        await workRecordService.updateWorkRecord(currentRecord.id, { duration: editDuration })
        Taro.showToast({ title: '修改成功', icon: 'success' })
        setEditDialogVisible(false)
        fetchRecords(selectedDate) // Refresh
    } catch (error) {
        Taro.showToast({ title: '修改失败', icon: 'error' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return

    try {
        await workRecordService.deleteWorkRecord(currentRecord.id)
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setDeleteDialogVisible(false)
        fetchRecords(selectedDate) // Refresh
    } catch (error) {
        Taro.showToast({ title: '删除失败', icon: 'error' })
    }
  }

  const actionOptions: any[] = [
    { name: '修改工时', key: 'edit' },
    { name: '删除记录', key: 'delete', color: '#fa2c19' }
  ]

  return (
    <View className="project-detail-page">
      {/* Header Section */}
      <View className="header-section">
        <View className="title-row">
          <View className="project-name">{currentProject.name}</View>
          <View className="actions">
            {canEdit && (
                <View className="edit-btn" onClick={handleEdit}>
                    <Edit size={16} color="#666" />
                </View>
            )}
          </View>
        </View>
        
        <View className="project-desc">{currentProject.description || '暂无描述'}</View>
        
        {/* Compact Stats Row */}
        <View className="stats-row">
          <View className="stat-item" onClick={handleGoMembers}>
            <People size={14} color="#666" className="icon" />
            <Text className="text">{currentProject.memberCount}人</Text>
            <ArrowRight size={10} color="#999" style={{ marginLeft: 2 }} />
          </View>
          <View className="divider" />
          <View className="stat-item" onClick={handleGoStats}>
            <Clock size={14} color="#666" className="icon" />
            <Text className="text">{currentProject.totalHours}小时</Text>
            <ArrowRight size={10} color="#999" style={{ marginLeft: 2 }} />
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
        onPageChange={handlePageChange}
        renderDayBottom={(day: CalendarCardDay) => {
            // Check if day has records
            const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
            //  console.log(day);
            const hasRecord = monthStats.includes(dateStr)
            if (hasRecord) {
            console.log(dateStr);
            }
            return hasRecord ? <View className="dot" /> : null
        }}
        />
      </View>

      {/* Daily Work Records List */}
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
                <View 
                    key={record.id} 
                    className="record-card"
                    onClick={() => handleRecordClick(record)}
                >
                <View className="user-info">
                    <Avatar size="small" className="avatar">{record.userName[0]}</Avatar>
                    <View className="name-role">
                    <Text className="name">{record.userName}</Text>
                    {record.userRole === 'owner' && <View className="role-tag manager">项目负责人</View>}
                    </View>
                    <View className="duration">
                    <Text className="num">{record.duration}</Text>
                    <Text className="unit">小时</Text>
                    </View>
                </View>
                </View>
            ))}
            </View>
        ) : (
            <Empty description="暂无用工记录" imageSize={80} />
        )
        )}
      </View>

      {/* Floating Add Button */}
      <View className="fab-add" onClick={handleAddRecord}>
        <Plus size={24} color="#fff" />
      </View>

      {/* Action Sheet */}
      <ActionSheet
        visible={actionSheetVisible}
        options={actionOptions}
        onSelect={handleActionSelect}
        onCancel={() => setActionSheetVisible(false)}
      />

      {/* Edit Dialog */}
      <Dialog
        visible={editDialogVisible}
        title="修改工时"
        onConfirm={handleEditConfirm}
        onCancel={() => setEditDialogVisible(false)}
      >
        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0' }}>
            <InputNumber 
                value={editDuration}
                min={0}
                max={24}
                step={0.5}
                digits={1}
                onChange={(val) => setEditDuration(Number(val))}
            />
            <Text style={{ marginLeft: '8px' }}>小时</Text>
        </View>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        visible={deleteDialogVisible}
        title="确认删除"
        content="确定要删除这条工时记录吗？此操作无法撤销。"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </View>
  )
}

export default ProjectDetail
