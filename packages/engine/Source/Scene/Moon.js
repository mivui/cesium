import buildModuleUrl from "../Core/buildModuleUrl.js";
import Cartesian3 from "../Core/Cartesian3.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import IauOrientationAxes from "../Core/IauOrientationAxes.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Simon1994PlanetaryPositions from "../Core/Simon1994PlanetaryPositions.js";
import Transforms from "../Core/Transforms.js";
import EllipsoidPrimitive from "./EllipsoidPrimitive.js";
import Material from "./Material.js";

/**
 * 以 3D 方式绘制月亮。
 * @alias Moon
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.show=true] 决定是否渲染月亮。
 * @param {string} [options.textureUrl=buildModuleUrl('Assets/Textures/moonSmall.jpg')] 月亮纹理。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.MOON] 月球椭球体。
 * @param {boolean} [options.onlySunLighting=true] 使用太阳作为唯一的光源。
 *
 *
 * @example
 * scene.moon = new Cesium.Moon();
 *
 * @see Scene#moon
 */
function Moon(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let url = options.textureUrl;
  if (!defined(url)) {
    url = buildModuleUrl("Assets/Textures/moonSmall.jpg");
  }

  /**
   * 确定是否显示月亮。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 月亮纹理。
   * @type {string}
   * @default buildModuleUrl('Assets/Textures/moonSmall.jpg')
   */
  this.textureUrl = url;

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.MOON);

  /**
   * 使用太阳作为唯一的光源。
   * @type {boolean}
   * @default true
   */
  this.onlySunLighting = defaultValue(options.onlySunLighting, true);

  this._ellipsoidPrimitive = new EllipsoidPrimitive({
    radii: this.ellipsoid.radii,
    material: Material.fromType(Material.ImageType),
    depthTestEnabled: false,
    _owner: this,
  });
  this._ellipsoidPrimitive.material.translucent = false;

  this._axes = new IauOrientationAxes();
}

Object.defineProperties(Moon.prototype, {
  /**
   * 获取定义月亮形状的椭球体。
   *
   * @memberof Moon.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   *
   * @default {@link Ellipsoid.MOON}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
});

const icrfToFixed = new Matrix3();
const rotationScratch = new Matrix3();
const translationScratch = new Cartesian3();
const scratchCommandList = [];

/**
 * @private
 */
Moon.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const ellipsoidPrimitive = this._ellipsoidPrimitive;
  ellipsoidPrimitive.material.uniforms.image = this.textureUrl;
  ellipsoidPrimitive.onlySunLighting = this.onlySunLighting;

  const date = frameState.time;
  if (!defined(Transforms.computeIcrfToFixedMatrix(date, icrfToFixed))) {
    Transforms.computeTemeToPseudoFixedMatrix(date, icrfToFixed);
  }

  const rotation = this._axes.evaluate(date, rotationScratch);
  Matrix3.transpose(rotation, rotation);
  Matrix3.multiply(icrfToFixed, rotation, rotation);

  const translation =
    Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame(
      date,
      translationScratch,
    );
  Matrix3.multiplyByVector(icrfToFixed, translation, translation);

  Matrix4.fromRotationTranslation(
    rotation,
    translation,
    ellipsoidPrimitive.modelMatrix,
  );

  const savedCommandList = frameState.commandList;
  frameState.commandList = scratchCommandList;
  scratchCommandList.length = 0;
  ellipsoidPrimitive.update(frameState);
  frameState.commandList = savedCommandList;
  return scratchCommandList.length === 1 ? scratchCommandList[0] : undefined;
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code>，如果此对象被销毁;否则为 <code>false</code>。
 *
 * @see Moon#destroy
 */
Moon.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * moon = moon && moon.destroy();
 *
 * @see Moon#isDestroyed
 */
Moon.prototype.destroy = function () {
  this._ellipsoidPrimitive =
    this._ellipsoidPrimitive && this._ellipsoidPrimitive.destroy();
  return destroyObject(this);
};
export default Moon;
