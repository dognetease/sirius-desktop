import React from 'react';
import { ReactComponent as IconSvg } from '@/images/icons/search.svg';
import { ReactComponent as IconSvg2 } from '@/images/icons/waimao/global_search_icon.svg';
import { ReactComponent as IconSvg3 } from '@/images/icons/waimao/search-icon-at-input.svg';
import { ReactComponent as IconSvg4 } from '@/images/icons/waimao/search-icon-at-input-hover.svg';
// import { ReactComponent as IconSvgEnhance } from "../../../../images/icons/contact_enhance.svg";

export const SearchIconAtInput = ({ hover }: { hover?: boolean }) => (!hover ? <IconSvg3 /> : <IconSvg4 />);

const SearchIcon = (props: any) => <IconSvg {...props} />;
export const SearchGlobalIcon = () => <IconSvg2 />;
// ContactSvg.Enhance = () => <IconSvgEnhance />

export default SearchIcon;
