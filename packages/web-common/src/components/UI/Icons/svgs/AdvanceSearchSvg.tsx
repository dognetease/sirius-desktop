import React from 'react';
import { ReactComponent as IconSvg } from '@/images/icons/mail/advanced_search.svg';

interface Prop {
  className?: string;
}

const AdvancedSearchSvg = ({ className }: Prop) => <IconSvg className={className} />;

export default AdvancedSearchSvg;
