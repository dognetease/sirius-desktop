import * as React from 'react';
import { PageProps } from 'gatsby';
import SiriusLayout from '@web/layouts';

const Error404Page: React.FC<PageProps> = () => (
  <SiriusLayout.ContainerLayout isLogin={false}>
    <div>
      <h1>You are here!</h1>
      <h2>But nothing found for you #404</h2>
    </div>
  </SiriusLayout.ContainerLayout>
);

export default Error404Page;
