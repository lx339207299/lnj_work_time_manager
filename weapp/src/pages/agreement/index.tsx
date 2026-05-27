import { Component } from 'react'
import { View, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface State {
  html: string
  loading: boolean
  title: string
}

const API_BASE = process.env.TARO_APP_API_URL || ''

export default class AgreementPage extends Component<{}, State> {
  $instance = Taro.getCurrentInstance()

  state: State = {
    html: '',
    loading: true,
    title: '协议详情',
  }

  async componentDidMount() {
    const params = this.$instance.router?.params || {}
    const type = params.type || 'yhxy'
    
    const titles: Record<string, string> = {
      yhxy: '用户协议',
      ysxy: '隐私协议',
    }
    const title = titles[type] || '协议详情'
    this.setState({ title })
    Taro.setNavigationBarTitle({ title })

    try {
      const url = `${API_BASE}/pages/view?code=${type}`
      const res = await Taro.request({ url, method: 'GET' })
      // 公开接口返回纯 HTML 字符串
      if (typeof res.data === 'string') {
        this.setState({ html: res.data, loading: false })
      } else {
        this.setState({ html: '<div style="padding:16px;color:#999;">加载失败</div>', loading: false })
      }
    } catch {
      this.setState({ html: '<div style="padding:16px;color:#999;">加载失败，请检查网络</div>', loading: false })
    }
  }

  render() {
    const { html, loading } = this.state

    return (
      <View className='agreement-page'>
        {loading ? (
          <View className='agreement-loading'>加载中...</View>
        ) : (
          <RichText nodes={html} />
        )}
      </View>
    )
  }
}
