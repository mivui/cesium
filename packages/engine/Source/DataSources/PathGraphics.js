import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PathGraphics.ConstructorOptions
 *
 * PathGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定路径可见性的布尔属性。
 * @property {Property | number} [leadTime] 一个属性，指定要显示的对象前面的秒数。
 * @property {Property | number} [trailTime] 一个属性，指定要显示的对象落后秒数。
 * @property {Property | number} [width=1.0] 一个数字属性，用于指定以像素为单位的宽度。
 * @property {Property | number} [resolution=60] 一个数字属性，指定对位置进行采样时的最大步进秒数。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于绘制路径的材质的属性。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距摄像机多远处显示此路径。
 */

/**
 * 描述定义为 {@link Entity} 在随时间移动时所形成的路径的折线。
 *
 * @alias PathGraphics
 * @constructor
 *
 * @param {PathGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 */
function PathGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._leadTime = undefined;
  this._leadTimeSubscription = undefined;
  this._trailTime = undefined;
  this._trailTimeSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._resolution = undefined;
  this._resolutionSubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PathGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
   * @memberof PathGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置boolean 指定路径可见性的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定要显示的对象前面的秒数的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  leadTime: createPropertyDescriptor("leadTime"),

  /**
   * 获取或设置指定要显示的对象后面的秒数的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  trailTime: createPropertyDescriptor("trailTime"),

  /**
   * 获取或设置numeric 属性，用于指定宽度（以像素为单位）。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置指定对位置进行采样时要步进的最大秒数的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default 60
   */
  resolution: createPropertyDescriptor("resolution"),

  /**
   * 获取或设置指定用于绘制路径的材质的属性。
   * @memberof PathGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此路径将在距摄像机多远处显示的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),
});

/**
 * 复制实例。
 *
 * @param {PathGraphics} [result] 要在其上存储结果的对象。
 * @returns {PathGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
 */
PathGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PathGraphics(this);
  }
  result.show = this.show;
  result.leadTime = this.leadTime;
  result.trailTime = this.trailTime;
  result.width = this.width;
  result.resolution = this.resolution;
  result.material = this.material;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {PathGraphics} source 要合并到此对象中的对象。
 */
PathGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.leadTime = defaultValue(this.leadTime, source.leadTime);
  this.trailTime = defaultValue(this.trailTime, source.trailTime);
  this.width = defaultValue(this.width, source.width);
  this.resolution = defaultValue(this.resolution, source.resolution);
  this.material = defaultValue(this.material, source.material);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
};
export default PathGraphics;
