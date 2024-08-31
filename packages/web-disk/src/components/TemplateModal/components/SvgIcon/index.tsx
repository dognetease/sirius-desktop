/*
 * @Author: wangzhijie02
 * @Date: 2022-05-27 16:01:52
 * @LastEditors: wangzhijie02
 * @LastEditTime: 2022-06-29 17:25:26
 * @Description: file content
 */
import React from 'react';

export interface SvgIconProps {
  status: 'active' | 'normal';
}

export const SvgIconTemplate = () => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.2959 8.35208C12.2959 6.50078 13.7967 5 15.648 5C17.4993 5 19.0001 6.50078 19.0001 8.35208C19.0001 10.2034 17.4993 11.7042 15.648 11.7042H13.9719C13.0463 11.7042 12.2959 10.9538 12.2959 10.0281V8.35208Z"
        fill="#5B89FE"
      />
      <path
        d="M5 15.4512C5 13.5999 6.50078 12.0991 8.35208 12.0991H10.0281C10.9538 12.0991 11.7042 12.8495 11.7042 13.7752V15.4512C11.7042 17.3025 10.2034 18.8033 8.35208 18.8033C6.50078 18.8033 5 17.3025 5 15.4512Z"
        fill="#5B89FE"
      />
      <path
        d="M11.7041 8.35208C11.7041 6.50078 10.2033 5 8.35202 5C6.50072 5 4.99994 6.50078 4.99994 8.35208C4.99994 10.2034 6.50072 11.7042 8.35202 11.7042H10.0281C10.9537 11.7042 11.7041 10.9538 11.7041 10.0281V8.35208Z"
        fill="#36BF84"
      />
      <path
        d="M19 15.4512C19 13.5999 17.4992 12.0991 15.6479 12.0991H13.9719C13.0462 12.0991 12.2958 12.8495 12.2958 13.7752V15.4512C12.2958 17.3025 13.7966 18.8033 15.6479 18.8033C17.4992 18.8033 19 17.3025 19 15.4512Z"
        fill="#36BF84"
      />
    </svg>
  );
};
/**我的模板 */
export const SvgIconOwn: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4.0835" y="4.0835" width="11.8333" height="11.8333" rx="0.75" stroke={strokeColor} stroke-width="1.5" />
      <path d="M4.1665 8.3335H15.4165" stroke={strokeColor} stroke-width="1.5" />
      <path d="M8.3335 15.8335L8.3335 8.3335" stroke={strokeColor} stroke-width="1.5" />
    </svg>
  );
};
/**热门推荐 */
export const SvgIconPopular: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.1918 8.2V5.8C11.1918 4.80589 10.3868 4 9.39387 4L6.99658 9.4V16H13.9607C14.5584 16.0068 15.0697 15.5716 15.1593 14.98L15.9864 9.58C16.0392 9.2319 15.9366 8.8782 15.7058 8.6125C15.4751 8.34683 15.1394 8.196 14.7878 8.2H11.1918Z"
        stroke={strokeColor}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <path
        d="M6.9966 9.3332H5.39642C4.69432 9.32077 4.09413 9.903 4 10.5997V14.7997C4.09413 15.4963 4.69432 16.0121 5.39642 15.9997H6.9966V9.3332Z"
        stroke={strokeColor}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>
  );
};
/**项目管理 */
export const SvgIconProject: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.75" y="4.39844" width="4.61141" height="4.61141" rx="0.75" stroke={strokeColor} stroke-width="1.5" />
      <rect x="10.6525" y="6.7041" width="3.73835" height="3.73835" rx="0.75" transform="rotate(-45 10.6525 6.7041)" stroke={strokeColor} stroke-width="1.5" />
      <rect x="3.75" y="11.3828" width="4.61141" height="4.61141" rx="0.75" stroke={strokeColor} stroke-width="1.5" />
      <rect x="10.7344" y="11.3828" width="4.61141" height="4.61141" rx="0.75" stroke={strokeColor} stroke-width="1.5" />
    </svg>
  );
};
/**协同办公 */
export const SvgIconCooperative: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8.51904" y="3.75" width="3.57692" height="3.57692" rx="0.75" stroke={strokeColor} stroke-width="1.5" />
      <circle cx="14.75" cy="14.2114" r="2" stroke={strokeColor} stroke-width="1.5" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M13.8987 6.80839C13.7263 7.29573 13.4575 7.73752 13.1153 8.11083C13.8281 8.74874 14.3223 9.62583 14.4718 10.6159C14.4941 10.6155 14.5164 10.6153 14.5387 10.6153C15.0666 10.6153 15.5663 10.7362 16.0116 10.9517C15.9255 9.27933 15.1201 7.79707 13.8987 6.80839ZM12.3532 16.5844C11.9495 16.2427 11.627 15.8081 11.4185 15.3136C11.0646 15.4101 10.6922 15.4616 10.3077 15.4616C9.83312 15.4616 9.37685 15.3831 8.9512 15.2384C8.84137 15.7418 8.63195 16.208 8.34463 16.6153C8.95677 16.8394 9.61797 16.9616 10.3077 16.9616C11.0285 16.9616 11.7182 16.8281 12.3532 16.5844ZM7.5004 8.11061C6.76219 8.77117 6.25834 9.68827 6.129 10.7218C5.84106 10.6522 5.54035 10.6153 5.23102 10.6153C5.02511 10.6153 4.82302 10.6316 4.62598 10.6631C4.78462 9.10912 5.56626 7.73953 6.7171 6.80811C6.88943 7.29546 7.15817 7.73727 7.5004 8.11061Z"
        fill={strokeColor}
      />
      <path
        d="M4.79279 12.394C5.08146 11.894 5.80315 11.894 6.09183 12.394L7.3409 14.5575C7.62958 15.0575 7.26873 15.6825 6.69138 15.6825H4.19323C3.61588 15.6825 3.25504 15.0575 3.54371 14.5575L4.79279 12.394Z"
        stroke={strokeColor}
        stroke-width="1.5"
      />
    </svg>
  );
};
/**日常工作 */
export const SvgIconDaily: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.05104 8.77185C3.41605 8.52345 3.41604 7.66698 4.05104 7.41858L8.50798 5.67509C8.69495 5.60195 8.90466 5.60195 9.09163 5.67509L13.5486 7.41858C14.1836 7.66698 14.1836 8.52345 13.5486 8.77185L9.09163 10.5153C8.90466 10.5885 8.69495 10.5885 8.50798 10.5153L4.05104 8.77185Z"
        stroke={strokeColor}
        stroke-width="1.5"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M4.0161 9.54883L3.19868 9.96033C2.04722 10.54 2.12815 12.1357 3.33291 12.607L8.21527 14.5169C8.58921 14.6632 9.00862 14.6632 9.38255 14.5169L14.2649 12.607C15.4697 12.1357 15.5506 10.54 14.3991 9.96033L13.5817 9.54883L11.732 10.2724L13.6813 11.2537L8.79891 13.1636L3.91655 11.2537L5.86583 10.2724L4.0161 9.54883Z"
        fill={strokeColor}
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M4.0161 12.8647L3.19868 13.2763C2.04722 13.8559 2.12815 15.4516 3.33291 15.9229L8.21527 17.8328C8.58921 17.9791 9.00862 17.9791 9.38255 17.8328L14.2649 15.9229C15.4697 15.4516 15.5506 13.8559 14.3991 13.2763L13.5817 12.8647L11.732 13.5883L13.6813 14.5697L8.79891 16.4796L3.91655 14.5697L5.86583 13.5883L4.0161 12.8647Z"
        fill={strokeColor}
      />
    </svg>
  );
};
/** 人力资源 */
export const SvgIconHr: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.56448 11.7651H4.7998C3.69524 11.7651 2.7998 12.6606 2.7998 13.7651V15.4021C2.7998 15.8439 3.15798 16.2021 3.5998 16.2021H9.76448C10.2063 16.2021 10.5645 15.8439 10.5645 15.4021V13.7651C10.5645 12.6606 9.66905 11.7651 8.56448 11.7651Z"
        stroke={strokeColor}
        stroke-width="1.5"
      />
      <path d="M11.7339 7.2998L16.0002 7.2998" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M12.7998 10.6997C14.0494 10.6997 15.9995 10.6997 15.9995 10.6997" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M13.8662 14.2339L15.9994 14.2339" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <rect x="3.95068" y="4.75" width="4.89946" height="4.89946" rx="2.44973" stroke={strokeColor} stroke-width="1.5" />
    </svg>
  );
};
/**高效学习 */
export const SvgIconLearn: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.75" y="2.75" width="11.3" height="10.3154" rx="1.25" stroke={strokeColor} stroke-width="1.5" />
      <path d="M3.91455 15.7144H14.886" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M9.33008 9.31445L9.33008 5.65731" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M12 9.31445L12 8.40017" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M6.65723 9.31445L6.65723 8.40017" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
    </svg>
  );
};
/**生活管理 */
export const SvgIconLife: React.FC<SvgIconProps> = props => {
  const strokeColor = props.status === 'normal' ? '#626E85' : '#326CFE';

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.3999 16H4.6999C4.25807 16 3.8999 15.6418 3.8999 15.2V4.8C3.8999 4.35817 4.25807 4 4.6999 4H14.0999C14.5417 4 14.8999 4.35817 14.8999 4.8V10"
        stroke={strokeColor}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path d="M6.3999 7H12.3999" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M6.3999 10H9.3999" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path d="M6.3999 13H7.3999" stroke={strokeColor} stroke-width="1.5" stroke-linecap="round" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.993 12.7006L12.3644 15.3295L12.3486 15.6137L12.6327 15.5979L15.2614 12.969L14.993 12.7006ZM14.2289 11.3434C14.6509 10.9214 15.3351 10.9213 15.7571 11.3434L16.6187 12.205C17.0406 12.6269 17.0406 13.3111 16.6187 13.7331L13.5801 16.7719C13.3921 16.9599 13.1414 17.072 12.8759 17.0867L11.5948 17.1579C11.3818 17.1697 11.1738 17.0902 11.0229 16.9394C10.872 16.7885 10.7925 16.5805 10.8044 16.3674L10.8756 15.0863C10.8903 14.8208 11.0024 14.5701 11.1904 14.3821L14.2289 11.3434Z"
        fill={strokeColor}
      />
    </svg>
  );
};
