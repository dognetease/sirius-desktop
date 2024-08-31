import React from 'react';
import { ReactComponent as IconSvg } from '@/images/icons/calendarDetail/closeCircle.svg';
import { ReactComponent as IconSvg2 } from '@/images/icons/calendarDetail/closeCircleHover.svg';

const CloseCircleSvg = () => <IconSvg />;
CloseCircleSvg.Enhance = () => <IconSvg2 />;

export default CloseCircleSvg;
