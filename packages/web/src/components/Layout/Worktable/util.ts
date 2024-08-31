const RGBToHex = (str: string) => {
  let res = '#';
  str.replace(/\d{1,3}/g, word => {
    res += ('0' + parseInt(word).toString(16)).slice(-2);
    return '';
  });
  return res;
};

export function getRandomColor(num: number, excludeColors: string[] = [], maxTries: number = 50) {
  let colors = [];

  const generateColor = (tryCount: number): string => {
    if (tryCount >= maxTries) {
      return '';
    }

    const red = Math.floor(Math.random() * 255) + 1; // 1~255
    const green = Math.floor(Math.random() * 255) + 1; // 1~255
    const blue = Math.floor(Math.random() * 255) + 1; // 1~255
    const color = 'rgb(' + red + ',' + green + ',' + blue + ')';
    const hexColor = RGBToHex(color);
    return excludeColors.includes(hexColor) ? generateColor(tryCount + 1) : hexColor;
  };

  for (let i = 0; i < num; i++) {
    colors.push(generateColor(0));
  }
  return colors;
}
