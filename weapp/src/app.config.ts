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
    'pages/employee/batch-add/index',
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
    selectedColor: '#1989fa',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/project/index',
        text: '项目',
        iconPath: 'assets/images/tabbar/project.png',
        selectedIconPath: 'assets/images/tabbar/project-active.png'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计',
        iconPath: 'assets/images/tabbar/stats.png',
        selectedIconPath: 'assets/images/tabbar/stats-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/images/tabbar/mine.png',
        selectedIconPath: 'assets/images/tabbar/mine-active.png'
      }
    ]
  },
  lazyCodeLoading: 'requiredComponents'
})
