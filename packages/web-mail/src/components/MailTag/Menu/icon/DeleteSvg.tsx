import React from 'react';
import { ReactComponent as IconSvg } from './delete.svg';

interface Prop {
  className?: string;
}

const DeleteSvg = ({ className }: Prop) => <IconSvg className={className} />;

export default DeleteSvg;
