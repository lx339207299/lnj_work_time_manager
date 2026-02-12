import React, { useEffect } from 'react'
import Taro, { useDidShow, useDidHide } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { useAuth } from './hooks/useAuth'
// 全局样式
import './app.scss'

function App(props) {
  const { checkAuth } = useAuth()
  
  useEffect(() => {
    const isH5 = process.env.TARO_ENV === 'h5'
    const isDev = process.env.NODE_ENV === 'development'
    if (isH5 && isDev) {
      // if (!(window as any).__vconsole__) {
      //   import('vconsole').then(VConsoleModule => {
      //     const VConsole = VConsoleModule.default
      //     ;(window as any).__vconsole__ = new VConsole()
      //   })
      // }
    }
  }, [])
  
  // 对应 onShow
  useDidShow(() => {
    checkAuth()
  })

  // 对应 onHide
  useDidHide(() => {})

  return props.children
}

export default App
