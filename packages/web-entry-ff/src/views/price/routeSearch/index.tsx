import React, { useEffect, useState, useMemo } from 'react';
import { apiHolder, apis, FFMSApi, FFMSRate } from 'api';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import { Row, Col, Tooltip, Button } from 'antd';
import { useDebounceFn } from 'ahooks';
import classNames from 'classnames';
import { useMount } from 'react-use';
import { SearchIconAtInput } from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { ReactComponent as TipsIcon } from '@web-entry-ff/images/tips.svg';
import Modal from '@/components/Layout/components/Modal/modal';

import style from './style.module.scss';

const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;

interface Props {
  className?: string;
}

const RouteSearch: React.FC<Props> = ({ className }) => {
  const [currentList, setList] = useState<Map<string, FFMSRate.RouteOption[]>>(new Map());
  const [value, setValue] = useState<string>('');
  const [portList, setPortList] = useState<FFMSRate.RouteOption[]>([]);
  const [route, setRoute] = useState<string[]>();
  const [visible, setVisible] = useState(false);

  const { run } = useDebounceFn(
    () => {
      onSearch(value);
    },
    {
      wait: 500,
    }
  );

  const onSearch = (value: string) => {
    if (value) {
      classify(portList.filter(item => item.searchText?.includes(value.replace(/\s*/g, '').toLocaleUpperCase())));
    } else {
      classify(portList);
    }
  };

  const classify = (portList: FFMSRate.RouteOption[]) => {
    const map = new Map();
    portList.forEach(item => {
      if (map.has(item.route)) {
        const rowArr = map.get(item.route);
        rowArr.push(item);
        map.set(item.route, rowArr);
      } else {
        map.set(item.route, [item]);
      }
    });
    setList(map);
  };

  useEffect(() => {
    if (visible) {
      classify(portList);
    }
  }, [portList, visible]);

  const getPermissionPorts = () => {
    ffmsApi.ffPermissionsPortList().then(res => {
      const options = (res || []).map(item => ({
        label: `${item.enName} ${item.cnName} ${item.countryCnName}`,
        searchText: `${item.enName}${item.cnName}${item.countryCnName}`,
        value: item.code,
        route: item.route,
      }));

      setPortList(options);
      const route = (res || []).map(item => item.route).filter(item => !!item);
      setRoute([...new Set(route)]);
    });
  };

  useMount(() => {
    getPermissionPorts();
  });

  const RenderBox = useMemo(() => {
    const renderDom = [];
    for (const [route, vlaue] of currentList) {
      renderDom.push(
        <Row gutter={[16, 8]}>
          <div className={style.title} key={route}>
            {route}
          </div>
          {vlaue.map((item, index) => (
            <Col
              flex="0 0 25%"
              style={{
                maxWidth: '25%',
              }}
              key={`${route}${index}`}
            >
              <Tooltip title={item.label}>
                <div className={style.routeItem}>{item.label}</div>
              </Tooltip>
            </Col>
          ))}
        </Row>
      );
    }
    return renderDom;
  }, [currentList]);

  return (
    <>
      <div className={classNames(style.routeBox, className)}>
        <div className={style.textBox}>
          <TipsIcon className={style.svgIcon} />
          <span className={style.preText}>可以上传</span>
          <span className={style.route}>{route?.join('，')}</span>
          <span>等航线</span>
        </div>
        <Button type="link" onClick={() => setVisible(true)}>
          查看全部港口
        </Button>
      </div>
      <Modal
        width={840}
        bodyStyle={{ minHeight: 480, maxHeight: 480, padding: '0 24px' }}
        className={style.searchRoute}
        visible={visible}
        footer={null}
        onCancel={() => setVisible(false)}
        title="港口查询"
      >
        <Input
          prefix={<SearchIconAtInput />}
          className={style.searchInput}
          onChange={e => {
            setValue(e.target.value as string);
            run();
          }}
          placeholder="请搜索想要查找的港口或国家"
        />
        <div className={style.scrollBox}>{RenderBox}</div>
      </Modal>
    </>
  );
};

export default RouteSearch;
