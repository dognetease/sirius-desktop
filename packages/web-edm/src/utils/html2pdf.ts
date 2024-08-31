import html2pdf from 'html2pdf.js';
import { inWindow } from 'api';

/**
 * 导出pdf，执行完成后自动下载
 */
export const generatePdf = (conf: { filename: string; target: HTMLElement }): Promise<any> => {
  if (!inWindow()) {
    return Promise.resolve('');
  }

  const { filename, target } = conf;

  return html2pdf()
    .set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { useCORS: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      avoid: ['.yingxiao-header'],
      before: ['yingxiao-header'],
    })
    .from(target)
    .save();
};
