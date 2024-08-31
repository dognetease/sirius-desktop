import React, { useEffect, useRef, useState } from 'react';
import { connectToChild } from 'penpal';
import { contactBridgeApiImpl } from '../penpal-bridge/contact-impl';
import { systemBridgeApiImpl } from '../penpal-bridge/system-impl';
import { siriusEmailBridgeImpl } from '../penpal-bridge/email-impl';
import { WaimaoAppMethodsForUnitableCrmDetailIframe, useBridgeMethodsProxy, UnitableCrmBridgeApi } from '@lxunit/bridge-types';
import { wrapLogToMethods } from '../api/helper';

export type methodType = WaimaoAppMethodsForUnitableCrmDetailIframe & {
  unitableApi: Partial<UnitableCrmBridgeApi>;
};
export const recordDetailCancel = 'recordDetailCancel';
export const recordDetailSubmitSuccess = 'recordDetailSubmitSuccess';
export const getInitData = 'getInitData';

export default (iframeUrl: string, handlerEvent: any, unitableApi: Partial<UnitableCrmBridgeApi>) => {
  let iframeRef = useRef<HTMLIFrameElement>(null);
  const childRef = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const methods: methodType = {
    contactApi: contactBridgeApiImpl,
    systemApi: systemBridgeApiImpl,
    emailApi: siriusEmailBridgeImpl,
    unitableApi: unitableApi,
    recordDetailApi: {
      recordDetailCancel() {
        // TODO: 实现
        handlerEvent(recordDetailCancel);
      },
      recordDetailSubmitSuccess(recordId, data) {
        // TODO: 实现
        handlerEvent(recordDetailSubmitSuccess, { recordId, data });
      },
      getInitData() {
        return handlerEvent(getInitData);
      },
    },
  };
  const penpalMethods = useBridgeMethodsProxy(methods);
  useEffect(() => {
    if (iframeUrl && iframeRef.current) {
      connectionRef.current?.destroy();
      connectionRef.current = connectToChild({
        iframe: iframeRef.current,
        methods: wrapLogToMethods(penpalMethods as any),
      });
      connectionRef.current.promise.then((child: any) => {
        childRef.current = child;
      });
    }
  }, [iframeUrl]);

  return {
    iframeRef,
    childRef,
  };
};
