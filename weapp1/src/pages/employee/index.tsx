
import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Avatar, Tag, Swipe, Dialog, Empty, Skeleton, Cell } from '@nutui/nutui-react-taro'
import { Plus, ArrowRight } from '@nutui/icons-react-taro'
import { employeeService, Employee } from '../../services/employeeService'
import { invitationService } from '../../services/invitationService'
import { useOrgStore } from '../../store/orgStore'
import './index.scss'

const roleMap: Record<string, { text: string, type: string }> = {
  owner: { text: '负责人', type: 'primary' },
  leader: { text: '组长', type: 'success' },
  member: { text: '员工', type: 'default' },
  temp: { text: '临时工', type: 'warning' }
}

function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const { currentOrg } = useOrgStore()

  useDidShow(() => {
    fetchEmployees()
  })

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await employeeService.getEmployees(currentOrg?.id || '')
      setEmployees(res)
    } catch (error) {
      console.error(error)
      Taro.showToast({ title: '获取员工列表失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Mock current user info
  const currentUserId = '1' // Assume current user is '张三' (owner)
  const currentUserRole = 'owner' 

  const handleEdit = (targetId: string) => {
    // Permission check
    // Owner/Leader can edit anyone
    // Others can only edit themselves
    const canEdit = 
        ['owner', 'leader'].includes(currentUserRole) || 
        targetId === currentUserId

    if (canEdit) {
        Taro.navigateTo({ url: `/pages/employee/edit/index?id=${targetId}` })
    } else {
        Taro.showToast({ title: '无权编辑他人信息', icon: 'none' })
    }
  }

  const handleDelete = (targetId: string) => {
      // Permission check
      if (!['owner', 'leader'].includes(currentUserRole)) {
          Taro.showToast({ title: '无权删除员工', icon: 'none' })
          return
      }
      
      Dialog.open('confirm', {
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该员工吗？',
      onConfirm: async () => {
        try {
          await employeeService.deleteEmployee(targetId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
          fetchEmployees()
          Dialog.close('confirm')
        } catch (error) {
          Taro.showToast({ title: '删除失败', icon: 'error' })
        }
      },
      onCancel: () => {
        Dialog.close('confirm')
      }
    })
  }

  const handleInvite = async () => {
    if (!['owner', 'leader'].includes(currentUserRole)) {
        Taro.showToast({ title: '无权邀请员工', icon: 'none' })
        return
    }

    if (!currentOrg?.id) {
        Taro.showToast({ title: '未选择组织', icon: 'none' })
        return
    }
    
    Taro.showLoading({ title: '生成邀请...' })
    try {
        const invite = await invitationService.create(currentOrg.id)
        Taro.hideLoading()
        
        Taro.showActionSheet({
            itemList: ['复制邀请码', '复制邀请链接']
        }).then(res => {
            if (res.tapIndex === 0) {
                Taro.setClipboardData({ data: invite.code })
            } else if (res.tapIndex === 1) {
                // Assuming we have a way to deep link or just text description
                // In real WeChat Mini Program, we might not have a URL scheme unless we use Link or QR Code
                // For now, text is fine.
                const link = `请在小程序中输入邀请码: ${invite.code}`
                Taro.setClipboardData({ data: link })
            }
        }).catch(() => {})
        
    } catch (error) {
        Taro.hideLoading()
        Taro.showToast({ title: '生成邀请失败', icon: 'error' })
    }
  }

  return (
    <View className="employee-page">
      {loading ? (
        <View className="skeleton-wrapper">
             <Skeleton rows={3} title animated />
             <Skeleton rows={3} title animated style={{ marginTop: 20 }} />
        </View>
      ) : (
        employees.length > 0 ? (
            <View className="employee-list">
                <Cell.Group>
                {employees.map(emp => (
                    <Swipe
                        key={emp.id}
                        rightAction={
                            <Button type="danger" shape="square" onClick={() => handleDelete(emp.id)}>
                                删除
                            </Button>
                        }
                        disabled={!['owner', 'leader'].includes(currentUserRole)}
                    >
                        <Cell
                            className="employee-cell"
                            onClick={() => handleEdit(emp.id)}
                            align="center"
                            title={
                                <View className="cell-title-content">
                                    <Avatar size="normal" className="avatar">{emp.name[0]}</Avatar>
                                    <View className="info">
                                        <View className="name-row">
                                            <Text className="name">{emp.name}</Text>
                                            <Tag type={roleMap[emp.role]?.type as any || 'default'} plain>
                                                {roleMap[emp.role]?.text || emp.role}
                                            </Tag>
                                            {/* Show red dot if wageAmount is not set */}
                                            {(!emp.wageAmount || emp.wageAmount <= 0) && (
                                                <View className="red-dot" />
                                            )}
                                        </View>
                                        <Text className="phone">{emp.phone}</Text>
                                    </View>
                                </View>
                            }
                            extra={
                                (['owner', 'leader'].includes(currentUserRole) || emp.id === currentUserId) ? (
                                    <ArrowRight color="#999" />
                                ) : null
                            }
                        />
                    </Swipe>
                ))}
                </Cell.Group>
            </View>
        ) : (
            <Empty description="暂无员工数据" />
        )
      )}

      {/* Only owner/leader can add */}
      {['owner', 'leader'].includes(currentUserRole) && (
          <View className="fab-add" onClick={handleInvite}>
            <Plus size={24} color="#fff" />
          </View>
      )}
      
      <Dialog id="confirm" />
    </View>
  )
}

export default EmployeeList
