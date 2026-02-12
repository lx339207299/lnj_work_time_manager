
import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Button, Cell, DatePicker, Dialog, Empty, Input, InputNumber, Picker } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import dayjs from 'dayjs'
import { employeeService, Employee } from '../../../services/employeeService'
import { request } from '../../../utils/request'
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
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Manager Edit Mode Only
  const canEditWorkInfo = true 

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
      const emp = await employeeService.getEmployeeById(Number(empId))
      if (emp) {
        setName(emp.user?.name || '')
        setPhone(emp.user?.phone || '')
        setRole(emp.role)
        setWageType(emp.wageType)
        setWageAmount(emp.wageAmount)
        setBirthday(emp.user?.birthday || '')
      }
    } catch (error) {
      console.error(error)
      Taro.showToast({ title: '获取员工信息失败', icon: 'error' })
    }
  }

  const handleSave = async () => {
    if (!phone) {
      Taro.showToast({ title: '请填写手机号', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const data = {
        role: role as any,
        wageType: wageType as any,
        wageAmount: Number(wageAmount),
      }

      if (id) {
        await employeeService.updateEmployee(Number(id), data)
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await employeeService.addEmployee({ ...data, phone, name, birthday })
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
            await employeeService.transferOwnership(Number(id))
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
                    await employeeService.deleteEmployee(Number(id))
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
            {!id && (
                <>
                    <Cell title="姓名" extra={
                        <Input 
                            placeholder="请输入姓名"
                            value={name} 
                            onChange={(val) => setName(val)}
                            align="right"
                            style={{ border: 'none', padding: 0, textAlign: 'right', color: '#333' }}
                        />
                    } />
                    <Cell title="手机号" extra={
                        <Input 
                            placeholder="请输入手机号"
                            value={phone} 
                            onChange={(val) => setPhone(val)}
                            maxLength={11}
                            align="right"
                            type="tel"
                            style={{ border: 'none', padding: 0, textAlign: 'right', color: '#333' }}
                        />
                    } />
                    <Cell 
                        title="生日" 
                        extra={
                            <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Text style={{ color: birthday ? '#333' : '#999' }}>{birthday || '请选择'}</Text>
                                <ArrowRight size={14} color="#999" />
                            </View>
                        }
                        onClick={() => setShowBirthdayPicker(true)}
                    />
                </>
            )}
            {id && (
                <>
                    <Cell title="姓名" extra={
                        <Text style={{ color: '#999' }}>{name || '待填写'}</Text>
                    } />
                    <Cell title="手机号" extra={
                        <Text style={{ color: '#999' }}>{phone || '待填写'}</Text>
                    } />
                    <Cell 
                        title="生日" 
                        extra={
                            <Text style={{ color: '#999' }}>{birthday || '未设置'}</Text>
                        }
                    />
                </>
            )}
        </Cell.Group>
      </View>

      <View className="form-card">
        <Cell.Group>
            <Cell 
                title="角色" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: '#333' }}>{getRoleText(role)}</Text>
                        <ArrowRight size={14} color="#999" />
                    </View>
                }
                onClick={() => setShowRolePicker(true)}
            />
            <Cell 
                title="薪资类型" 
                extra={
                    <View style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ color: '#333' }}>{getWageTypeText(wageType)}</Text>
                        <ArrowRight size={14} color="#999" />
                    </View>
                }
                onClick={() => setShowWagePicker(true)}
            />
            <Cell title="薪资数额" extra={
                <Input 
                    placeholder="请输入金额"
                    value={String(wageAmount)} 
                    onChange={(val) => setWageAmount(val)}
                    align="right"
                    type="digit"
                    style={{ border: 'none', padding: 0, textAlign: 'right', color: '#333' }}
                />
            } />
        </Cell.Group>
      </View>

      <View className="action-section">
        <Button block type="primary" loading={submitting} onClick={handleSave}>
            保存
        </Button>
        
        {/* Actions for existing employees */}
        {id && (
            <>
                {role !== 'owner' && (
                    <Button block type="warning" fill="outline" className="transfer-btn" onClick={handleTransfer}>
                        移交负责人身份
                    </Button>
                )}
                <Button block type="danger" fill="outline" className="delete-btn" onClick={handleDelete}>
                    删除员工
                </Button>
            </>
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
        visible={showBirthdayPicker}
        title="选择生日"
        type="date"
        startDate={new Date(1900, 0, 1)}
        endDate={new Date()}
        onConfirm={(options, values) => {
            setBirthday(values.join('-'))
            setShowBirthdayPicker(false)
        }}
        onClose={() => setShowBirthdayPicker(false)}
      />

      <Dialog id="transfer" />
      <Dialog id="delete" />
    </View>
  )
}

export default EmployeeEdit
