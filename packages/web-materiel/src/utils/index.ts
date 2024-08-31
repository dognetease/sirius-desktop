import moment from 'moment';

export const timestampFormatter = (timestamp: number) => (timestamp ? moment(+timestamp).format('YYYY-MM-DD HH:mm:ss') : '-');

export const enhanceLink = (link: string, payload: Record<string, string | number>) => {
  const url = new URL(link);
  const params = new URLSearchParams(url.search);
  Object.entries(payload).forEach(([key, value]) => {
    params.set(key, `${value}`);
  });
  url.search = params.toString();

  return url.href;
};

export const splitFullName = (fullName: string) => {
  const match = fullName.match(/^(.*?)(\.[a-z0-9]+)?$/i);

  return {
    name: match ? match[1] : '',
    ext: match && match[2] ? match[2].slice(1) : '',
  };
};

export const validFullName = (fullName: string) => {
  const pattern = /^[\u4e00-\u9fa5a-z0-9\-_.]+\.[a-z0-9]+$/i;
  return pattern.test(fullName);
};
