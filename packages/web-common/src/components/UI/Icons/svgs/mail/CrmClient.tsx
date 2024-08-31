import React from 'react';

export interface Props {
  className?: string;
  stroke?: string;
}
const CrmClient: React.FC<Props> = (props: Props) => {
  const attribute = { ...props };
  delete attribute.stroke;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...attribute}>
      <circle cx="10" cy="10" r="10" fill="#00CCAA" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10 9.625C11.2426 9.625 12.25 8.61764 12.25 7.375C12.25 6.13236 11.2426 5.125 10 5.125C8.75736 5.125 7.75 6.13236 7.75 7.375C7.75 8.61764 8.75736 9.625 10 9.625ZM8.5 10.375C6.84315 10.375 5.5 11.7182 5.5 13.375V14.125C5.5 14.5392 5.83579 14.875 6.25 14.875H13.75C14.1642 14.875 14.5 14.5392 14.5 14.125V13.375C14.5 11.7182 13.1569 10.375 11.5 10.375H8.5Z"
        fill="white"
      />
    </svg>
  );
};

export default CrmClient;
