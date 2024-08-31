export const WarningIcon = () => (
  <div style={{ width: 16, height: 16 }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <g clip-path="url(#clip0_9112_44248)">
        <circle cx="7" cy="7" r="5.6875" stroke="#FE5B4C" stroke-width="0.875" />
        <path d="M7 4.11255V7.87504" stroke="#FE5B4C" stroke-width="0.875" stroke-linecap="round" />
        <rect x="6.69395" y="9.49375" width="0.6125" height="0.6125" rx="0.30625" stroke="#FE5B4C" stroke-width="0.6125" />
      </g>
      <defs>
        <clipPath id="clip0_9112_44248">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  </div>
);

/**
 * 获取最近几天的时间列表
 * @param filterDate 天数
 * @returns ['2023-10-12', '2023-10-11', '2023-10-10', '2023-10-09']
 */
export const getDateStrList = (filterDate: number): string[] => {
  const dateList = [];
  for (let i = 0; i < filterDate; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dateList.push(date.toISOString().slice(0, 10));
  }
  return dateList;
};
