export default defineAppConfig({
  pages: [
    'pages/project/index',
    'pages/home/index',
    'pages/login/index',
    'pages/project/detail/index',
    'pages/project/edit/index',
    'pages/work-hour/index',
    'pages/stats/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '工时管理',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1989fa', // NutUI default blue
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/project/index',
        text: '项目'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
