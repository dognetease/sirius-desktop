// 没有引用，注释掉 by 周昊 @2024.01.03
// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { PageProps, navigate } from 'gatsby';
// import { apiHolder, environment, inWindow, MailApi, apis, NetStorageApi, NIMApi } from 'api';
// import Edm from '@web-edm/edmIndex';
// import { HeaderFc } from '../layouts/WmMain/HeaderFc';
// import SideBar from '@web-entry-wm/layouts/WmMain/sideBar';
//
// import {
//   CalenderIcon,
//   ContactIcon,
//   AppsIcon,
//   DiskTabIcon,
//   IMIcon,
//   MailBoxIcon,
//   EdmIcon,
//   CustomerIcon,
//   WorktableIcon,
//   CustomsDataIcon,
//   GlobalSearchIcon,
//   EnterpriseIcon,
//   SnsIcon,
// } from '@web-common/components/UI/Icons/icons';
// import '../styles/global.scss';
// import TinymceTooltip from '@web-common/components/UI/TinymceTooltip/TinymceTooltip';
// import SiriusLayout from '@web-entry-wm/layouts';
//
// const systemApi = apiHolder.api.getSystemApi();
//
// const IndexPageWrapper: React.FC<any> = ({ children }) => <SiriusLayout.ContainerLayout isLogin={false}>{children}</SiriusLayout.ContainerLayout>;
//
// const IndexPage: React.FC<PageProps> = ({ location }) => {
//   const MemoizedTinymceTooltip = useMemo(() => TinymceTooltip, []);
//
//   const isDevEnv = environment === 'dev';
//   const edmEntries = [
//     // <SendedMarketing
//     //   name="edm"
//     //   qs={qs}
//     //   tag="营销"
//     //   icon={EdmIcon}
//     // // hidden={!enalbeFastMail || !visibleEdm}
//     // />,
//     <Edm
//       name="edm"
//       tag="营销"
//       icon={EdmIcon}
//       // hidden={!enalbeFastMail || !visibleEdm}
//     />,
//   ];
//   return (
//     <>
//       <IndexPageWrapper>
//         <MemoizedTinymceTooltip />
//         <HeaderFc />
//         <SiriusLayout.MainLayout location={location}>
//           {/* 内层直接引入模块 */}
//
//           {systemApi.inEdm() && edmEntries}
//         </SiriusLayout.MainLayout>
//       </IndexPageWrapper>
//     </>
//   );
// };
// export default IndexPage;
