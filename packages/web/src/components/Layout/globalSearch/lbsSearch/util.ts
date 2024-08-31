export const checkIsProxy = () => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;

    img.onload = resolve;

    img.onerror = reject;

    setTimeout(reject, 3000);
  });
};
