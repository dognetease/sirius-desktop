const { Buffer } = require('node:buffer');
const isSvg = require('is-svg');
const { optimize } = require('svgo');

const imageminSvgo = options => async buffer => {
  options = { multipass: true, ...options };

  if (!isSvg(buffer)) {
    return buffer;
  }

  if (Buffer.isBuffer(buffer)) {
    buffer = buffer.toString();
  }

  const { data } = optimize(buffer, options);
  return Buffer.from(data);
};

module.exports = imageminSvgo;
