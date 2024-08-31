/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useMemo } from 'react';
import { ResParseTables } from 'api';
// eslint-disable-next-line import/no-extraneous-dependencies
import { navigate } from '@reach/router';
import { useAppSelector } from '@web-common/state/createStore';
import { getIsSomeMenuVisbleSelector, getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { ReactComponent as IconWarn } from '@/images/icons/edm/icon_warnning.svg';
import { MapStatus, RowData, TableMapping } from './tableMapping';
import style from './dataTransfer.module.scss';
import { getIn18Text } from 'api';

interface DataMigrationStep2Props {
  data?: ResParseTables;
  sessionId: string;
  selectedField: Record<string, boolean>;
  showHistoryMap?: boolean;
  updateBaseInfo: () => void;
  onMappingChange?: (fileName: string, map: RowData[]) => void;
}
export const DataMigrationStep2 = (props: DataMigrationStep2Props) => {
  const { data, sessionId, showHistoryMap, onMappingChange, selectedField } = props;
  const hasFieldSettingPrivilege = useAppSelector(gState => getModuleAccessSelector(gState.privilegeReducer, 'ORG_SETTINGS', 'CONTACT_FIELD_SETTING'));
  const fieldSettingMenuVisible = useAppSelector(gState => getIsSomeMenuVisbleSelector(gState.privilegeReducer, ['ORG_SETTINGS_FIELD_SETTING']));
  const historyMapping: Record<string, Record<string, RowData>> = useMemo(() => {
    const groupByFileName: Record<string, Record<string, RowData>> = {};
    data?.history_field_mapping_list.forEach(f => {
      const k = f.file_name;
      const obj: RowData = {
        field_name: '',
        field_number: f.origin_column_number,
        mapStatus: f.mapping_result ? MapStatus.Success : MapStatus.Error,
        object_code: f.object_code,
        mapping_field_code: f.mapping_field_code,
        default_value: f.default_value,
      };
      groupByFileName[k] = groupByFileName[k] || {};
      groupByFileName[k][obj.field_number] = obj;
    });
    return groupByFileName;
  }, [data?.history_field_mapping_list, showHistoryMap]);
  return (
    <div className={style.step2}>
      <div className={style.mappingTips}>
        <p>
          <IconWarn />
          {getIn18Text('GONGSIMINGCHENG\u3001YOUXIANG WEIBITIANZIDUAN\u3002')}
        </p>
        <p>
          <IconWarn />
          {getIn18Text('KEHUDUIXIANGYULIANXIRENDUIXIANG\uFF0CDOUXUXUANZE\u3002')}
        </p>
        {data?.file_field_list && data.file_field_list.length > 1 && (
          <p>
            <IconWarn />
            {getIn18Text('LIANGGEMOBAN\uFF0CMEIGEMOBANZHINENGXUANZEYIGEDUIXIANG\uFF0C\u201CLIANXIREN\u201DDUIXIANGBIXUXUANZE\u201CSUOSHUGONGSI\u201D\u3002')}
          </p>
        )}
        {hasFieldSettingPrivilege && fieldSettingMenuVisible && (
          <div style={{ position: 'absolute', bottom: 12, right: 16 }}>
            <a onClick={() => navigate('#enterpriseSetting?page=fieldSetting')}>{getIn18Text('ZIDUANSHEZHI')}</a>
          </div>
        )}
      </div>
      {data?.file_field_list.map(table => (
        <TableMapping
          key={table.file_name}
          parsedTable={table}
          mapTables={['CUSTOMER', 'CONTACT']}
          sessionId={sessionId}
          onChange={map => onMappingChange && onMappingChange(table.file_name, map)}
          multiFile={data.file_field_list.length > 1}
          selectedField={selectedField}
          updateBaseInfo={props.updateBaseInfo}
          initMapping={showHistoryMap ? historyMapping[table.file_name] : undefined}
        />
      ))}
    </div>
  );
};
