const got = require('got');
const fse = require('fs-extra');
const path = require('path');
const url =
  'https://su-desktop-web.cowork.netease.com:8000/js6/read/readdata.jsp?action=download_attach&l=read&mode=download&part=3&sid=r0oAlATAG9N8C8UEoMjM31F2rOcFElMF&mid=ABYAUABCDiGko-Hk42HhqKrR';
const res = got.stream(url, {
  headers: {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    'upgrade-insecure-requests': '1',
    cookie:
      'pass_2fa=5FCNqDmLMSBBB2z7l5kaUCIQyHM40LpNvNTHl0JPzuEyaGFaUwGByb30TFpuJVna; io=41sp36GBLYx01R15AABE; QIYE_SESS=numSHKBSVVkMxnavRZEc.2Cplxefv4Y6tXpaPiCMkBz8yxzv48pYnvszrSoyvBu8c8Bj6kfhVGNnT430gTBlOdpBQQhjn4nzZ1N6iJwujMyeYtg43AN03A2b1NPaof0hhZEADMOkS0_ULC2ktfRkie.83tYBWSWwvm9IVyqHhJy; mail_idc=mimghz.qiye.163.com; Coremail=YT1hwUcgmn5m*vaDzWcQ0e8yxHjjPxpjesAoQX1P9NtvgT8vXAP6zD7hb3n51sd*7RRSfp0ZntaYwslXF3sz54KS*pQh8O5G55ZWQOUg2SOpBDwl5oVg8h-U15qj8yW4FmtJKO121DQdxYzizARjJKxs2l7sqsIlpW0O1O5q*yU|%test-hm5.hzqyhmail.163.com; cm_last_info=rhPyrkDPmkSKb2_zp5zNslaIpAjO7AeXo5fOq0iNegiMfwiMfAPvokLN9AjGslbTqMTInlezaynEshazaynHmkzI9ADNq0iNfBbDn0iNf1aKmO2Pekj_rhz8c1.SnOjKpQXmrlz7s4Xjn2zKp3n67BaXaN_xehj_ni3PciCSa1vBfl_JpPvPsizSpPjygl_GjyuAo1POnlbO9kvHbgTCsB3To4PvokKIahmN9AbJpgnRdkPvokLN9AjGslbTqMTInleAp1OK7ByXa.; qiye_uid="dujuan04@elysys.net"; qiye_mail_upx=uphz1.qiye.163.com',
  },
});
const dest = fse.createWriteStream(path.join(__dirname, '1111.mov'), {
  highWaterMark: 1024 * 1024,
});
res.pipe(dest);
res.on('request', data => {
  console.log('request', data);
});
res.on('downloadProgress', progress => {
  console.log('downloadProgress', progress);
});
dest.on('close', () => {
  console.log('end');
});
dest.on('error', error => {
  console.log('dest error', error);
});
res.on('error', error => {
  console.log('res error', error);
});
