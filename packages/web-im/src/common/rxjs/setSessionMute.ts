import { apiHolder, NIMApi, apis, IMTeamApi } from 'api';
import lodashGet from 'lodash/get';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const imHttpApi = apiHolder.api.requireLogicalApi(apis.imTeamApiImpl) as unknown as IMTeamApi;
const systemApi = apiHolder.api.getSystemApi();
interface SetMuteParam {
  toAccount: string;
  ismute: boolean; // true表示静音 false表示打开
}
/**
 * 设置静音的时候一定要配置
 * @param params
 */
export const setSessionMute = async (params: SetMuteParam, isP2P = true) => {
  let myAccount = '';
  const contactInfo = systemApi.getCurrentUser()?.contact?.contactInfo || [];
  if (contactInfo && contactInfo.length) {
    myAccount = contactInfo.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';
  }

  myAccount = myAccount || lodashGet(nimApi, '$instance.account', '');

  await imHttpApi.toggleMute({
    session_id: params.toAccount,
    owner: myAccount,
    type: 1,
    ope: params.ismute ? 2 : 1,
  });

  if (isP2P) {
    nimApi.p2pMuteStream.toggleMute({
      account: params.toAccount,
      isAdd: params.ismute,
    });
  } else {
    nimApi.excute('updateInfoInTeam', {
      teamId: params.toAccount,
      muteTeam: params.ismute,
    });
  }
};
