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
  const { isInitialized } = useAppStore()

  // 可以使用所有的 React Hooks
  useEffect(() => {
    // Check for invite code in launch options (Cold launch)
    const launchOptions = Taro.getLaunchOptionsSync()
    const query = launchOptions.query || {}
    if (query.inviteCode) {
        console.log('Received invite code:', query.inviteCode)
        Taro.setStorageSync('pending_invite_code', query.inviteCode)
    }

    // 仅在 H5 环境下加载 vConsole，且只加载一次
    if (process.env.TARO_ENV === 'h5') {
      import('vconsole').then(VConsole => {
        new VConsole.default()
      })
    }
    // Initial check (handles H5 refresh where useDidShow might miss initial render timing or for safety)
    checkAuth()
  }, [])


  // 对应 onShow
  useDidShow(() => {
    checkAuth()
  })

  // 对应 onHide
  useDidHide(() => {})

  // Global Loading / Initialization Guard
  // Note: In Taro H5, blocking the first render of props.children might cause "Page instance not found" error
  // because Taro expects the page component to be mounted to register the page instance.
  // We should render props.children but maybe hide it, or ensure at least the page wrapper is rendered.
  
  // However, returning null or a different view component completely replaces the Page component, 
  // which Taro's runtime doesn't like during initial route match.
  
  // Better approach: Render children but overlay the loading spinner, OR use a layout wrapper.
  // But props.children IS the page.
  
  // Let's try rendering props.children hidden + loading spinner overlay.
  
  return React.createElement(View, { className: 'app-wrapper' }, [
      // The actual page content (always render to satisfy Taro runtime)
      React.createElement(View, { 
          key: 'content',
          style: { display: isInitialized ? 'block' : 'none' } 
      }, props.children),
      
      // Loading Overlay
      !isInitialized ? React.createElement(View, {
          key: 'loading',
          style: {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#fff'
          }
      }, [
          React.createElement(View, { key: 'spinner', className: 'loading-spinner' }),
          React.createElement(View, { 
              key: 'text',
              style: { marginTop: 20, color: '#999', fontSize: 14 } 
          }, '正在同步数据...')
      ]) : null
  ])
}

export default App
