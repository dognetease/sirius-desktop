import React from 'react';
import { ReactComponent as IconSvg } from './plus.svg';

interface Prop {
  className?: string;
}

const AddSvg = ({ className }: Prop) => <IconSvg className={className} />;

export default AddSvg;
