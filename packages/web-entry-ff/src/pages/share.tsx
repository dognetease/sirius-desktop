import React from 'react';
import { PageProps } from 'gatsby';
import SharePageComp from '@web-disk/sharePage';

const SharePage: React.FC<PageProps> = props => {
  const { hash } = props.location;
  return <SharePageComp hash={hash} />;
};

export default SharePage;
