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
    // 仅在 H5 环境下加载 vConsole，且只加载一次
    if (process.env.TARO_ENV === 'h5') {
      import('vconsole').then(VConsole => {
        new VConsole.default()
      })
    }
  }, [])

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
