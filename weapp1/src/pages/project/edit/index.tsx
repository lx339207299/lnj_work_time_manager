import React, { useState, useEffect } from 'react'
import { View } from '@tarojs/components'
import { Form, Button, Input, TextArea } from '@nutui/nutui-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { useProjectStore } from '../../../store/projectStore'
import { projectService } from '../../../services/projectService'
import './index.scss'

function ProjectEdit() {
  const router = useRouter()
  const { id } = router.params
  const { addProject, updateProject } = useProjectStore()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (id) {
      Taro.setNavigationBarTitle({ title: '编辑项目' })
      projectService.getProjectDetail(id).then(project => {
          setName(project.name)
          setDescription(project.description)
      }).catch(err => {
          console.error(err)
          Taro.showToast({ title: '获取项目失败', icon: 'error' })
      })
    } else {
      Taro.setNavigationBarTitle({ title: '创建项目' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入项目名称', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      if (id) {
        // Update
        // await projectService.updateProject(id, { name, description }) // Mock API needed
        updateProject(id, { name, description })
        Taro.showToast({ title: '保存成功', icon: 'success' })
      } else {
        // Create
        const newProject = await projectService.createProject({ name, description })
        addProject(newProject as any)
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="project-edit-page">
      <View className="form-content">
        <Form
          labelPosition="left"
        >
          <Form.Item label="项目名称" required name="name">
            <Input 
              value={name} 
              onChange={(val) => setName(val)} 
              placeholder="请输入项目名称" 
              maxLength={15}
            />
          </Form.Item>
          <Form.Item label="项目描述" name="description">
            <TextArea 
              value={description} 
              onChange={(val) => setDescription(val)} 
              placeholder="请输入项目描述（选填）" 
              maxLength={50}
              rows={3}
            />
          </Form.Item>
        </Form>
      </View>

      <View className="form-footer">
        <Button block type="primary" loading={loading} onClick={handleSubmit}>
          {id ? '保存修改' : '立即创建'}
        </Button>
      </View>

      {/* Placeholder for Member Management in V2 */}
      {id && (
        <View className="tips-section">
          <View>成员管理功能请在详情页操作</View>
        </View>
      )}
    </View>
  )
}

export default ProjectEdit
