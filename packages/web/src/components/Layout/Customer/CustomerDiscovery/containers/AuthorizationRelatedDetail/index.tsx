import React from 'react';
import { CustomerAuthDataType } from 'api';
import { CustomerDetail } from '../CustomerDetail';
import CompanyIdDetail from '../../../NewClient/components/CustomerDetail/customerDetail';
import OpportunityDetail from '../../../Business/components/OpportunityDetail/opportunityDetail';
import ClueDetail from '../../../Clue/components/ClueDetail/clueDetail';
import SeaClueDetail from '../../../SeaClue/components/SeaClueDetail/seaClueDetail';

interface Props {
  relationId: string;
  relationType: string;
  onClose: () => void;
}

export const AuthorizationRelatedDetail: React.FC<Props> = props => {
  const { relationId, relationType, children, onClose } = props;

  if (!relationId) {
    return null;
  }

  if (relationType === CustomerAuthDataType.RegularCustomer) {
    // 老客详情
    return (
      <CustomerDetail id={relationId} visible={Boolean(true)} onClose={onClose} showOperation={false}>
        {children}
      </CustomerDetail>
    );
  }

  if (relationType === CustomerAuthDataType.Company) {
    // 客户详情
    return (
      <CompanyIdDetail
        visible={Boolean(true)}
        companyId={relationId}
        onClose={onClose}
        prevDisabled={Boolean(true)}
        nextDisabled={Boolean(true)}
        onPrev={() => {}}
        onNext={() => {}}
      >
        {children}
      </CompanyIdDetail>
    );
  }

  if (relationType === CustomerAuthDataType.Opportunity) {
    // 商机
    return (
      <OpportunityDetail
        visible={Boolean(true)}
        opportunityId={relationId}
        onClose={onClose}
        prevDisabled={Boolean(true)}
        nextDisabled={Boolean(true)}
        onPrev={() => {}}
        onNext={() => {}}
      >
        {children}
      </OpportunityDetail>
    );
  }

  if (relationType === CustomerAuthDataType.Clue) {
    // 线索
    return (
      <ClueDetail
        visible={Boolean(true)}
        clueId={relationId}
        onClose={onClose}
        prevDisabled={Boolean(true)}
        nextDisabled={Boolean(true)}
        onPrev={() => {}}
        onNext={() => {}}
      >
        {children}
      </ClueDetail>
    );
  }

  if (relationType === CustomerAuthDataType.OpenSea) {
    // 公海
    return (
      <SeaClueDetail
        visible={Boolean(true)}
        openSeaId={relationId}
        onClose={onClose}
        prevDisabled={Boolean(true)}
        nextDisabled={Boolean(true)}
        onPrev={() => {}}
        onNext={() => {}}
      >
        {children}
      </SeaClueDetail>
    );
  }

  return null;
};
