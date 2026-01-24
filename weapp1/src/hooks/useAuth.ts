import Taro from '@tarojs/taro'
import { useUserStore } from '../store/userStore'
import { useOrgStore } from '../store/orgStore'
import { useAppStore } from '../store/appStore'
import { request } from '../utils/request'

export const useAuth = () => {
  const { token, userInfo, setUserInfo } = useUserStore()
  const { setInitialized } = useAppStore()
  
  const checkAuth = async () => {
    // ... whitelist ...
    const whitelist = [
        'pages/login/index',
        'pages/project/index',
        'pages/mine/index'
    ]
    
    // ... route detection ...
    let route = ''
    const currentPages = Taro.getCurrentPages()
    if (currentPages.length > 0) {
      const currentPage = currentPages[currentPages.length - 1]
      route = currentPage?.route || ''
    } else if (process.env.TARO_ENV === 'h5') {
      const hash = window.location.hash
      route = hash.replace(/^#/, '').split('?')[0]
    }
    route = route.replace(/^\//, '')

    // ... token retrieval ...
    let effectiveToken = token
    if (!effectiveToken && process.env.TARO_ENV === 'h5') {
         const storage = localStorage.getItem('user-storage')
         if (storage) {
             try {
                 const parsed = JSON.parse(storage)
                 if (parsed && parsed.state && parsed.state.token) {
                     effectiveToken = parsed.state.token
                 }
             } catch (e) {}
         }
    }

    // Redirect if no token
    if (!effectiveToken) {
        if (route && !whitelist.includes(route)) {
            if (process.env.TARO_ENV === 'h5') {
                 if (!window.location.hash.includes('pages/login/index')) {
                    Taro.redirectTo({ url: '/pages/login/index' })
                 }
            } else {
                 Taro.redirectTo({ url: '/pages/login/index' })
            }
        }
        // If no token, we consider initialization done (as "guest" state)
        setInitialized(true)
        return
    }

    if (effectiveToken && !Taro.getStorageSync('token')) {
        Taro.setStorageSync('token', effectiveToken)
    }

    // Sync Profile Logic
    const now = Date.now()
    const lastSyncTime = Taro.getStorageSync('last_sync_time') || 0
    const shouldSync = !userInfo || (now - lastSyncTime > 10 * 1000)

    if (shouldSync) {
        // If userInfo is missing, it means we are in "initializing" state
        if (!userInfo) {
            setInitialized(false)
        }

        try {
            console.log('Fetching profile (Reason: Missing userInfo or timeout)...')
            const user: any = await request({ url: '/auth/profile', method: 'GET' })
            
            // 1. Update User
            setUserInfo(user)
            
            // 2. Update Orgs
            if (user.memberships && user.memberships.length > 0) {
                const orgs = user.memberships.map((m: any) => ({
                    id: m.organization.id,
                    name: m.organization.name,
                    role: m.role
                }))
                useOrgStore.getState().setOrgList(orgs)
                
                // Smart select current org
                const current = useOrgStore.getState().currentOrg
                if (!current || !orgs.find(o => o.id === current.id)) {
                    useOrgStore.getState().setCurrentOrg(orgs[0])
                } else {
                    const match = orgs.find(o => o.id === current.id)
                    if (match && match.role !== current.role) {
                         useOrgStore.getState().setCurrentOrg(match)
                    }
                }
            } else {
                useOrgStore.getState().setOrgList([])
                useOrgStore.getState().setCurrentOrg(null)
            }
            
            Taro.setStorageSync('last_sync_time', now)
        } catch (e) {
            console.error('Sync profile failed', e)
        } finally {
            // Always set initialized to true after attempt
            setInitialized(true)
        }
    } else {
        // No sync needed, already initialized
        setInitialized(true)
    }
  }

  return { token, checkAuth }
}

