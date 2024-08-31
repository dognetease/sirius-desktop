import React, { useMemo, useState, useRef, useImperativeHandle } from 'react';
import classNames from 'classnames';
import style from '../index.module.scss';
import { getIn18Text, ReqForwarder, ForwarderType } from 'api';
import ForwarderSearch from '../../CustomsData/customs/ForwarderSearch/ForwarderSearch';
import { ForwarderSearchRef, ForwarderFormType } from '../../CustomsData/customs/ForwarderSearch/ForwarderSearch';

interface Prop {
  initLayout: boolean;
  setInitLayout: () => void;
  onSearch: (value: ForwarderFormType) => void;
  defaultValues: ReqForwarder;
  handleForwarderChange?: (v: ForwarderType) => void;
  afterReset?: () => void;
  onValuesChange?: () => void;
}

export interface SearchRef {
  getValues(): ForwarderFormType;
  setValues(values: Partial<ForwarderFormType>): void;
  resetValues(values?: ForwarderFormType): void;
  // updateSearchHistoryList(): void;
}

const PerrsSearch = React.forwardRef<SearchRef, Prop>(
  ({ initLayout, setInitLayout, onSearch, defaultValues, handleForwarderChange, afterReset, onValuesChange, ...rest }, ref) => {
    const customsSearchInputRef = useRef<ForwarderSearchRef>(null);
    useImperativeHandle(
      ref,
      () => ({
        getValues: customsSearchInputRef.current?.getValues as any,
        setValues(values: ForwarderFormType) {
          customsSearchInputRef.current?.setValues(values);
        },
        resetValues(values?: ForwarderFormType) {
          customsSearchInputRef.current?.resetValues(values);
        },
      }),
      [customsSearchInputRef.current]
    );
    return (
      <>
        <div
          className={classNames(style.peersSearchBox, {
            [style.peersSearchBoxList]: !initLayout,
          })}
        >
          <div
            className={classNames(style.peersSearchBoxInner, {
              [style.peersSearchBoxInnerList]: !initLayout,
            })}
          >
            <ForwarderSearch
              ref={customsSearchInputRef}
              formClassName={!initLayout ? style.formList : style.form}
              onSearch={onSearch}
              needValitor={true}
              searchType={'peers'}
              defaultValues={defaultValues}
              onForwarderTypeChange={handleForwarderChange}
              afterReset={afterReset}
              initLayout={initLayout}
              onValuesChange={onValuesChange}
              model={'peers'}
              btnClassName={!initLayout ? style.stowSpan : style.formOp}
              className=""
            />
          </div>
        </div>
      </>
    );
  }
);

export default PerrsSearch;
