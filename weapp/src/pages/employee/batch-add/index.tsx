import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, TextArea, Toast } from '@nutui/nutui-react-taro'
import { employeeService } from '../../../services/employeeService'
import './index.scss'

function BatchAddEmployee() {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState<'success' | 'fail' | 'loading' | 'text'>('text')

  const handleParseAndSubmit = async () => {
    if (!content.trim()) {
      setToastMsg('请输入员工信息')
      setToastType('fail')
      setShowToast(true)
      return
    }

    const lines = content.split('\n').filter(line => line.trim())
    const employees: { name: string; phone: string }[] = []
    const errors: string[] = []

    lines.forEach((line, index) => {
      // Replace full-width comma with half-width
      const parts = line.replace(/，/g, ',').split(',')
      
      if (parts.length < 2) {
        errors.push(`第 ${index + 1} 行格式错误：需包含姓名和手机号，用逗号分隔`)
        return
      }

      const name = parts[0].trim()
      const phone = parts[1].trim()

      if (!name) {
        errors.push(`第 ${index + 1} 行姓名为空`)
        return
      }

      if (!phone || !/^1\d{10}$/.test(phone)) {
        errors.push(`第 ${index + 1} 行手机号格式错误`)
        return
      }

      employees.push({ name, phone })
    })

    if (errors.length > 0) {
      Taro.showModal({
        title: '格式校验失败',
        content: errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...' : ''),
        showCancel: false
      })
      return
    }

    if (employees.length === 0) {
      setToastMsg('未解析到有效数据')
      setToastType('fail')
      setShowToast(true)
      return
    }

    setSubmitting(true)
    try {
      const results = await employeeService.batchAddEmployees(employees)
      
      const successCount = results.filter(r => r.status === 'success').length
      const failCount = results.filter(r => r.status === 'failed').length

      if (failCount === 0) {
        setToastMsg(`成功添加 ${successCount} 名员工`)
        setToastType('success')
        setShowToast(true)
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        const failDetails = results
          .filter(r => r.status === 'failed')
          .map(r => `${r.phone}: ${r.reason}`)
          .join('\n')
        
        Taro.showModal({
          title: '部分添加失败',
          content: `成功: ${successCount}, 失败: ${failCount}\n\n失败详情:\n${failDetails}`,
          showCancel: false,
          success: () => {
             // Keep the user on the page to fix errors? Or navigate back?
             // Maybe clear the successful ones from the input?
             // For now, let's just leave it.
             if (successCount > 0) {
                // Ideally we should navigate back if user is done
             }
          }
        })
      }
    } catch (error) {
      setToastMsg('提交失败，请稍后重试')
      setToastType('fail')
      setShowToast(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="batch-add-page">
      <View className="example-section">
        <View className="title">快速批量添加说明：</View>
        <View className="desc">请在下方输入框中输入员工信息，每行一位员工。格式为“姓名，手机号”（支持中文或英文逗号）。</View>
        <View className="title">示例：</View>
        <View className="example-box">
          张三，13111111111{'\n'}
          赵四，13111111112
        </View>
        <View className="desc" style={{ marginTop: 8, color: '#999' }}>
          * 默认身份为“员工”，薪资类型为“日薪”，薪资数额为 0
        </View>
      </View>

      <View className="input-card">
        <TextArea
          value={content}
          onChange={(val) => setContent(val)}
          placeholder="请输入员工信息..."
          rows={15}
          maxLength={5000}
        />
      </View>

      <View className="action-section">
        <Button block type="primary" loading={submitting} onClick={handleParseAndSubmit}>
          确认添加
        </Button>
      </View>

      <Toast 
        visible={showToast} 
        msg={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)}
      />
    </View>
  )
}

export default BatchAddEmployee
