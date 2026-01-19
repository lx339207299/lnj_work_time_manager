import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Cell, InputNumber, TextArea, Calendar, Checkbox, CheckboxGroup, Avatar, Radio, RadioGroup } from '@nutui/nutui-react-taro'
import { ArrowRight, Calendar as CalendarIcon, CheckChecked } from '@nutui/icons-react-taro'
import dayjs from 'dayjs'
import { projectService } from '../../services/projectService'
import './index.scss'

interface Member {
    id: string
    name: string
    avatar: string
    role: string
    wageType: 'day' | 'hour'
}

function WorkHour() {
  const router = useRouter()
  const { projectId, projectName, date } = router.params
  const decodedProjectName = projectName ? decodeURIComponent(projectName) : ''
  
  // State
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
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
            const res = await projectService.getProjectMembers(projectId)
            setMembers(res)
            
            // Initialize selection and work hours
            setSelectedMemberIds(res.map(m => m.id))
            
            const initialHours: Record<string, number> = {}
            res.forEach(m => {
                initialHours[m.id] = m.wageType === 'hour' ? 9 : 1 // Default: 9h for hour-wage (standard?), 1d for day-wage
                // User said "Default 1 day, 8 hours". Let's use 8 for hour.
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
    // Force reset state to trigger re-render if deep equal check prevents it
    // Actually defaultValue in InputNumber is only initial. We need modelValue to control it reactively?
    // NutUI InputNumber: modelValue is for v-model in Vue, in React it might be `value` or `defaultValue` + key change.
    // If NutUI React InputNumber is uncontrolled (defaultValue only), changing state won't update UI.
    // Let's try forcing update by key or finding if it supports controlled `value`.
    // Looking at docs or types: usually `modelValue` or `value`.
    // Let's try using `key` to force re-render when quick fill happens.
    
    // Create a new object reference to ensure state update
    const newHours = { ...workHours }
    selectedMemberIds.forEach(id => {
        const member = members.find(m => m.id === id)
        if (member) {
            newHours[id] = member.wageType === 'hour' ? 8 : 1
        }
    })
    setWorkHours(newHours)
    // To force re-render input numbers, we can increment a version counter
    setQuickFillVersion(prev => prev + 1)
    
    Taro.showToast({ title: '已重置为默认值', icon: 'none' })
  }

  const handleSubmit = () => {
    if (selectedMemberIds.length === 0) {
        Taro.showToast({ title: '请选择员工', icon: 'none' })
        return
    }
    
    // Prepare submission data
    const submissionData = selectedMemberIds.map(id => ({
        memberId: id,
        date: selectedDate,
        duration: workHours[id],
        // wageType: members.find(m => m.id === id)?.wageType
    }))
    
    console.log('Submission:', submissionData)

    setSubmitting(true)
    // Mock API call
    setTimeout(() => {
        setSubmitting(false)
        const count = selectedMemberIds.length
        Taro.showToast({ title: `成功为${count}人记录`, icon: 'success' })
        setTimeout(() => {
            Taro.navigateBack()
        }, 1500)
    }, 1000)
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
                <CalendarIcon size={14} color="#666" />
            </View>
        </View>
      </View>

      {/* Members Selection */}
      <View className="section-card members-card">
        <View className="card-header">
            <Text className="title">选择员工 ({selectedMemberIds.length}/{members.length})</Text>
            <View className="actions">
                <View className="action-btn" onClick={handleQuickFill}>一键默认</View>
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
                                <Avatar size="small" className="avatar">{member.name[0]}</Avatar>
                                <View className="info">
                                    <Text className="name">{member.name}</Text>
                                    <Text className="role">{member.role}</Text>
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
                                        max={member.wageType === 'day' ? 3 : 24} 
                                        step={0.5} 
                                        digits={1}
                                        onChange={(val) => {
                                            setWorkHours(prev => ({ ...prev, [member.id]: Number(val) }))
                                        }} 
                                        className="mini-input"
                                    />
                                    <Text className="unit">{member.wageType === 'day' ? '天' : '小时'}</Text>
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
