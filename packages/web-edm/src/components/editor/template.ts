import { inWindow } from 'api';
import { config as envDefConfig } from 'env_def';

export enum CURRENCY_MAP {
  'CNY人民币' = '￥',
  'USD美金' = '$',
  'USD美元' = '$', // 商机列表的对应符号返回的是USD美金，兼容一下
  'AUD澳元' = '$',
  'CAD加元' = 'C$',
  'EUR欧元' = '€',
  'KRW韩元' = '₩',
  'GBP英镑' = '£',
  'CHF瑞士法郎' = 'CHF',
  'HKD港币' = 'HK$',
  'IDR印尼卢比' = 'Rs',
  'INR印度卢比' = '₹',
  'JPY日元' = '¥',
  'MYR马来西亚林吉特' = 'RM',
  'MYR玛拉西亚林吉特' = 'RM',
  'NZD新西兰元' = 'NZ$',
  'PHP菲律宾比索' = '₱',
  'RUB俄罗斯卢布' = '₽',
  'SGD新加坡元' = 'S$',
  'THB泰铢' = '฿',
  'TWD新台币' = 'NT$',
}

/**
 * 获取跳转商品详情所用的path
 * @param id
 * @returns
 */
const getUrl = (id: string) => {
  return envDefConfig('stage') === 'prod' ? `https://site.office.163.com/product/${id}.html` : `https://sirius-it-site.cowork.netease.com/product/${id}.html`;
};

/**
 * 提取html字符串中的文本
 * @param content html字符串
 */
export const getTextContent = (content: string) => {
  if (inWindow() && typeof content == 'string') {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.textContent as string;
  }
  return content ?? '';
};

/**
 * 营销和普通邮件插入商品信息公共方法
 * 向编辑器内插入商品信息
 * 普通邮件的跳转地址通过接口请求设置为 productLink，营销邮件跳转地址通过 getUrl 获取
 * @param tab  0 图文样式，1 表格样式
 * @param lists 所选择的商品列表
 * @param columns 展示字段
 * @param fieldsMap
 * @param siteId 商品详情页所属站点的 siteId
 */
export const getProductsHtml = (
  tab: number,
  lists: {
    productLink: string;
    product_name_en: string;
    id: string;
    pictures?: Array<{ url: string }>;
    price_currency: any;
    price: string;
    priceRange: string;
  }[],
  columns: string[],
  fieldsMap: any,
  imgSize: number,
  siteId?: string
) => {
  let subHtml = '';

  if (tab === 0) {
    // 图文样式
    let column = 5;
    if (imgSize == 150) {
      column = 4;
    } else if (imgSize == 200) {
      column = 3;
    }
    const l = lists.length;
    while (l % column > 0 && l % column <= column / 2) {
      column--;
    }

    const render = (item: any, index: number) => {
      const columnKey = columns[index];
      if (!columnKey) {
        return '';
      }
      let text = item[columnKey];
      // 富文本字段转换为纯文本
      if (columnKey == 'product_description_en') {
        text = getTextContent(text);
      } else if (columnKey === 'price') {
        text = item['priceRange'] || text; // 优先展示价格区间
        if (text) {
          const currency: keyof typeof CURRENCY_MAP = item['price_currency'];
          const currencyIcon = currency ? CURRENCY_MAP[currency] || '$' : '$';
          text = currencyIcon + text;
        }
      }
      return ['product_name_cn', 'product_name_en'].includes(columnKey)
        ? `<a style="display:inline-block;width:100%;overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;" href="${item.productLink || getUrl(item.id)}">${text}</a>`
        : `<div style="width: 100%;overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;">${text}</div>`;
    };

    let contentHtml = '';
    lists.forEach(item => {
      const column1 = columns[0] ? `<div style="font-size: 14px; line-height: 22px; height: 22px;">${render(item, 0)}</div>` : '';
      const column2 = columns[1] ? `<div style="font-size: 14px; line-height: 22px; height: 22px;">${render(item, 1)}</div>` : '';
      const column3 = columns[2] ? `<div style="font-weight: 500; font-size: 14px; line-height: 28px;">${render(item, 2)}</div>` : '';
      const column4 = columns[3] ? `<div style="font-size: 12px; line-height: 16px; color: #747A8C;">${render(item, 3)}</div>` : '';
      contentHtml += `<div contenteditable="false"
      style="width: ${imgSize}px; font-weight: 400; color: #232D47;">
        <a href="${item.productLink || getUrl(item.id)}"
          class="sirius-product-item"
          data-id="${item.id}"
          data-link="${item.productLink || getUrl(item.id)}"
          data-siteId="${siteId}">
          <img style="margin-bottom:8px;object-fit:cover;" width=${imgSize} height=${imgSize} src=${
        item.pictures?.[0]?.url || 'https://cowork-storage-public-cdn.lx.netease.com/common/2022/10/20/2dde2e8f437349c4a9a9597960eb9ef3.png'
      } />
      </a>
      ${column1}
      ${column2}
      ${column3}
      ${column4}
      </div>`;
    });
    subHtml = `<div style="
    overflow-y: hidden;
    display: flex;
    flex-wrap: wrap;
    padding: 20px;
    box-sizing: border-box;
    width: ${column * (imgSize + 31.5) - 31.5 + 42}px;
    border-radius: 4px;
    gap: 31.5px;
    ">${contentHtml}</div>`;
  } else {
    // 表格样式
    let theadHtml = '';
    columns.forEach((key, index) => {
      theadHtml += `<th style="width:130px; text-align:left; padding:${index === 0 ? '12px 20px 12px 24px;' : '12px 20px 12px 0'}">${fieldsMap[key].label}</th>`;
    });
    let tbodyHtml = '';

    lists.forEach(item => {
      let tdHtml = '';
      columns.forEach((key, index) => {
        const columnKey = columns[index];
        let text = item[columnKey];
        // 富文本字段转换为纯文本
        if (columnKey == 'product_description_en') {
          text = getTextContent(text);
        } else if (columnKey === 'price') {
          text = item['priceRange'] || text; // 优先展示价格区间
          if (text) {
            const currency: keyof typeof CURRENCY_MAP = item['price_currency'];
            const currencyIcon = currency ? CURRENCY_MAP[currency] || '$' : '$';
            text = currencyIcon + text;
          }
        }
        text = text ?? '-';

        const overflowStyle =
          'white-space: pre-wrap; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;';
        tdHtml += ['product_name_cn', 'product_name_en'].includes(key)
          ? `<td style="width:130px; height: 44px; padding:${index === 0 ? '12px 20px 12px 24px;' : '12px 20px 12px 0'}">
    <a href='${item.productLink || getUrl(item.id)}'
    class="sirius-product-item"
    data-id="${item.id}"
    data-link="${item.productLink || getUrl(item.id)}"
    data-siteId="${siteId}"
    style="${overflowStyle}">${text}</a></td>`
          : `<td style="width:130px; height:44px; padding:${index === 0 ? '12px 20px 12px 24px;' : '12px 20px 12px 0'}">
     <span style="${overflowStyle}">${text}</span></td>`;
      });
      tbodyHtml += `<tr style="border-bottom: solid 1px #f0f3f5; line-height: 22px;">${tdHtml}</tr>`;
    });

    subHtml = `<table style="border-collapse:collapse; table-layout:fixed; font-size:14px; width:${columns.length * 130 + 48}px;">
  <thead style="background: #F9FAFB; line-height:22px; color:#747A8C;">
    <tr>${theadHtml}</tr>
  </thead>
  <tbody style="color: #272E47;">${tbodyHtml}</tbody>
</table>`;
  }

  subHtml = subHtml.replace(/\r\n/g, '');
  return `<div class="sirius-product-table">${subHtml}</div><br />`;
};
