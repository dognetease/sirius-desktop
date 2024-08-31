import React, { useState, useEffect } from 'react';
import lodashGet from 'lodash/get';
import { apiHolder, apis, ContactApi, OrgApi } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

export const ItemUnit: React.FC<{ id: string }> = props => {
  const { id } = props;
  const [department, setDepartment] = useState('');
  const requestDepartment = async (idList: string[]) => {
    const result = await contactApi.doGetOrgList({
      idList: [id],
    });

    const orgName = lodashGet(result, '[0].orgName', 'default');

    setDepartment(orgName);
  };
  useEffect(() => {
    requestDepartment([id]);
  }, []);
  return <>{department}</>;
};
