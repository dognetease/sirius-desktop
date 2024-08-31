import { useState, useEffect, useRef } from 'react';
import { apiHolder, apis, CustomerApi, conf } from 'api';
const clientApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const httpApi = apiHolder.api.getDataTransApi();

export default () => {
  const formatNumber = (number: number) => {
    if (number <= 9) {
      return `0${number}`;
    }
    return number;
  };
  const getDate = () => {
    let newDate = new Date();
    let year = newDate.getFullYear();
    let month = newDate.getMonth() + 1;
    let day = newDate.getDate();
    return `${year}${formatNumber(month)}${formatNumber(day)}`;
  };
  // 下载table表格数据
  const downLoadTableExcel = async (url: string, name: string, data: any) => {
    httpApi
      .post(`${url}`, data || {}, {
        responseType: 'blob',
        contentType: 'json',
      })
      .then(res => {
        const blob = res.rawData;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${getDate()}_${name}.xlsx`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  // 客户和线索下载模板
  const downloadTemplate = async (url: string, name: string) => {
    httpApi
      .get(
        `${url}`,
        {},
        {
          responseType: 'blob',
        }
      )
      .then(res => {
        const blob = res.rawData;
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); // 将流文件写入a标签的href属性值
        a.download = `${name}.xlsx`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };
  return {
    downLoadTableExcel,
    downloadTemplate,
  };
};
