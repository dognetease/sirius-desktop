import moment from 'moment';
import { api, SystemApi } from 'api';
import { SnsMessage } from './types';
import { getIn18Text } from 'api';

const systemApi = api.getSystemApi() as SystemApi;

export const getHandyTime = (timestamp: number) => {
  const currentMoment = moment();
  const incomingMoment = moment(timestamp);

  if (moment(currentMoment).subtract(3, 'minute') <= incomingMoment) {
    const GANGGANG = getIn18Text('GANGGANG');

    return GANGGANG;
  }

  if (moment(currentMoment).startOf('day') <= incomingMoment) {
    return incomingMoment.format('HH:mm');
  }

  if (moment(currentMoment).startOf('day').subtract(1, 'day') <= incomingMoment) {
    const ZUOTIAN = getIn18Text('ZUOTIAN');

    return `${ZUOTIAN} ${incomingMoment.format('HH:mm')}`;
  }

  if (moment(currentMoment).startOf('year') <= incomingMoment) {
    return incomingMoment.format('MM-DD HH:mm');
  }

  return incomingMoment.format('YYYY-MM-DD HH:mm');
};

export const getAvatarColor = (name: string) => {
  const colors = ['#6557FF', '#00CCAA', '#FE6C5E', '#00C4D6', '#A259FF', '#4C6AFF'];
  const emailMd5 = systemApi.md5(name);

  return colors[parseInt(emailMd5[emailMd5.length - 1], 16) % colors.length];
};

export const updateMessageListItem: (params: { list: SnsMessage[]; updateId: number | string; updateItem: SnsMessage }) => SnsMessage[] = ({
  list,
  updateId,
  updateItem,
}) => {
  return list.map(item => {
    return item.id === updateId ? updateItem : item;
  });
};
