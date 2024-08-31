import { getIn18Text } from 'api';
/**
 * utils
 */
interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}
let _ctx: CanvasRenderingContext2D | null = null;
function stringToRgb(value: string) {
  let canvasContext = _ctx;
  if (canvasContext === null) {
    const c = document.createElement('canvas');
    canvasContext = c.getContext('2d');
    _ctx = canvasContext;
  }
  canvasContext = canvasContext as CanvasRenderingContext2D;
  canvasContext.clearRect(1, 1, 1, 1);
  canvasContext.fillStyle = value;
  canvasContext.fillRect(1, 1, 1, 1);
  const imgData = canvasContext.getImageData(1, 1, 1, 1);
  return {
    r: imgData.data[0],
    g: imgData.data[1],
    b: imgData.data[2],
    a: imgData.data[4] / 255,
  };
}
export function parseColor(color: string): Color {
  if (color.startsWith('#')) {
    // hex
    let hex = color.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }
  if ((color.startsWith('rgba(') || color.startsWith('rgba(')) && color.endsWith(')')) {
    // rgb rgba
    const isRgba = color.startsWith('rgba(');
    const colors = color.substring(isRgba ? 5 : 4, color.length - 1);
    const arr = colors.split(',').map(s => s.trim());
    const c: Color = {
      r: parseInt(arr[0], 10),
      g: parseInt(arr[1], 10),
      b: parseInt(arr[2], 10),
    };
    if (arr[3]) {
      c.a = parseFloat(arr[3]);
    }
  }
  // 'white', 'red'...
  return stringToRgb(color);
}
export function toColorString(color: Color) {
  const { r, g, b, a } = color;
  let alpha = a;
  if (alpha === undefined) {
    alpha = 255;
  }
  if (alpha === 255) {
    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
  }
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
const defaultColors = ['#6BA9FF', '#F7A87C', '#AA90F4', '#70CCAB'];
const defaultBgColors = ['rgba(107, 169, 255, 0.12)', 'rgba(247, 168, 124, 0.12)', 'rgba(170, 144, 244, 0.12)', 'rgba(112, 204, 171, 0.12)'];
export function getLabelStyle(labelId: string, labelColor?: string) {
  let color = labelColor;
  if (!color) {
    const idx = Number(labelId) % defaultColors.length;
    color = defaultColors[idx];
    return {
      color,
      backgroundColor: defaultBgColors[idx],
    };
  }
  const bgColor = parseColor(color);
  // bgColor.a = (bgColor.a ?? 1) * 0.12;
  const opactity = 0.1;
  bgColor.r = Math.floor(bgColor.r * opactity + 255 * (1 - opactity));
  bgColor.g = Math.floor(bgColor.g * opactity + 255 * (1 - opactity));
  bgColor.b = Math.floor(bgColor.b * opactity + 255 * (1 - opactity));
  return {
    color,
    backgroundColor: toColorString(bgColor),
  };
}
export const currencyMap: Record<number | string, string> = {
  0: getIn18Text('RENMINBI'),
  1: getIn18Text('MEIJIN'),
  2: getIn18Text('AOYUAN'),
  3: getIn18Text('JIAYUAN'),
  4: getIn18Text('OUYUAN'),
  5: getIn18Text('HANYUAN'),
  6: getIn18Text('YINGBANG'),
  7: getIn18Text('GANGBI'),
  8: getIn18Text('YINNILUBI'),
  9: getIn18Text('RIYUAN'),
  10: getIn18Text('MALAIXIYALINJITE'),
  11: getIn18Text('XINXILANYUAN'),
  12: getIn18Text('FEILVBINBISUO'),
  13: getIn18Text('ELUOSILUBU'),
  14: getIn18Text('XINJIAPOYUAN'),
  15: getIn18Text('TAIZHU'),
  16: getIn18Text('XINTAIBI'),
};
