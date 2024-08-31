/*
 * @Author: your name
 * @Date: 2022-03-21 16:04:10
 * @LastEditTime: 2022-03-24 15:16:01
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-setting/src/Mail/components/CustomMailClassify/ClassifyList/ClassifyList.tsx
 */
import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DraggableProvided } from 'react-beautiful-dnd';
import update from 'immutability-helper';
import classnames from 'classnames';
import listStyle from './classifyList.module.scss';
import { MailConfApi, apis, apiHolder as api, ResponseMailClassify, MailApi, MailBoxModel } from 'api';
const MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;

interface Props {
  dataList: ResponseMailClassify[];
  setDataList: (val: ResponseMailClassify[]) => void;
  renderItem: (item: ResponseMailClassify, index: number) => React.ReactNode;
}

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',

  // change background colour if dragging
  background: 'white',

  // styles we need to apply on draggables
  ...draggableStyle,
});

const ClassifyList: React.FC<Props> = ({ dataList, setDataList, renderItem }) => {
  const onDragEnd = result => {
    if (!result.destination) {
      return;
    }
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    const items = update(dataList, {
      $splice: [
        [startIndex, 1],
        [endIndex, 0, dataList[startIndex]],
      ],
    });
    MailConfApi.sortMailClassifyRule(+result.draggableId, dataList.length - 1 - endIndex);
    setDataList(items);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable-1" type="PERSON">
        {(provided, snapshotDrop) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {dataList.map((item, index) => (
              <Draggable draggableId={item.id + ''} index={index} key={item.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.dragHandleProps}
                    {...provided.draggableProps}
                    style={{ ...getItemStyle(snapshot.isDragging, provided.draggableProps.style) }}
                  >
                    {renderItem(item, index)}
                  </div>
                )}
              </Draggable>
            ))}
            {snapshotDrop.isDraggingOver && <div style={{ height: '200px' }}></div>}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ClassifyList;
