import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Resource from "../Core/Resource.js";
import CubeMap from "./CubeMap.js";

/**
 * 异步加载 6 张图像并创建一个 cube 映射。 返回一个 Promise，该 Promise
 * 将在加载后解析为 {@link CubeMap}，如果任何图像加载失败，则拒绝。
 *
 * @function loadCubeMap
 *
 * @param {Context} context 用于创建多维数据集映射的上下文。
 * @param {object} urls 每张图片的源 URL。 请参阅下面的示例。
 * @param {boolean} [skipColorSpaceConversion=false] 如果为 true，则图像中的任何自定义灰度系数或颜色配置文件都将被忽略。
 * @returns {Promise<CubeMap>} 一个 Promise，该 Promise 在加载时将解析为请求的 {@link CubeMap}。
 *
 * @exception {DeveloperError} 上下文是必需的。
 * @exception {DeveloperError} urls 是必需的，并且必须具有 positiveX、negativeX、positiveY、negativeY、positiveZ 和 negativeZ 属性。
 *
 *
 * @example
 * Cesium.loadCubeMap(context, {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 * }).then(function(cubeMap) {
 *     // use the cubemap
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 *
 * @private
 */
function loadCubeMap(context, urls, skipColorSpaceConversion) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("context", context);
  Check.defined("urls", urls);
  if (
    Object.values(CubeMap.FaceName).some((faceName) => !defined(urls[faceName]))
  ) {
    throw new DeveloperError(
      "urls must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties."
    );
  }
  //>>includeEnd('debug');

  // PERFORMANCE_IDEA: Given the size of some cube maps, we should consider tiling them, which
  // would prevent hiccups when uploading, for example, six 4096x4096 textures to the GPU.
  //
  // Also, it is perhaps acceptable to use the context here in the callbacks, but
  // ideally, we would do it in the primitive's update function.
  const flipOptions = {
    flipY: true,
    skipColorSpaceConversion: skipColorSpaceConversion,
    preferImageBitmap: true,
  };

  const facePromises = [
    Resource.createIfNeeded(urls.positiveX).fetchImage(flipOptions),
    Resource.createIfNeeded(urls.negativeX).fetchImage(flipOptions),
    Resource.createIfNeeded(urls.positiveY).fetchImage(flipOptions),
    Resource.createIfNeeded(urls.negativeY).fetchImage(flipOptions),
    Resource.createIfNeeded(urls.positiveZ).fetchImage(flipOptions),
    Resource.createIfNeeded(urls.negativeZ).fetchImage(flipOptions),
  ];

  return Promise.all(facePromises).then(function (images) {
    return new CubeMap({
      context: context,
      source: {
        positiveX: images[0],
        negativeX: images[1],
        positiveY: images[2],
        negativeY: images[3],
        positiveZ: images[4],
        negativeZ: images[5],
      },
    });
  });
}
export default loadCubeMap;
