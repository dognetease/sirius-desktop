import { Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import LanguageSwitchModal from '@web-common/components/LanguageSwitchModal/languageSwitchModal';
import { Lang, DEFAULT_LANG, apiHolder, SystemApi } from 'api';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;

let langTemp: Lang = DEFAULT_LANG;

interface IProps {
  menuClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  iconColor?: string;
}

const LangMenusComp: React.FC<IProps> = props => {
  const { menuClassName, labelClassName, iconClassName, iconColor = '#fff' } = props;
  const [showModal, setShowModal] = useState<boolean>(false);
  const [lang] = useState<Lang>(systemApi.getSystemLang());

  const langMap: { [key: string]: string } = {
    en: 'English',
    zh: '简体中文',
    'zh-trad': '繁體中文',
  };

  const langMenus = (
    <Menu className={menuClassName}>
      {Object.keys(langMap).map(currKey => {
        return (
          <Menu.Item
            key={currKey}
            onClick={({ domEvent }) => {
              domEvent.stopPropagation();
              langTemp = currKey as Lang;
              if (langTemp !== lang) {
                setShowModal(true);
              }
            }}
          >
            {langMap[currKey]}
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const restartApp = () => {
    if (process.env.BUILD_ISELECTRON) {
      systemApi.reLaunchApp();
    } else {
      history.go();
    }
  };

  const getLanguageLabel = () => {
    return langMap[lang] || DEFAULT_LANG;
  };

  return (
    <>
      <Dropdown overlay={langMenus}>
        <div>
          <span className={labelClassName}>{getLanguageLabel()}</span>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={iconClassName}>
            <path
              d="M4.39043 6.51196L7.35012 2.81235C7.61203 2.48497 7.37894 2 6.95969 2L1.04031 2C0.621061 2 0.387974 2.48496 0.64988 2.81235L3.60957 6.51196C3.80973 6.76216 4.19027 6.76216 4.39043 6.51196Z"
              fill={iconColor}
            />
          </svg>
        </div>
      </Dropdown>
      <LanguageSwitchModal
        visible={showModal}
        lang={langTemp}
        onClose={(onOk: boolean) => {
          setShowModal(false);
          if (onOk) {
            systemApi.setSystemLang(langTemp);
            restartApp();
          }
        }}
      />
    </>
  );
};

export default LangMenusComp;
