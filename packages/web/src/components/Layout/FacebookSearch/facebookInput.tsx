import React, { useContext } from 'react';
import { Input, Button, message } from 'antd';
import styles from './index.module.scss';
import { FacebookContext } from './facebookProvider';

import { ReactComponent as SearchIcon } from '@/images/icons/datasearch/searchIcon.svg';
import { getIn18Text } from 'api';

export const FacebookInput = (props: { isBorder?: boolean }) => {
  const { state, updateQuery, fetchData, updateIsInit, updatePagination, updateTable } = useContext(FacebookContext);

  const { isBorder = false } = props;

  const triggerSearch = () => {
    if (state.query.length < 2) {
      message.error(getIn18Text('queryNotLongTip'));
      return;
    }
    updateIsInit(false);
    updatePagination({
      page: 1,
      pageSize: 20,
    });
    updateTable({
      total: 0,
      tableData: [],
      status: 'loading',
    });
    fetchData();
  };
  return (
    <div
      className={styles.input}
      style={{
        border: isBorder ? '1px solid #EBEDF2' : 'none',
      }}
    >
      <Input.Group className={styles.group}>
        <Input
          className={styles.real}
          prefix={<SearchIcon className={styles.icon} />}
          placeholder={getIn18Text('facebookSearchPlaceholder')}
          value={state.query}
          onChange={e => {
            const value = e.target.value;
            updateQuery(value);
          }}
          onPressEnter={triggerSearch}
          disabled={state.isTasking}
        />
        <Button type="primary" className={styles.btn} onClick={triggerSearch} disabled={state.isTasking}>
          {getIn18Text('SOUSUO')}
        </Button>
      </Input.Group>
    </div>
  );
};
