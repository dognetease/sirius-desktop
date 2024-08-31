const fetchImage = url =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'Anonymous';
    im.onload = () => {
      resolve(im);
    };
    im.onerror = () => {
      reject();
    };
    im.src = url;
  });

const toObjectUrl = canvas => {
  const promise = new Promise<string>((resolve, reject) => {
    if (!canvas) {
      reject();
    } else {
      // chrome等现代浏览器
      if (canvas.toBlob) {
        canvas.toBlob(
          blob => {
            resolve(URL.createObjectURL(blob));
          },
          'image/png',
          1
        );
      } else if (canvas.msToBlob) {
        // IE.
        const blob = canvas.msToBlob();
        resolve(URL.createObjectURL(blob));
      } else {
        const data = canvas.toDataURL('image/png', 1);
        resolve(data);
      }
    }
  });
  return promise;
};

export const convertRotateImg = (url, orientation) =>
  new Promise<string>((resolve, reject) => {
    fetchImage(url).then((img: HTMLImageElement) => {
      const { naturalHeight: height, naturalWidth: width } = img;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      const direction = ((orientation + 360) % 360) / 90;
      switch (direction) {
        case 1: {
          canvas.width = height;
          canvas.height = width;
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, 0, -height);
          break;
        }
        case 2: {
          canvas.width = width;
          canvas.height = height;
          ctx.rotate((180 * Math.PI) / 180);
          ctx.drawImage(img, -width, -height);
          break;
        }
        case 3: {
          canvas.width = height;
          canvas.height = width;
          ctx.rotate((270 * Math.PI) / 180);
          ctx.drawImage(img, -width, 0);
          break;
        }
        case 0:
        case 4:
        default: {
          canvas.width = width;
          canvas.height = height;
          ctx.rotate(0);
          ctx.drawImage(img, 0, 0);
          break;
        }
      }
      toObjectUrl(canvas).then(resolve, reject);
    });
  });
