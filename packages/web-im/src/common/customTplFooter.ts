export interface FooterAction {
  req_api: string; // 请求接口
  resp_field: string; // 任务状态对应的keys
  max_age: number;
  elements: FooterFrame[];
}

export interface FooterFrame {
  status: string;
  align: string; // 对齐方向
  items: (FooterText | FooterButton | FooterLink)[];
}

// control基础字段
export interface FooterControl {
  type: string;
  text: string;
  alt_text: string;
  style?: string;
}

export interface FooterText extends FooterControl {
  type: 'text';
}

export interface FooterButton extends FooterControl {
  type: 'button';
  'button-type'?: 'primary' | 'dashed' | 'link' | 'default';
  'button-size'?: 'small' | 'middle' | number;
  action: string;
  req_type: 'post' | 'put' | 'delete';
  status: string;
  form: Record<string, any>;
}

export interface FooterLink extends FooterControl {
  type: 'link';
  src: string;
  link_type: 'button' | 'link'; // button:按钮样式 link:链接样式
  'button-type'?: 'primary' | 'dashed' | 'link' | 'default';
  'button-size'?: 'small' | 'middle' | number;
}
