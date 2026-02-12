import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Button, Cell, Dialog, Empty, Input, InputNumber, Picker, Popup, Radio, Skeleton } from '@nutui/nutui-react-taro'
import { Plus } from '@nutui/icons-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { projectService } from '../../../services/projectService'
import { employeeService } from '../../../services/employeeService'
import './index.scss'

const EXPENSE_TYPES = ['薪资', '人情', '福利']
const INCOME_TYPES = ['收款']

function ProjectFlow() {
  const router = useRouter()
  const projectId = Number(router.params.projectId || '-1')
  const projectName = router.params.projectName ? decodeURIComponent(router.params.projectName) : '项目'

  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ income: 0, expense: 0 })
  
  // Add Flow State
  const [addVisible, setAddVisible] = useState(false)
  const [flowType, setFlowType] = useState<'expense' | 'income'>('expense') // 'expense' | 'income'
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [remark, setRemark] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Employee Selection
  const [showMemberSelect, setShowMemberSelect] = useState(false)
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    if (projectId) {
        fetchFlows()
        fetchMembers()
    }
  }, [projectId])

  const fetchFlows = async () => {
    setLoading(true)
    try {
      const list = await projectService.getProjectFlows(projectId)
      setFlows(list)
      
      // Calculate stats
      const inc = list.filter(i => i.type === 'income').reduce((acc, cur) => acc + cur.amount, 0)
      const exp = list.filter(i => i.type === 'expense').reduce((acc, cur) => acc + cur.amount, 0)
      setStats({ income: inc, expense: exp })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
      try {
          const list = await projectService.getProjectMembers(projectId)
          setMembers(list)
      } catch (error) {
          console.error(error)
      }
  }

  const handleAddClick = () => {
      // Reset form
      setFlowType('expense')
      setAmount('')
      setCategory('')
      setRemark('')
      setSelectedUser(null)
      setAddVisible(true)
  }

  const handleTypeChange = (type: 'expense' | 'income') => {
      setFlowType(type)
      setCategory('') // Reset category when type changes
      setSelectedUser(null)
  }

  const handleCategorySelect = (cat: string) => {
      setCategory(cat)
      if (cat !== '薪资') {
          setSelectedUser(null)
      }
  }

  const handleConfirmAdd = async () => {
      if (!amount || Number(amount) <= 0) {
          Taro.showToast({ title: '请输入有效金额', icon: 'none' })
          return
      }
      if (!category) {
          Taro.showToast({ title: '请选择类型', icon: 'none' })
          return
      }
      if (category === '薪资' && !selectedUser) {
          Taro.showToast({ title: '请选择员工', icon: 'none' })
          return
      }

      try {
          await projectService.addProjectFlow(projectId, {
              type: flowType,
              amount: Number(amount),
              category,
              remark,
              relatedUserId: selectedUser?.id,
              relatedUserName: selectedUser?.name,
              date: new Date().toISOString().split('T')[0]
          })
          Taro.showToast({ title: '添加成功', icon: 'success' })
          setAddVisible(false)
          fetchFlows()
      } catch (error) {
          Taro.showToast({ title: '添加失败', icon: 'error' })
      }
  }

  return (
    <View className="project-flow-page">
      {/* Stats Header */}
      <View className="stats-header">
          <View className="stat-card">
              <Text className="label">总收入</Text>
              <Text className="value income">+{stats.income}</Text>
          </View>
          <View className="divider" />
          <View className="stat-card">
              <Text className="label">总支出</Text>
              <Text className="value expense">-{stats.expense}</Text>
          </View>
      </View>

      {/* Flow List */}
      <View className="flow-list">
          {loading ? (
              <Skeleton rows={3} title animated />
          ) : (
              flows.length > 0 ? (
                  flows.map(item => (
                      <View key={item.id} className="flow-item">
                          <View className="info">
                              <Text className="title">{item.category} {item.relatedUser ? `- ${item.relatedUser}` : ''}</Text>
                              <View className="meta">
                                  <Text>{item.date}</Text>
                                  {item.remark && <Text>| {item.remark}</Text>}
                              </View>
                          </View>
                          <Text className={`amount ${item.type}`}>
                              {item.type === 'income' ? '+' : '-'}{item.amount}
                          </Text>
                      </View>
                  ))
              ) : (
                  <Empty description="暂无流水记录" />
              )
          )}
      </View>

      {/* FAB Add */}
      <View className="fab-add" onClick={handleAddClick}>
        <Plus size={24} color="#fff" />
      </View>

      {/* Add Flow Popup */}
      <Popup 
        visible={addVisible} 
        position="bottom" 
        round
        onClose={() => setAddVisible(false)}
      >
        <View className="add-flow-popup">
            <View className="popup-header">记一笔</View>
            <ScrollView scrollY className="popup-content">
                <View className="form-item">
                    <View className="type-tags" style={{ justifyContent: 'center', marginBottom: 20 }}>
                        <View 
                            className={`tag ${flowType === 'expense' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('expense')}
                            style={{ flex: 1, textAlign: 'center' }}
                        >支出</View>
                        <View 
                            className={`tag ${flowType === 'income' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('income')}
                            style={{ flex: 1, textAlign: 'center' }}
                        >收入</View>
                    </View>
                </View>

                <View className="form-item">
                    <Text className="label">金额</Text>
                    <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={amount}
                        onChange={(val) => setAmount(val)}
                    />
                </View>

                <View className="form-item">
                    <Text className="label">分类</Text>
                    <View className="type-tags">
                        {(flowType === 'expense' ? EXPENSE_TYPES : INCOME_TYPES).map(t => (
                            <View 
                                key={t} 
                                className={`tag ${category === t ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(t)}
                            >
                                {t}
                            </View>
                        ))}
                    </View>
                </View>

                {category === '薪资' && (
                    <View className="form-item">
                        <Text className="label">关联员工</Text>
                        <Cell 
                            title={selectedUser ? selectedUser.name : "请选择员工"} 
                            onClick={() => setShowMemberSelect(true)}
                        />
                    </View>
                )}

                <View className="form-item">
                    <Text className="label">备注</Text>
                    <Input 
                        placeholder="请输入备注信息" 
                        value={remark}
                        onChange={(val) => setRemark(val)}
                    />
                </View>
            </ScrollView>
            <View className="popup-footer">
                <Button block type="primary" onClick={handleConfirmAdd}>确认保存</Button>
            </View>
        </View>
      </Popup>

      {/* Member Selection Picker */}
      <Picker
        visible={showMemberSelect}
        options={members.map(m => ({ text: m.name, value: m.id, ...m }))}
        onConfirm={(options) => {
            setSelectedUser(options[0])
            setShowMemberSelect(false)
        }}
        onCancel={() => setShowMemberSelect(false)}
      />
    </View>
  )
}

export default ProjectFlow
