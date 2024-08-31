export enum L2cCrmPageType {
  /**客户和业务 老菜单 */
  customerAndBusiness = 'customerAndBusiness',
  /**客户管理 */
  customerManagement = 'customerManagement',
  /**客户履约 */
  customerPerformance = 'customerPerformance',
}
export interface L2cCrmSidebarMenuExtra {
  [L2cCrmPageType.customerAndBusiness]: {
    defaultPath: string;
  };
  [L2cCrmPageType.customerManagement]: {
    defaultPath: string;
  };
  [L2cCrmPageType.customerPerformance]: {
    defaultPath: string;
  };
}

export const L2cCrmPageTypeSet = new Set<L2cCrmPageType>([L2cCrmPageType.customerAndBusiness, L2cCrmPageType.customerManagement, L2cCrmPageType.customerPerformance]);
