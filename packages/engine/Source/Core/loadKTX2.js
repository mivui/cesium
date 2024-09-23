import Check from "./Check.js";
import Resource from "./Resource.js";
import KTX2Transcoder from "./KTX2Transcoder.js";

/**
 * 存储 KTX2 可以转码到的支持格式。在上下文创建期间调用。
 *
 * @param {boolean} s3tc 是否支持 S3TC
 * @param {boolean} pvrtc 是否支持 PVRTC
 * @param {boolean} astc 是否支持 ASTC
 * @param {boolean} etc 是否支持 ETC
 * @param {boolean} etc1 是否支持 ETC1
 * @param {boolean} bc7 是否支持 BC7
 * @private
 */
let supportedTranscoderFormats;

loadKTX2.setKTX2SupportedFormats = function (
  s3tc,
  pvrtc,
  astc,
  etc,
  etc1,
  bc7
) {
  supportedTranscoderFormats = {
    s3tc: s3tc,
    pvrtc: pvrtc,
    astc: astc,
    etc: etc,
    etc1: etc1,
    bc7: bc7,
  };
};

/**
 * 异步加载和解析给定的 URL 到 KTX2 文件，或解析 KTX2 文件的原始二进制数据。
 * 返回一个 Promise，该 Promise 将在加载后解析为包含图像缓冲区、宽度、高度和格式的对象，
 * 或 reject 如果 URL 加载失败或解析数据失败。数据已加载
 * 使用 XMLHttpRequest，这意味着为了向另一个源发出请求，
 * 服务器必须启用跨域资源共享 （CORS） 标头。
 * <p>
 * 以下是 KTX2 格式规范的一部分，但不受支持：
 * <ul>
 * <li>元数据</li>
 * <li>3D 纹理</li>
 * <li>纹理数组</li>
 * <li>视频</li>
 * </ul>
 * </p>
 *
 * @function loadKTX2
 *
 * @param {Resource|string|ArrayBuffer} resourceOrUrlOrBuffer 二进制数据或 ArrayBuffer 的 URL。
 * @returns {Promise<CompressedTextureBuffer>|undefined} 一个 Promise，在加载时将解析为请求的数据。如果 <code>request.throttle</code> 为 true，并且请求的优先级不够高，则返回 undefined。
 *
 * @exception {RuntimeError} 无效的 KTX2 文件。
 * 不支持 @exception {RuntimeError} KTX2 纹理数组。
 * @exception 不支持 KTX2 3D 纹理。
 * @exception {RuntimeError} 没有可用于 ETC1S 压缩 ktx2 的转码格式目标。
 * @exception {RuntimeError} 没有可用于 UASTC 压缩 ktx2 的转码格式目标。
 * @exception {RuntimeError} startTranscoding() 失败。
 * @exception {RuntimeError} transcodeImage() 失败。
 *
 * @example
 * // load a single URL asynchronously
 * Cesium.loadKTX2('some/url').then(function (ktx2Data) {
 *     const width = ktx2Data.width;
 *     const height = ktx2Data.height;
 *     const format = ktx2Data.internalFormat;
 *     const arrayBufferView = ktx2Data.bufferView;
 *     // use the data to create a texture
 * }).catch(function (error) {
 *     // an error occurred.
 * });
 *
 * @see {@link https://github.com/KhronosGroup/KTX-Specification|KTX file format}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 * @private
 */
function loadKTX2(resourceOrUrlOrBuffer) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("resourceOrUrlOrBuffer", resourceOrUrlOrBuffer);
  //>>includeEnd('debug');

  let loadPromise;
  if (
    resourceOrUrlOrBuffer instanceof ArrayBuffer ||
    ArrayBuffer.isView(resourceOrUrlOrBuffer)
  ) {
    loadPromise = Promise.resolve(resourceOrUrlOrBuffer);
  } else {
    const resource = Resource.createIfNeeded(resourceOrUrlOrBuffer);
    loadPromise = resource.fetchArrayBuffer();
  }

  // load module then return
  return loadPromise.then(function (data) {
    return KTX2Transcoder.transcode(data, supportedTranscoderFormats);
  });
}

export default loadKTX2;
