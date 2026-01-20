
import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Cell, Input, InputNumber, Picker, DatePicker, Dialog } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import dayjs from 'dayjs'
import { employeeService, Employee } from '../../../services/employeeService'
import './index.scss'

const roleOptions = [
  { text: '负责人', value: 'owner' },
  { text: '组长', value: 'leader' },
  { text: '员工', value: 'member' },
  { text: '临时工', value: 'temp' },
]

const wageTypeOptions = [
  { text: '日薪 (按天)', value: 'day' },
  { text: '月薪 (按月)', value: 'month' },
  { text: '时薪 (按时)', value: 'hour' },
]

function EmployeeEdit() {
  const router = useRouter()
  const { id } = router.params
  
  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('member')
  const [wageType, setWageType] = useState('day')
  const [wageAmount, setWageAmount] = useState<string | number>(0)
  const [birthday, setBirthday] = useState('')

  // UI State
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [showWagePicker, setShowWagePicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Mock current user check
  const isCurrentUserOwner = true 
  const isLeader = false // Mock role check
  const isSelf = id === '1' // Mock check if editing self (Assume '1' is self)

  const canEditPersonalInfo = isSelf
  const canEditWorkInfo = isCurrentUserOwner || isLeader 

  useEffect(() => {
    if (id) {
      Taro.setNavigationBarTitle({ title: '编辑员工' })
      fetchEmployee(id)
    } else {
      Taro.setNavigationBarTitle({ title: '添加员工' })
    }
  }, [id])

  const fetchEmployee = async (empId: string) => {
    try {
      const emp = await employeeService.getEmployeeById(empId)
      if (emp) {
        setName(emp.name)
        setPhone(emp.phone)
        setRole(emp.role)
        setWageType(emp.wageType)
        setWageAmount(emp.wageAmount)
        setBirthday(emp.birthday || '')
      }
    } catch (error) {
      console.error(error)
      Taro.showToast({ title: '获取员工信息失败', icon: 'error' })
    }
  }

  const handleSave = async () => {
    if (!name || !phone) {
      Taro.showToast({ title: '请填写姓名和手机号', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const data = {
        name,
        phone,
        role: role as any,
        wageType: wageType as any,
        wageAmount: Number(wageAmount),
        birthday
      }

      if (id) {
        await employeeService.updateEmployee(id, data)
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await employeeService.addEmployee(data)
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransfer = () => {
    Dialog.open('transfer', {
      title: '确认移交',
      content: '将负责人身份移交给该员工后，您将自动降级为普通员工。确定操作吗？',
      onConfirm: async () => {
        try {
          if (id) {
            await employeeService.transferOwnership(id)
            Taro.showToast({ title: '移交成功', icon: 'success' })
            setTimeout(() => {
                Taro.navigateBack()
            }, 1000)
          }
          Dialog.close('transfer')
        } catch (error) {
          Taro.showToast({ title: '移交失败', icon: 'error' })
        }
      },
      onCancel: () => {
        Dialog.close('transfer')
      }
    })
  }

  const handleDelete = () => {
      Dialog.open('delete', {
        title: '确认删除',
        content: '删除后无法恢复，确定要删除该员工吗？',
        onConfirm: async () => {
            try {
                if (id) {
                    await employeeService.deleteEmployee(id)
                    Taro.showToast({ title: '删除成功', icon: 'success' })
                    setTimeout(() => {
                        Taro.navigateBack()
                    }, 1000)
                }
                Dialog.close('delete')
            } catch (error) {
                Taro.showToast({ title: '删除失败', icon: 'error' })
            }
        },
        onCancel: () => {
            Dialog.close('delete')
        }
      })
  }

  const getRoleText = (val: string) => roleOptions.find(o => o.value === val)?.text || val
  const getWageTypeText = (val: string) => wageTypeOptions.find(o => o.value === val)?.text || val

  return (
    <View className="employee-edit-page">
      <View className="form-card">
        <Cell.Group>
            <Cell title="姓名" extra={
                <Input 
                    placeholder="请输入姓名" 
                    value={name} 
                    onChange={(val) => setName(val)}
                    align="right"
                    disabled={!canEditPersonalInfo}
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: !canEditPersonalInfo ? '#999' : '#333' }}
                />
            } />
            <Cell title="手机号" extra={
                <Input 
                    placeholder="请输入手机号" 
                    value={phone} 
                    onChange={(val) => setPhone(val)}
                    align="right"
                    type="number"
                    disabled={!canEditPersonalInfo}
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: !canEditPersonalInfo ? '#999' : '#333' }}
                />
            } />
            <Cell 
                title="生日" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: birthday ? (canEditPersonalInfo ? '#333' : '#999') : '#ccc' }}>{birthday || '请选择(选填)'}</Text>
                        {canEditPersonalInfo && <ArrowRight size={14} color="#999" />}
                    </View>
                }
                onClick={() => canEditPersonalInfo && setShowDatePicker(true)}
            />
        </Cell.Group>
      </View>

      <View className="form-card">
        <Cell.Group>
            <Cell 
                title="角色" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: canEditWorkInfo ? '#333' : '#999' }}>{getRoleText(role)}</Text>
                        {canEditWorkInfo && <ArrowRight size={14} color="#999" />}
                    </View>
                }
                onClick={() => canEditWorkInfo && setShowRolePicker(true)}
            />
            <Cell 
                title="薪资类型" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: canEditWorkInfo ? '#333' : '#999' }}>{getWageTypeText(wageType)}</Text>
                        {canEditWorkInfo && <ArrowRight size={14} color="#999" />}
                    </View>
                }
                onClick={() => canEditWorkInfo && setShowWagePicker(true)}
            />
            <Cell title="薪资数额" extra={
                <Input 
                    placeholder="请输入金额"
                    value={String(wageAmount)} 
                    onChange={(val) => setWageAmount(val)}
                    align="right"
                    type="digit"
                    disabled={!canEditWorkInfo}
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: !canEditWorkInfo ? '#999' : '#333' }}
                />
            } />
        </Cell.Group>
      </View>

      <View className="action-section">
        <Button block type="primary" loading={submitting} onClick={handleSave}>
            保存
        </Button>
        
        {/* Transfer Button Logic: Must be editing, current user is owner, target is not owner */}
        {id && isCurrentUserOwner && role !== 'owner' && (
            <Button block type="warning" fill="outline" className="transfer-btn" onClick={handleTransfer}>
                移交负责人身份
            </Button>
        )}

        {/* Delete Button */}
        {id && (isCurrentUserOwner || isLeader) && !isSelf && (
             <Button block type="danger" fill="outline" className="delete-btn" onClick={handleDelete}>
                 删除员工
             </Button>
        )}
      </View>

      {/* Role Picker */}
      <Picker
        visible={showRolePicker}
        options={roleOptions}
        onConfirm={(list) => {
            setRole(String(list[0].value))
            setShowRolePicker(false)
        }}
        onClose={() => setShowRolePicker(false)}
      />

      {/* Wage Picker */}
      <Picker
        visible={showWagePicker}
        options={wageTypeOptions}
        onConfirm={(list) => {
            setWageType(String(list[0].value))
            setShowWagePicker(false)
        }}
        onClose={() => setShowWagePicker(false)}
      />

      {/* Birthday Picker */}
      <DatePicker
        visible={showDatePicker}
        type="date"
        startDate={new Date(1950, 0, 1)}
        endDate={new Date()}
        onConfirm={(list, values) => {
            // values is array of strings/numbers depending on version.
            // list is options list. 
            // NutUI 2 DatePicker onConfirm: (options, values)
            // values: [year, month, day]
            const dateStr = values.join('-')
            setBirthday(dateStr)
            setShowDatePicker(false)
        }}
        onClose={() => setShowDatePicker(false)}
      />

      <Dialog id="transfer" />
      <Dialog id="delete" />
    </View>
  )
}

export default EmployeeEdit
