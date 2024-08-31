import React from 'react';
import { ReactComponent as IconSvg } from '@/images/icons/time_icon.svg';

interface Prop {
  className?: string;
}

const TimeSvg = ({ className }: Prop) => <IconSvg className={className} />;

export default TimeSvg;
