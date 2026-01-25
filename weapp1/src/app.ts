import React, { useEffect } from 'react'
import Taro, { useDidShow, useDidHide } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { useAuth } from './hooks/useAuth'
import { useAppStore } from './store/appStore'
import '@nutui/nutui-react-taro/dist/style.css'
// 全局样式
import './app.scss'

function App(props) {
  const { checkAuth } = useAuth()
  
  // Use useEffect to handle initialization logic, but do NOT render conditionally
  // Let the LoadingPage handle the UI
  
  // We still need checkAuth here for App-level lifecycle if needed, 
  // but if LoadingPage is the entry, it will handle the initial check.
  
  // However, checkAuth is also used for onShow (resuming app).
  
  // 对应 onShow
  useDidShow(() => {
    checkAuth()
  })

  // 对应 onHide
  useDidHide(() => {})

  return props.children
}

export default App
