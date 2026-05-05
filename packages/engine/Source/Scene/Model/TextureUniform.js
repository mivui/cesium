import Frozen from "../../Core/Frozen.js";
import defined from "../../Core/defined.js";
import DeveloperError from "../../Core/DeveloperError.js";
import Resource from "../../Core/Resource.js";
import PixelFormat from "../../Core/PixelFormat.js";
import PixelDatatype from "../../Renderer/PixelDatatype.js";
import Sampler from "../../Renderer/Sampler.js";
import TextureWrap from "../../Renderer/TextureWrap.js";

/**
 * 一个简单结构体，用作 <code>sampler2D</code> 类型 uniform 的值。它与 {@link CustomShader} 和 {@link TextureManager} 一起使用
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Uint8Array} [options.typedArray] 存储纹理内容的类型化数组。值按行主序存储。由于 WebGL 使用 y 轴向上的纹理约定，行从下到上排列。
 * @param {number} [options.width] 图像的宽度。当 options.typedArray 存在时为必需。
 * @param {number} [options.height] 图像的高度。当 options.typedArray 存在时为必需。
 * @param {string|Resource} [options.url] 指向纹理图像的 URL 字符串或资源。
 * @param {boolean} [options.repeat=true] 当定义时，纹理采样器将设置为在两个方向上环绕。
 * @param {PixelFormat} [options.pixelFormat=PixelFormat.RGBA] 当 options.typedArray 定义时，用于确定纹理的像素格式。
 * @param {PixelDatatype} [options.pixelDatatype=PixelDatatype.UNSIGNED_BYTE] 当 options.typedArray 定义时，这是类型化数组中像素值的数据类型。
 * @param {TextureMinificationFilter} [options.minificationFilter=TextureMinificationFilter.LINEAR] 纹理采样器的缩小过滤器。
 * @param {TextureMagnificationFilter} [options.magnificationFilter=TextureMagnificationFilter.LINEAR] 纹理采样器的放大过滤器。
 * @param {number} [options.maximumAnisotropy=1.0] 纹理采样器的最大各向异性。
 *
 * @alias TextureUniform
 * @constructor
 *
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
function TextureUniform(options) {
  options = options ?? Frozen.EMPTY_OBJECT;
  //>>includeStart('debug', pragmas.debug);
  const hasTypedArray = defined(options.typedArray);
  const hasUrl = defined(options.url);
  if (hasTypedArray === hasUrl) {
    throw new DeveloperError(
      "exactly one of options.typedArray, options.url must be defined",
    );
  }
  if (hasTypedArray && (!defined(options.width) || !defined(options.height))) {
    throw new DeveloperError(
      "options.width and options.height are required when options.typedArray is defined",
    );
  }
  //>>includeEnd('debug');

  this.typedArray = options.typedArray;
  this.width = options.width;
  this.height = options.height;
  this.pixelFormat = options.pixelFormat ?? PixelFormat.RGBA;
  this.pixelDatatype = options.pixelDatatype ?? PixelDatatype.UNSIGNED_BYTE;

  let resource = options.url;
  if (typeof resource === "string") {
    resource = Resource.createIfNeeded(resource);
  }
  this.resource = resource;

  const repeat = options.repeat ?? true;
  const wrap = repeat ? TextureWrap.REPEAT : TextureWrap.CLAMP_TO_EDGE;
  this.sampler = new Sampler({
    wrapS: wrap,
    wrapT: wrap,
    minificationFilter: options.minificationFilter,
    magnificationFilter: options.magnificationFilter,
    maximumAnisotropy: options.maximumAnisotropy,
  });
}

export default TextureUniform;
