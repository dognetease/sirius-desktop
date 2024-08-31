import moment from 'moment';

/**
 * 获取内容转换为引用样式
 */
export const getContentAsReplay = (
  content: string | undefined,
  info: {
    fromEmail: string;
    nickname: string;
    subject: string;
  }
): string => {
  if (!content || !info.nickname || !info.subject) {
    return '';
  }

  const quoteId = 'isForwardContent';

  return (
    '<div class="edm-empty-line" style="font-size: 14px;"><br></div><div class="edm-empty-line" style="font-size: 14px;"><br></div><div class="edm-empty-line" style="font-size: 14px;"><br></div>' +
    "<blockquote id='" +
    quoteId +
    "' style='PADDING-LEFT: 1ex; MARGIN: 0px 0px 0px 0.8ex; BORDER-LEFT: #ccc 1px solid; margin: 0'>" +
    // 引用label
    "<div style='color: #7d8085'>" +
    'Original' +
    ':</div>' +
    "<ul style='color: #7d8085; font-size:12px; padding-left: 20px'>" +
    '<li>' +
    'From' +
    '：' +
    info.nickname +
    '<' +
    '<a href="mailto:' +
    info.fromEmail +
    '">' +
    info.fromEmail +
    '</a>' +
    '>' +
    '</li>' +
    '<li>' +
    'Date' +
    '：' +
    moment().format('yyyy-MM-DD HH:mm:ss') +
    '</li>' +
    '<li>' +
    'Subject' +
    '：' +
    info.subject +
    '</li>' +
    '</ul>' +
    content +
    '</blockquote>'
  );
};
