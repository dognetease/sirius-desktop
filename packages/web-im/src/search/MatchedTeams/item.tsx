import React from 'react';
import { SearchTeamOrgModel, Team } from 'api';
import classnames from 'classnames/bind';
import { TeamDiscussTag } from '../../components/TeamSetting/teamDiscussTag';
import style from './item.module.scss';
import { useImTeamType } from '../../common/hooks/useTeamInfo';
import { TeamAvatar } from '../../common/imUserAvatar';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface Props {
  keyword: string;
  teamInfo: SearchTeamOrgModel | Team;
  customClassnames?: string;
}
export const Item: React.FC<Props> = ({ keyword, teamInfo, customClassnames = '' }) => {
  // 邮件讨论组
  const discussGroup = useImTeamType(teamInfo.id.replace('team_', ''), 'team') === 'discuss';
  // 匹配处理方法
  const handlePinyin = (pinyinStr: string = '', name: string = '', pyLabelName: string = '') => {
    // 如果存在中文匹配或无拼音则展示中文匹配，中文匹配和拼音匹配不同时存在
    const nameMatch = name.indexOf(keyword) !== -1;
    if (nameMatch || !pinyinStr) {
      return `${name}`.replace(keyword, arg => `<span class="${realStyle('highlight')}">${arg}</span>`);
    }
    const lowerCaseKeyword = (keyword || '').toLocaleLowerCase();
    // 拼音字符串分割为数组
    const pinyinArr = pinyinStr.split('-');
    // 情景一：输入单个字以首字母开头的拼音（例如zhang） 将匹配成功的位置记录成数组
    const pinyinMatchArr = pinyinArr.map((item, index) => (item.indexOf(lowerCaseKeyword) === 0 ? index : -1)).filter(item => item > -1);
    // 情景二：输入多个字的首字母拼音（例如zqs） 将匹配成功的位置加入数组
    let firstPySite = pyLabelName.indexOf(keyword);
    if (firstPySite > -1) {
      while (firstPySite < keyword.length) {
        pinyinMatchArr.push(firstPySite);
        firstPySite += 1;
      }
    }
    // 存储由拼音匹配的最终字符串
    let actualName = '';
    name.split('').forEach((item: string, index: number) => {
      actualName += pinyinMatchArr.includes(index) ? `<span class="${realStyle('highlight')}">${item}</span>` : item;
    });
    return actualName;
  };
  return (
    <div className={realStyle('teamInfo', customClassnames)}>
      <TeamAvatar testId="im_search_imitem_avatar" teamId={teamInfo.id || teamInfo.originId} teamInfo={teamInfo} />
      <div className={realStyle('teamDesc')}>
        <p className={realStyle('teamNameWrapper')}>
          <p
            className={realStyle('teamName')}
            data-test-id="im_search_imitem_teamname"
            dangerouslySetInnerHTML={{
              __html: [handlePinyin(teamInfo?.pinyin, teamInfo?.orgName, teamInfo?.orgPYLabelName), `（${teamInfo.memberNum}）`].join(''),
            }}
          />
          {/* 邮件讨论组增加标签 */}
          {discussGroup ? <TeamDiscussTag /> : null}
        </p>
        {teamInfo?.contactList?.length > 0 && (
          <p
            data-test-id="im_search_imitem_teammemnames"
            className={realStyle('teamContain')}
            dangerouslySetInnerHTML={{
              __html:
                getIn18Text('BAOHAN\uFF1A') +
                teamInfo.contactList
                  .map(item => {
                    if (item?.contact?.contactName) {
                      return handlePinyin(item?.contact?.contactPinyin, item?.contact?.contactName, item?.contact?.contactPYLabelName);
                    }
                  })
                  .filter(item => item)
                  .join('，'),
            }}
          />
        )}
      </div>
    </div>
  );
};
