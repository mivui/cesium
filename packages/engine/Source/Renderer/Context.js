import Buffer from "./Buffer.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import createGuid from "../Core/createGuid.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Geometry from "../Core/Geometry.js";
import GeometryAttribute from "../Core/GeometryAttribute.js";
import loadKTX2 from "../Core/loadKTX2.js";
import Matrix4 from "../Core/Matrix4.js";
import PixelFormat from "../Core/PixelFormat.js";
import PrimitiveType from "../Core/PrimitiveType.js";
import RuntimeError from "../Core/RuntimeError.js";
import WebGLConstants from "../Core/WebGLConstants.js";
import ViewportQuadVS from "../Shaders/ViewportQuadVS.js";
import BufferUsage from "./BufferUsage.js";
import ClearCommand from "./ClearCommand.js";
import ContextLimits from "./ContextLimits.js";
import CubeMap from "./CubeMap.js";
import DrawCommand from "./DrawCommand.js";
import PassState from "./PassState.js";
import PickId from "./PickId.js";
import PixelDatatype from "./PixelDatatype.js";
import RenderState from "./RenderState.js";
import ShaderCache from "./ShaderCache.js";
import ShaderProgram from "./ShaderProgram.js";
import Texture from "./Texture.js";
import TextureCache from "./TextureCache.js";
import UniformState from "./UniformState.js";
import VertexArray from "./VertexArray.js";

/**
 * @private
 * @constructor
 *
 * @param {HTMLCanvasElement} canvas 上下文将关联的 canvas 元素
 * @param {ContextOptions} [options] 用于控制上下文 WebGL 设置的选项
 */
function Context(canvas, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("canvas", canvas);
  //>>includeEnd('debug');

  const {
    getWebGLStub,
    requestWebgl1,
    webgl: webglOptions = {},
    allowTextureFilterAnisotropic = true,
  } = options ?? {};

  // 覆盖部分 WebGL 默认值
  webglOptions.alpha = webglOptions.alpha ?? false; // WebGL 默认为 true
  webglOptions.stencil = webglOptions.stencil ?? true; // WebGL 默认为 false
  webglOptions.powerPreference =
    webglOptions.powerPreference ?? "high-performance"; // WebGL 默认为 "default"

  const glContext = defined(getWebGLStub)
    ? getWebGLStub(canvas, webglOptions)
    : getWebGLContext(canvas, webglOptions, requestWebgl1);

  // 获取上下文类型。如果 WebGL2 不受支持，instanceof 会抛出异常
  const webgl2Supported = typeof WebGL2RenderingContext !== "undefined";
  const webgl2 = webgl2Supported && glContext instanceof WebGL2RenderingContext;

  this._canvas = canvas;
  this._originalGLContext = glContext;
  this._gl = glContext;
  this._webgl2 = webgl2;
  this._id = createGuid();

  // 默认禁用验证和日志记录以提升速度。
  this.validateFramebuffer = false;
  this.validateShaderProgram = false;
  this.logShaderCompilation = false;

  this._throwOnWebGLError = false;

  this._shaderCache = new ShaderCache(this);
  this._textureCache = new TextureCache();

  const gl = glContext;

  this._stencilBits = gl.getParameter(gl.STENCIL_BITS);

  ContextLimits._maximumCombinedTextureImageUnits = gl.getParameter(
    gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
  );
  ContextLimits._maximumCubeMapSize = gl.getParameter(
    gl.MAX_CUBE_MAP_TEXTURE_SIZE,
  );
  ContextLimits._maximumFragmentUniformVectors = gl.getParameter(
    gl.MAX_FRAGMENT_UNIFORM_VECTORS,
  );
  ContextLimits._maximumTextureImageUnits = gl.getParameter(
    gl.MAX_TEXTURE_IMAGE_UNITS,
  );
  ContextLimits._maximumRenderbufferSize = gl.getParameter(
    gl.MAX_RENDERBUFFER_SIZE,
  );
  ContextLimits._maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  ContextLimits._maximum3DTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
  ContextLimits._maximumVaryingVectors = gl.getParameter(
    gl.MAX_VARYING_VECTORS,
  );
  ContextLimits._maximumVertexAttributes = gl.getParameter(
    gl.MAX_VERTEX_ATTRIBS,
  );
  ContextLimits._maximumVertexTextureImageUnits = gl.getParameter(
    gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
  );
  ContextLimits._maximumVertexUniformVectors = gl.getParameter(
    gl.MAX_VERTEX_UNIFORM_VECTORS,
  );

  ContextLimits._maximumSamples = this._webgl2
    ? gl.getParameter(gl.MAX_SAMPLES)
    : 0;

  const aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE); // must include 1
  ContextLimits._minimumAliasedLineWidth = aliasedLineWidthRange[0];
  ContextLimits._maximumAliasedLineWidth = aliasedLineWidthRange[1];

  const aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); // must include 1
  ContextLimits._minimumAliasedPointSize = aliasedPointSizeRange[0];
  ContextLimits._maximumAliasedPointSize = aliasedPointSizeRange[1];

  const maximumViewportDimensions = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  ContextLimits._maximumViewportWidth = maximumViewportDimensions[0];
  ContextLimits._maximumViewportHeight = maximumViewportDimensions[1];

  const highpFloat = gl.getShaderPrecisionFormat(
    gl.FRAGMENT_SHADER,
    gl.HIGH_FLOAT,
  );
  ContextLimits._highpFloatSupported = highpFloat.precision !== 0;
  const highpInt = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT);
  ContextLimits._highpIntSupported = highpInt.rangeMax !== 0;

  this._antialias = gl.getContextAttributes().antialias;

  // 查询并初始化扩展
  this._standardDerivatives = !!getExtension(gl, ["OES_standard_derivatives"]);
  this._blendMinmax = !!getExtension(gl, ["EXT_blend_minmax"]);
  this._elementIndexUint = !!getExtension(gl, ["OES_element_index_uint"]);
  this._depthTexture = !!getExtension(gl, [
    "WEBGL_depth_texture",
    "WEBKIT_WEBGL_depth_texture",
  ]);
  this._fragDepth = !!getExtension(gl, ["EXT_frag_depth"]);
  this._debugShaders = getExtension(gl, ["WEBGL_debug_shaders"]);

  this._textureFloat = !!getExtension(gl, ["OES_texture_float"]);
  this._textureHalfFloat = !!getExtension(gl, ["OES_texture_half_float"]);

  this._textureFloatLinear = !!getExtension(gl, ["OES_texture_float_linear"]);
  this._textureHalfFloatLinear = !!getExtension(gl, [
    "OES_texture_half_float_linear",
  ]);

  this._supportsTextureLod = !!getExtension(gl, ["EXT_shader_texture_lod"]);

  this._colorBufferFloat = !!getExtension(gl, [
    "EXT_color_buffer_float",
    "WEBGL_color_buffer_float",
  ]);
  this._floatBlend = !!getExtension(gl, ["EXT_float_blend"]);
  this._colorBufferHalfFloat = !!getExtension(gl, [
    "EXT_color_buffer_half_float",
  ]);

  this._s3tc = !!getExtension(gl, [
    "WEBGL_compressed_texture_s3tc",
    "MOZ_WEBGL_compressed_texture_s3tc",
    "WEBKIT_WEBGL_compressed_texture_s3tc",
  ]);
  this._pvrtc = !!getExtension(gl, [
    "WEBGL_compressed_texture_pvrtc",
    "WEBKIT_WEBGL_compressed_texture_pvrtc",
  ]);
  this._astc = !!getExtension(gl, ["WEBGL_compressed_texture_astc"]);
  this._etc = !!getExtension(gl, ["WEBG_compressed_texture_etc"]);
  this._etc1 = !!getExtension(gl, ["WEBGL_compressed_texture_etc1"]);
  this._bc7 = !!getExtension(gl, ["EXT_texture_compression_bptc"]);

  // 必须将支持的格式传递给 loadKTX2，
  // 因为影像图层无法访问上下文。
  loadKTX2.setKTX2SupportedFormats(
    this._s3tc,
    this._pvrtc,
    this._astc,
    this._etc,
    this._etc1,
    this._bc7,
  );

  const textureFilterAnisotropic = allowTextureFilterAnisotropic
    ? getExtension(gl, [
        "EXT_texture_filter_anisotropic",
        "WEBKIT_EXT_texture_filter_anisotropic",
      ])
    : undefined;
  this._textureFilterAnisotropic = textureFilterAnisotropic;
  ContextLimits._maximumTextureFilterAnisotropy = defined(
    textureFilterAnisotropic,
  )
    ? gl.getParameter(textureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
    : 1.0;

  let glCreateVertexArray;
  let glBindVertexArray;
  let glDeleteVertexArray;

  let glDrawElementsInstanced;
  let glDrawArraysInstanced;
  let glVertexAttribDivisor;

  let glDrawBuffers;

  let vertexArrayObject;
  let instancedArrays;
  let drawBuffers;

  if (webgl2) {
    const that = this;

    glCreateVertexArray = function () {
      return that._gl.createVertexArray();
    };
    glBindVertexArray = function (vao) {
      that._gl.bindVertexArray(vao);
    };
    glDeleteVertexArray = function (vao) {
      that._gl.deleteVertexArray(vao);
    };

    glDrawElementsInstanced = function (
      mode,
      count,
      type,
      offset,
      instanceCount,
    ) {
      gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
    };
    glDrawArraysInstanced = function (mode, first, count, instanceCount) {
      gl.drawArraysInstanced(mode, first, count, instanceCount);
    };
    glVertexAttribDivisor = function (index, divisor) {
      gl.vertexAttribDivisor(index, divisor);
    };

    glDrawBuffers = function (buffers) {
      gl.drawBuffers(buffers);
    };
  } else {
    vertexArrayObject = getExtension(gl, ["OES_vertex_array_object"]);
    if (defined(vertexArrayObject)) {
      glCreateVertexArray = function () {
        return vertexArrayObject.createVertexArrayOES();
      };
      glBindVertexArray = function (vertexArray) {
        vertexArrayObject.bindVertexArrayOES(vertexArray);
      };
      glDeleteVertexArray = function (vertexArray) {
        vertexArrayObject.deleteVertexArrayOES(vertexArray);
      };
    }

    instancedArrays = getExtension(gl, ["ANGLE_instanced_arrays"]);
    if (defined(instancedArrays)) {
      glDrawElementsInstanced = function (
        mode,
        count,
        type,
        offset,
        instanceCount,
      ) {
        instancedArrays.drawElementsInstancedANGLE(
          mode,
          count,
          type,
          offset,
          instanceCount,
        );
      };
      glDrawArraysInstanced = function (mode, first, count, instanceCount) {
        instancedArrays.drawArraysInstancedANGLE(
          mode,
          first,
          count,
          instanceCount,
        );
      };
      glVertexAttribDivisor = function (index, divisor) {
        instancedArrays.vertexAttribDivisorANGLE(index, divisor);
      };
    }

    drawBuffers = getExtension(gl, ["WEBGL_draw_buffers"]);
    if (defined(drawBuffers)) {
      glDrawBuffers = function (buffers) {
        drawBuffers.drawBuffersWEBGL(buffers);
      };
    }
  }

  this.glCreateVertexArray = glCreateVertexArray;
  this.glBindVertexArray = glBindVertexArray;
  this.glDeleteVertexArray = glDeleteVertexArray;

  this.glDrawElementsInstanced = glDrawElementsInstanced;
  this.glDrawArraysInstanced = glDrawArraysInstanced;
  this.glVertexAttribDivisor = glVertexAttribDivisor;

  this.glDrawBuffers = glDrawBuffers;

  this._vertexArrayObject = !!vertexArrayObject;
  this._instancedArrays = !!instancedArrays;
  this._drawBuffers = !!drawBuffers;

  ContextLimits._maximumDrawBuffers = this.drawBuffers
    ? gl.getParameter(WebGLConstants.MAX_DRAW_BUFFERS)
    : 1;
  ContextLimits._maximumColorAttachments = this.drawBuffers
    ? gl.getParameter(WebGLConstants.MAX_COLOR_ATTACHMENTS)
    : 1;

  this._clearColor = new Color(0.0, 0.0, 0.0, 0.0);
  this._clearDepth = 1.0;
  this._clearStencil = 0;

  const us = new UniformState();
  const ps = new PassState(this);
  const rs = RenderState.fromCache();

  this._defaultPassState = ps;
  this._defaultRenderState = rs;
  // 默认纹理的值为 (1, 1, 1)
  // 默认发光纹理的值为 (0, 0, 0)
  // 默认法线纹理为 +z 方向，编码为 (0.5, 0.5, 1)
  this._defaultTexture = undefined;
  this._defaultEmissiveTexture = undefined;
  this._defaultNormalTexture = undefined;
  this._defaultCubeMap = undefined;

  this._us = us;
  this._currentRenderState = rs;
  this._currentPassState = ps;
  this._currentFramebuffer = undefined;
  this._maxFrameTextureUnitIndex = 0;

  // 顶点属性除数状态缓存。ANGLE 的变通方法（另请参阅 VertexArray.setVertexAttribDivisor）
  this._vertexAttribDivisors = [];
  this._previousDrawInstanced = false;
  for (let i = 0; i < ContextLimits._maximumVertexAttributes; i++) {
    this._vertexAttribDivisors.push(0);
  }

  this._pickObjects = new Map();
  this._nextPickColor = new Uint32Array(1);

  /**
   * 用于构造此上下文的选项
   *
   * @type {ContextOptions}
   */
  this.options = {
    getWebGLStub: getWebGLStub,
    requestWebgl1: requestWebgl1,
    webgl: webglOptions,
    allowTextureFilterAnisotropic: allowTextureFilterAnisotropic,
  };

  /**
   * 与此上下文关联的对象缓存。在 Context 被销毁之前，
   * 将对此对象字面量中每个具有 <code>destroy</code> 方法的对象调用该方法。
   * 这对于缓存任何可能存储为全局的对象非常有用，除了它们与特定上下文关联，
   * 并且可以管理它们的生命周期。
   *
   * @type {object}
   */
  this.cache = {};

  RenderState.apply(gl, rs, ps);
}

/**
 * @typedef {object} ContextOptions
 *
 * 用于控制 WebGL 上下文设置的选项。
 * <p>
 * <code>allowTextureFilterAnisotropic</code> 默认为 true，在支持 WebGL 扩展时启用
 * 各向异性纹理过滤。将其设置为 false 可提升性能，但会降低视觉质量，
 * 尤其是在地平线视图中。
 * </p>
 *
 * @property {boolean} [requestWebgl1=false] 如果为 true 且浏览器支持，则使用 WebGL 1 渲染上下文
 * @property {boolean} [allowTextureFilterAnisotropic=true] 如果为 true，在纹理采样期间使用各向异性过滤
 * @property {WebGLOptions} [webgl] 传递给 canvas.getContext 的 WebGL 选项
 * @property {Function} [getWebGLStub] 用于创建 WebGL 测试桩的函数
 */

/**
 * @private
 * @param {HTMLCanvasElement} canvas 上下文将关联的 canvas 元素
 * @param {WebGLOptions} webglOptions 传递给 HTMLCanvasElement.getContext() 的 WebGL 选项
 * @param {boolean} requestWebgl1 是否请求 WebGLRenderingContext 或 WebGL2RenderingContext。
 * @returns {WebGLRenderingContext|WebGL2RenderingContext}
 */
function getWebGLContext(canvas, webglOptions, requestWebgl1) {
  if (typeof WebGLRenderingContext === "undefined") {
    throw new RuntimeError(
      "The browser does not support WebGL.  Visit http://get.webgl.org.",
    );
  }

  // 确保请求 WebGL 2 时受支持。否则，回退到 WebGL 1。
  const webgl2Supported = typeof WebGL2RenderingContext !== "undefined";
  if (!requestWebgl1 && !webgl2Supported) {
    requestWebgl1 = true;
  }

  const contextType = requestWebgl1 ? "webgl" : "webgl2";
  const glContext = canvas.getContext(contextType, webglOptions);

  if (!defined(glContext)) {
    throw new RuntimeError(
      "The browser supports WebGL, but initialization failed.",
    );
  }

  return glContext;
}

/**
 * @typedef {object} WebGLOptions
 *
 * 传递给 HTMLCanvasElement.getContext() 的 WebGL 选项。
 * 参见 {@link https://registry.khronos.org/webgl/specs/latest/1.0/#5.2|WebGLContextAttributes}
 * 但请注意 'alpha'、'stencil' 和 'powerPreference' 的默认值已修改
 *
 * <p>
 * <code>alpha</code> 默认为 false，与标准 WebGL 默认值 true 相比可以提升性能。
 * 如果应用程序需要使用 alpha 混合将 Cesium 合成到其他 HTML 元素之上，请将
 * <code>alpha</code> 设置为 true。
 * </p>
 *
 * @property {boolean} [alpha=false] alpha 通道
 * @property {boolean} [depth=true] 深度缓冲区
 * @property {boolean} [stencil=false] 模板缓冲区
 * @property {boolean} [antialias=true] 抗锯齿
 * @property {boolean} [premultipliedAlpha=true] 预乘 alpha
 * @property {boolean} [preserveDrawingBuffer=false] 保留绘图缓冲区
 * @property {("default"|"low-power"|"high-performance")} [powerPreference="high-performance"] 功耗偏好
 * @property {boolean} [failIfMajorPerformanceCaveat=false] 性能警告时失败
 */

function errorToString(gl, error) {
  let message = "WebGL 错误:  ";
  switch (error) {
    case gl.INVALID_ENUM:
      message += "INVALID_ENUM (无效枚举)";
      break;
    case gl.INVALID_VALUE:
      message += "INVALID_VALUE (无效值)";
      break;
    case gl.INVALID_OPERATION:
      message += "INVALID_OPERATION (无效操作)";
      break;
    case gl.OUT_OF_MEMORY:
      message += "OUT_OF_MEMORY (内存不足)";
      break;
    case gl.CONTEXT_LOST_WEBGL:
      message += "CONTEXT_LOST_WEBGL (WebGL 上下文丢失)";
      break;
    default:
      message += `未知错误 (${error})`;
  }

  return message;
}

function createErrorMessage(gl, glFunc, glFuncArguments, error) {
  let message = `${errorToString(gl, error)}: ${glFunc.name}(`;

  for (let i = 0; i < glFuncArguments.length; ++i) {
    if (i !== 0) {
      message += ", ";
    }
    message += glFuncArguments[i];
  }
  message += ");";

  return message;
}

function throwOnError(gl, glFunc, glFuncArguments) {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    throw new RuntimeError(
      createErrorMessage(gl, glFunc, glFuncArguments, error),
    );
  }
}

function makeGetterSetter(gl, propertyName, logFunction) {
  return {
    get: function () {
      const value = gl[propertyName];
      logFunction(gl, `get: ${propertyName}`, value);
      return gl[propertyName];
    },
    set: function (value) {
      gl[propertyName] = value;
      logFunction(gl, `set: ${propertyName}`, value);
    },
  };
}

function wrapGL(gl, logFunction) {
  if (!defined(logFunction)) {
    return gl;
  }

  function wrapFunction(property) {
    return function () {
      const result = property.apply(gl, arguments);
      logFunction(gl, property, arguments);
      return result;
    };
  }

  const glWrapper = {};

  // JavaScript linters 通常要求 for..in 循环必须直接包含 if，
  // 但在下面的循环中，我们实际上打算迭代所有属性，包括
  // 原型中的属性。
  /*eslint-disable guard-for-in*/
  for (const propertyName in gl) {
    const property = gl[propertyName];

    // 包装我们遇到的任何函数，否则只将属性复制到包装器。
    if (property instanceof Function) {
      glWrapper[propertyName] = wrapFunction(property);
    } else {
      Object.defineProperty(
        glWrapper,
        propertyName,
        makeGetterSetter(gl, propertyName, logFunction),
      );
    }
  }
  /*eslint-enable guard-for-in*/

  return glWrapper;
}

function getExtension(gl, names) {
  const length = names.length;
  for (let i = 0; i < length; ++i) {
    const extension = gl.getExtension(names[i]);
    if (extension) {
      return extension;
    }
  }

  return undefined;
}

const defaultFramebufferMarker = {};

Object.defineProperties(Context.prototype, {
  id: {
    get: function () {
      return this._id;
    },
  },
  webgl2: {
    get: function () {
      return this._webgl2;
    },
  },
  canvas: {
    get: function () {
      return this._canvas;
    },
  },
  shaderCache: {
    get: function () {
      return this._shaderCache;
    },
  },
  textureCache: {
    get: function () {
      return this._textureCache;
    },
  },
  uniformState: {
    get: function () {
      return this._us;
    },
  },

  /**
   * 默认绑定的帧缓冲区中每个像素的模板位数。最小值为 8 位。
   * @memberof Context.prototype
   * @type {number}
   * @see {@link https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGet.xml|glGet} 使用 <code>STENCIL_BITS</code>。
   */
  stencilBits: {
    get: function () {
      return this._stencilBits;
    },
  },

  /**
   * 如果 WebGL 上下文支持模板缓冲区，则为 <code>true</code>。
   * 并非所有系统都支持模板缓冲区。
   * @memberof Context.prototype
   * @type {boolean}
   */
  stencilBuffer: {
    get: function () {
      return this._stencilBits >= 8;
    },
  },

  /**
   * 如果 WebGL 上下文支持抗锯齿，则为 <code>true</code>。默认情况下
   * 请求抗锯齿，但并非所有系统都支持。
   * @memberof Context.prototype
   * @type {boolean}
   */
  antialias: {
    get: function () {
      return this._antialias;
    },
  },

  /**
   * 如果 WebGL 上下文支持多重采样抗锯齿，则为 <code>true</code>。需要
   * WebGL2。
   * @memberof Context.prototype
   * @type {boolean}
   */
  msaa: {
    get: function () {
      return this._webgl2;
    },
  },

  /**
   * 如果支持 OES_standard_derivatives 扩展，则为 <code>true</code>。该
   * 扩展提供对 GLSL 中 <code>dFdx</code>、<code>dFdy</code> 和 <code>fwidth</code>
   * 函数的访问。使用这些函数的着色器仍需要显式启用
   * 扩展：<code>#extension GL_OES_standard_derivatives : enable</code>。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/gles/extensions/OES/OES_standard_derivatives.txt|OES_standard_derivatives}
   */
  standardDerivatives: {
    get: function () {
      return this._standardDerivatives || this._webgl2;
    },
  },

  /**
   * 如果支持 EXT_float_blend 扩展，则为 <code>true</code>。该
   * 扩展支持使用 32 位浮点值进行混合。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_float_blend/}
   */
  floatBlend: {
    get: function () {
      return this._floatBlend;
    },
  },

  /**
   * 如果支持 EXT_blend_minmax 扩展，则为 <code>true</code>。该
   * 扩展通过添加两个新的混合方程来扩展混合功能：
   * 源颜色和目标颜色的最小或最大颜色分量。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/}
   */
  blendMinmax: {
    get: function () {
      return this._blendMinmax || this._webgl2;
    },
  },

  /**
   * 如果支持 OES_element_index_uint 扩展，则为 <code>true</code>。该
   * 扩展允许使用无符号整数索引，可以通过
   * 消除无符号短整型索引引起的批次中断来提升性能。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/|OES_element_index_uint}
   */
  elementIndexUint: {
    get: function () {
      return this._elementIndexUint || this._webgl2;
    },
  },

  /**
   * 如果支持 WEBGL_depth_texture，则为 <code>true</code>。该扩展提供
   * 对深度纹理的访问，例如可以附加到帧缓冲区用于阴影映射。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/|WEBGL_depth_texture}
   */
  depthTexture: {
    get: function () {
      return this._depthTexture || this._webgl2;
    },
  },

  /**
   * 如果支持 OES_texture_float，则为 <code>true</code>。该扩展提供
   * 对浮点纹理的访问，例如可以附加到帧缓冲区用于高动态范围渲染。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_float/}
   */
  floatingPointTexture: {
    get: function () {
      return this._webgl2 || this._textureFloat;
    },
  },

  /**
   * 如果支持 OES_texture_half_float，则为 <code>true</code>。该扩展提供
   * 对半浮点纹理的访问，例如可以附加到帧缓冲区用于高动态范围渲染。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/}
   */
  halfFloatingPointTexture: {
    get: function () {
      return this._webgl2 || this._textureHalfFloat;
    },
  },

  /**
   * 如果支持 OES_texture_float_linear，则为 <code>true</code>。该扩展提供
   * 对浮点纹理的缩小和放大过滤器线性采样方法的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/}
   */
  textureFloatLinear: {
    get: function () {
      return this._textureFloatLinear;
    },
  },

  /**
   * 如果支持 OES_texture_half_float_linear，则为 <code>true</code>。该扩展提供
   * 对半浮点纹理的缩小和放大过滤器线性采样方法的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/}
   */
  textureHalfFloatLinear: {
    get: function () {
      return (
        (this._webgl2 && this._textureFloatLinear) ||
        (!this._webgl2 && this._textureHalfFloatLinear)
      );
    },
  },

  /**
   * 如果支持 EXT_shader_texture_lod，则为 <code>true</code>。该扩展提供
   * 对纹理采样函数中显式 LOD 选择的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://registry.khronos.org/webgl/extensions/EXT_shader_texture_lod/}
   */
  supportsTextureLod: {
    get: function () {
      return this._webgl2 || this._supportsTextureLod;
    },
  },

  /**
   * 如果支持 EXT_texture_filter_anisotropic，则为 <code>true</code>。该扩展提供
   * 对与观察者成斜角的纹理表面各向异性过滤的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_texture_filter_anisotropic/}
   */
  textureFilterAnisotropic: {
    get: function () {
      return !!this._textureFilterAnisotropic;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_s3tc，则为 <code>true</code>。该扩展提供
   * 对 DXT 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/}
   */
  s3tc: {
    get: function () {
      return this._s3tc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_pvrtc，则为 <code>true</code>。该扩展提供
   * 对 PVR 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/}
   */
  pvrtc: {
    get: function () {
      return this._pvrtc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_astc，则为 <code>true</code>。该扩展提供
   * 对 ASTC 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/}
   */
  astc: {
    get: function () {
      return this._astc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_etc，则为 <code>true</code>。该扩展提供
   * 对 ETC 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/}
   */
  etc: {
    get: function () {
      return this._etc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_etc1，则为 <code>true</code>。该扩展提供
   * 对 ETC1 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/}
   */
  etc1: {
    get: function () {
      return this._etc1;
    },
  },

  /**
   * 如果支持 EXT_texture_compression_bptc，则为 <code>true</code>。该扩展提供
   * 对 BC7 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_texture_compression_bptc/}
   */
  bc7: {
    get: function () {
      return this._bc7;
    },
  },

  /**
   * 如果支持 S3TC、PVRTC、ASTC、ETC、ETC1 或 BC7 压缩，则为 <code>true</code>。
   * @memberof Context.prototype
   * @type {boolean}
   */
  supportsBasis: {
    get: function () {
      return (
        this._s3tc ||
        this._pvrtc ||
        this._astc ||
        this._etc ||
        this._etc1 ||
        this._bc7
      );
    },
  },

  /**
   * 如果支持 OES_vertex_array_object 扩展，则为 <code>true</code>。该
   * 扩展可以通过减少切换顶点数组的开销来提升性能。
   * 启用后，{@link VertexArray} 会自动使用此扩展。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/|OES_vertex_array_object}
   */
  vertexArrayObject: {
    get: function () {
      return this._vertexArrayObject || this._webgl2;
    },
  },

  /**
   * 如果支持 EXT_frag_depth 扩展，则为 <code>true</code>。该
   * 扩展提供对 GLSL 片段着色器中内置输出变量 <code>gl_FragDepthEXT</code>
   * 的访问。使用这些函数的着色器仍需要显式启用
   * 扩展：<code>#extension GL_EXT_frag_depth : enable</code>。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/|EXT_frag_depth}
   */
  fragmentDepth: {
    get: function () {
      return this._fragDepth || this._webgl2;
    },
  },

  /**
   * 如果支持 ANGLE_instanced_arrays 扩展，则为 <code>true</code>。该
   * 扩展提供对实例化渲染的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays}
   */
  instancedArrays: {
    get: function () {
      return this._instancedArrays || this._webgl2;
    },
  },

  /**
   * 如果支持 EXT_color_buffer_float 扩展，则为 <code>true</code>。该
   * 扩展使 gl.RGBA32F 格式的颜色可渲染。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_color_buffer_float/}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/}
   */
  colorBufferFloat: {
    get: function () {
      return this._colorBufferFloat;
    },
  },

  /**
   * 如果支持 EXT_color_buffer_half_float 扩展，则为 <code>true</code>。该
   * 扩展使 gl.RGBA16F 格式的颜色可渲染。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_half_float/}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/}
   */
  colorBufferHalfFloat: {
    get: function () {
      return (
        (this._webgl2 && this._colorBufferFloat) ||
        (!this._webgl2 && this._colorBufferHalfFloat)
      );
    },
  },

  /**
   * 如果支持 WEBGL_draw_buffers 扩展，则为 <code>true</code>。该
   * 扩展提供对多渲染目标的支持。帧缓冲区对象可以有多个
   * 颜色附件，GLSL 片段着色器可以写入内置输出数组 <code>gl_FragData</code>。
   * 使用此功能的着色器需要显式启用扩展：
   * <code>#extension GL_EXT_draw_buffers : enable</code>。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/|WEBGL_draw_buffers}
   */
  drawBuffers: {
    get: function () {
      return this._drawBuffers || this._webgl2;
    },
  },

  debugShaders: {
    get: function () {
      return this._debugShaders;
    },
  },

  throwOnWebGLError: {
    get: function () {
      return this._throwOnWebGLError;
    },
    set: function (value) {
      this._throwOnWebGLError = value;
      this._gl = wrapGL(
        this._originalGLContext,
        value ? throwOnError : undefined,
      );
    },
  },

  /**
   * 初始化为 [255, 255, 255, 255] 的 1x1 RGBA 纹理。这可以
   * 用作其他纹理下载时的占位纹理。
   * @memberof Context.prototype
   * @type {Texture}
   */
  defaultTexture: {
    get: function () {
      if (this._defaultTexture === undefined) {
        this._defaultTexture = new Texture({
          context: this,
          source: {
            width: 1,
            height: 1,
            arrayBufferView: new Uint8Array([255, 255, 255, 255]),
          },
          flipY: false,
        });
      }

      return this._defaultTexture;
    },
  },
  /**
   * 初始化为 [0, 0, 0] 的 1x1 RGB 纹理，表示
   * 不发光材质。这可以用作发光纹理的占位纹理，
   * 等待其他纹理下载完成。
   * @memberof Context.prototype
   * @type {Texture}
   */
  defaultEmissiveTexture: {
    get: function () {
      if (this._defaultEmissiveTexture === undefined) {
        this._defaultEmissiveTexture = new Texture({
          context: this,
          pixelFormat: PixelFormat.RGB,
          source: {
            width: 1,
            height: 1,
            arrayBufferView: new Uint8Array([0, 0, 0]),
          },
          flipY: false,
        });
      }

      return this._defaultEmissiveTexture;
    },
  },
  /**
   * 初始化为 [128, 128, 255] 的 1x1 RGBA 纹理，用于编码切线
   * 空间法线，指向 +z 方向，即 (0, 0, 1)。这可以
   * 用作法线纹理的占位纹理，等待其他纹理
   * 下载完成。
   * @memberof Context.prototype
   * @type {Texture}
   */
  defaultNormalTexture: {
    get: function () {
      if (this._defaultNormalTexture === undefined) {
        this._defaultNormalTexture = new Texture({
          context: this,
          pixelFormat: PixelFormat.RGB,
          source: {
            width: 1,
            height: 1,
            arrayBufferView: new Uint8Array([128, 128, 255]),
          },
          flipY: false,
        });
      }

      return this._defaultNormalTexture;
    },
  },

  /**
   * 立方体贴图，每个面都是初始化为
   * [255, 255, 255, 255] 的 1x1 RGBA 纹理。这可以用作占位立方体贴图，
   * 等待其他立方体贴图下载完成。
   * @memberof Context.prototype
   * @type {CubeMap}
   */
  defaultCubeMap: {
    get: function () {
      if (this._defaultCubeMap === undefined) {
        const face = {
          width: 1,
          height: 1,
          arrayBufferView: new Uint8Array([255, 255, 255, 255]),
        };

        this._defaultCubeMap = new CubeMap({
          context: this,
          source: {
            positiveX: face,
            negativeX: face,
            positiveY: face,
            negativeY: face,
            positiveZ: face,
            negativeZ: face,
          },
          flipY: false,
        });
      }

      return this._defaultCubeMap;
    },
  },

  /**
   * 底层 GL 上下文的 drawingBufferHeight。
   * @memberof Context.prototype
   * @type {number}
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferHeight|drawingBufferHeight}
   */
  drawingBufferHeight: {
    get: function () {
      return this._gl.drawingBufferHeight;
    },
  },

  /**
   * 底层 GL 上下文的 drawingBufferWidth。
   * @memberof Context.prototype
   * @type {number}
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferWidth|drawingBufferWidth}
   */
  drawingBufferWidth: {
    get: function () {
      return this._gl.drawingBufferWidth;
    },
  },

  /**
   * 获取表示当前绑定的帧缓冲区的对象。虽然此实例不是实际的
   * {@link Framebuffer}，但它用于在调用
   * {@link Texture.fromFramebuffer} 时表示默认帧缓冲区。
   * @memberof Context.prototype
   * @type {object}
   */
  defaultFramebuffer: {
    get: function () {
      return defaultFramebufferMarker;
    },
  },
});

/**
 * 验证帧缓冲区。
 * 仅在调试版本中可用。
 * @private
 */
function validateFramebuffer(context) {
  //>>includeStart('debug', pragmas.debug);
  if (context.validateFramebuffer) {
    const gl = context._gl;
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      let message;

      switch (status) {
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
          message =
            "Framebuffer is not complete.  Incomplete attachment: at least one attachment point with a renderbuffer or texture attached has its attached object no longer in existence or has an attached image with a width or height of zero, or the color attachment point has a non-color-renderable image attached, or the depth attachment point has a non-depth-renderable image attached, or the stencil attachment point has a non-stencil-renderable image attached.  Color-renderable formats include GL_RGBA4, GL_RGB5_A1, and GL_RGB565. GL_DEPTH_COMPONENT16 is the only depth-renderable format. GL_STENCIL_INDEX8 is the only stencil-renderable format.";
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
          message =
            "Framebuffer is not complete.  Incomplete dimensions: not all attached images have the same width and height.";
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
          message =
            "Framebuffer is not complete.  Missing attachment: no images are attached to the framebuffer.";
          break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
          message =
            "Framebuffer is not complete.  Unsupported: the combination of internal formats of the attached images violates an implementation-dependent set of restrictions.";
          break;
      }

      throw new DeveloperError(message);
    }
  }
  //>>includeEnd('debug');
}

function applyRenderState(context, renderState, passState, clear) {
  const previousRenderState = context._currentRenderState;
  const previousPassState = context._currentPassState;
  context._currentRenderState = renderState;
  context._currentPassState = passState;
  RenderState.partialApply(
    context._gl,
    previousRenderState,
    renderState,
    previousPassState,
    passState,
    clear,
  );
}

let scratchBackBufferArray;
// 此检查必须使用 typeof，而不是 defined，因为 defined 对未声明的变量不起作用。
if (typeof WebGLRenderingContext !== "undefined") {
  scratchBackBufferArray = [WebGLConstants.BACK];
}

function bindFramebuffer(context, framebuffer) {
  if (framebuffer !== context._currentFramebuffer) {
    context._currentFramebuffer = framebuffer;
    let buffers = scratchBackBufferArray;

    if (defined(framebuffer)) {
      framebuffer._bind();
      validateFramebuffer(context);

      // TODO: 需要一种方式让命令告知哪些绘制缓冲区处于活动状态。
      buffers = framebuffer._getActiveColorAttachments();
    } else {
      const gl = context._gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (context.drawBuffers) {
      context.glDrawBuffers(buffers);
    }
  }
}

const defaultClearCommand = new ClearCommand();

Context.prototype.clear = function (clearCommand, passState) {
  clearCommand = clearCommand ?? defaultClearCommand;
  passState = passState ?? this._defaultPassState;

  const gl = this._gl;
  let bitmask = 0;

  const c = clearCommand.color;
  const d = clearCommand.depth;
  const s = clearCommand.stencil;

  if (defined(c)) {
    if (!Color.equals(this._clearColor, c)) {
      Color.clone(c, this._clearColor);
      gl.clearColor(c.red, c.green, c.blue, c.alpha);
    }
    bitmask |= gl.COLOR_BUFFER_BIT;
  }

  if (defined(d)) {
    if (d !== this._clearDepth) {
      this._clearDepth = d;
      gl.clearDepth(d);
    }
    bitmask |= gl.DEPTH_BUFFER_BIT;
  }

  if (defined(s)) {
    if (s !== this._clearStencil) {
      this._clearStencil = s;
      gl.clearStencil(s);
    }
    bitmask |= gl.STENCIL_BUFFER_BIT;
  }

  const rs = clearCommand.renderState ?? this._defaultRenderState;
  applyRenderState(this, rs, passState, true);

  // 命令的帧缓冲区优先于通道的帧缓冲区，例如用于离屏渲染。
  const framebuffer = clearCommand.framebuffer ?? passState.framebuffer;
  bindFramebuffer(this, framebuffer);

  gl.clear(bitmask);
};

function beginDraw(
  context,
  framebuffer,
  passState,
  shaderProgram,
  renderState,
) {
  //>>includeStart('debug', pragmas.debug);
  if (defined(framebuffer) && renderState.depthTest) {
    if (renderState.depthTest.enabled && !framebuffer.hasDepthAttachment) {
      throw new DeveloperError(
        "The depth test can not be enabled (drawCommand.renderState.depthTest.enabled) because the framebuffer (drawCommand.framebuffer) does not have a depth or depth-stencil renderbuffer.",
      );
    }
  }
  //>>includeEnd('debug');

  bindFramebuffer(context, framebuffer);
  applyRenderState(context, renderState, passState, false);
  shaderProgram._bind();

  context._maxFrameTextureUnitIndex = Math.max(
    context._maxFrameTextureUnitIndex,
    shaderProgram.maximumTextureUnitIndex,
  );
}

function continueDraw(context, drawCommand, shaderProgram, uniformMap) {
  const primitiveType = drawCommand._primitiveType;
  const va = drawCommand._vertexArray;
  let offset = drawCommand._offset;
  let count = drawCommand._count;
  const instanceCount = drawCommand.instanceCount;

  //>>includeStart('debug', pragmas.debug);
  if (!PrimitiveType.validate(primitiveType)) {
    throw new DeveloperError(
      "drawCommand.primitiveType is required and must be valid.",
    );
  }

  Check.defined("drawCommand.vertexArray", va);
  Check.typeOf.number.greaterThanOrEquals("drawCommand.offset", offset, 0);
  if (defined(count)) {
    Check.typeOf.number.greaterThanOrEquals("drawCommand.count", count, 0);
  }
  Check.typeOf.number.greaterThanOrEquals(
    "drawCommand.instanceCount",
    instanceCount,
    0,
  );
  if (instanceCount > 0 && !context.instancedArrays) {
    throw new DeveloperError("Instanced arrays extension is not supported");
  }
  //>>includeEnd('debug');

  context._us.model = drawCommand._modelMatrix ?? Matrix4.IDENTITY;
  shaderProgram._setUniforms(
    uniformMap,
    context._us,
    context.validateShaderProgram,
  );

  va._bind();
  const indexBuffer = va.indexBuffer;

  if (defined(indexBuffer)) {
    offset = offset * indexBuffer.bytesPerIndex; // offset in vertices to offset in bytes
    if (defined(count)) {
      count = Math.min(count, indexBuffer.numberOfIndices);
    } else {
      count = indexBuffer.numberOfIndices;
    }
    if (instanceCount === 0) {
      context._gl.drawElements(
        primitiveType,
        count,
        indexBuffer.indexDatatype,
        offset,
      );
    } else {
      context.glDrawElementsInstanced(
        primitiveType,
        count,
        indexBuffer.indexDatatype,
        offset,
        instanceCount,
      );
    }
  } else {
    if (defined(count)) {
      count = Math.min(count, va.numberOfVertices);
    } else {
      count = va.numberOfVertices;
    }

    if (instanceCount === 0) {
      context._gl.drawArrays(primitiveType, offset, count);
    } else {
      context.glDrawArraysInstanced(
        primitiveType,
        offset,
        count,
        instanceCount,
      );
    }
  }

  va._unBind();
}

Context.prototype.draw = function (
  drawCommand,
  passState,
  shaderProgram,
  uniformMap,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("drawCommand", drawCommand);
  Check.defined("drawCommand.shaderProgram", drawCommand._shaderProgram);
  //>>includeEnd('debug');

  passState = passState ?? this._defaultPassState;
  // The command's framebuffer takes precedence over the pass' framebuffer, e.g., for off-screen rendering.
  const framebuffer = drawCommand._framebuffer ?? passState.framebuffer;
  const renderState = drawCommand._renderState ?? this._defaultRenderState;
  shaderProgram = shaderProgram ?? drawCommand._shaderProgram;
  uniformMap = uniformMap ?? drawCommand._uniformMap;

  beginDraw(this, framebuffer, passState, shaderProgram, renderState);
  continueDraw(this, drawCommand, shaderProgram, uniformMap);
};

Context.prototype.beginFrame = function () {
  // 空操作。当绘制到 SharedContext 时会被覆盖。
};

Context.prototype.endFrame = function () {
  const gl = this._gl;
  gl.useProgram(null);

  this._currentFramebuffer = undefined;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const buffers = scratchBackBufferArray;
  if (this.drawBuffers) {
    this.glDrawBuffers(buffers);
  }

  const length = this._maxFrameTextureUnitIndex;
  this._maxFrameTextureUnitIndex = 0;

  for (let i = 0; i < length; ++i) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }
};

/**
 * @typedef {object} ReadState
 *
 * 定义从帧缓冲区读取像素的矩形选项。
 *
 * @private
 * @property {number} [x=0] 读取矩形的 x 偏移量。
 * @property {number} [y=0] 读取矩形的 y 偏移量。
 * @property {number} [width=this.drawingBufferWidth] 读取矩形的宽度。
 * @property {number} [height=this.drawingBufferHeight] 读取矩形的高度。
 * @property {FrameBuffer|undefined} [framebuffer] 要读取的帧缓冲区。如果未定义，则从默认帧缓冲区读取。
 */

/**
 * 从帧缓冲区读取像素到像素缓冲区对象 (PBO)。
 *
 * @private
 * @param {ReadState} readState 定义从帧缓冲区读取像素的矩形选项。
 * @returns {Buffer} 包含从指定矩形读取的像素的 PixelBuffer。
 *
 * @exception {DeveloperError} 使用 PBO 读取像素需要 WebGL 2 上下文。
 */
Context.prototype.readPixelsToPBO = function (readState) {
  const gl = this._gl;

  readState = readState ?? Frozen.EMPTY_OBJECT;
  const x = Math.max(readState.x ?? 0, 0);
  const y = Math.max(readState.y ?? 0, 0);
  const width = readState.width ?? this.drawingBufferWidth;
  const height = readState.height ?? this.drawingBufferHeight;
  const framebuffer = readState.framebuffer;

  if (!this._webgl2) {
    throw new DeveloperError(
      "A WebGL 2 context is required to read pixels using a PBO.",
    );
  }

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThan("readState.width", width, 0);
  Check.typeOf.number.greaterThan("readState.height", height, 0);
  //>>includeEnd('debug');

  let pixelDatatype = PixelDatatype.UNSIGNED_BYTE;
  let pixelFormat = PixelFormat.RGBA;
  if (defined(framebuffer) && framebuffer.numberOfColorAttachments > 0) {
    pixelDatatype = framebuffer.getColorTexture(0).pixelDatatype;
    pixelFormat = framebuffer.getColorTexture(0).pixelFormat;
  }

  const pixels = Buffer.createPixelBuffer({
    context: this,
    sizeInBytes: PixelFormat.textureSizeInBytes(
      pixelFormat,
      pixelDatatype,
      width,
      height,
    ),
    usage: BufferUsage.DYNAMIC_READ,
  });

  bindFramebuffer(this, framebuffer);

  pixels._bind();
  gl.readPixels(
    x,
    y,
    width,
    height,
    pixelFormat,
    PixelDatatype.toWebGLConstant(pixelDatatype, this),
    0,
  );
  pixels._unBind();

  return pixels;
};

/**
 * 从帧缓冲区读取像素到类型化数组。
 *
 * @private
 * @param {ReadState} readState 定义从帧缓冲区读取像素的矩形选项。
 * @returns {Uint8Array|Uint16Array|Float32Array|Uint32Array} 指定矩形中的像素。
 */
Context.prototype.readPixels = function (readState) {
  const gl = this._gl;

  readState = readState ?? Frozen.EMPTY_OBJECT;
  const x = Math.max(readState.x ?? 0, 0);
  const y = Math.max(readState.y ?? 0, 0);
  const width = readState.width ?? this.drawingBufferWidth;
  const height = readState.height ?? this.drawingBufferHeight;
  const framebuffer = readState.framebuffer;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThan("readState.width", width, 0);
  Check.typeOf.number.greaterThan("readState.height", height, 0);
  //>>includeEnd('debug');

  let pixelDatatype = PixelDatatype.UNSIGNED_BYTE;
  let pixelFormat = PixelFormat.RGBA;
  if (defined(framebuffer) && framebuffer.numberOfColorAttachments > 0) {
    pixelDatatype = framebuffer.getColorTexture(0).pixelDatatype;
    pixelFormat = framebuffer.getColorTexture(0).pixelFormat;
  }

  const pixels = PixelFormat.createTypedArray(
    pixelFormat,
    pixelDatatype,
    width,
    height,
  );

  bindFramebuffer(this, framebuffer);

  gl.readPixels(
    x,
    y,
    width,
    height,
    PixelFormat.RGBA,
    PixelDatatype.toWebGLConstant(pixelDatatype, this),
    pixels,
  );

  return pixels;
};

const viewportQuadAttributeLocations = {
  position: 0,
  textureCoordinates: 1,
};

Context.prototype.getViewportQuadVertexArray = function () {
  // 每个上下文的视口四边形缓存
  let vertexArray = this.cache.viewportQuad_vertexArray;

  if (!defined(vertexArray)) {
    const geometry = new Geometry({
      attributes: {
        position: new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0],
        }),

        textureCoordinates: new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        }),
      },
      // 解决 Internet Explorer 11.0.8 缺少 TRIANGLE_FAN 的问题
      indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
      primitiveType: PrimitiveType.TRIANGLES,
    });

    vertexArray = VertexArray.fromGeometry({
      context: this,
      geometry: geometry,
      attributeLocations: viewportQuadAttributeLocations,
      bufferUsage: BufferUsage.STATIC_DRAW,
      interleave: true,
    });

    this.cache.viewportQuad_vertexArray = vertexArray;
  }

  return vertexArray;
};

Context.prototype.createViewportQuadCommand = function (
  fragmentShaderSource,
  overrides,
) {
  overrides = overrides ?? Frozen.EMPTY_OBJECT;

  return new DrawCommand({
    vertexArray: this.getViewportQuadVertexArray(),
    primitiveType: PrimitiveType.TRIANGLES,
    renderState: overrides.renderState,
    shaderProgram: ShaderProgram.fromCache({
      context: this,
      vertexShaderSource: ViewportQuadVS,
      fragmentShaderSource: fragmentShaderSource,
      attributeLocations: viewportQuadAttributeLocations,
    }),
    uniformMap: overrides.uniformMap,
    owner: overrides.owner,
    framebuffer: overrides.framebuffer,
    pass: overrides.pass,
  });
};

/**
 * 获取与拾取颜色关联的对象。
 *
 * @param {number} pickColor 无符号 32 位 RGBA 拾取颜色
 * @returns {object} 与拾取颜色关联的对象，如果没有对象与该颜色关联则返回 undefined。
 *
 * @example
 * const object = context.getObjectByPickColor(pickColor);
 *
 * @see Context#createPickId
 */
Context.prototype.getObjectByPickColor = function (pickColor) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("pickColor", pickColor);
  //>>includeEnd('debug');

  return this._pickObjects.get(pickColor);
};

/**
 * 创建一个与输入对象关联的唯一 ID，用于颜色缓冲区拾取。
 * 该 ID 具有此上下文唯一的 RGBA 颜色值。销毁输入对象时，
 * 必须在拾取 ID 上调用 destroy()。
 *
 * @param {object} object 要与拾取 ID 关联的对象。
 * @returns {PickId} 具有 <code>color</code> 属性的 PickId 对象。
 *
 * @exception {RuntimeError} 唯一的拾取 ID 已用完。
 *
 *
 * @example
 * this._pickId = context.createPickId({
 *   primitive : this,
 *   id : this.id
 * });
 *
 * @see Context#getObjectByPickColor
 */
Context.prototype.createPickId = function (object) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("object", object);
  //>>includeEnd('debug');

  // 递增和赋值必须是单独的语句，以
  // 实际检测 Uint32 值的溢出
  ++this._nextPickColor[0];
  const key = this._nextPickColor[0];
  if (key === 0) {
    // In case of overflow
    throw new RuntimeError("Out of unique Pick IDs.");
  }

  this._pickObjects.set(key, object);
  return new PickId(this._pickObjects, key, Color.fromRgba(key));
};

Context.prototype.isDestroyed = function () {
  return false;
};

Context.prototype.destroy = function () {
  // 销毁缓存中所有具有 destroy 方法的对象。
  const cache = this.cache;
  for (const property in cache) {
    if (cache.hasOwnProperty(property)) {
      const propertyValue = cache[property];
      if (defined(propertyValue.destroy)) {
        propertyValue.destroy();
      }
    }
  }

  this._shaderCache = this._shaderCache.destroy();
  this._textureCache = this._textureCache.destroy();
  this._defaultTexture = this._defaultTexture && this._defaultTexture.destroy();
  this._defaultEmissiveTexture =
    this._defaultEmissiveTexture && this._defaultEmissiveTexture.destroy();
  this._defaultNormalTexture =
    this._defaultNormalTexture && this._defaultNormalTexture.destroy();
  this._defaultCubeMap = this._defaultCubeMap && this._defaultCubeMap.destroy();

  return destroyObject(this);
};

export default Context;
