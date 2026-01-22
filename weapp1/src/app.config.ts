export default defineAppConfig({
  pages: [
    'pages/project/index',
    'pages/home/index',
    'pages/login/index',
    'pages/project/detail/index',
    'pages/project/stats/index',
    'pages/project/member/index',
    'pages/project/flow/index',
    'pages/project/edit/index',
    'pages/work-hour/index',
    'pages/stats/index',
    'pages/mine/index',
    'pages/employee/index',
    'pages/employee/edit/index',
    'pages/org/list/index',
    'pages/org/edit/index',
    'pages/mine/profile/index'
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
