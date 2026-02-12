import React, { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, Checkbox, DatePicker, Dialog, Empty, Popup, SearchBar, Skeleton } from '@nutui/nutui-react-taro'
import dayjs from 'dayjs'
import { employeeService } from '../../services/employeeService'
import { workRecordService, ProjectMemberStat } from '../../services/workRecordService'
import { orgManager } from '../../utils/orgManager'
import './index.scss'

function Stats() {
  const [range, setRange] = useState<{ start: string; end: string }>({
    start: dayjs().format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  })

  const [members, setMembers] = useState<any[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>([])
  const [memberPickerVisible, setMemberPickerVisible] = useState(false)
  const [search, setSearch] = useState('')
  const [pickStartVisible, setPickStartVisible] = useState(false)
  const [pickEndVisible, setPickEndVisible] = useState(false)

  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ProjectMemberStat[]>([])
  const selectedSummary = useMemo(() => {
    if (!members.length) return '请选择人员'
    if (selectedMemberIds.length === 0) return '请选择人员'
    if (selectedMemberIds.length === members.length) return '所有人'
    const firstId = selectedMemberIds[0]
    const first = members.find(m => m.id === firstId)
    const total = selectedMemberIds.length
    if (total === 1) return `${first?.name || '已选'}`
    return `${first?.name || '已选'}等${total}人`
  }, [selectedMemberIds, members])

  useEffect(() => {
    loadMembers()
    fetchStats()
  }, [])

  useEffect(() => {
    if (selectedMemberIds.length === 0 && members.length > 0) {
      setSelectedMemberIds(members.map(m => m.id))
    }
  }, [members])

  const filteredMembers = useMemo(() => {
    if (!search) return members
    return members.filter((m: any) => String(m.name || '').includes(search))
  }, [members, search])

  const loadMembers = async () => {
    try {
      const list = await employeeService.getEmployees(true)
      const mapped = list.map((m: any) => ({
        id: m.id,
        name: m.user?.name || m.user?.phone,
        wageType: m.wageType || 'day'
      }))
      setMembers(mapped)
    } catch (e) {
      Taro.showToast({ title: '获取员工失败', icon: 'error' })
    }
  }

  const handleOpenMemberPicker = async () => {
    if (!members.length) await loadMembers()
    setTempSelectedIds(selectedMemberIds)
    setMemberPickerVisible(true)
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await workRecordService.getSummaryByRange({
        start: range.start,
        end: range.end,
        memberIds: selectedMemberIds.length === members.length ? undefined : selectedMemberIds,
      })
      setStats(res || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const normalizePickerDate = (val: any): string => {
    if (!val) return dayjs().format('YYYY-MM-DD')
    if (val instanceof Date) return dayjs(val).format('YYYY-MM-DD')
    if (Array.isArray(val)) {
      const parts = val.map((item: any) => {
        if (typeof item === 'string' || typeof item === 'number') return String(item).padStart(2, '0')
        if (item && typeof item === 'object') {
          const v = item.value ?? item.text ?? item.label ?? ''
          return String(v).padStart(2, '0')
        }
        return ''
      })
      return parts.join('-')
    }
    return dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD') : String(val)
  }

  return (
    <View className="stats-page">
      <View className="toolbar">
        <View className="toolbar-row">
          <Text className="label">范围</Text>
          <View className="range">
            <Text className="date" onClick={() => setPickStartVisible(true)}>{range.start}</Text>
            <Text className="divider">至</Text>
            <Text className="date" onClick={() => setPickEndVisible(true)}>{range.end}</Text>
          </View>
        </View>
        <View className="toolbar-row">
          <Text className="label">人员</Text>
          <View className="member-actions">
            <View className="action-btn" onClick={handleOpenMemberPicker}>{selectedSummary}</View>
            <Button size="mini" type="primary" onClick={fetchStats} className="query-btn">查询</Button>
          </View>
        </View>
      </View>

      <View className="content">
        {loading ? (
          <View className="skeleton-wrapper">
            <Skeleton rows={3} title animated />
          </View>
        ) : stats.length ? (
          <View className="stat-list">
            {stats.map(s => (
              <View key={s.userId} className="stat-item">
                <View className="row">
                  <Text className="name">{s.userName}</Text>
                  <View className="value">
                    <Text className="num">{s.totalDuration}</Text>
                    <Text className="unit">{s.wageType === 'hour' ? '小时' : '天'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Empty description="暂无统计数据" imageSize={80} />
        )}
      </View>

      <Popup
        visible={memberPickerVisible}
        onClose={() => setMemberPickerVisible(false)}
        position="bottom"
        className="member-popup"
        overlayClassName="member-overlay"
        zIndex={10000}
      >
        <View className="member-picker">
          <SearchBar value={search} onChange={val => setSearch(val)} placeholder="搜索人员" />
          <View className="picker-actions top">
            <View className="action-btn" onClick={() => setTempSelectedIds(members.map(m => m.id))}>全选</View>
            <View className="action-btn" onClick={() => setTempSelectedIds([])}>清除</View>
          </View>
          <View className="member-list">
            {filteredMembers.map((m: any) => {
              const checked = tempSelectedIds.includes(m.id)
              return (
                <View className={`member-row ${checked ? 'checked' : ''}`} key={m.id} onClick={() => {
                  setTempSelectedIds(prev => checked ? prev.filter(id => id !== m.id) : [...prev, m.id])
                }}>
                  <Checkbox checked={checked} />
                  <Text className="member-name">{m.name}</Text>
                </View>
              )
            })}
          </View>
          <View className="picker-actions">
            <Button
              onClick={() => {
                setSelectedMemberIds(tempSelectedIds)
                setMemberPickerVisible(false)
              }}
              type="primary"
              block
            >
              完成
            </Button>
          </View>
        </View>
      </Popup>

      <DatePicker
        visible={pickStartVisible}
        type="date"
        defaultValue={new Date(range.start)}
        onConfirm={(val: any) => {
          const d = normalizePickerDate(val)
          setRange(prev => ({ ...prev, start: d }))
          setPickStartVisible(false)
        }}
        onCancel={() => setPickStartVisible(false)}
      />
      <DatePicker
        visible={pickEndVisible}
        type="date"
        defaultValue={new Date(range.end)}
        onConfirm={(val: any) => {
          const d = normalizePickerDate(val)
          setRange(prev => ({ ...prev, end: d }))
          setPickEndVisible(false)
        }}
        onCancel={() => setPickEndVisible(false)}
      />
    </View>
  )
}

export default Stats
