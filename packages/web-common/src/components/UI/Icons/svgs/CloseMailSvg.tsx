import React from 'react';
import { ReactComponent as IconSvg } from '@/images/icons/close_modal.svg';

const CloseMailIcon = (props: any) => <IconSvg onClick={props.onClick} className={props.className || ''} />;

export default CloseMailIcon;
