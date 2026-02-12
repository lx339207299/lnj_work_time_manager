import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Calendar, Cell, Checkbox, InputNumber, TextArea } from '@nutui/nutui-react-taro'
import { Calendar as CalendarIcon, Edit } from '@nutui/icons-react-taro'
import dayjs from 'dayjs'
import { projectService } from '../../services/projectService'
import { workRecordService } from '../../services/workRecordService'
import './index.scss'

interface Member {
    id: number
    name: string
    avatar: string
    role: string
    wageType: 'day' | 'hour' | 'month'
}

function WorkHour() {
  const router = useRouter()
  const { projectName, date } = router.params
  const projectId = Number(router.params.projectId || '-1')
  const decodedProjectName = projectName ? decodeURIComponent(projectName) : ''
  
  // State
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [workHours, setWorkHours] = useState<Record<string, number>>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState(date || dayjs().format('YYYY-MM-DD'))
  const [submitting, setSubmitting] = useState(false)
  const [quickFillVersion, setQuickFillVersion] = useState(0)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    if (projectId) {
        try {
            const res = await projectService.getProjectMembers(Number(projectId))
            const mapped = res.map((m: any) => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              role: m.role,
              wageType: m.wageType || 'day'
            }))
            setMembers(mapped)
            
            if (mapped.length === 0) {
               Taro.showModal({
                 title: '提示',
                 content: '当前项目还没有成员，请先添加成员',
                 confirmText: '去添加',
                 success: (res) => {
                   if (res.confirm) {
                     Taro.redirectTo({
                       url: `/pages/project/member/index?projectId=${projectId}`
                     })
                   } else {
                     Taro.navigateBack()
                   }
                 }
               })
               return
             }

            // Initialize selection and work hours
            setSelectedMemberIds(mapped.map(m => m.id))
            
            const initialHours: Record<string, number> = {}
            mapped.forEach(m => {
                initialHours[m.id] = m.wageType === 'hour' ? 8 : 1
            })
            setWorkHours(initialHours)

        } catch (error) {
            console.error(error)
            Taro.showToast({ title: '获取成员失败', icon: 'error' })
        }
    }
  }

  const handleConfirmDate = (param: string) => {
    if (Array.isArray(param) && param.length > 0) {
        setSelectedDate(param[3])
    }
    setShowCalendar(false)
  }

  const handleToggleSelectAll = () => {
      if (selectedMemberIds.length === members.length) {
          setSelectedMemberIds([])
      } else {
          setSelectedMemberIds(members.map(m => m.id))
      }
  }

  const handleQuickFill = () => {
    const newHours = { ...workHours }
    selectedMemberIds.forEach(id => {
        const member = members.find(m => m.id === id)
        if (member?.wageType === 'hour') {
            newHours[id] = 8
        } else {
            newHours[id] = 1
        }
    })
    setWorkHours(newHours)
    // To force re-render input numbers, we can increment a version counter
    setQuickFillVersion(prev => prev + 1)
    
    Taro.showToast({ title: '已重置为默认值', icon: 'none' })
  }

  const handleSubmit = async () => {
    if (selectedMemberIds.length === 0) {
        Taro.showToast({ title: '请选择员工', icon: 'none' })
        return
    }
    
    // Prepare submission data
    const records = selectedMemberIds.map(id => ({
        memberId: id,
        duration: workHours[id]
    }))

    setSubmitting(true)
    try {
        await workRecordService.batchAddWorkRecords({
            projectId: projectId || '',
            date: selectedDate,
            records
        })
        
        const count = selectedMemberIds.length
        Taro.showToast({ title: `成功为${count}人记录`, icon: 'success' })
        setTimeout(() => {
            Taro.navigateBack()
        }, 1500)
    } catch (error) {
        console.error(error)
        Taro.showToast({ title: '提交失败', icon: 'error' })
    } finally {
        setSubmitting(false)
    }
  }

  return (
    <View className="work-hour-page">
      {/* Project & Date Info */}
      <View className="section-card info-card">
        <View className="row-item">
            <Text className="label">项目</Text>
            <Text className="value">{decodedProjectName || '未指定'}</Text>
        </View>
        <View className="divider" />
        <View className="row-item" onClick={() => setShowCalendar(true)}>
            <Text className="label">日期</Text>
            <View className="value date-trigger">
                <Text>{selectedDate}</Text>
                <Edit size={16} color="#666" />
            </View>
        </View>
      </View>

      {/* Members Selection */}
      <View className="section-card members-card">
        <View className="card-header">
            <Text className="title">选择员工 ({selectedMemberIds.length}/{members.length})</Text>
            <View className="actions">
                <View className="action-btn" onClick={handleQuickFill}>默认工时</View>
                <View className="divider-v" />
                <View className="action-btn" onClick={handleToggleSelectAll}>
                    {selectedMemberIds.length === members.length ? '全不选' : '全选'}
                </View>
            </View>
        </View>
        <View className="members-list">
            {/* Using a custom list instead of CheckboxGroup to have better control over layout and selection */}
            {members.map(member => {
                const isSelected = selectedMemberIds.includes(member.id)
                return (
                <View 
                    key={member.id} 
                    className={`member-item ${isSelected ? 'selected' : ''}`}
                >
                    <View className="member-row">
                        <View 
                            className="custom-checkbox-wrapper"
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedMemberIds(prev => prev.filter(id => id !== member.id))
                                } else {
                                    setSelectedMemberIds(prev => [...prev, member.id])
                                }
                            }}
                        >
                            <Checkbox 
                                checked={isSelected} 
                                className="custom-checkbox"
                            />
                            <View className="member-content">
                                <View className="info">
                                    <Text className="name">{member.name}</Text>
                                    <View className={'role-tag'}>
                                        {member.wageType === 'day' ? '日薪' : member.wageType === 'month' ? '月薪' : '时薪'}
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        {/* Individual Work Hour Setting */}
                            {isSelected && (
                                <View className="work-setting">
                                    <InputNumber 
                                        key={`${member.id}-${quickFillVersion}`} // Force re-render on quick fill
                                        value={workHours[member.id]}
                                        min={0} 
                                        // max={member.wageType === 'day' ? 3 : 24} 
                                        step={1} 
                                        digits={1}
                                        formatter={(val) => String(Number(val))}
                                        onChange={(val) => {
                                            const num = Number(val)
                                            if (num % 0.5 === 0) {
                                                setWorkHours(prev => ({ ...prev, [member.id]: num }))
                                            } else {
                                                Taro.showToast({ title: '只能输入整数或x.5', icon: 'none' })
                                            }
                                        }} 
                                        onBlur={() => {
                                            // Force update to reset invalid input
                                            const current = workHours[member.id]
                                            setWorkHours(prev => ({ ...prev, [member.id]: current }))
                                        }}
                                        className="mini-input"
                                    />
                                    <Text className="unit">{member.wageType === 'hour' ? '小时' : '天'}</Text>
                                </View>
                            )}
                    </View>
                </View>
            )})}
        </View>
      </View>

      <View className="footer-action">
        <Button block type="primary" loading={submitting} onClick={handleSubmit}>
            确认添加
        </Button>
      </View>

      {/* Calendar Popup */}
      <Calendar
        visible={showCalendar}
        defaultValue={selectedDate}
        onClose={() => setShowCalendar(false)}
        onConfirm={handleConfirmDate}
      />
    </View>
  )
}

export default WorkHour
