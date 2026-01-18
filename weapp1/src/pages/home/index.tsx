import React from 'react'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import './index.scss'

function Home() {
  return (
    <View className="nut-flex nut-flex-col nut-row-center page-container">
      <View>首页 - 工作台</View>
      <Button type="primary">开始工作</Button>
    </View>
  )
}

export default Home
