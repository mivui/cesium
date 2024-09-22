import Cartesian3 from "../Core/Cartesian3.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import EllipsoidGeometry from "../Core/EllipsoidGeometry.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import VertexFormat from "../Core/VertexFormat.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import VertexArray from "../Renderer/VertexArray.js";
import AtmosphereCommon from "../Shaders/AtmosphereCommon.js";
import SkyAtmosphereCommon from "../Shaders/SkyAtmosphereCommon.js";
import SkyAtmosphereFS from "../Shaders/SkyAtmosphereFS.js";
import SkyAtmosphereVS from "../Shaders/SkyAtmosphereVS.js";
import Axis from "./Axis.js";
import BlendingState from "./BlendingState.js";
import CullFace from "./CullFace.js";
import SceneMode from "./SceneMode.js";

/**
 * 在提供的椭球体的肢体周围绘制的大气。基于
 * {@link http://nishitalab.org/user/nis/cdrom/sig93_nis.pdf|考虑大气散射的地球显示}。
 * <p>
 * 这仅在 3D 中受支持。当变形为 2D 或哥伦布视图时，大气层会淡出。
 * </p>
 *
 * @alias SkyAtmosphere
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 大气围绕绘制的椭球体。
 *
 * @example
 * scene.skyAtmosphere = new Cesium.SkyAtmosphere();
 *
 * @see Scene.skyAtmosphere
 */
function SkyAtmosphere(ellipsoid) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

  /**
   * Determines if the atmosphere is shown.
   *
   * @type {boolean}
   * @default true
   */
  this.show = true;

  /**
   * 计算每个片段的大气，而不是每个顶点的大气。
   * 这会产生更好看的氛围，但性能会略有下降。
   *
   * @type {boolean}
   * @default false
   */
  this.perFragmentAtmosphere = false;

  this._ellipsoid = ellipsoid;

  const outerEllipsoidScale = 1.025;
  const scaleVector = Cartesian3.multiplyByScalar(
    ellipsoid.radii,
    outerEllipsoidScale,
    new Cartesian3()
  );
  this._scaleMatrix = Matrix4.fromScale(scaleVector);
  this._modelMatrix = new Matrix4();

  this._command = new DrawCommand({
    owner: this,
    modelMatrix: this._modelMatrix,
  });
  this._spSkyFromSpace = undefined;
  this._spSkyFromAtmosphere = undefined;

  this._flags = undefined;

  /**
   * 用于计算天空大气颜色的光的强度。
   *
   * @type {number}
   * @default 50.0
   */
  this.atmosphereLightIntensity = 50.0;

  /**
   * 天空大气的大气散射方程中使用的瑞利散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
   */
  this.atmosphereRayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

  /**
   * 天空大气的大气散射方程中使用的 Mie 散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(21e-6, 21e-6, 21e-6)
   */
  this.atmosphereMieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

  /**
   * 天空大气的大气散射方程中使用的瑞利标尺高度，以米为单位。
   *
   * @type {number}
   * @default 10000.0
   */
  this.atmosphereRayleighScaleHeight = 10000.0;

  /**
   * 天空大气的大气散射方程中使用的 Mie 比例高度，以米为单位。
   *
   * @type {number}
   * @default 3200.0
   */
  this.atmosphereMieScaleHeight = 3200.0;

  /**
   * 米氏散射要考虑的介质的各向异性。
   * <p>
   * 有效值介于 -1.0 和 1.0 之间。
   * </p>
   * @type {number}
   * @default 0.9
   */
  this.atmosphereMieAnisotropy = 0.9;

  /**
   * 应用于大气的色相偏移。默认为 0.0（无偏移）。
   * 色相偏移 1.0 表示可用色相完全旋转。
   * @type {number}
   * @default 0.0
   */
  this.hueShift = 0.0;

  /**
   * 应用于大气的饱和度偏移。默认为 0.0（无偏移）。
   * -1.0 的饱和度偏移为单色。
   * @type {number}
   * @default 0.0
   */
  this.saturationShift = 0.0;

  /**
   * 应用于大气的亮度偏移。默认为 0.0（无偏移）。
   * -1.0 的亮度偏移是完全黑暗的，这将使空间透出。
   * @type {number}
   * @default 0.0
   */
  this.brightnessShift = 0.0;

  this._hueSaturationBrightness = new Cartesian3();

  // outer radius, inner radius, dynamic atmosphere color flag
  const radiiAndDynamicAtmosphereColor = new Cartesian3();

  radiiAndDynamicAtmosphereColor.x =
    ellipsoid.maximumRadius * outerEllipsoidScale;
  radiiAndDynamicAtmosphereColor.y = ellipsoid.maximumRadius;

  // Toggles whether the sun position is used. 0 treats the sun as always directly overhead.
  radiiAndDynamicAtmosphereColor.z = 0;

  this._radiiAndDynamicAtmosphereColor = radiiAndDynamicAtmosphereColor;

  const that = this;

  this._command.uniformMap = {
    u_radiiAndDynamicAtmosphereColor: function () {
      return that._radiiAndDynamicAtmosphereColor;
    },
    u_hsbShift: function () {
      that._hueSaturationBrightness.x = that.hueShift;
      that._hueSaturationBrightness.y = that.saturationShift;
      that._hueSaturationBrightness.z = that.brightnessShift;
      return that._hueSaturationBrightness;
    },
    u_atmosphereLightIntensity: function () {
      return that.atmosphereLightIntensity;
    },
    u_atmosphereRayleighCoefficient: function () {
      return that.atmosphereRayleighCoefficient;
    },
    u_atmosphereMieCoefficient: function () {
      return that.atmosphereMieCoefficient;
    },
    u_atmosphereRayleighScaleHeight: function () {
      return that.atmosphereRayleighScaleHeight;
    },
    u_atmosphereMieScaleHeight: function () {
      return that.atmosphereMieScaleHeight;
    },
    u_atmosphereMieAnisotropy: function () {
      return that.atmosphereMieAnisotropy;
    },
  };
}

Object.defineProperties(SkyAtmosphere.prototype, {
  /**
   * 获取绘制大气所围绕的椭球体。
   * @memberof SkyAtmosphere.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
});

/**
 * 设置着色器的动态照明枚举值
 * @param {DynamicAtmosphereLightingType} lightingEnum 确定动态大气光源的枚举
 *
 * @private
 */
SkyAtmosphere.prototype.setDynamicLighting = function (lightingEnum) {
  this._radiiAndDynamicAtmosphereColor.z = lightingEnum;
};

const scratchModelMatrix = new Matrix4();

/**
 * @private
 */
SkyAtmosphere.prototype.update = function (frameState, globe) {
  if (!this.show) {
    return undefined;
  }

  const mode = frameState.mode;
  if (mode !== SceneMode.SCENE3D && mode !== SceneMode.MORPHING) {
    return undefined;
  }

  // The atmosphere is only rendered during the render pass; it is not pickable, it doesn't cast shadows, etc.
  if (!frameState.passes.render) {
    return undefined;
  }

  // Align the ellipsoid geometry so it always faces the same direction as the
  // camera to reduce artifacts when rendering atmosphere per-vertex
  const rotationMatrix = Matrix4.fromRotationTranslation(
    frameState.context.uniformState.inverseViewRotation,
    Cartesian3.ZERO,
    scratchModelMatrix
  );
  const rotationOffsetMatrix = Matrix4.multiplyTransformation(
    rotationMatrix,
    Axis.Y_UP_TO_Z_UP,
    scratchModelMatrix
  );
  const modelMatrix = Matrix4.multiply(
    this._scaleMatrix,
    rotationOffsetMatrix,
    scratchModelMatrix
  );
  Matrix4.clone(modelMatrix, this._modelMatrix);

  const context = frameState.context;

  const colorCorrect = hasColorCorrection(this);
  const translucent = frameState.globeTranslucencyState.translucent;
  const perFragmentAtmosphere =
    this.perFragmentAtmosphere || translucent || !defined(globe) || !globe.show;

  const command = this._command;

  if (!defined(command.vertexArray)) {
    const geometry = EllipsoidGeometry.createGeometry(
      new EllipsoidGeometry({
        radii: new Cartesian3(1.0, 1.0, 1.0),
        slicePartitions: 256,
        stackPartitions: 256,
        vertexFormat: VertexFormat.POSITION_ONLY,
      })
    );
    command.vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: geometry,
      attributeLocations: GeometryPipeline.createAttributeLocations(geometry),
      bufferUsage: BufferUsage.STATIC_DRAW,
    });
    command.renderState = RenderState.fromCache({
      cull: {
        enabled: true,
        face: CullFace.FRONT,
      },
      blending: BlendingState.ALPHA_BLEND,
      depthMask: false,
    });
  }

  const flags =
    colorCorrect | (perFragmentAtmosphere << 2) | (translucent << 3);

  if (flags !== this._flags) {
    this._flags = flags;

    const defines = [];

    if (colorCorrect) {
      defines.push("COLOR_CORRECT");
    }

    if (perFragmentAtmosphere) {
      defines.push("PER_FRAGMENT_ATMOSPHERE");
    }

    if (translucent) {
      defines.push("GLOBE_TRANSLUCENT");
    }

    const vs = new ShaderSource({
      defines: defines,
      sources: [AtmosphereCommon, SkyAtmosphereCommon, SkyAtmosphereVS],
    });

    const fs = new ShaderSource({
      defines: defines,
      sources: [AtmosphereCommon, SkyAtmosphereCommon, SkyAtmosphereFS],
    });

    this._spSkyAtmosphere = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
    });

    command.shaderProgram = this._spSkyAtmosphere;
  }

  return command;
};

function hasColorCorrection(skyAtmosphere) {
  return !(
    CesiumMath.equalsEpsilon(
      skyAtmosphere.hueShift,
      0.0,
      CesiumMath.EPSILON7
    ) &&
    CesiumMath.equalsEpsilon(
      skyAtmosphere.saturationShift,
      0.0,
      CesiumMath.EPSILON7
    ) &&
    CesiumMath.equalsEpsilon(
      skyAtmosphere.brightnessShift,
      0.0,
      CesiumMath.EPSILON7
    )
  );
}

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see SkyAtmosphere#destroy
 */
SkyAtmosphere.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * skyAtmosphere = skyAtmosphere && skyAtmosphere.destroy();
 *
 * @see SkyAtmosphere#isDestroyed
 */
SkyAtmosphere.prototype.destroy = function () {
  const command = this._command;
  command.vertexArray = command.vertexArray && command.vertexArray.destroy();
  this._spSkyAtmosphere =
    this._spSkyAtmosphere && this._spSkyAtmosphere.destroy();
  return destroyObject(this);
};
export default SkyAtmosphere;
