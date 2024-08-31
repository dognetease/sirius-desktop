import React, { useState, useEffect, useRef, useCallback } from 'react';
import { G6GraphEvent, IG6GraphEvent, TreeGraph, TreeGraphData } from '@antv/g6';
import { Select, message, Skeleton } from 'antd';
import style from './purchasechain.module.scss';
import { recData as recDataType } from '../../../customs/customs';
import { apis, api, apiHolder, EdmCustomsApi, platform } from 'api';
import { ReactComponent as MoreTipsSvg } from '@/images/globalSearch/video.svg';
import IconSvgAdd from '@/images/purchase_add.svg';
import IconSvgDel from '@/images/purchase_del.svg';
import PurchaseAddICon from '@/images/PurchaseAddIcon.svg';
import PurchaseDelICon from '@/images/PurchaseDelIcon.svg';
import { getIn18Text } from 'api';
import dictionary from '../../../components/NationalFlag/dictionary';
import { useCustomsCountryHook } from '../../docSearch/component/CountryList/customsCountryHook';
// import Cascader from '@web-common/components/UI/Cascader';
import Cascader from '@lingxi-common-component/sirius-ui/Cascader';
import { SingleValueType } from 'rc-cascader/lib/Cascader';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import G6 from '@antv/g6';
import { YearRangePicker } from './YearRangePicker';
import PurchaseChainBtn from './purchaseChainBtn';
import { Popover } from 'antd';
import { useIsForwarder } from '../../ForwarderSearch/useHooks/useIsForwarder';
import { isWindows } from '@/components/Layout/globalSearch/constants';
import { useOpenHelpCenter } from '@web-common/utils/utils';
const sysApi = api.getSystemApi();

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

const moreGuideUrl = '/d/1671030622582321154.html';

interface Props {
  tabList: any;
  recordParams: any;
  companyName: string;
  openDrawer?: (content: recDataType['content']) => void;
  country: string;
  selectCompanyList: string[];
  fetchType?: 'global' | 'customs';
  tabKey?: string;
  time: string[];
}
interface dataType {
  label?: string;
  id?: string;
  color?: string;
  children?: Array<dataType>;
  level?: number;
  direction?: 'left' | 'right';
  type?: string;
  // 是否为供应商
  isSupplie?: boolean;
  isBuyers?: boolean;
  position?: 'left' | 'right';
  purchaseType?: boolean;
}
// 供应商模版
let modalData: Array<dataType> = [
  {
    label: getIn18Text('GONGYINGSHANG'),
    children: [],
    isSupplie: true,
  },
  {
    label: getIn18Text('CAIGOUSHANG'),
    children: [],
    isBuyers: true,
  },
];

const orderMap: Array<{ label: string; value: string }> = [
  {
    label: '按采供商数量排列',
    value: 'relationCompanyCnt',
  },
  {
    label: '按交易占比排序',
    value: 'percentage',
  },
];

const edmCustomsApi = apiHolder.api.requireLogicalApi(apis.edmCustomsApiImpl) as EdmCustomsApi;
const SHOW_TIPS_KEY = 'PURCHASE_POPOVER';
const PurchaseChain: React.FC<Props> = props => {
  const ref = useRef<HTMLDivElement>(null);
  const refTool = useRef<HTMLDivElement>(null);
  const [continentList] = useCustomsCountryHook();
  const [buyerRltCountry, setBuyerRltCountry] = useState<string[]>([]);
  const [supplierRltCountry, setSupplierRltCountry] = useState<string[]>([]);
  const { tabList, recordParams, companyName, openDrawer, country, selectCompanyList, fetchType = 'customs', tabKey, time } = props;
  const [initData, setInitData] = useState<TreeGraphData>({
    label: companyName,
    id: '0',
    children: [],
    level: 0,
    type: 'dice-mind-map-root',
  });
  const graphRef = useRef<TreeGraph | null>(null);
  const [year, setYear] = useState<number[]>([new Date().getFullYear() - 3, new Date().getFullYear()]);
  const [update, setUpdate] = useState<boolean>(true);
  const [selectList, setSelectList] = useState<any[]>([]);
  const [showTips, setShowTips] = useState<boolean>(!localStorage.getItem(SHOW_TIPS_KEY));
  const [sortBy, setSortBy] = useState<string>('relationCompanyCnt');
  const [loading, setLoading] = useState<boolean>(false);
  const paramsRef = useRef(update);
  const isForwarder = useIsForwarder();
  const openHelpCenter = useOpenHelpCenter();

  useEffect(() => {
    if (tabList.buy && tabList.supplie) {
      const res: any = handlePurchaseData(tabList.buy, tabList.supplie, initData.id, initData.level);
      if (graphRef.current) {
        graphRef.current.destroy();
      }
      setInitData({
        label: companyName,
        id: '0',
        children: res,
        level: 0,
        type: 'dice-mind-map-root',
      });
    }
  }, [tabList]);

  useEffect(() => {
    if (initData.children && initData.children.length > 0 && ref.current) {
      setLoading(false);
      init(initData);
    } else {
      setLoading(true);
    }
  }, [initData]);

  useEffect(() => {
    paramsRef.current = update;
  }, [update]);

  useEffect(() => {
    if (tabKey !== 'purchaseChain') {
      graphRef.current && graphRef.current.destroy();
    }
  }, [tabKey]);

  useEffect(() => {
    if (graphRef.current) {
      handleChangeDate([2021, 2022]);
    }
  }, [time]);

  // 初始化
  const init = async (data: any) => {
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
        fitView: true,
        plugins: [toolbar],
        fitViewPadding: [10, 20],
        layout: {
          type: 'mindmap',
          direction: 'H',
          getHeight: (node: any) => {
            switch (node.type) {
              case 'dice-mind-map-root':
                return 44;
              case 'dice-mind-map-sub':
                return 44;
              default:
                return 60;
            }
          },
          getWidth: (node: any) => {
            // console.log(node.level);
            switch (node.type) {
              case 'dice-mind-map-root':
                return 160;
              case 'dice-mind-map-sub':
                return 68;
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
          type: 'round-poly-right',
          style: {
            lineWidth: 2,
            // radius: 4,
            lineJoin: 'round',
          },
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
      // 确定每个结点对于的自定义线条的类型 根据及节点信息来判断
      initTree.edge(edge => {
        if (!edge.id) {
          return {};
        }
        const sourceModel = initTree.findDataById(edge.id.slice(0, edge.id.indexOf(':')));
        const targeModel = initTree.findDataById(edge.id.slice(edge.id.indexOf(':') + 1));
        if (sourceModel && targeModel) {
          // 最特殊的是中心点两个结点。需要单独判断
          if (sourceModel.id === '0' && (targeModel.id === '0-1' || targeModel.id === '0-2')) {
            return {
              id: edge.id,
              type: 'round-poly',
            };
          } else if (sourceModel.type === 'dice-mind-map-sub' && sourceModel.position === 'left') {
            // 对于左侧供应采购商线段
            return {
              id: edge.id,
              type: 'round-poly',
            };
          } else if (sourceModel.type === 'dice-mind-map-leaf' && sourceModel.position === 'left') {
            // 左侧普通节点线段
            return {
              id: edge.id,
              type: 'round-poly-left',
            };
          } else if (sourceModel.type === 'dice-mind-map-sub' && sourceModel.position === 'right') {
            // 右侧供应采购节点线段
            return {
              id: edge.id,
              type: 'round-poly',
            };
          } else if (sourceModel.type === 'dice-mind-map-leaf' && sourceModel.position === 'right') {
            // 右侧普通节点线段
            return {
              id: edge.id,
              type: 'round-poly-right',
            };
          } else {
            return {
              id: edge.id,
              type: 'round-poly',
            };
          }
        }
        return {};
      });
      initTree.data(data);
      initTree.render();
      initTree.on('collapsed-icon:click', e => {
        if (paramsRef.current) {
          handleCollapse(e);
        } else {
          message.warning('数据加载中，请稍后');
        }
      });
      initTree.on('label-shape-rect:click', e => {
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
  // hover时间处理
  const handleNodeHover = (ev: IG6GraphEvent, color: string) => {
    const { item } = ev;
    const group = item?.getContainer();
    const model = item?.getModel();
    if (group && model && model.type === 'dice-mind-map-leaf') {
      const child = group.find((e: any) => {
        return e.get('name') === 'label-shape-rect';
      });
      child.attr({
        fill: color,
      });
    }
  };
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
        const res = await featchPurchase(nodeModel, year, [], sortBy);
        // 处理数据
        graphRef.current?.setItemState(item, 'collapse', !!nodeModel.collapsed);
        graphRef.current?.updateItem(item, {
          label: '',
          children: handlePurchaseData(res.buyers, res.supplie, nodeModel.id, nodeModel.level, nodeModel.position),
        });
        graphRef.current?.layout();
      } else {
        nodeModel.collapsed = !nodeModel.collapsed;
        graphRef.current?.layout();
        graphRef.current?.setItemState(item, 'collapse', !!nodeModel.collapsed);
      }
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
    if (item && nodeModel && nodeModel.type === 'dice-mind-map-leaf') {
      openDrawer?.({
        to: nodeModel.purchaseType ? 'buysers' : 'supplier',
        companyName: nodeModel.companyName as string,
        country: nodeModel.country as string,
        originCompanyName: recordParams.originCompanyName,
      });
    }
  };
  const featchGlobalPurchaseBuyers = async (node: any, year?: number[], paramCountry?: string[], sRltCountry?: string[], sort?: string) => {
    const { from, relationCountryList } = recordParams;
    const res = await edmCustomsApi.getBuyersCompanyList({
      size: 10,
      companyList: node.companyList?.length ? node.companyList : [{ companyName: node.companyName, country: node.country }],
      groupByCountry: true,
      from: from - 1,
      sortBy: sort,
      order: 'desc',
      conCountryList: paramCountry || (buyerRltCountry.length > 0 ? buyerRltCountry : relationCountryList),
      relationCountry: paramCountry || (buyerRltCountry.length > 0 ? buyerRltCountry : relationCountryList),
      shpCountryList: sRltCountry || (supplierRltCountry.length > 0 ? supplierRltCountry : relationCountryList),
      startYear: '',
      endYear: '',
      beginDate: time[0],
      endDate: time[1],
      sourceType: fetchType,
    });
    return res.companies;
  };
  const featchGlobalPurchaseSupplier = async (node: any, year?: number[], paramCountry?: string[], bRltCountry?: string[], sort?: string) => {
    const { from, relationCountryList } = recordParams;
    const res = await edmCustomsApi.getSuppliersCompanyList({
      size: 10,
      companyList: node.companyList?.length ? node.companyList : [{ companyName: node.companyName, country: node.country }],
      groupByCountry: true,
      from: from - 1,
      sortBy: sort,
      order: 'desc',
      shpCountryList: paramCountry || (supplierRltCountry.length > 0 ? supplierRltCountry : relationCountryList),
      relationCountry: paramCountry || (supplierRltCountry.length > 0 ? supplierRltCountry : relationCountryList),
      conCountryList: bRltCountry || (buyerRltCountry.length > 0 ? buyerRltCountry : relationCountryList),
      startYear: '',
      endYear: '',
      beginDate: time[0],
      endDate: time[1],
      sourceType: fetchType,
    });
    return res.companies;
  };
  // 接口获取数据
  const featchPurchase = async (node: any, year?: number[], rltCountrys: Array<string[] | undefined> = [], sortBy: string = 'relationCompanyCnt') => {
    const [bRltCountry, sRltCountry] = rltCountrys;
    const [buyers, supplie] = await Promise.all([
      featchGlobalPurchaseBuyers(node, year, bRltCountry, sRltCountry, sortBy),
      featchGlobalPurchaseSupplier(node, year, sRltCountry, bRltCountry, sortBy),
    ]).finally(() => {
      setUpdate(true);
    });
    return {
      buyers,
      supplie,
    };
  };
  // 注册节点/边
  const registerFn = async () => {
    G6.registerNode(
      'dice-mind-map-root',
      {
        jsx: cfg => {
          const width = 160;
          const stroke = '#4C6AFF';
          return `
          <group>
            <rect draggable="true" style={{width: ${width}, height: 44,  shadowColor: 'rgba(47, 83, 134, 0.12)', shadowBlur: 10, shadowOffsetX: 0,  shadowOffsetY: 4, stroke: ${stroke}, radius: 4, fill: '#4C6AFF'}} >
              <text style={{ fontSize: 16, marginLeft: 12, marginTop: 13, fill: '#fff' }}>${
                (typeof cfg?.label === 'string' ? cfg?.label : '')?.slice(0, 12) + '...'
              }</text>
            </rect>
          </group>
        `;
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
      'dice-mind-map-sub',
      {
        draw(cfg, group) {
          const size = [68, 44];
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
            name: 'level1node-keyshape',
          });
          group!.addShape('text', {
            attrs: {
              text: `${cfg!.label}`,
              fill: '#272E47',
              x: size[0] / 2,
              y: size[1] / 2 + 5,
              fontSize: 12,
              lineHeight: 20,
              textAlign: 'center',
              fontWeight: 500,
            },
            draggable: true,
            name: 'label-shape',
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
    //
    G6.registerNode(
      'dice-mind-map-leaf',
      {
        draw(cfg, group) {
          const size = [160, 60];
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
          const countryFlagImageSrc = nationComponentMap[cfg!.country as string] || { label: '', component: null };
          if (countryFlagImageSrc.component) {
            group?.addShape('image', {
              attrs: {
                x: 134,
                y: isForwarder && cfg!.chineseCompanyId && cfg!.companyCnName ? 5 : 14,
                width: 18,
                height: 12,
                img: countryFlagImageSrc.component,
              },
              name: 'image-shape',
            });
          }
          if (isForwarder && cfg!.chineseCompanyId && cfg!.companyCnName) {
            group!.addShape('text', {
              attrs: {
                text: `${(cfg!.companyCnName as string).slice(0, 12) + '...'}`,
                fill: '#747A8C',
                x: 16,
                y: 35,
                fontSize: 10,
                textAlign: 'left',
              },
              draggable: true,
              name: 'label-shape-radio',
            });
          }
          group!.addShape('text', {
            attrs: {
              text: `交易额占比 ${cfg!.percentage}`,
              fill: '#747A8C',
              x: 16,
              y: isForwarder && cfg!.chineseCompanyId && cfg!.companyCnName ? 52 : 45,
              fontSize: 10,
              textAlign: 'left',
            },
            draggable: true,
            name: 'label-shape-radio',
          });
          if (((cfg!.id as string) || '').length < 11) {
            group!.addShape('image', {
              attrs: {
                width: 16,
                height: 16,
                img: PurchaseAddICon,
                x: cfg!.position === 'left' ? -20 : 164,
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
              if (id && value) {
                setSelectList(prv => {
                  return [...prv, graphRef.current?.findById(id)?.getModel()];
                });
              } else if (id && !value) {
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
              if (dom && value) {
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
    // 右侧线段
    G6.registerEdge('round-poly-right', {
      draw(cfg, group) {
        const startPoint = cfg!.startPoint;
        const endPoint = cfg!.endPoint;
        const shape = group!.addShape('path', {
          attrs: {
            stroke: '#E1E3E8',
            path: [
              ['M', startPoint!.x + 20, startPoint!.y],
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
    // 普通线
    G6.registerEdge('round-poly', {
      draw(cfg, group) {
        const startPoint = cfg!.startPoint;
        const endPoint = cfg!.endPoint;
        const shape = group!.addShape('path', {
          attrs: {
            stroke: '#E1E3E8',
            path: [
              ['M', startPoint!.x, startPoint!.y],
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
    // 左边线段
    G6.registerEdge('round-poly-left', {
      draw(cfg, group) {
        const startPoint = cfg!.startPoint;
        const endPoint = cfg!.endPoint;
        const shape = group!.addShape('path', {
          attrs: {
            stroke: '#E1E3E8',
            path: [
              ['M', startPoint!.x - 20, startPoint!.y],
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
  // 处理传入的数据
  const handlePurchaseData = (buyers: any, supplie: any, dataId: any, dataLevel: any, position?: any) => {
    modalData = [
      {
        label: getIn18Text('GONGYINGSHANG'),
        children: [],
        isSupplie: true,
      },
      {
        label: getIn18Text('CAIGOUSHANG'),
        children: [],
        isBuyers: true,
      },
    ];
    return joinPurchase(dataId, dataLevel, buyers, supplie, position ? position : '');
  };
  const joinPurchase = (dataId: any, dataLevel: any, buyers: any, supplie: any, position?: any) => {
    let res: any[] = [];
    modalData.forEach((item, index) => {
      item.id = dataId + '-' + (index + 1);
      item.level = dataLevel + 1;
      item.type = 'dice-mind-map-sub';
      if (item.level === 1 && !item.direction) {
        item.direction = item.isBuyers ? 'left' : 'right';
        item.position = item.isBuyers ? 'left' : 'right';
      }
      if (position) {
        item.position = position;
      }
      if (item.isBuyers) {
        item.purchaseType = true;
        handelBuyers(item, buyers, 'buy', item.position);
      } else {
        item.purchaseType = false;
        handelBuyers(item, supplie, 'supplie', item.position);
      }
      // return
      res.push(item);
    });
    return res;
  };
  const handelBuyers = (data: any, buyers: any, type: string, position: any) => {
    buyers.forEach((item: any, index: any) => {
      item.id = data.id + '-' + (index + 1);
      item.level = data.level + 1;
      item.children = [];
      item.label = item.companyName;
      item.purchaseType = type === 'buy' ? true : false;
      item.position = position;
      item.type = 'dice-mind-map-leaf';
      data.children.push(item);
    });
  };
  // 处理线段
  const handleDraw = (cfg: any, group: any) => {
    const sourceNode = cfg.sourceNode!.getModel();
    const targetNode = cfg.targetNode!.getModel();
    const keyShape = group.get('children')[0];
    let color = 'red';
    if (targetNode.purchaseType) {
      color = '#FE5B4C';
    } else {
      color = '#4C6AFF';
    }
    keyShape.attr({
      stroke: color,
      // lineWidth: 3 // branchThick
    });
    group.toBack();
  };
  const handleCountryChange = async (values: SingleValueType[], tp: 'buyer' | 'supplier') => {
    const allList: string[] = [];
    values.forEach(val => {
      const [_, cou] = val || [];
      if (cou) {
        allList.push(cou as string);
      }
    });
    const nextCountry = Array.from(new Set(allList));
    if (tp === 'buyer') {
      setBuyerRltCountry(nextCountry);
    } else {
      setSupplierRltCountry(nextCountry);
    }
    const result = await featchPurchase(
      {
        companyName,
        country,
        // 全球搜在筛选国家和时间时需要带上全部合并公司companyList
        companyList: recordParams.companyList,
      },
      year,
      tp === 'buyer' ? [nextCountry] : [undefined, nextCountry],
      sortBy
    );
    const res = handlePurchaseData(result.buyers, result.supplie, initData.id, initData.level);
    graphRef.current?.destroy();
    setInitData({
      label: companyName,
      id: '0',
      children: res,
      level: 0,
      type: 'dice-mind-map-root',
    });
  };
  // 时间处理
  const handleChangeDate = async (year: number[]) => {
    const result: any = await featchPurchase(
      {
        companyName,
        country,
        // 全球搜在筛选国家和时间时需要带上全部合并公司companyList
        companyList: recordParams.companyList,
      },
      year,
      [],
      sortBy
    );
    const res: any = handlePurchaseData(result.buyers, result.supplie, initData.id, initData.level);
    graphRef.current?.destroy();
    setInitData({
      label: companyName,
      id: '0',
      children: res,
      level: 0,
      type: 'dice-mind-map-root',
    });
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
  const closeSearchTips = useCallback(() => {
    if (!showTips) return;
    setShowTips(false);
    localStorage.setItem(SHOW_TIPS_KEY, '1');
  }, [showTips]);
  const handleSortChange = useCallback(
    async (vl: string) => {
      setSortBy(vl);
      const result: any = await featchPurchase(
        {
          companyName,
          country,
          // 全球搜在筛选国家和时间时需要带上全部合并公司companyList
          companyList: recordParams.companyList,
        },
        year,
        [],
        vl
      );
      const res: any = handlePurchaseData(result.buyers, result.supplie, initData.id, initData.level);
      graphRef.current?.destroy();
      setInitData({
        label: companyName,
        id: '0',
        children: res,
        level: 0,
        type: 'dice-mind-map-root',
      });
    },
    [sortBy, companyName, country, recordParams.companyList, initData]
  );
  const onKnowledgeCenterClick = (e: MouseEvent) => {
    openHelpCenter(moreGuideUrl);
    e.preventDefault();
  };

  return (
    <>
      <div className={style.purchasePart} style={{ padding: fetchType === 'global' ? '0' : '20px' }}>
        <div className={style.header}>
          <div className={style.datePick}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', columnGap: '24px' }}>
              {['buyer', 'supplier'].map(tp => (
                <div className={style.purchaseItem}>
                  <span className={style.label}>{tp === 'buyer' ? '采购商' : '供应商'}</span>
                  <Cascader
                    key={tp}
                    style={{ borderRadius: '4px' }}
                    placeholder={tp === 'buyer' ? '请输入采购商国家' : '请输入供应商国家'}
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
              <EnhanceSelect
                style={{ borderRadius: '4px', width: '20%' }}
                className={style.purchaseItem}
                maxTagCount="responsive"
                onChange={vl => {
                  handleSortChange(vl);
                }}
                value={sortBy}
              >
                {orderMap.map(lo => (
                  <InSingleOption key={lo.value} label={lo.label} value={lo.value}>
                    {lo.label}
                  </InSingleOption>
                ))}
              </EnhanceSelect>
            </div>
          </div>
        </div>
        <div className={style.purchaseIntro}>
          <Popover
            visible={showTips}
            placement="topLeft"
            overlayClassName={style.productSearchTips}
            getPopupContainer={trigger => trigger}
            content={
              <>
                <div className={style.popContent}>
                  新增多选采供链公司【录入线索】【订阅公司】，快去试试吧
                  <span className={style.popClose} onClick={closeSearchTips}>
                    知道了
                  </span>
                </div>
              </>
            }
          >
            <div className={style.textIntro}>多选公司：【{isWindows ? 'Alt' : 'Option'}+公司】或【Shift+框选公司】</div>
          </Popover>
          <a href={moreGuideUrl} target="_blank" className={style.showTipsWrapper} rel="noreferrer" onClick={onKnowledgeCenterClick}>
            <MoreTipsSvg />
            <span className={style.searchTipsText}>了解更多</span>
          </a>
        </div>
        <div style={{ height: `${document.body.clientHeight - 300}px` }}>
          <div hidden={loading} ref={ref} style={{ height: 'calc(100% - 16px)', background: '#fff' }}></div>
          <div hidden={loading} className={style.toolBar} ref={refTool}></div>
          <Skeleton active loading={loading} paragraph={{ rows: 4 }}></Skeleton>
        </div>
        {/* <div >
          <SearchLoading height={document.body.clientHeight - 247}/>
        </div> */}
        {/* <button onClick={() => toggle()}>Toggle</button> */}
        {selectList.length > 0 && (
          <PurchaseChainBtn
            list={selectList}
            onCompleted={() => {
              handleComplete();
            }}
          />
        )}
      </div>
    </>
  );
};

export default PurchaseChain;
