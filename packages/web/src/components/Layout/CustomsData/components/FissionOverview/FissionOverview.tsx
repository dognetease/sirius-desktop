import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import style from './index.module.scss';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import G6, { TreeGraphData, TreeGraph, Graph } from '@antv/g6';
import { GlobalSearchApi, api, apis, FessionRelation, FessionCompany } from 'api';
import dictionary from '../NationalFlag/dictionary';
import VirtualTable from '../../../../../../../web-common/src/components/UI/VirtualTable/VirtualTable';
import { getIn18Text } from 'api';
interface Props {
  fissionId: number;
  container: 'tree' | 'table';
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
const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const FissionOverview: React.FC<Props> = ({ fissionId, container }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [overviewData, setoverviewData] = useState<TreeGraphData | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const graphRef = useRef<TreeGraph | null>(null);
  const [list, setList] = useState<FessionCompany[]>([]);
  useEffect(() => {
    if (container === 'tree') {
      globalSearchApi
        .fissionOverview({
          fissionId,
        })
        .then(res => {
          // handleRelationData(res);
          handleData(res);
        });
    } else {
      graphRef.current?.destroy();
    }
  }, [container]);
  useEffect(() => {
    if (ref.current && overviewData) {
      // diagramInit(initData);
      init(overviewData);
    }
  }, [overviewData]);
  const handleData = (param: FessionRelation) => {
    // 树图需要的type 与  接口数据type重复  此处需注意
    param.levelId = param.id;
    param.id = (param.id + param.level + param.name).toString() + Math.random();
    param.children = param.childrens;
    param.fissionType = param.type;
    param.type = 'root';
    param.root = true;
    param.level = 0;
    const handleDeep = (level: number, data?: FessionRelation[], parentId?: any) => {
      data &&
        data.forEach(item => {
          item.levelId = item.id;
          item.id = (item.id + item.level + item.name).toString() + Math.random();
          item.fissionType = item?.type;
          item.rootType = param.fissionType;
          item.children = item.childrens;
          item.type = 'root';
          item.level = level;
          item.parentId = parentId;
          if (item.children && item.children.length > 0) {
            handleDeep(level + 1, item.children, item.levelId);
          }
        });
    };
    handleDeep(1, param.children, param.levelId);
    setoverviewData(param);
  };
  const init = useCallback(
    async (data: TreeGraphData) => {
      if (ref.current) {
        await registerFn();
        G6.Util.traverseTree((data: any, subtree: any) => {
          subtree.type = 'root';
        });
        const graph = new G6.TreeGraph({
          container: ref.current,
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
          defaultNode: {
            type: 'root',
          },
          defaultEdge: {
            type: 'polyline',
            style: {
              radius: 5,
              endArrow: true,
              lineWidth: 1,
              stroke: '#4C6AFF',
              lineDash: [3],
            },
          },
          // minZoom: 0.5,
          layout: {
            type: 'compactBox',
            direction: 'LR',
            getVGap: () => {
              // console.log(node);
              return 40;
            },
            getHGap: (node: any) => {
              return 100;
            },
          },
          modes: {
            default: ['drag-canvas', 'zoom-canvas'],
          },
          fitView: true,
        });
        graphRef.current = graph;
        graph.data(data);
        graph.render();

        graph.on('fissionType-shape-detail:click', e => {
          handleDetailClick(e);
        });
      }
    },
    [overviewData]
  );
  const handleText = useCallback((text: string) => {
    if (text && text.length > 0) {
      if (hasChinese(text)) {
        return text.length > 9 ? text.slice(0, 9) + '...' : text;
      } else {
        return text.length > 18 ? text.slice(0, 16) + '...' : text;
      }
    } else {
      return ' ';
    }
  }, []);
  const hasChinese = useCallback((str: String): boolean => {
    if (str && str.length) {
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 255) {
          return true;
        }
      }
    }
    return false;
  }, []);
  const registerFn = useCallback(() => {
    G6.registerNode(
      'root',
      {
        draw(cfg, group) {
          const size = [160, 60];
          const keyShape = group!.addShape('rect', {
            attrs: {
              width: size[0],
              height: size[1],
              fill: '#fff',
              stroke: cfg?.root ? '#FE6C5E' : cfg?.potentialCustomerLevelLabel ? '#4C6AFF' : '#C9CBD6',
              radius: 4,
              lineDash: cfg?.potentialCustomerLevelLabel ? undefined : [3],
            },
            draggable: true,
            name: 'dice-mind-map-rect',
          });
          const countryFlagImage = nationComponentMap[cfg!.country as string] || { label: '', component: null };
          if (!!cfg?.potentialCustomerLevelLabel && !cfg?.root) {
            group!.addShape('rect', {
              attrs: {
                width: 60,
                height: 20,
                fill: cfg?.root ? '#FE6C5E' : '#4C6AFF',
                radius: 2,
                x: 8,
                y: -20,
              },
              draggable: true,
              modelId: cfg!.id,
              name: 'intro-rect',
            });
            group!.addShape('text', {
              attrs: {
                text: cfg?.potentialCustomerLevelLabel,
                fill: '#fff',
                x: 14,
                y: -3,
                fontSize: 12,
                lineHeight: 20,
                textAlign: 'left',
                cursor: 'pointer',
              },
              draggable: true,
              modelId: cfg!.id,
              name: 'intro-text',
            });
            if ((cfg?.companyNum as number) > 0) {
              group?.addShape('text', {
                attrs: {
                  text: '详情',
                  fill: '#4C6AFF',
                  x: 117,
                  y: 46,
                  fontSize: 12,
                  lineHeight: 20,
                  textAlign: 'left',
                  cursor: 'pointer',
                },
                modelId: cfg!.id,
                name: 'fissionType-shape-detail',
              });
              group?.addShape('text', {
                attrs: {
                  text: `${cfg?.companyNum}家${cfg?.fissionType === 1 ? '采购商' : '供应商'}`,
                  fill: '#747A8C',
                  x: 16,
                  y: 46,
                  fontSize: 12,
                  lineHeight: 20,
                  textAlign: 'left',
                },
                name: 'user-shape',
              });
            }
          } else {
            if (cfg?.root) {
              group!.addShape('rect', {
                attrs: {
                  width: 60,
                  height: 20,
                  fill: cfg?.root ? '#FE6C5E' : '#4C6AFF',
                  radius: 2,
                  x: 8,
                  y: -20,
                },
                draggable: true,
                modelId: cfg!.id,
                name: 'intro-rect',
              });
              group!.addShape('text', {
                attrs: {
                  text: cfg?.potentialCustomerLevelLabel,
                  fill: '#fff',
                  x: 14,
                  y: -3,
                  fontSize: 12,
                  lineHeight: 20,
                  textAlign: 'left',
                  cursor: 'pointer',
                },
                draggable: true,
                modelId: cfg!.id,
                name: 'intro-text',
              });
            }
            group?.addShape('text', {
              attrs: {
                text: cfg?.fissionType === 1 ? '采购商' : '供应商',
                fill: '#747A8C',
                x: 105,
                y: 46,
                fontSize: 12,
                lineHeight: 20,
                textAlign: 'left',
              },
              name: 'fissionType-shape',
            });
            if (countryFlagImage.label) {
              group?.addShape('text', {
                attrs: {
                  text: countryFlagImage.label,
                  fill: '#747A8C',
                  x: countryFlagImage.component ? 38 : 24,
                  y: 46,
                  fontSize: 12,
                  lineHeight: 20,
                  textAlign: 'left',
                },
                name: 'country-shape',
              });
            }
          }
          if (countryFlagImage.component) {
            group?.addShape('image', {
              attrs: {
                x: 16,
                y: !!cfg?.potentialCustomerLevelLabel && !cfg?.root ? 12 : 34,
                width: 18,
                height: 12,
                img: countryFlagImage.component,
              },
              name: 'image-shape',
            });
          }
          group?.addShape('text', {
            attrs: {
              text: handleText(cfg?.name as string),
              fill: '#272E47',
              x: !!cfg?.potentialCustomerLevelLabel && !cfg?.root && countryFlagImage.component ? 38 : 16,
              y: 24,
              fontSize: 12,
              lineHeight: 20,
              textAlign: 'left',
              cursor: 'pointer',
            },
            draggable: true,
            modelId: cfg!.id,
            name: 'label-shape-rect',
          });
          return keyShape;
        },
        getAnchorPoints(cfg) {
          return [
            [1, 0.5],
            [0, 0.5],
          ];
        },
      },
      'single-node'
    );
    G6.registerEdge(
      'round-poly',
      {
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
      },
      'polyline'
    );
  }, [overviewData]);
  const handleDetailClick = useCallback(
    e => {
      const target = e.target;
      const id = target.get('modelId');
      const item = graphRef.current?.findById(id);
      const nodeModel = item?.getModel();
      if (item && nodeModel) {
        globalSearchApi
          .fissionCompanyList({
            level: nodeModel?.level as number,
            fissionId: nodeModel?.fissionId as number,
            country: nodeModel?.country as string,
            parentId: nodeModel?.parentId as number,
          })
          .then(res => {
            setList(res);
            setVisible(true);
          });
      }
    },
    [list, graphRef.current]
  );
  const tableColumns = useMemo(() => {
    return [
      {
        title: getIn18Text('GONGSI'),
        dataIndex: 'name',
      },
      {
        title: getIn18Text('GUOJIA/DEQU'),
        dataIndex: 'countryCn',
      },
    ];
  }, []);
  return (
    <div className={style.overview}>
      <div className={style.overviewContent} style={{ height: `${document.body.clientHeight - 286}px` }} ref={ref}></div>
      <Modal
        title="潜客详情"
        className={style.fession}
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        footer={null}
        headerBottomLine={false}
        footerTopLine={false}
        isGlobal
        width={640}
      >
        <VirtualTable
          rowKey={'id'}
          className={style.overviewTable}
          rowHeight={46}
          columns={tableColumns}
          autoSwitchRenderMode
          enableVirtualRenderCount={30}
          dataSource={list}
          scroll={{ y: 460 }}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default FissionOverview;
