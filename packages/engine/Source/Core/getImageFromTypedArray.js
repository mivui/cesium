/**
 * 从像素值的 TypedArray 构造图像
 *
 * @param {Uint8Array} typedArray 像素值数组
 * @param {number} width 要创建的图片宽度
 * @param {number} height 要创建的图片高度
 * @returns {HTMLCanvasElement} 包含构造图像的新画布
 *
 * @private
 */
function getImageFromTypedArray(typedArray, width, height) {
  // Input typedArray is Uint8Array, ImageData needs Uint8ClampedArray
  // To avoid copying, make a new DataView of the same buffer
  const dataArray = new Uint8ClampedArray(typedArray.buffer);
  const imageData = new ImageData(dataArray, width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);

  return canvas;
}
export default getImageFromTypedArray;
