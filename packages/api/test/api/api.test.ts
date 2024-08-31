// import api from "../../src/api/api";
// import {MockImpl} from "../../src/impl/data/common/mock_impl";

import mailApiImpl from '../../src/impl/logical/mail/mail_impl';

describe('api type test', function () {
  it('type spec', function (done) {
    // let a = api.prototype.getDataTransApi();
    // console.log(typeof  a);
    done();
  });
  // it("test call",function (done){
  //     let mockImpl = new MockImpl();
  //     api.prototype.registerDataApi(mockImpl);
  //
  //     let a = api.prototype.requireApi(mockImpl.name);
  //     a.get("test",{}).then(value=>{console.log(value);}).catch(v=>{console.log(v);}).then(()=>done());
  //     // done();
  // })
});
const str = '"石晟" <shisheng@office.163.com>,"陈镇威" <chenzhenwei01@office.163.com>';
const ret = { parsed: [] };
window.apiResposity.mailApiImpl.contactHandler.handleEmailListStringToParsedContent(str, ret);

apiResposity.dexieDbApi.put({ dbName: 'mail_new', tableName: 'mail_data' }, { mid: 'ANwAbgDHE273cymG*o0gE4qX', brief: undefined });

const map = new Map(); document.querySelectorAll('.username').forEach(it => { const tt = it.innerText; if (map.has(tt)) { const time = map.get(tt); map.set(tt, time + 1); } else { map.set(tt, 1); } });
map.forEach((v, k) => { if (v > 1) console.warn(k + ' ' + v + 'times'); });

(function () {
  const map = new Map(); const pos = new Map(); document.querySelectorAll('.e1hwtrh40').forEach(
    it => {
      const ttEl = it.querySelector('.username');
      const vvEl = it.querySelector('.e1hwtrh42');
      const tt = ttEl ? ttEl.innerText : ''; const vv = vvEl ? vvEl.innerText : '';
      if (map.has(tt)) { const time = map.get(tt); map.set(tt, time + 1); } else { map.set(tt, 1); }
      if (pos.has(tt)) { const posMap = pos.get(tt); posMap.push(vv); } else { pos.set(tt, [vv]); }
    }
  );
  let ret = ''; let all = '';
  map.forEach((v, k) => {
    if (v > 1) {
      ret += (k + ' ' + v + 'times:') + (pos.get(k) ? pos.get(k).join(',') : '--') + '; ';
    } else {
      all += k + ';';
    }
  });
  return { ret, all };
}());
