import CesiumMath from "./Math.js";

/**
 * 调整图像大小以确保宽度和高度均为 2 的幂。
 * 注意：输入图像的重新采样更大，而不是填充。
 * 图像的纵横比可能会发生变化。
 *
 * @param {HTMLImageElement|HTMLCanvasElement} image 要调整大小的图片
 * @returns {HTMLCanvasElement} 绘制了调整大小后的图像的新画布
 *
 * @private
 */
function resizeImageToNextPowerOfTwo(image) {
  const canvas = document.createElement("canvas");
  canvas.width = CesiumMath.nextPowerOfTwo(image.width);
  canvas.height = CesiumMath.nextPowerOfTwo(image.height);
  const canvasContext = canvas.getContext("2d");
  canvasContext.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}
export default resizeImageToNextPowerOfTwo;
