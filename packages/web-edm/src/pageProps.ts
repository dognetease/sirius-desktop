import { DetailTabOption } from 'detail/detailEnums';

export interface EdmPageProps {
  qs: Record<string, string>;
  index?: number;
  target?: DetailTabOption;
  onSendSuccess?: () => void;
}
