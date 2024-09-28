import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import ClearCommand from "../Renderer/ClearCommand.js";
import FramebufferManager from "../Renderer/FramebufferManager.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";

/**
 * 一个后期处理阶段，它将获取每个像素的亮度值，并且
 * 使用 Parallel Reduction 来计算 1x1 纹理中的平均亮度。
 * 此纹理可用作色调映射的输入。
 *
 * @constructor
 * @private
 */
function AutoExposure() {
  this._uniformMap = undefined;
  this._command = undefined;

  this._colorTexture = undefined;
  this._depthTexture = undefined;

  this._ready = false;

  this._name = "czm_autoexposure";

  this._logDepthChanged = undefined;
  this._useLogDepth = undefined;

  this._framebuffers = undefined;
  this._previousLuminance = new FramebufferManager();

  this._commands = undefined;
  this._clearCommand = undefined;

  this._minMaxLuminance = new Cartesian2();

  /**
   * 准备就绪时是否执行此后处理阶段。
   *
   * @type {boolean}
   */
  this.enabled = true;
  this._enabled = true;

  /**
   * 用于限制明亮度的最小值。
   *
   * @type {number}
   * @default 0.1
   */
  this.minimumLuminance = 0.1;

  /**
   * 用于限制明亮度的最大值。
   *
   * @type {number}
   * @default 10.0
   */
  this.maximumLuminance = 10.0;
}

Object.defineProperties(AutoExposure.prototype, {
  /**
   * 确定此后处理阶段是否已准备好执行。仅当两个<code>阶段都准备就绪</code>时，才会执行 stage
   * 和 {@link AutoExposure#enabled} 为 <code>true</code>。阶段在等待纹理时将未准备就绪
   * 加载。
   *
   * @memberof AutoExposure.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },
  /**
   * 此后处理阶段的唯一名称，供其他阶段参考。
   *
   * @memberof AutoExposure.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 对执行此后期处理阶段时写入的纹理的引用。
   *
   * @memberof AutoExposure.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  outputTexture: {
    get: function () {
      const framebuffers = this._framebuffers;
      if (!defined(framebuffers)) {
        return undefined;
      }
      return framebuffers[framebuffers.length - 1].getColorTexture(0);
    },
  },
});

function destroyFramebuffers(autoexposure) {
  const framebuffers = autoexposure._framebuffers;
  if (!defined(framebuffers)) {
    return;
  }

  const length = framebuffers.length;
  for (let i = 0; i < length; ++i) {
    framebuffers[i].destroy();
  }
  autoexposure._framebuffers = undefined;

  autoexposure._previousLuminance.destroy();
  autoexposure._previousLuminance = undefined;
}

function createFramebuffers(autoexposure, context) {
  destroyFramebuffers(autoexposure);

  let width = autoexposure._width;
  let height = autoexposure._height;

  const pixelDatatype = context.halfFloatingPointTexture
    ? PixelDatatype.HALF_FLOAT
    : PixelDatatype.FLOAT;

  const length = Math.ceil(Math.log(Math.max(width, height)) / Math.log(3.0));
  const framebuffers = new Array(length);
  for (let i = 0; i < length; ++i) {
    width = Math.max(Math.ceil(width / 3.0), 1.0);
    height = Math.max(Math.ceil(height / 3.0), 1.0);
    framebuffers[i] = new FramebufferManager();
    framebuffers[i].update(context, width, height, 1, pixelDatatype);
  }

  const lastTexture = framebuffers[length - 1].getColorTexture(0);
  autoexposure._previousLuminance.update(
    context,
    lastTexture.width,
    lastTexture.height,
    1,
    pixelDatatype,
  );
  autoexposure._framebuffers = framebuffers;
}

function destroyCommands(autoexposure) {
  const commands = autoexposure._commands;
  if (!defined(commands)) {
    return;
  }

  const length = commands.length;
  for (let i = 0; i < length; ++i) {
    commands[i].shaderProgram.destroy();
  }
  autoexposure._commands = undefined;
}

function createUniformMap(autoexposure, index) {
  let uniforms;
  if (index === 0) {
    uniforms = {
      colorTexture: function () {
        return autoexposure._colorTexture;
      },
      colorTextureDimensions: function () {
        return autoexposure._colorTexture.dimensions;
      },
    };
  } else {
    const texture = autoexposure._framebuffers[index - 1].getColorTexture(0);
    uniforms = {
      colorTexture: function () {
        return texture;
      },
      colorTextureDimensions: function () {
        return texture.dimensions;
      },
    };
  }

  uniforms.minMaxLuminance = function () {
    return autoexposure._minMaxLuminance;
  };
  uniforms.previousLuminance = function () {
    return autoexposure._previousLuminance.getColorTexture(0);
  };

  return uniforms;
}

function getShaderSource(index, length) {
  let source =
    "uniform sampler2D colorTexture; \n" +
    "in vec2 v_textureCoordinates; \n" +
    "float sampleTexture(vec2 offset) { \n";

  if (index === 0) {
    source +=
      "    vec4 color = texture(colorTexture, v_textureCoordinates + offset); \n" +
      "    return czm_luminance(color.rgb); \n";
  } else {
    source +=
      "    return texture(colorTexture, v_textureCoordinates + offset).r; \n";
  }

  source += "}\n\n";

  source +=
    "uniform vec2 colorTextureDimensions; \n" +
    "uniform vec2 minMaxLuminance; \n" +
    "uniform sampler2D previousLuminance; \n" +
    "void main() { \n" +
    "    float color = 0.0; \n" +
    "    float xStep = 1.0 / colorTextureDimensions.x; \n" +
    "    float yStep = 1.0 / colorTextureDimensions.y; \n" +
    "    int count = 0; \n" +
    "    for (int i = 0; i < 3; ++i) { \n" +
    "        for (int j = 0; j < 3; ++j) { \n" +
    "            vec2 offset; \n" +
    "            offset.x = -xStep + float(i) * xStep; \n" +
    "            offset.y = -yStep + float(j) * yStep; \n" +
    "            if (offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0) { \n" +
    "                continue; \n" +
    "            } \n" +
    "            color += sampleTexture(offset); \n" +
    "            ++count; \n" +
    "        } \n" +
    "    } \n" +
    "    if (count > 0) { \n" +
    "        color /= float(count); \n" +
    "    } \n";

  if (index === length - 1) {
    source +=
      "    float previous = texture(previousLuminance, vec2(0.5)).r; \n" +
      "    color = clamp(color, minMaxLuminance.x, minMaxLuminance.y); \n" +
      "    color = previous + (color - previous) / (60.0 * 1.5); \n" +
      "    color = clamp(color, minMaxLuminance.x, minMaxLuminance.y); \n";
  }

  source += "    out_FragColor = vec4(color); \n" + "} \n";
  return source;
}

function createCommands(autoexposure, context) {
  destroyCommands(autoexposure);
  const framebuffers = autoexposure._framebuffers;
  const length = framebuffers.length;

  const commands = new Array(length);

  for (let i = 0; i < length; ++i) {
    commands[i] = context.createViewportQuadCommand(
      getShaderSource(i, length),
      {
        framebuffer: framebuffers[i].framebuffer,
        uniformMap: createUniformMap(autoexposure, i),
      },
    );
  }
  autoexposure._commands = commands;
}

/**
 * 将在执行之前调用的函数。用于清除附加到 framebuffer 的任何纹理。
 * @param {Context} context 上下文。
 * @private
 */
AutoExposure.prototype.clear = function (context) {
  const framebuffers = this._framebuffers;
  if (!defined(framebuffers)) {
    return;
  }

  let clearCommand = this._clearCommand;
  if (!defined(clearCommand)) {
    clearCommand = this._clearCommand = new ClearCommand({
      color: new Color(0.0, 0.0, 0.0, 0.0),
      framebuffer: undefined,
    });
  }

  const length = framebuffers.length;
  for (let i = 0; i < length; ++i) {
    framebuffers[i].clear(context, clearCommand);
  }
};

/**
 * 将在执行之前调用的函数。用于创建 WebGL 资源和加载任何纹理。
 * @param {Context} context 上下文。
 * @private
 */
AutoExposure.prototype.update = function (context) {
  const width = context.drawingBufferWidth;
  const height = context.drawingBufferHeight;

  if (width !== this._width || height !== this._height) {
    this._width = width;
    this._height = height;

    createFramebuffers(this, context);
    createCommands(this, context);

    if (!this._ready) {
      this._ready = true;
    }
  }

  this._minMaxLuminance.x = this.minimumLuminance;
  this._minMaxLuminance.y = this.maximumLuminance;

  const framebuffers = this._framebuffers;
  const temp = framebuffers[framebuffers.length - 1];
  framebuffers[framebuffers.length - 1] = this._previousLuminance;
  this._commands[this._commands.length - 1].framebuffer =
    this._previousLuminance.framebuffer;
  this._previousLuminance = temp;
};

/**
 * 执行后处理阶段。颜色纹理是由场景或上一阶段渲染的纹理。
 * @param {Context} context 上下文。
 * @param {Texture} colorTexture 输入颜色纹理。
 * @private
 */
AutoExposure.prototype.execute = function (context, colorTexture) {
  this._colorTexture = colorTexture;

  const commands = this._commands;
  if (!defined(commands)) {
    return;
  }

  const length = commands.length;
  for (let i = 0; i < length; ++i) {
    commands[i].execute(context);
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <p>
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
 *
 * @see AutoExposure#destroy
 */
AutoExposure.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <p>
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。  Therefore,
 * 将 return value （<code>undefined</code>） 分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see AutoExposure#isDestroyed
 */
AutoExposure.prototype.destroy = function () {
  destroyFramebuffers(this);
  destroyCommands(this);
  return destroyObject(this);
};
export default AutoExposure;
