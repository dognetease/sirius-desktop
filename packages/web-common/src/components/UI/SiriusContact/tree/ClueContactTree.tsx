// import React, { useEffect, useState, useCallback } from 'react';
// import { ContactTreeDataNode, ContactTreeNode, ContactTreeOrgNode, transTreeLeaf } from '@web-common/components/util/contact';
// import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
// import BaseTree from '@web-common/components/UI/SiriusContact/tree/BaseTree';
// import { api, apis, ContactAndOrgApi, ContactEdmSyncRes, EntityOrg } from 'api';
// import { updateOrgTreeData } from 'utils/contact_util';
// import { ContactTreeBase, transTreeName } from './data';

// /**
//  * 客户树
//  * @param props
//  * @constructor
//  */
// const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

// const rootBaseKey = 'TreeBaseRootKey';

// const transCustomer = (data: EntityOrg[]): ContactTreeOrgNode[] => {
//   return data.map(item => {
//     return {
//       key: item.id,
//       title: item.orgName,
//       isLeaf: false,
//       nodeType: 'customer',
//       orgInfo: item,
//     };
//   });
// };

// /**
//  * 线索树
//  * @param props
//  * @constructor
//  */
// const ClueContactTree: React.FC<ContactTreeBase> = props => {
//   const [treeData, setTreeData] = useState<ContactTreeDataNode[]>([]);
//   const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<any>();
//   const getDataList = useCallback(() => {
//     contactApi.doGetCustomerOrgList({ type: 'clue' }).then(data => {
//       setDefaultExpandedKeys([]);
//       setTreeData([
//         {
//           key: rootBaseKey,
//           nodeType: 'clue',
//           title: transTreeName('clue'),
//           isLeaf: false,
//           children: transCustomer(data),
//         },
//       ]);
//     });
//   }, [setDefaultExpandedKeys, setTreeData]);

//   /**
//    * 加载组织数据
//    * @param node
//    */
//   const handleLoadData = useCallback(
//     async (node: ContactTreeNode) => {
//       const { key } = node;
//       const res = await contactApi.doGetCustomerContactByOrgIds({ idList: [key] });
//       const data = res[key];
//       const leafList = data.map(item => transTreeLeaf(item));
//       setTreeData(_data => updateOrgTreeData(_data, `${key}`, leafList));
//     },
//     [setTreeData]
//   );
//   useEffect(() => {
//     getDataList();
//   }, []);
//   useMsgRenderCallback('contactEdmNotify', e => {
//     if ((e.eventData as ContactEdmSyncRes)?.needSync) {
//       getDataList();
//     }
//   });
//   return <BaseTree {...props} defaultExpandedKeys={defaultExpandedKeys} treeInitData={treeData} loadData={handleLoadData} />;
// };
// export default ClueContactTree;