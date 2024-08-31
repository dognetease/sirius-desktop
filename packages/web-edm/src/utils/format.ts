import moment from 'moment';
/**
 *  判断是都为空(rd-fe)
 */
export const isEmpty = data => {
  if (typeof data === 'object') {
    let item = JSON.stringify(data);
    if (!item || item === '[]' || item === '{}') {
      return true;
    }
    return false;
  }
  return !data;
};

/**
 * form 格式化数据的特殊格式
 */
export const isSpEmpty = data => {
  if (JSON.stringify(data) === '[{}]') {
    return true;
  }
  return isEmpty(data);
};

/**
 *  处理联系人格式(rd-fe)
 */
export const fromatContact = item => {
  console.log('判断是对为空g', item.telephones, isSpEmpty(item.telephones));
  // 电话
  if (isSpEmpty(item.telephones)) {
    item.telephones = [{}];
  } else {
    item.telephones = item.telephones.map(item => {
      if (item) {
        return {
          number: item,
        };
      }
      return {};
    });
  }
  // 社交平台
  if (isEmpty(item.social_platform)) {
    item.social_platform = [{}];
  }
  // 生日必须是moment格式才可以
  if (item.birthday) {
    item.birthday = moment(item.birthday);
  }
  if (item.deal_at) {
    item.deal_at = moment(item.deal_at);
  }
  // 处理标签
  if (item.label_list && item.label_list.length) {
    item.label_list = item.label_list.map(item => item.label_name);
  }
  return item;
};
/**
 *  额外的校验规则
 */

/**
 *  return true 有错误  false 无错误
 */
export const checkLabelItem = label_list => {
  if (Array.isArray(label_list)) {
    return label_list.some(item => {
      return item.length > 10;
    });
  }
  return false;
};
export const checkOtherItems = value => {
  const { label_list, contact_list } = value;
  // 检查客户
  if (checkLabelItem(label_list)) {
    return true;
  }
  if (Array.isArray(contact_list)) {
    return contact_list.some(item => {
      return checkLabelItem(item?.label_list) === true;
    });
  }
  return false;
};

/**
 * true loading
 * false success
 */
const loadingStatus = 'uploading';

const checkPictureLoading = pictures => {
  if (pictures === loadingStatus) {
    return true;
  }
  return false;
};

export const checkPictures = value => {
  const { company_logo, pictures, contact_list } = value;
  // 检查客户
  if (checkPictureLoading(pictures)) {
    return true;
  }
  if (checkPictureLoading(company_logo)) {
    return true;
  }
  if (Array.isArray(contact_list)) {
    return contact_list.some(item => {
      if (checkPictureLoading(item.contact_icon) || checkPictureLoading(item.pictures)) {
        return true;
      }
      return false;
    });
  }
  return false;
};

const opportunityFiled = ['company_id', 'contact_id_list', 'currency', 'deal_at', 'deal_info', 'estimate', 'name', 'product', 'remark', 'source', 'stage', 'turnover'];

interface paramData {
  customer: any;
  opportunity: any;
  id: any;
}

export const clueToClientBusiness = (data, id, isBusiness) => {
  let paramData: paramData = {
    customer: {},
    opportunity: {},
    id: '',
  };
  console.log('转客户-1', data);

  for (const [key, value] of Object.entries(data)) {
    console.log(`${key}: ${value}`);
    if (opportunityFiled.includes(key)) {
      if (isBusiness) {
        paramData.opportunity[key] = value;
      }
    } else {
      paramData.customer[key] = value;
    }
  }
  if (!isBusiness) {
    paramData.opportunity = null;
  }

  const { contact_list } = paramData.customer as any;
  if (contact_list) {
    contact_list.map(item => {
      const { social_platform, telephones, birthday } = item;
      if (isSpEmpty(social_platform)) {
        delete item.social_platform;
      }
      if (isSpEmpty(telephones)) {
        delete item.telephones;
      } else {
        if (telephones && telephones.length) {
          item.telephones = telephones
            .filter(element => element)
            .map(el => {
              return el.number;
            });
        } else {
          delete item.telephones;
        }
      }
      if (birthday) {
        item.birthday = birthday.format('YYYY-MM-DD');
      }
      return item;
    });
  }
  paramData.id = id;
  return paramData;
};
