import React, { useEffect } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
import { useAuth } from './hooks/useAuth'
import '@nutui/nutui-react-taro/dist/style.css'
// 全局样式
import './app.scss'

function App(props) {
  const { checkAuth } = useAuth()

  // 可以使用所有的 React Hooks
  useEffect(() => {
    checkAuth()
  })

  // 对应 onShow
  useDidShow(() => {
    checkAuth()
  })

  // 对应 onHide
  useDidHide(() => {})

  return props.children
}

export default App
