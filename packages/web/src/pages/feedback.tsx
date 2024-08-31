import * as React from 'react';
import { PageProps } from 'gatsby';
import FeedbackContent from '@/components/Electron/FeedBack/feedbackContent';
import SiriusLayout from '../layouts';

const FeedbackPage: React.FC<PageProps> = () => (
  <SiriusLayout.ContainerLayout isLogin showMin={false} showMax={false}>
    <FeedbackContent />
  </SiriusLayout.ContainerLayout>
);

export default FeedbackPage;
