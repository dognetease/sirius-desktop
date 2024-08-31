import React from 'react';
import ICompDoc, { CompDocProps } from './compDoc';
import Describe, { DescribeProps } from './describe';
import RenderCode, { RenderCodeProps } from './renderCode';
import RenderTypeTable, { RenderTypeTableProps } from './renderTypeTable';
import Link, { RenderTypeLinkProps } from './link';
import Use, { UseProps } from './use';

export type IBreadcrumbComponent = React.FC<CompDocProps> & {
  Describe: React.FC<DescribeProps>;
  RenderCode: React.FC<RenderCodeProps>;
  RenderTypeTable: React.FC<RenderTypeTableProps>;
  Link: React.FC<RenderTypeLinkProps>;
  Use: React.FC<UseProps>;
};

const CompDoc = ICompDoc as IBreadcrumbComponent;
CompDoc.Describe = Describe;
CompDoc.RenderCode = RenderCode;
CompDoc.RenderTypeTable = RenderTypeTable;
CompDoc.Link = Link;
CompDoc.Use = Use;

export default CompDoc;
