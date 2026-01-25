import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Avatar, Cell, Swipe, Empty, Skeleton, Popup, Checkbox } from '@nutui/nutui-react-taro'
import { Plus } from '@nutui/icons-react-taro'
import { projectService } from '../../../services/projectService'
import { employeeService, Employee } from '../../../services/employeeService'
import { useOrgStore } from '../../../store/orgStore'
import './index.scss'

function ProjectMember() {
  const router = useRouter()
  const projectId = router.params.projectId || ''
  const { currentOrg } = useOrgStore()
  
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Add Member State
  const [addVisible, setAddVisible] = useState(false)
  const [orgEmployees, setOrgEmployees] = useState<Employee[]>([])
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([])
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchMembers()
    }
  }, [projectId])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const list = await projectService.getProjectMembers(projectId)
      setMembers(list)
    } catch (error) {
      console.error(error)
      Taro.showToast({ title: '获取成员失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = async () => {
    // Load org employees
    try {
      Taro.showLoading({ title: '加载中...' })
      const res = await employeeService.getEmployees(currentOrg?.id || '')
      // Filter out existing members
      const existingIds = members.map(m => m.id)
      const available = res.filter(e => !existingIds.includes(e.id))
      
      setOrgEmployees(available)
      setSelectedEmpIds([])
      setAddVisible(true)
    } catch (error) {
      Taro.showToast({ title: '加载员工失败', icon: 'error' })
    } finally {
      Taro.hideLoading()
    }
  }

  const handleConfirmAdd = async () => {
    if (selectedEmpIds.length === 0) {
      return
    }
    
    setAdding(true)
    try {
      await projectService.addProjectMembers(projectId, selectedEmpIds)
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setAddVisible(false)
      fetchMembers()
    } catch (error) {
      Taro.showToast({ title: '添加失败', icon: 'error' })
    } finally {
      setAdding(false)
    }
  }

  const toggleSelection = (id: string) => {
      if (selectedEmpIds.includes(id)) {
          setSelectedEmpIds(selectedEmpIds.filter(item => item !== id))
      } else {
          setSelectedEmpIds([...selectedEmpIds, id])
      }
  }

  const handleSelectAll = () => {
    if (selectedEmpIds.length === orgEmployees.length) {
      // Deselect all
      setSelectedEmpIds([])
    } else {
      // Select all
      setSelectedEmpIds(orgEmployees.map(e => e.id))
    }
  }

  return (
    <View className="project-member-page">
      {loading ? (
        <View className="skeleton-wrapper">
             <Skeleton rows={3} title animated />
        </View>
      ) : (
        members.length > 0 ? (
            <View className="member-list">
                <Cell.Group>
                {members.map(mem => (
                    <Cell
                        key={mem.id}
                        className="employee-cell"
                        align="center"
                        title={
                            <View className="cell-title-content">
                                <Avatar size="normal" className="avatar">{mem.name[0]}</Avatar>
                                <View className="info">
                                    <View className="name-row">
                                        <Text className="name">{mem.name}</Text>
                                    </View>
                                    <Text className="role">{mem.role}</Text>
                                </View>
                            </View>
                        }
                    />
                ))}
                </Cell.Group>
            </View>
        ) : (
            <Empty description="暂无项目成员" />
        )
      )}

      {/* FAB Add Button */}
      <View className="fab-add" onClick={handleAddClick}>
        <Plus size={24} color="#fff" />
      </View>

      {/* Add Member Popup */}
      <Popup 
        visible={addVisible} 
        position="bottom" 
        round
        onClose={() => setAddVisible(false)}
      >
        <View className="add-member-popup">
            <View className="popup-header">
                <Text>添加成员</Text>
                {orgEmployees.length > 0 && (
                    <Text className="select-all-btn" onClick={handleSelectAll}>
                        {selectedEmpIds.length === orgEmployees.length ? '全不选' : '全选'}
                    </Text>
                )}
            </View>
            <ScrollView scrollY className="popup-content">
                {orgEmployees.length > 0 ? (
                    <View className="employee-check-list">
                        {orgEmployees.map(emp => (
                            <View key={emp.id} className="check-item" onClick={() => toggleSelection(emp.id)}>
                                <View style={{ pointerEvents: 'none' }}>
                                    <Checkbox checked={selectedEmpIds.includes(emp.id)} />
                                </View>
                                <View className="info">
                                    <Text className="name">{emp.name}</Text>
                                    <Text className="phone">{emp.phone}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Empty description="没有可添加的员工" />
                )}
            </ScrollView>
            <View className="popup-footer">
                <Button 
                    block 
                    type="primary" 
                    disabled={selectedEmpIds.length === 0}
                    loading={adding}
                    onClick={handleConfirmAdd}
                >
                    确认添加 ({selectedEmpIds.length})
                </Button>
            </View>
        </View>
      </Popup>
    </View>
  )
}

export default ProjectMember
