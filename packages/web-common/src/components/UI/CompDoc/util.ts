export const copyToClipboard = (text: string) => {
  if (window?.clipboardData && window?.clipboardData.setData) {
    // IE
    return window.clipboardData.setData('Text', text);
  } else {
    if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
      let textarea = document.createElement('textarea');
      textarea.textContent = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand('copy');
      } catch (err) {
        throw err;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }
};
