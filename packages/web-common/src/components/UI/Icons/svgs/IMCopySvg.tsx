import React from 'react';
import { ReactComponent as IconSvg } from '@/images/icons/im/copy.svg';
import { ReactComponent as IconHoverSvg } from '@/images/icons/im/copy-hover.svg';

const CopySvg = () => <IconSvg />;

CopySvg.Enhance = () => <IconSvg />;
export const CopyCheckedSvg = () => <IconHoverSvg />;
export default CopySvg;
