import React from 'react';
import IntelligentSearch from '@web/components/Layout/Data/IntelligentSearch/index';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';

const SearchWhatsApp = () => (
  <PermissionCheckPage resourceLabel="WHATSAPP_GROUP_SEND" accessLabel="VIEW" menu="WHATSAPP_MARKETING_SEARCH">
    <div style={{ 'overflow-y': 'auto', height: '100%' }}>
      <IntelligentSearch title="营销搜索" inWa />
    </div>
  </PermissionCheckPage>
);

export default SearchWhatsApp;
