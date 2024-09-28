import defaultValue from "../../Core/defaultValue.js";
import defined from "../../Core/defined.js";
import DeveloperError from "../../Core/DeveloperError.js";
import Resource from "../../Core/Resource.js";
import PixelFormat from "../../Core/PixelFormat.js";
import PixelDatatype from "../../Renderer/PixelDatatype.js";
import Sampler from "../../Renderer/Sampler.js";
import TextureWrap from "../../Renderer/TextureWrap.js";

/**
 * 一个简单的结构体，用作 <code>sampler2D</code> 值的值
 * 均匀。这与 {@link CustomShader} 和 {@link TextureManager} 一起使用
 *
 * @param {object} options  对象，具有以下属性:
 * @param {Uint8Array} [options.typedArray] 存储纹理内容的类型化数组。值按行优先顺序存储。由于 WebGL 对纹理使用 y-up 约定，因此行是从下到上列出的。
 * @param {number} [options.width] 宽度 image.当 options.typedArray 存在时是必需的
 * @param {number} [options.height] 高度 image.当 options.typedArray 存在时是必需的。
 * @param {string|Resource} [options.url] 指向纹理图像的 URL 字符串或资源。
 * @param {boolean} [options.repeat=true] 定义后，纹理采样器将设置为在两个方向上环绕
 * @param {PixelFormat} [options.pixelFormat=PixelFormat.RGBA] 定义 options.typedArray 后，这用于确定纹理的像素格式
 * @param {PixelDatatype} [options.pixelDatatype=PixelDatatype.UNSIGNED_BYTE] 定义 options.typedArray 时，这是类型化数组中像素值的数据类型。
 * @param {TextureMinificationFilter} [options.minificationFilter=TextureMinificationFilter.LINEAR] 纹理采样器的缩小过滤器。
 * @param {TextureMagnificationFilter} [options.magnificationFilter=TextureMagnificationFilter.LINEAR] 纹理采样器的放大滤镜。
 * @param {number} [options.maximumAnisotropy=1.0] 纹理采样器的最大各向异性
 *
 * @alias TextureUniform
 * @constructor
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function TextureUniform(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
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
  this.pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
  this.pixelDatatype = defaultValue(
    options.pixelDatatype,
    PixelDatatype.UNSIGNED_BYTE,
  );

  let resource = options.url;
  if (typeof resource === "string") {
    resource = Resource.createIfNeeded(resource);
  }
  this.resource = resource;

  const repeat = defaultValue(options.repeat, true);
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
