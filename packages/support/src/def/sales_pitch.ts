// 话术库
// https://lingxi.office.163.com/doc/#id=19000006142241&from=PERSONAL&parentResourceId=19000000030650&spaceId=504677562&ref=515262669
const PREFIX = '/sirius/discourse-template/api/biz/discourse';

export default {
  getSalesPitchList: `${PREFIX}/list`, // 获取话术列表
  deleteSalesPitch: `${PREFIX}/remove`, //  删除话术
  sortSalesPitchList: `${PREFIX}/order`, // 给特定阶段的话术进行排序
  editSalesPitch: `${PREFIX}/update-all`, // 话术编辑（包含话术内容、场景、类型、阶段的修改），修改话术类型时 ID 会发生变化
  updateSalesPitch: `${PREFIX}/update`, // 话术内容、场景修改
  changeSalesPitchType: `${PREFIX}/update-type`, // 修改话术的类型（仅管理员有操作权限），ID 会发生变化
  changeSalesPitchStage: `${PREFIX}/update-stage`, //  修改话术的阶段
  addSalesPitch: `${PREFIX}/add`, // 添加话术
  searchSalesPitch: `${PREFIX}/search`, // 搜索话术
  getSalesConfig: `${PREFIX}/config`, // 获取是否展示企业话术的配置
  setSalesConfig: `${PREFIX}/update-config`, // 获取是否展示企业你话术的配置
};
