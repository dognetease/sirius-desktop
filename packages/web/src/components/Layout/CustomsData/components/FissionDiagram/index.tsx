import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import G6, { TreeGraphData, TreeGraph, Graph } from '@antv/g6';
import style from './index.module.scss';
import { GlobalSearchApi, FessionRelation, api, apis } from 'api';
import ReactDOM from 'react-dom';
import dictionary from '../NationalFlag/dictionary';
interface RelationDiagramProp {
  visible: boolean;
  onCancel: (data: boolean) => void;
  id?: number | string;
  recordId?: number | string;
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
const RelationDiagram: React.FC<RelationDiagramProp> = ({ visible, onCancel, id = 2, recordId }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [initData, setInitData] = useState<TreeGraphData | null>(null);
  const graphRef = useRef<Graph | null>(null);
  useEffect(() => {
    if (ref.current && initData) {
      diagramInit(initData);
    }
  }, [initData]);
  useEffect(() => {
    if (visible) {
      globalSearchApi
        .fissionRelation({
          fissionId: id as number,
          recordId: recordId as number,
        })
        .then(res => {
          handleRelationData(res);
        });
    } else {
      graphRef.current?.destroy();
    }
  }, [visible]);
  const diagramInit = useCallback(
    async (data: TreeGraphData) => {
      if (ref.current) {
        await registerFn();
        const graph = new G6.Graph({
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
          modes: {
            default: ['drag-canvas', 'zoom-canvas', 'click-select'],
          },
          fitView: true,
        });
        graphRef.current = graph;
        graph.data(data);
        graph.render();
      }
    },
    [initData]
  );
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
          if (cfg?.potentialCustomerLevelLabel) {
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
          const countryFlagImage = nationComponentMap[cfg!.country as string] || { label: '', component: null };
          if (countryFlagImage.component) {
            group?.addShape('image', {
              attrs: {
                x: 16,
                y: 34,
                width: 18,
                height: 12,
                img: countryFlagImage.component,
              },
              name: 'image-shape',
            });
          }
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
          group?.addShape('text', {
            attrs: {
              text: handleText(cfg?.name as string),
              fill: '#272E47',
              x: 16,
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
          return cfg?.fissionType === cfg?.rootType
            ? [
                [1, 0.5],
                [1, 0.33],
              ]
            : [
                [0.5, 0],
                [0.5, 1],
              ];
        },
      },
      'single-node'
    );
    G6.registerEdge('line-arrow', {
      draw: function draw(cfg, group) {
        const startPoint = cfg!.startPoint,
          endPoint = cfg!.endPoint;
        const keyShape = group!.addShape('path', {
          attrs: {
            path: [
              ['M', startPoint?.x, startPoint?.y],
              ['L', endPoint?.x, startPoint?.y],
              ['L', endPoint?.x, endPoint?.y],
            ],
            stroke: '#BBB',
            lineWidth: 1,
            endArrow: {
              path: 'M 6,0 L -6,-6 L -3,0 L -6,6 Z',
              d: 6,
            },
            className: 'edge-shape',
          },
        });
        return keyShape;
      },
    });
  }, [initData]);
  const handleRelationData = useCallback(
    (data: FessionRelation) => {
      let nodes: TreeGraphData[] = [
        {
          id: data.id + data.name + 0,
          dataType: 'root',
          name: data.name,
          x: 0,
          y: 0,
          fissionType: data.type,
          level: 0,
          root: true,
          rootType: data.type,
          country: data.country,
          potentialCustomerLevelLabel: data.potentialCustomerLevelLabel,
        },
      ];
      const haldeData = (data: FessionRelation[], level: number, parentId: string, type: 1 | 2 | string) => {
        data.forEach((item, index) => {
          nodes = [
            ...nodes,
            {
              id: item?.id + item.name + level,
              dataType: 'root',
              name: item?.name,
              x: item?.type === type ? 320 * index : 180 * (index + 1),
              y: 100 * level,
              fissionType: item?.type,
              level: level,
              childrens: item?.childrens,
              parentId: parentId,
              rootType: type,
              country: item.country,
              potentialCustomerLevelLabel: item.potentialCustomerLevelLabel,
            },
          ];
          if (item.childrens && item.childrens.length > 0) {
            haldeData(item.childrens, level + 1, item.id + item.name + level, type);
          }
        });
      };
      if (data.childrens) {
        haldeData(data.childrens, 1, data.id + data.name + 0, data.type);
        const filterData = Array.from(new Set(nodes.map(item => item.id))).map(item => {
          return nodes.find(e => e.id === item);
        });
        const edges = nodes
          .filter(item => item?.parentId)
          .map(item => {
            return {
              source: item?.parentId,
              target: item?.id,
            };
          });
        setInitData({
          id: id + '',
          nodes: filterData,
          edges: edges,
        });
      }
    },
    [initData, visible]
  );
  const hasChinese = useCallback((str: String): boolean => {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 255) {
        return true;
      }
    }
    return false;
  }, []);
  const handleText = useCallback((text: string) => {
    if (hasChinese(text)) {
      return text.length > 9 ? text.slice(0, 9) + '...' : text;
    } else {
      return text.length > 18 ? text.slice(0, 16) + '...' : text;
    }
  }, []);
  return (
    <Modal
      title="裂变关系图"
      className="fession"
      visible={visible}
      onCancel={() => {
        onCancel(false);
      }}
      onOk={() => {
        onCancel(false);
      }}
      footer={null}
      headerBottomLine={false}
      footerTopLine={false}
      isGlobal
      width={640}
    >
      <div className={style.diagram}>
        <div className={style.diagramContent} ref={ref}></div>
      </div>
    </Modal>
  );
};
export default RelationDiagram;

export const showRelationDiagramModal = (id?: number | string, recordId?: number | string) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const closeHandler = () => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  };
  ReactDOM.render(<RelationDiagram visible id={id} recordId={recordId} onCancel={closeHandler} />, container);
};
