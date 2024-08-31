import React from 'react';
import CustomsBaseDetail from './customsBaseDetail';
import { recData as recDataType } from '../../customs/customs';
interface Porps extends recDataType {
  onOpen: (content: recDataType['content']) => void;
}

// to: 'buysers'|'supplier'
const CustomsDetail = (props: Porps | any) => {
  console.log('props-chagne', props);
  const { visible } = props;
  if (visible) {
    return <CustomsBaseDetail {...props} />;
  }
  return null;
};
export default CustomsDetail;
