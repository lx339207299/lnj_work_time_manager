import { Component, PropsWithChildren } from 'react'
import { WebView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

class WebviewPage extends Component<PropsWithChildren> {
  $instance = Taro.getCurrentInstance()

  componentDidMount() {
    // 设置导航栏标题
    const params = this.$instance.router?.params || {}
    const title = params.title || '详情'
    Taro.setNavigationBarTitle({ title })
    console.log(params.url);
    
  }

  render() {
    const params = this.$instance.router?.params || {}
    const url = decodeURIComponent(params.url || '')

    if (!url) {
      return (
        <div className='webview-error'>
          <p>链接无效</p>
        </div>
      )
    }

    return <WebView src={url} />
  }
}

export default WebviewPage
