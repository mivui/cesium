import Cartesian3 from "../Core/Cartesian3.js";
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
 * 绘制在指定椭球体边缘的大气层。基于
 * {@link http://nishitalab.org/user/nis/cdrom/sig93_nis.pdf|考虑大气散射的地球显示}。
 * <p>
 * 该功能仅支持3D模式。当切换到2D或哥伦布视图时，大气层会逐渐淡出。
 * </p>
 *
 * @alias SkyAtmosphere
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 大气层所围绕的椭球体。
 *
 * @example
 * scene.skyAtmosphere = new Cesium.SkyAtmosphere();
 *
 * @see Scene.skyAtmosphere
 */
function SkyAtmosphere(ellipsoid) {
  ellipsoid = ellipsoid ?? Ellipsoid.WGS84;

  /**
   * 确定是否显示大气层。
   *
   * @type {boolean}
   * @default true
   */
  this.show = true;

  /**
   * 逐片段而非逐顶点计算大气层。
   * 这样渲染的大气层效果更好，但会有轻微的性能损耗。
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
    new Cartesian3(),
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
   * 用于计算天空大气层颜色的光照强度。
   *
   * @type {number}
   * @default 50.0
   */
  this.atmosphereLightIntensity = 50.0;

  /**
   * 用于天空大气层大气散射方程的瑞利散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
   */
  this.atmosphereRayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

  /**
   * 用于天空大气层大气散射方程的米氏散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(21e-6, 21e-6, 21e-6)
   */
  this.atmosphereMieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

  /**
   * 用于天空大气层大气散射方程的瑞利尺度高度，单位为米。
   *
   * @type {number}
   * @default 10000.0
   */
  this.atmosphereRayleighScaleHeight = 10000.0;

  /**
   * 用于天空大气层大气散射方程的米氏尺度高度，单位为米。
   *
   * @type {number}
   * @default 3200.0
   */
  this.atmosphereMieScaleHeight = 3200.0;

  /**
   * 米氏散射所考虑介质的各向异性。
   * <p>
   * 有效值范围为-1.0到1.0之间。
   * </p>
   * @type {number}
   * @default 0.9
   */
  this.atmosphereMieAnisotropy = 0.9;

  /**
   * 应用于大气层的色相偏移。默认值为0.0（无偏移）。
   * 色相偏移为1.0表示完成所有可用色相的循环。
   * @type {number}
   * @default 0.0
   */
  this.hueShift = 0.0;

  /**
   * 应用于大气层的饱和度偏移。默认值为0.0（无偏移）。
   * 饱和度偏移为-1.0时为单色。
   * @type {number}
   * @default 0.0
   */
  this.saturationShift = 0.0;

  /**
   * 应用于大气层的亮度偏移。默认值为0.0（无偏移）。
   * 亮度偏移为-1.0时为完全黑暗，会透出背景太空。
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
   * 获取大气层所围绕的椭球体。
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
 * Set the dynamic lighting enum value for the shader
 * @param {DynamicAtmosphereLightingType} lightingEnum The enum that determines the dynamic atmosphere light source
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
    scratchModelMatrix,
  );
  const rotationOffsetMatrix = Matrix4.multiplyTransformation(
    rotationMatrix,
    Axis.Y_UP_TO_Z_UP,
    scratchModelMatrix,
  );
  const modelMatrix = Matrix4.multiply(
    this._scaleMatrix,
    rotationOffsetMatrix,
    scratchModelMatrix,
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
      }),
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
      CesiumMath.EPSILON7,
    ) &&
    CesiumMath.equalsEpsilon(
      skyAtmosphere.saturationShift,
      0.0,
      CesiumMath.EPSILON7,
    ) &&
    CesiumMath.equalsEpsilon(
      skyAtmosphere.brightnessShift,
      0.0,
      CesiumMath.EPSILON7,
    )
  );
}

/**
 * 如果此对象已被销毁则返回true，否则返回false。
 * <br /><br />
 * 如果对象已销毁，则不应再使用；调用除<code>isDestroyed</code>之外的任何函数都会导致{@link DeveloperError}异常。
 *
 * @returns {boolean} 如果此对象已销毁则返回<code>true</code>，否则返回<code>false</code>。
 *
 * @see SkyAtmosphere#destroy
 */
SkyAtmosphere.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的WebGL资源。销毁对象可以确定性地释放WebGL资源，而非依赖垃圾回收器自动销毁该对象。
 * <br /><br />
 * 对象销毁后不应再使用；调用除<code>isDestroyed</code>之外的任何函数都会导致{@link DeveloperError}异常。因此，
 * 请像示例中那样将返回值（<code>undefined</code>）赋给该对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用destroy()。
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
