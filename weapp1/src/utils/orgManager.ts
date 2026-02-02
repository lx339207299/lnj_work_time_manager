import Taro from '@tarojs/taro'

const ORG_ID_KEY = 'currentOrgId'

export const orgManager = {
  /**
   * 设置当前组织ID到本地存储
   * @param orgId 组织ID
   */
  setCurrentOrgId: (orgId: string | null) => {
    try {
      if (orgId) {
        Taro.setStorageSync(ORG_ID_KEY, orgId)
      } else {
        Taro.removeStorageSync(ORG_ID_KEY)
      }
    } catch (error) {
      console.error('设置组织ID缓存失败:', error)
    }
  },

  /**
   * 从本地存储获取当前组织ID
   * @returns 组织ID或null
   */
  getCurrentOrgId: (): string | null => {
    try {
      const orgId = Taro.getStorageSync(ORG_ID_KEY)
      return orgId || null
    } catch (error) {
      console.error('获取组织ID缓存失败:', error)
      return null
    }
  },

  /**
   * 清理当前组织ID缓存
   */
  clearCurrentOrgId: () => {
    try {
      Taro.removeStorageSync(ORG_ID_KEY)
    } catch (error) {
      console.error('清理组织ID缓存失败:', error)
    }
  },

  /**
   * 检查是否有缓存的组织ID
   * @returns boolean
   */
  hasCurrentOrgId: (): boolean => {
    return !!orgManager.getCurrentOrgId()
  }
}