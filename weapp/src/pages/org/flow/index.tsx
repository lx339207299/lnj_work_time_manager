import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Button, Empty, Input, Picker, Popup, Skeleton } from '@nutui/nutui-react-taro'
import { Plus } from '@nutui/icons-react-taro'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import { orgFlowService, OrgFlow } from '../../../services/orgFlowService'
import { employeeService } from '../../../services/employeeService'
import { yuanToFen, fenToYuanStr } from '../../../utils/money'
import './index.scss'

const EXPENSE_TYPES = ['工资', '设备', '其他']
const INCOME_TYPES = ['其他']

function OrgFlowPage() {
  const [flows, setFlows] = useState<OrgFlow[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ income: 0, expense: 0 })

  // Add Flow State
  const [addVisible, setAddVisible] = useState(false)
  const [flowType, setFlowType] = useState<'expense' | 'income'>('expense') // 'expense' | 'income'
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [remark, setRemark] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string } | null>(null)

  // Employee Selection
  const [showMemberSelect, setShowMemberSelect] = useState(false)
  const [members, setMembers] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '组织流水' })
    fetchFlows()
  }, [])

  const fetchFlows = async () => {
    setLoading(true)
    try {
      const list = await orgFlowService.listOrgFlows()
      setFlows(list)

      // Calculate stats
      const inc = list.filter(i => i.type === 'income').reduce((acc, cur) => acc + cur.amount, 0)
      const exp = list.filter(i => i.type === 'expense').reduce((acc, cur) => acc + cur.amount, 0)
      setStats({ income: inc, expense: exp })
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
      try {
          const list = await employeeService.getEmployees(true)
          setMembers(list.map(m => ({ id: m.id, name: m.user?.name || m.user?.phone || `成员${m.id}` })))
      } catch (error) {
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
      if (members.length === 0) {
          fetchMembers()
      }
  }

  const handleTypeChange = (type: 'expense' | 'income') => {
      setFlowType(type)
      setCategory('') // Reset category when type changes
      setSelectedUser(null)
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
      if (category === '工资' && !selectedUser) {
          Taro.showToast({ title: '请选择员工', icon: 'none' })
          return
      }

      try {
          await orgFlowService.addOrgFlow({
              type: flowType,
              amount: yuanToFen(amount),
              category,
              remark,
              relatedMemberId: selectedUser?.id,
              date: dayjs().format('YYYY-MM-DD')
          })
          Taro.showToast({ title: '添加成功', icon: 'success' })
          setAddVisible(false)
          fetchFlows()
      } catch (error) {
          Taro.showToast({ title: (error as any)?.message || '添加失败', icon: 'none' })
      }
  }

  const handleItemClick = (item: OrgFlow) => {
      Taro.showModal({
          title: '删除流水',
          content: `确定删除「${item.category}${item.relatedUserName ? ` - ${item.relatedUserName}` : ''}」这笔流水吗？`,
          success: async (res) => {
              if (!res.confirm) return
              try {
                  await orgFlowService.deleteOrgFlow(item.id)
                  Taro.showToast({ title: '已删除', icon: 'success' })
                  fetchFlows()
              } catch (error) {
                  Taro.showToast({ title: (error as any)?.message || '删除失败', icon: 'none' })
              }
          }
      })
  }

  return (
    <View className="org-flow-page">
      {/* Stats Header */}
      <View className="stats-header">
          <View className="stat-card">
              <Text className="label">总收入</Text>
              <Text className="value income">+{fenToYuanStr(stats.income)}</Text>
          </View>
          <View className="divider" />
          <View className="stat-card">
              <Text className="label">总支出</Text>
              <Text className="value expense">-{fenToYuanStr(stats.expense)}</Text>
          </View>
      </View>

      {/* Flow List */}
      <View className="flow-list">
          {loading ? (
              <Skeleton rows={3} title animated />
          ) : (
              flows.length > 0 ? (
                  flows.map(item => (
                      <View key={item.id} className="flow-item" onClick={() => handleItemClick(item)}>
                          <View className="info">
                              <Text className="title">{item.category} {item.relatedUserName ? `- ${item.relatedUserName}` : ''}</Text>
                              <View className="meta">
                                  <Text>{item.date}</Text>
                                  {item.remark && <Text>| {item.remark}</Text>}
                              </View>
                          </View>
                          <Text className={`amount ${item.type}`}>
                              {item.type === 'income' ? '+' : '-'}{fenToYuanStr(item.amount)}
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
                                onClick={() => setCategory(t)}
                            >
                                {t}
                            </View>
                        ))}
                    </View>
                </View>

                {category === '工资' && (
                    <View className="form-item">
                        <Text className="label">关联员工</Text>
                        <View
                            className="member-select"
                            onClick={() => setShowMemberSelect(true)}
                        >
                            <Text className={selectedUser ? 'member-name' : 'member-placeholder'}>
                                {selectedUser ? selectedUser.name : '请选择员工'}
                            </Text>
                        </View>
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
        options={members.map(m => ({ text: m.name, value: m.id }))}
        onConfirm={(options) => {
            setSelectedUser({ id: options[0].value as number, name: options[0].text as string })
            setShowMemberSelect(false)
        }}
        onCancel={() => setShowMemberSelect(false)}
      />
    </View>
  )
}

export default OrgFlowPage
