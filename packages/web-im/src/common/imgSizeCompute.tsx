const sizeMapFunctions = {
  'wlt-hlt': function (wScale, hScale) {
    return {
      height: '120px',
      width: 'auto',
      maxWidth: '1000px',
      minHeight: '120px',
      objectFit: 'cover',
    };
  },
  'wequal-hlt': function () {
    return {
      height: '120px',
      objecFit: 'cover',
      maxWidth: '1000px',
    };
  },
  'wgt-hlt': function (wScale, hScale) {
    return {
      height: '120px',
      objectFit: 'cover',
      maxWidth: '1000px',
    };
  },
  'wlt-hequal': function () {
    return {
      width: '120px',
      objectFit: 'cover',
      maxHeight: '300px',
    };
  },
  'wequal-hequal': function (wScale, hScale, curWidth) {
    return {
      width: `${curWidth}px`,
      objectFit: 'cover',
    };
  },
  'wgt-hequal': function () {
    return {
      width: '1000px',
      objectFit: 'cover',
      minHeight: '120px',
    };
  },
  'wlt-hgt': function () {
    return {
      width: '120px',
      objectFit: 'cover',
      maxHeight: '300px',
    };
  },
  'wequal-hgt': function () {
    return {
      height: '300px',
      objectFit: 'cover',
      width: 'auto',
      minWidth: '120px',
    };
  },
  'wgt-hgt': function (wScale, hScale) {
    // 获取两个数值都大于最大值
    if (wScale > hScale) {
      /**
       * 2000*600
       * 6000*600
       */
      return {
        width: '1000px',
        objectFit: 'cover',
        height: 'auto',
        minHeight: '120px',
      };
    }
    return {
      height: '300px',
      objectFit: 'cover',
      width: 'auto',
      minWidth: '120px',
    };
  },
};

export const computeImageSize = (curWidth, widthLimit, curHeight, heightLimit) => {
  const scale = curWidth / curHeight;
  const [widthMinLimit, widthMaxLimit] = widthLimit;
  const [heightMinLimit, heightMaxLimit] = heightLimit;

  /**
   * 总共分为以下九种情况
   * [[wlt,hlt],[wequal,hlt],[wgt,hlt]]
   * [[wlt,hequal],[wequal,hequal],[wgt,hequal]]
   * [[wlt,hgt],[wequal,hgt],[wgt,hgt]]
   */

  let wStatus = '';
  if (widthMinLimit >= curWidth) {
    wStatus = 'wlt';
  } else if (widthMaxLimit <= curWidth) {
    wStatus = 'wgt';
  } else {
    wStatus = 'wequal';
  }

  let hStatus = '';
  if (heightMinLimit >= curHeight) {
    hStatus = 'hlt';
  } else if (heightMaxLimit <= curHeight) {
    hStatus = 'hgt';
  } else {
    hStatus = 'hequal';
  }
  const wScale = curWidth / widthMaxLimit;
  const hScale = curHeight / heightMaxLimit;
  return sizeMapFunctions[`${wStatus}-${hStatus}`](wScale, hScale, curWidth, curHeight);
};
