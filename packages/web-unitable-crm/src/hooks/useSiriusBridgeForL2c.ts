import { useMemo } from 'react';
import { WaimaoAppMethodsForUnitableCRM } from '@lxunit/bridge-types';

import { contactBridgeApiImpl, useSelectContactModal } from '../penpal-bridge/contact-impl';
import { siriusEmailBridgeImpl } from '../penpal-bridge/email-impl';
import { systemBridgeApiImpl } from '../penpal-bridge/system-impl';

export const useSiriusBridgeForL2c = () => {
  useMemo(() => {
    const methods: WaimaoAppMethodsForUnitableCRM = {
      contactApi: {
        ...contactBridgeApiImpl,
        // callSelectContactModal(params) {
        //     return self.props.callSelectContractHandle(params)
        // },
      },
      systemApi: systemBridgeApiImpl,
      emailApi: siriusEmailBridgeImpl,
      unitableApi: {
        customEventHandle(data) {
          // _this.customEventHandle(data as unknown as HandlerData);
          console.log('customEventHandle handle called', data);
        },
        /** 预览邮件详情页 */
        readEmailDetail(data) {
          // readEmailDetail(data);
          console.log('customEventHandle handle called', data);
        },
        /** 回复邮件 */
        replyEmail(data) {
          // replyEmail(data);
          console.log('customEventHandle handle called', data);
        },
        /** 转发邮件 */
        transEmail(data) {
          // transEmail(data);
          console.log('customEventHandle handle called', data);
        },
        /** 申请权限邮件 */
        createAuthorization(data) {
          console.log('customEventHandle handle called', data);
          // createAuthorization(data, (isUpdate: boolean) => { _this.state.resoloveFun(isUpdate)});
          // return new Promise((resolve) => {
          //     _this.setState({
          //         resoloveFun: resolve
          //     })
          // })
        },
        /** 查看权限申请状态 */
        showAuthInfo(contactEmails) {
          // _this.setState({
          //     authorization: true,
          //     contactEmails: contactEmails
          // })
          // console.log('customEventHandle handle called', contactEmails);
        },
        /** 查看海关数据详情页 */
        customsDetail(data) {
          // _this.handleCustomsDetail(data, 0);
          // console.log('customEventHandle handle called', data);
        },
        /** 跟进动态附件 */
        showAppendix(data) {
          // previewNosFile(data?.document_id, data?.condition, data?.company_id);
          // console.log('customEventHandle handle called', data);
        },
        /** whatsapp图片预览 */
        previewImage(data) {
          // ImgPreview.preview(data);
        },
        getSiriusVisibleMenuLabels() {
          // return store.getState().privilegeReducer.visibleMenuLabels;
        },
        // /**获取往来邮件 未读气泡提醒*/
        // getRegularCustomerMenuData(){
        //     return self.props.regularMenuData;
        // },
      },
    } as any;
    return methods;
  }, []);
};
