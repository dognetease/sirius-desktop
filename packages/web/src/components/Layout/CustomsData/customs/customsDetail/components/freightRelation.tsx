import React, { useState, useEffect, useRef, useCallback } from 'react';
import style from './purchasechain.module.scss';
import classNames from 'classnames';
import Cascader from '@web-common/components/UI/Cascader';
import { useMemoizedFn } from 'ahooks';
import { SingleValueType } from 'rc-cascader/lib/Cascader';
import { useCustomsCountryHook } from '../../docSearch/component/CountryList/customsCountryHook';
import { YearRangePicker } from './YearRangePicker';
import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import dictionary from '../../../components/NationalFlag/dictionary';
import G6, { TreeGraphData, TreeGraph, Graph, IG6GraphEvent } from '@antv/g6';
import PurchaseAddICon from '@/images/PurchaseAddIcon.svg';
import PurchaseDelICon from '@/images/PurchaseDelIcon.svg';
import { useIsForwarder } from '../../ForwarderSearch/useHooks/useIsForwarder';
import { edmCustomsApi } from '@/components/Layout/globalSearch/constants';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { FreightRelationRes } from 'api';
import IconSvgAdd from '@/images/purchase_add.svg';
import IconSvgDel from '@/images/purchase_del.svg';
import PurchaseChainBtn from './purchaseChainBtn';
import { recData as recDataType } from '../../customs';
import EmptyResult from '@/components/Layout/globalSearch/search/EmptyResult/EmptyResult';
import { isWindows } from '@/components/Layout/globalSearch/constants';
interface Prop {
  companyName: string;
  country?: string;
  detailType: string;
  fetchType?: 'global' | 'customs';
  selectCompanyList: string[];
  tabKey?: string;
  openDrawer?: (content: recDataType['content']) => void;
  time: string[];
}

interface SortDataProp {
  count: number;
  id: string;
  level: number;
  size: number;
  position: string;
  country: string;
  type: string;
  label: string;
  transportCountry?: string;
}

interface TransportProp {
  companyCount: number;
  country: string;
  isSuppliers?: boolean;
  isBuyers?: boolean;
  label?: string;
  transportCountry?: string;
}

interface ReqProp {
  time: string[];
  from?: number;
  sortBy: string;
  recordType?: string;
  transportCountry?: string;
  conCountryList?: string[];
  shpCountryList?: string[];
  companyList?: Array<{
    companyName: string;
    country: string;
  }>;
}

interface HdTpProp {
  mergeData: TransportProp[];
  id: string;
  level: number;
  position?: string;
}

interface HdCompanyProp {
  data: FreightRelationRes;
  id?: string;
  level?: any;
  position?: any;
  direction?: string;
  hasCollapse?: boolean;
  roleType?: string;
  isPeers?: boolean;
}

type NationMap = {
  [n: string]: {
    component: string;
    label: string;
  };
};
const nationComponentMap: NationMap = {};
for (const item of dictionary) {
  Object.assign(nationComponentMap, {
    [item.code]: {
      component: item.flag && require(`@/images/flags/${item.flag}`),
      label: item.label,
    },
  });
}
const FreightRelation: React.FC<Prop> = ({ fetchType = 'customs', companyName, country, detailType, selectCompanyList, tabKey, openDrawer, time }) => {
  const [continentList] = useCustomsCountryHook();
  const [sortBy, setSortBy] = useState<string>('totalTransactions');
  const ref = useRef<HTMLDivElement>(null);
  const [initData, setInitData] = useState<TreeGraphData>({
    label: companyName,
    id: '0',
    children: undefined,
    level: 0,
    type: 'dice-mind-map-root',
  });
  const isForwarder = useIsForwarder();
  const [update, setUpdate] = useState<boolean>(true);
  const [conCountryList, setConCountryList] = useState<string[]>([]);
  const [shpCountryList, setShpCountryList] = useState<string[]>([]);
  const [selectList, setSelectList] = useState<any[]>([]);
  const updateRef = useRef(update);
  const graphRef = useRef<TreeGraph | null>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    handleInitRelation({
      time: time,
      sortBy,
      conCountryList,
      shpCountryList,
    });
  }, []);
  useEffect(() => {
    if (initData && initData.children && initData.children.length > 0 && ref.current) {
      if (graphRef.current) {
        graphRef.current.destroy();
      }
      init();
    }
  }, [initData]);
  useEffect(() => {
    updateRef.current = update;
  }, [update]);
  useEffect(() => {
    if (tabKey !== 'freightRelation') {
      graphRef.current && graphRef.current.destroy();
    }
  }, [tabKey]);
  useEffect(() => {
    if (time && (graphRef.current || emptyRef.current)) {
      handleInitRelation({
        time,
        sortBy,
        conCountryList,
        shpCountryList,
      });
    }
  }, [time]);
  const handleCountryChange = useMemoizedFn((values: SingleValueType[], tp: 'buysers' | 'supplier') => {
    const allList: string[] = [];
    values.forEach(val => {
      const [_, cou] = val || [];
      if (cou) {
        allList.push(cou as string);
      }
    });
    const nextCountry = Array.from(new Set(allList));
    if (tp === 'buysers') {
      setConCountryList(nextCountry);
    } else {
      setShpCountryList(nextCountry);
    }
    handleInitRelation({
      time,
      sortBy,
      conCountryList: tp === 'buysers' ? nextCountry : conCountryList,
      shpCountryList: tp === 'supplier' ? nextCountry : shpCountryList,
    });
  });
  const handleInitRelation = useMemoizedFn((param: ReqProp) => {
    if (detailType === 'peers') {
      handleRelationReq({
        time: param.time,
        sortBy: param.sortBy,
        conCountryList: param.conCountryList ?? [],
        shpCountryList: param.shpCountryList ?? [],
      });
    } else {
      handleTransportReq({
        time: param.time,
        sortBy: param.sortBy,
        recordType: detailType === 'buysers' ? 'import' : 'export',
        conCountryList: param.conCountryList ?? [],
        shpCountryList: param.shpCountryList ?? [],
      });
    }
  });
  // 查国家接口处理函数
  const handleCountryReq = useMemoizedFn(async (param: ReqProp) => {
    const res = await edmCustomsApi.getFreightRelationCountry({
      companyList: param.companyList ?? [
        {
          country: country,
          companyName: companyName,
        },
      ],
      conCountryList: param.conCountryList,
      endYear: '',
      startYear: '',
      size: 500,
      from: 0,
      mergedCompanyNames: selectCompanyList,
      order: 'desc',
      recordType: param.recordType,
      relationCountry: [],
      shpCountryList: param.shpCountryList,
      sortBy: param.sortBy,
      transportCustomerStatCountry: undefined,
      sourceCompanyList:
        detailType === 'peers'
          ? undefined
          : [
              {
                country: country,
                companyName: companyName,
              },
            ],
      beginDate: time[0],
      endDate: time[1],
      sourceType: 'transport',
    });
    setUpdate(true);
    return res;
  });
  // 查公司接口处理函数
  const handleCompanyReq = useMemoizedFn(async (param: ReqProp) => {
    const res = await edmCustomsApi.getFreightRelationCompany({
      companyList: param.companyList ?? [
        {
          country: country,
          companyName: companyName,
        },
      ],
      conCountryList: param.conCountryList,
      endYear: '',
      startYear: '',
      size: 100,
      from: param.from,
      mergedCompanyNames: selectCompanyList,
      order: 'desc',
      recordType: param.recordType,
      relationCountry: [],
      shpCountryList: param.shpCountryList,
      sortBy: sortBy,
      transportCustomerStatCountry: param.transportCountry,
      sourceCompanyList:
        detailType === 'peers'
          ? undefined
          : [
              {
                country: country,
                companyName: companyName,
              },
            ],
      beginDate: time[0],
      endDate: time[1],
      sourceType: 'transport',
    });
    setUpdate(true);
    return res;
  });
  // 同行 进入 运输公司初始请求函数
  const handleRelationReq = useMemoizedFn(async (params: ReqProp) => {
    const [buyers, suppliers] = await Promise.all([
      handleCountryReq({
        ...params,
        recordType: 'import',
        companyList: [
          {
            companyName: companyName,
            country: country ?? '',
          },
        ],
        shpCountryList: params.shpCountryList,
        conCountryList: params.conCountryList,
      }),
      handleCountryReq({
        ...params,
        recordType: 'export',
        companyList: [
          {
            companyName: companyName,
            country: country ?? '',
          },
        ],
        shpCountryList: params.shpCountryList,
        conCountryList: params.conCountryList,
      }),
    ]);
    const mergeData = [
      ...buyers.map(item => {
        return {
          ...item,
          isBuyers: true,
          label: companyName,
          companyName: companyName,
          transportCountry: item.country,
          country: country ?? '',
        };
      }),
      ...suppliers.map(item => {
        return {
          ...item,
          isSuppliers: true,
          label: companyName,
          companyName: companyName,
          transportCountry: item.country,
          country: country ?? '',
        };
      }),
    ];
    const res = handleTransportData({
      mergeData,
      id: '0',
      level: 0,
    });
    const newData = {
      ...initData,
      children: [...res],
    };
    setInitData(newData);
  });
  // 处理top 分组函数
  const handleSortData = useCallback((param: SortDataProp) => {
    const chunks = [];
    // 翻页以及记录id
    let index = 0;
    for (let i = 0; i < (param.count > 10000 ? 10000 : param.count); i += param.size) {
      const end = i + param.size > param.count ? param.count : i + param.size;
      const title = `Top${i + 1}-${end}`;
      chunks.push({
        id: param.id + '-' + (index + 1),
        companyCount: end - i,
        children: [],
        title: title,
        label: param.label,
        from: index,
        level: param.level + 1,
        type: 'dice-mind-map-leaf',
        nodeType: 'topType',
        position: param.position,
        // topType独有
        transportCountry: param.transportCountry,
        country: param.country,
        role: param.type,
        hasCollapse: true,
      });
      index += 1;
    }
    return chunks;
  }, []);
  // 处理运输公司初始数据函数
  const handleTransportData = useMemoizedFn((param: HdTpProp) => {
    const data = param.mergeData?.map((item, index) => {
      return {
        id: param.id + '-' + (index + 1),
        children: handleSortData({
          count: item.companyCount,
          id: param.id + '-' + (index + 1),
          level: param.level + 1,
          size: 100,
          position: param.position ? param.position : item.isSuppliers ? 'left' : 'right',
          country: item.country,
          transportCountry: item.transportCountry,
          type: item.isBuyers ? 'buyers' : 'suppliers',
          label: item.label ?? '',
        }),
        // 用于companyList counry 字段 用于 海关进入的 的类型  只有 国家类型
        country: item.country,
        nodeType: 'countryType',
        // 用于transPort的国家字段
        transportCountry: item.transportCountry,
        // 根节点下的第一层决定树的方向
        direction: param.position ? param.position : item.isSuppliers ? 'left' : 'right',
        position: param.position ? param.position : item.isSuppliers ? 'left' : 'right',
        level: param.level + 1,
        num: item.companyCount,
        type: 'dice-mind-map-leaf',
        hasCollapse: true,
      };
    });
    return [...data] || [];
  });
  // 处理公司信息函数
  const handleCompanyData = useCallback((param: HdCompanyProp) => {
    const res = param.data.companies?.map((item, index) => {
      return {
        id: param.id + '-' + (index + 1),
        country: item.country,
        nodeType: 'companyType',
        label: item.companyName,
        companyName: item.companyName,
        direction: param.direction ?? undefined,
        position: param.position,
        level: param.level + 1,
        percentage: item.percentage,
        type: 'dice-mind-map-leaf',
        hasCollapse: param.hasCollapse ?? false,
        roleType: param.roleType,
      };
    });
    return res || [];
  }, []);
  //  海关进入接口函数
  const handleTransportReq = useMemoizedFn(async (param: ReqProp) => {
    const res = await edmCustomsApi
      .getTransportCompany({
        companyList: [
          {
            country: country,
            companyName: companyName,
          },
        ],
        conCountryList: param.conCountryList,
        endYear: '',
        startYear: '',
        size: 500,
        from: 0,
        mergedCompanyNames: selectCompanyList,
        order: 'desc',
        recordType: param.recordType,
        relationCountry: [],
        shpCountryList: param.shpCountryList,
        sortBy: param.sortBy,
        transportCustomerStatCountry: '',
        beginDate: time[0],
        endDate: time[1],
        sourceType: 'transport',
      })
      .finally(() => {
        setUpdate(true);
      });
    const data = handleCompanyData({
      data: res,
      id: '0',
      level: 0,
      direction: 'right',
      position: 'right',
      hasCollapse: true,
      roleType: 'peers',
    });
    const newData = {
      ...initData,
      children: [...data],
    };
    setInitData(newData);
  });

  // 点击事件处理函数
  const handleCollapse = async (e: IG6GraphEvent) => {
    const target = e.target;
    const id = target.get('modelId');
    const item = graphRef.current?.findById(id);
    const nodeModel = item?.getModel();
    if (nodeModel && item) {
      if ((!nodeModel.children || (nodeModel.children as Array<any>).length === 0) && !nodeModel.collapsed) {
        // 调取接口查询数据
        setUpdate(false);
        let res;
        let companyData;
        if (nodeModel.nodeType === 'topType') {
          res = await handleCompanyReq({
            time,
            sortBy: sortBy,
            from: nodeModel?.from as number,
            transportCountry: nodeModel?.transportCountry as string,
            recordType: detailType === 'peers' ? (nodeModel?.role === 'buyers' ? 'import' : 'export') : nodeModel?.role === 'buyers' ? 'export' : 'import',
            shpCountryList,
            conCountryList,
            // 海关 进入 则 使用上级运输公司打开
            companyList:
              detailType === 'peers'
                ? [
                    {
                      companyName: companyName,
                      country: country ?? '',
                    },
                  ]
                : [
                    {
                      companyName: (nodeModel.label as string) ?? '',
                      country: (nodeModel?.country as string) ?? '',
                    },
                  ],
          });
          companyData = handleCompanyData({
            data: res,
            id: nodeModel?.id,
            level: nodeModel?.level,
            position: nodeModel?.position,
            roleType: detailType === 'peers' ? (nodeModel?.role === 'buyers' ? 'import' : 'export') : nodeModel?.role === 'buyers' ? 'export' : 'import',
          });
        } else {
          res = await handleCountryReq({
            time,
            sortBy: sortBy,
            // 海关 进入 则 使用上级运输公司打开
            companyList:
              detailType === 'peers'
                ? [
                    {
                      companyName: companyName,
                      country: country ?? '',
                    },
                  ]
                : [
                    {
                      companyName: (nodeModel.label as string) ?? '',
                      country: (nodeModel?.country as string) ?? '',
                    },
                  ],
            // 国家点击 只会发生在 海关详情页 所以 type 不会为peers  且  海关页面 取 type 相反参数入参
            recordType: detailType === 'buysers' ? 'export' : 'import',
            conCountryList,
            shpCountryList,
          });
          companyData = handleTransportData({
            mergeData: res.map(item => {
              return {
                ...item,
                isBuyers: detailType === 'buysers' ? true : false,
                label: (nodeModel?.label as string) ?? '',
                // 此处 用于 从运输公司展开 国家  后续 从国家展开 采购供应公司 需要提供此字段
                // 此处逻辑特殊 记住一点 不管是从海关进入 还是同行进入 在查询采购供应公司时，所有的companyLis里的 country字段 均来自他的上一级运输公司 故需要保留 上一级运输公司的 国家字段
                transportCountry: item.country,
                country: detailType === 'peers' ? country ?? '' : (nodeModel?.country as string),
              };
            }),
            id: nodeModel?.id ?? '',
            level: nodeModel?.level as number,
          });
        }
        // 处理数据
        graphRef.current?.setItemState(item, 'collapse', !!nodeModel.collapsed);
        graphRef.current?.updateItem(item, {
          label: '',
          children: [...companyData],
        });
        graphRef.current?.layout();
      } else {
        nodeModel.collapsed = !nodeModel.collapsed;
        graphRef.current?.layout();
        graphRef.current?.setItemState(item, 'collapse', !!nodeModel.collapsed);
      }
    }
  };

  const init = async () => {
    if (ref.current) {
      await registerFn();
      const toolbar = new G6.ToolBar({
        className: `${style.g6Toolbarui}`,
        getContent: () => {
          return `
            <ul>
              <li code='add'>
                <img src=${IconSvgAdd}> </img>
              </li>
              <li code='del'>
                <img src=${IconSvgDel}> </img>
              </li>
            </ul>
          `;
        },
        handleClick: (code, graph) => {
          if (code === 'add') {
            toolbar.zoomOut();
          } else if (code === 'del') {
            toolbar.zoomIn();
          }
        },
      });
      const initTree = new G6.TreeGraph({
        container: ref.current,
        width: ref.current?.scrollWidth,
        height: ref.current.scrollHeight - 28,
        // fitCenter: true,
        plugins: [toolbar],
        fitView: true,
        fitViewPadding: [10, 20],
        layout: {
          type: 'mindmap',
          direction: 'H',
          getHeight: (node: any) => {
            switch (node.type) {
              case 'dice-mind-map-root':
                return 60;
              case 'dice-mind-map-leaf':
                return (
                  {
                    countryType: 76,
                    companyType: 60,
                    topType: 44,
                  }[node!.nodeType as string] || 44
                );
              default:
                return 60;
            }
          },
          getWidth: (node: any) => {
            // console.log(node.level);
            switch (node.type) {
              case 'dice-mind-map-root':
                return 160;
              case 'dice-mind-map-leaf':
                return (
                  {
                    countryType: 184,
                    companyType: 172,
                    topType: 188,
                  }[node!.nodeType as string] || 160
                );
              default:
                return 160;
            }
            // return 160/
          },
          getVGap: () => {
            // console.log(node);
            return 4;
          },
          getHGap: (node: any) => {
            return 33;
          },
          getSide: (node: any) => {
            console.log();

            return node.data.direction;
          },
        },
        defaultEdge: {
          type: 'round-poly',
        },
        minZoom: 0.5,
        modes: {
          default: [
            'drag-canvas',
            'zoom-canvas',
            {
              type: 'brush-select',
              trigger: 'shift',
              includeEdges: false,
            },
            {
              type: 'click-select',
              trigger: 'alt',
              shouldBegin: (e: any) => {
                if (e.originalEvent!.altKey) {
                  return true;
                } else {
                  return false;
                }
              },
            },
          ],
        },
      });
      graphRef.current = initTree;
      initTree.data(initData);
      initTree.render();
      initTree.on('collapsed-icon:click', e => {
        if (updateRef.current) {
          handleCollapse(e);
        } else {
          SiriusMessage.warning({
            content: '数据加载中，请稍后',
          });
        }
      });
      initTree.on('company-shape:click', e => {
        handleCompanyClick(e);
      });
      initTree.on('node:mouseenter', e => {
        handleNodeHover(e, '#4C6AFF');
      });
      initTree.on('node:mouseleave', e => {
        handleNodeHover(e, '#272E47');
      });
      initTree.on('canvas:dragstart', evt => {
        if (evt.target && typeof evt.target.setCursor === 'function') {
          evt.target.setCursor('pointer');
        }
      });
      initTree.on('canvas:dragend', evt => {
        if (evt.target && typeof evt.target.setCursor === 'function') {
          evt.target.setCursor('default');
        }
      });
    }
  };

  const handleNodeHover = (ev: IG6GraphEvent, color: string) => {
    const { item } = ev;
    const group = item?.getContainer();
    const model = item?.getModel();
    if (group && model && model.type === 'dice-mind-map-leaf') {
      const child = group.find((e: any) => {
        return e.get('name') === 'company-shape';
      });
      child.attr({
        fill: color,
      });
    }
  };

  // 点击公司处理
  const handleCompanyClick = (e: any) => {
    if (e.originalEvent.altKey) {
      return;
    }
    const target = e.target;
    const id = target.get('modelId');
    const item = graphRef.current?.findById(id);
    const nodeModel = item?.getModel();
    console.log(nodeModel, 'nodeModel');
    if (item && nodeModel && nodeModel.nodeType === 'companyType') {
      openDrawer?.({
        to:
          ({
            import: 'buysers',
            export: 'supplier',
            peers: 'peers',
          }[nodeModel!.roleType as string] as any) || 'buysers',
        companyName: nodeModel.companyName as string,
        country: nodeModel.country as string,
      });
    }
  };

  const registerFn = async () => {
    G6.registerNode(
      'dice-mind-map-root',
      {
        draw(cfg, group) {
          const size = [160, 60];
          const keyShape = group!.addShape('rect', {
            attrs: {
              width: size[0],
              height: size[1],
              fill: '#4C6AFF',
              radius: 4,
              shadowBlur: 10,
              shadowColor: 'rgba(47, 83, 134, 0.12)',
              shadowOffsetX: 0,
              shadowOffsetY: 4,
            },
            draggable: true,
          });
          group?.addShape('text', {
            attrs: {
              text: {
                peers: '运输公司',
                supplier: '供应商',
                buysers: '采购商',
              }[detailType],
              fill: '#fff',
              x: 16, // 在矩形内水平居中文本
              y: 24, // 在矩形内垂直居中文本
              fontSize: 12,
              lineHeight: 20,
            },
            draggable: true,
            name: 'type-shape',
          });
          group?.addShape('text', {
            attrs: {
              text: typeof companyName === 'string' && companyName?.length > 18 ? companyName.slice(0, 18) + '...' : companyName,
              fill: '#fff',
              x: 16, // 在矩形内水平居中文本
              y: 44, // 在矩形内垂直居中文本
              fontSize: 12,
              lineHeight: 20,
            },
            draggable: true,
            name: 'companyName-shape',
          });

          return keyShape;
        },
        getAnchorPoints() {
          return [
            [0, 0.5],
            [1, 0.5],
          ];
        },
      },
      'single-node'
    );
    G6.registerNode(
      'dice-mind-map-leaf',
      {
        draw(cfg, group) {
          const size = {
            countryType: [184, 76],
            companyType: [172, 60],
            topType: [188, 44],
          }[cfg!.nodeType as string] || [148, 44];
          const keyShape = group!.addShape('rect', {
            attrs: {
              width: size[0],
              height: size[1],
              fill: '#fff',
              stroke: '#EBEDF2',
              radius: 4,
              shadowBlur: 10,
              shadowColor: 'rgba(47, 83, 134, 0.12)',
              shadowOffsetX: 0,
              shadowOffsetY: 4,
            },
            draggable: true,
            name: 'dice-mind-map-rect',
          });
          group!.addShape('text', {
            attrs: {
              text: `${cfg?.companyName ? (cfg.companyName as string).slice(0, 12) + '...' : ''}`,
              fill: '#272E47',
              x: 16,
              y: isForwarder && cfg!.chineseCompanyId && cfg!.companyCnName ? 18 : 28,
              fontSize: 12,
              lineHeight: 20,
              textAlign: 'left',
              cursor: 'pointer',
            },
            draggable: true,
            modelId: cfg!.id,
            name: 'label-shape-rect',
          });
          const countryFlagImageSrc = nationComponentMap[cfg?.nodeType === 'countryType' ? (cfg!.transportCountry as string) : (cfg!.country as string)] || {
            label: '',
            component: null,
          };
          // 如果是国家节点
          if (cfg?.nodeType === 'countryType') {
            if (countryFlagImageSrc.component) {
              group?.addShape('image', {
                attrs: {
                  x: 16,
                  y: 16,
                  width: 18,
                  height: 12,
                  img: countryFlagImageSrc.component,
                },
                name: 'image-shape',
              });
            }
            if (countryFlagImageSrc.label) {
              group?.addShape('text', {
                attrs: {
                  text: countryFlagImageSrc.label,
                  fill: '#272E47',
                  x: countryFlagImageSrc.component ? 38 : 16,
                  y: 28,
                  fontSize: 12,
                  lineHeight: 20,
                  textAlign: 'left',
                },
                name: 'country-shape',
              });
            }
            group?.addShape('text', {
              attrs: {
                text: cfg?.num + '家公司',
                x: 16,
                y: 60,
                fontSize: 12,
                lineHeight: 20,
                textAlign: 'left',
                fill: '#080B19',
              },
              name: 'country-text-shape',
            });
          }
          if (cfg?.nodeType === 'companyType') {
            group?.addShape('text', {
              attrs: {
                text: typeof cfg?.companyName === 'string' && cfg.companyName.length > 16 ? cfg.companyName.slice(0, 16) + '...' : cfg.companyName,
                fill: '#272E47',
                x: 16,
                y: 28,
                fontSize: 12,
                lineHeight: 20,
                textAlign: 'left',
                cursor: 'pointer',
              },
              modelId: cfg!.id,
              name: 'company-shape',
            });
            group!.addShape('text', {
              attrs: {
                text: `交易额占比 ${cfg!.percentage}`,
                fill: '#272E47',
                x: 16,
                y: 45,
                fontSize: 10,
                textAlign: 'left',
              },
              draggable: true,
              name: 'label-shape-radio',
            });
            group!.addShape('text', {
              attrs: {
                text:
                  detailType !== 'peers'
                    ? {
                        import: '采购商',
                        export: '供应商',
                        peers: '运输公司',
                      }[cfg!.roleType as string] || '运输公司'
                    : cfg?.position === 'right'
                    ? '采购商'
                    : '供应商',
                fill: '#272E47',
                x:
                  detailType !== 'peers'
                    ? {
                        import: 127,
                        export: 127,
                        peers: 116,
                      }[cfg!.roleType as string] || 127
                    : 127,
                y: 45,
                fontSize: 10,
                textAlign: 'left',
              },
              draggable: true,
              name: 'label-shape-radio',
            });
            if (countryFlagImageSrc.component) {
              group?.addShape('image', {
                attrs: {
                  x: 136,
                  y: 16,
                  width: 18,
                  height: 12,
                  img: countryFlagImageSrc.component,
                },
                name: 'image-company-shape',
              });
            }
          }
          if (cfg?.nodeType === 'topType') {
            group?.addShape('text', {
              attrs: {
                text: `${cfg?.title + '：' + cfg?.companyCount}家公司`,
                fill: '#272E47',
                x: 16,
                y: 28,
                fontSize: 12,
                lineHeight: 20,
                textAlign: 'left',
              },
              name: 'top-shape',
            });
          }
          if (cfg?.hasCollapse) {
            group!.addShape('image', {
              attrs: {
                width: 16,
                height: 16,
                img: cfg?.nodeType === 'countryType' ? PurchaseDelICon : PurchaseAddICon,
                x: cfg?.position === 'left' ? -20 : cfg?.nodeType === 'countryType' ? 188 : cfg?.nodeType === 'topType' ? 192 : 176,
                y: size[1] / 2 - 8,
                cursor: 'pointer',
              },
              draggable: true,
              modelId: cfg!.id,
              name: 'collapsed-icon',
            });
          }
          return keyShape;
        },
        setState(name, value, item) {
          if (name === 'collapse') {
            if (item) {
              const group = item.getContainer();
              const collapseText = group.find(e => e.get('name') === 'collapsed-icon');
              if (collapseText) {
                if (value) {
                  collapseText.attr({
                    img: PurchaseAddICon,
                    width: 16,
                    height: 16,
                  });
                } else {
                  collapseText.attr({
                    img: PurchaseDelICon,
                    width: 17,
                    height: 16,
                  });
                }
              }
            }
          }
          if (name === 'selected') {
            if (item) {
              const group = item.getContainer();
              const dom = group.find(e => e.get('name') === 'dice-mind-map-rect');
              const id = item.getModel().id;
              const nodeType = item.getModel().nodeType;
              if (id && value && nodeType === 'companyType') {
                setSelectList(prv => {
                  return [...prv, graphRef.current?.findById(id)?.getModel()];
                });
              } else if (id && !value && nodeType === 'companyType') {
                setSelectList(prv => {
                  const hasChild = prv.some(item => item.id === id);
                  if (hasChild) {
                    prv = prv.filter(item => item.id != id);
                    return [...prv];
                  } else {
                    return [...prv];
                  }
                });
              }
              if (dom && value && nodeType === 'companyType') {
                dom.attr({
                  stroke: '#4C6AFF',
                });
              } else {
                dom.attr({
                  stroke: '#EBEDF2',
                });
              }
            }
          }
        },
        getAnchorPoints() {
          return [
            [0, 0.5],
            [1, 0.5],
          ];
        },
      },
      'single-node'
    );
    // 普通线
    G6.registerEdge('round-poly', {
      draw(cfg, group) {
        const startPoint = cfg!.startPoint;
        const endPoint = cfg!.endPoint;
        const shape = group!.addShape('path', {
          attrs: {
            stroke: '#4C6AFF',
            path: [
              [
                'M',
                cfg?.hasCollapse && cfg?.position === 'left' ? startPoint!.x - 20 : cfg?.hasCollapse && cfg?.position === 'right' ? startPoint!.x + 20 : startPoint!.x,
                startPoint!.y,
              ],
              ['L', endPoint!.x / 2 + (1 / 2) * startPoint!.x, startPoint!.y], // 三分之一处
              ['L', endPoint!.x / 2 + (1 / 2) * startPoint!.x, endPoint!.y], // 三分之二处
              ['L', endPoint!.x, endPoint!.y],
            ],
            endArrow: true,
          },
          // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          name: 'path-shape',
        });
        return shape;
      },
      afterDraw(cfg, group) {
        if (cfg && group) {
          handleDraw(cfg, group);
        }
      },
    });
  };
  // 处理线段
  const handleDraw = (cfg: any, group: any) => {
    const sourceNode = cfg.sourceNode!.getModel();
    const startPoint = cfg!.startPoint;
    const endPoint = cfg!.endPoint;
    const keyShape = group.get('children')[0];
    keyShape.attr({
      path: [
        [
          'M',
          sourceNode?.hasCollapse && sourceNode?.position === 'left'
            ? startPoint!.x - 20
            : sourceNode?.hasCollapse && sourceNode?.position === 'right'
            ? startPoint!.x + 20
            : startPoint!.x,
          startPoint!.y,
        ],
        ['L', endPoint!.x / 2 + (1 / 2) * startPoint!.x, startPoint!.y], // 三分之一处
        ['L', endPoint!.x / 2 + (1 / 2) * startPoint!.x, endPoint!.y], // 三分之二处
        ['L', endPoint!.x, endPoint!.y],
      ],
    });
    group.toBack();
  };

  const handleComplete = useCallback(() => {
    if (graphRef.current) {
      // graphRef.current?.clearItemStates(selectList.map(item => item.id));
      selectList.forEach(item => {
        graphRef.current?.clearItemStates(item.id, 'selected');
      });
      setSelectList([]);
    }
    // graphRef.current?.setItemState(item, 'collapse', !!nodeModel.collapsed);
  }, [graphRef.current, selectList]);

  return (
    <>
      <div className={style.purchasePart} style={{ padding: fetchType === 'global' ? '20px 0' : '20px' }}>
        <div className={style.header}>
          <div className={style.datePick}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', columnGap: '12px' }}>
              {['supplier', 'buysers']
                .filter(item => item !== detailType)
                .map(tp => (
                  <div className={style.purchaseItem}>
                    <span className={style.label}>{tp === 'buysers' ? '采购商' : '供应商'}</span>
                    <Cascader
                      key={tp}
                      style={{ borderRadius: '4px' }}
                      placeholder={tp === 'buysers' ? '请选择采购商国家' : '请选择供应商国家'}
                      multiple
                      showSearch
                      maxTagCount="responsive"
                      className={style.purchaseValue}
                      showCheckedStrategy="SHOW_CHILD"
                      onChange={values => {
                        handleCountryChange(values, tp as any);
                      }}
                      options={continentList.map(e => ({
                        label: e.continentCn,
                        value: e.continent,
                        children: e.countries.map(d => ({
                          label: d.nameCn,
                          value: d.name,
                        })),
                      }))}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className={style.textIntro}>多选公司：【{isWindows ? 'Alt' : 'Option'}+公司】或【Shift+框选公司】</div>
        <div style={{ height: initData.children && initData.children.length === 0 ? '200px' : `${document.body.clientHeight - 247}px` }}>
          <div hidden={initData.children && initData.children.length === 0} ref={ref} style={{ height: '100%', background: '#fff' }}></div>
          {initData.children && initData.children.length === 0 && (
            <div ref={emptyRef}>
              <EmptyResult defaultDesc={'因当地法律原因，货运信息中的运输公司名称未公开，无法查看货运关系'} />
            </div>
          )}
        </div>
        {selectList.length > 0 && (
          <PurchaseChainBtn
            list={selectList}
            tips={selectList.some(item => item.roleType === 'peers') ? '暂不支持订阅运输公司' : undefined}
            onCompleted={() => {
              handleComplete();
            }}
          />
        )}
      </div>
    </>
  );
};

export default FreightRelation;
