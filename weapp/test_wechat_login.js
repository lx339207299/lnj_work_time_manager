const automator = require('miniprogram-automator');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testIsNewUser() {
  let miniProgram;
  try {
    miniProgram = await automator.launch({
      projectPath: '/Users/lixiong/workspace_ai/lnj_work_time_manager/weapp/',
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    });

    await sleep(2000);
    await miniProgram.navigateTo('/pages/login/index');
    await sleep(2000);

    // 直接在微信环境获取 code 并调后端
    const result = await miniProgram.evaluate(() => {
      return new Promise((resolve) => {
        const wx = globalThis.wx || globalThis['wx'];
        wx.login({
          success: (loginRes) => {
            wx.request({
              url: 'http://localhost:3000/api/auth/wechat-login',
              method: 'POST',
              header: { 'content-type': 'application/json' },
              data: { code: loginRes.code },
              success: (res) => {
                const d = res.data;
                resolve({
                  loginCode: loginRes.code,
                  statusCode: res.statusCode,
                  isNewUser: d?.data?.[0]?.isNewUser,
                  phone: d?.data?.[0]?.user?.phone,
                  name: d?.data?.[0]?.user?.name,
                  openid: d?.data?.[0]?.openid,
                  fullData: d,
                });
              },
              fail: (err) => resolve({ error: JSON.stringify(err) }),
            });
          },
          fail: (err) => resolve({ error: 'login failed: ' + JSON.stringify(err) }),
        });
      });
    });

    console.log('结果:', JSON.stringify(result, null, 2));
    
    if (result.isNewUser === true && result.phone === null) {
      console.log('✅ isNewUser=true, phone=null — 前端会进入手机号绑定步骤');
    } else if (result.isNewUser === false) {
      console.log('❌ isNewUser=false — 仍会跳过手机号绑定');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (miniProgram) {
      try { await miniProgram.close(); } catch (e) {}
    }
  }
}

testIsNewUser();
