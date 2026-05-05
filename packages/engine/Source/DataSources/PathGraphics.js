import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PathGraphics.ConstructorOptions
 *
 * PathGraphics构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定路径可见性的布尔属性。
 * @property {Property | number} [leadTime] 指定对象前方显示秒数的属性。
 * @property {Property | number} [trailTime] 指定对象后方显示秒数的属性。
 * @property {Property | number} [width=1.0] 指定宽度（像素）的数值属性。
 * @property {Property | number} [resolution=60] 指定采样位置时的最大步长（秒）的数值属性。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于绘制路径的材质的属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定路径在距离相机多远时显示的属性。
 * @property {Property | string} [relativeTo] 指定可视化路径的参考系的属性。使用另一个实体的id来可视化相对于该实体的路径，或使用字符串值"FIXED"或"INERTIAL"在这些参考系中可视化路径。
 */

/**
 * 描述由 {@link Entity} 随时间移动所创建的路径定义的折线。
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
  this._relativeTo = undefined;
  this._relativeToSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(PathGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
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
   * 获取或设置指定路径可见性的布尔属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定对象前方显示秒数的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  leadTime: createPropertyDescriptor("leadTime"),

  /**
   * 获取或设置指定对象后方显示秒数的属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  trailTime: createPropertyDescriptor("trailTime"),

  /**
   * 获取或设置指定宽度（像素）的数值属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置指定采样位置时的最大步长（秒）的属性。
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
   * 获取或设置指定路径在距离相机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置可视化路径的参考系。使用另一个实体的id来可视化相对于该实体的路径，或使用字符串值"FIXED"或"INERTIAL"在这些参考系中可视化路径。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @experimental 此功能尚未最终确定，可能会在不遵循Cesium标准弃用政策的情况下更改。
   */
  relativeTo: createPropertyDescriptor("relativeTo"),
});

/**
 * 复制此实例。
 *
 * @param {PathGraphics} [result] 存储结果的对象。
 * @returns {PathGraphics} 修改后的结果参数，如果未提供则返回新实例。
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
  result.relativeTo = this.relativeTo;
  return result;
};

/**
 * 将此对象上每个未赋值的属性分配给提供的源对象上相同属性的值。
 *
 * @param {PathGraphics} source 要合并到此对象中的对象。
 */
PathGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.leadTime = this.leadTime ?? source.leadTime;
  this.trailTime = this.trailTime ?? source.trailTime;
  this.width = this.width ?? source.width;
  this.resolution = this.resolution ?? source.resolution;
  this.material = this.material ?? source.material;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.relativeTo = this.relativeTo ?? source.relativeTo;
};
export default PathGraphics;
