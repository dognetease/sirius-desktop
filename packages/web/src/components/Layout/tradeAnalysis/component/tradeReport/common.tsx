export const drawWaterImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
    ctx.globalAlpha = 0.5;
    ctx.translate(160 / 2, 160 / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    ctx.fillText('网易外贸通' || '', 0, 0);
  }
  return canvas.toDataURL('image/png');
};

const drawFinallyImage = (waterImage: string, underlineImage: string) => {
  return new Promise((reslove, reject) => {
    const c = document.createElement('canvas');
    const img = new Image();
    img.src = underlineImage;
    img.onload = () => {
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        const image = new Image();
        image.src = waterImage;
        image.onload = () => {
          ctx?.drawImage(img, 0, 0, c.width, c.height);
          var pat = ctx.createPattern(image, 'repeat');
          ctx.rect(0, 0, c.width, c.height);
          ctx.fillStyle = pat ?? '';
          ctx.fill();
          const dataURL = c.toDataURL('image/png');
          reslove(dataURL);
        };
      } else {
        reslove(underlineImage);
      }
    };
  });
};

export default drawFinallyImage;
