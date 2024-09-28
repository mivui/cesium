import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PolylineGraphics.ConstructorOptions
 *
 * PolylineGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定多段线可见性的布尔属性。
 * @property {Property |Cartesian3[]} [positions] 一个属性，指定定义线带的 {@link Cartesian3} 位置数组。
 * @property {Property | number} [width=1.0] 一个数字属性，用于指定以像素为单位的宽度。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值属性，如果 arcType 不是 ArcType.NONE，则指定每个纬度和经度之间的角度距离。
 * @property {MaterialProperty |Color} [material=Color.WHITE] 指定用于绘制多段线的材料的属性。
 * @property {MaterialProperty |Color} [depthFailMaterial] 一个属性，用于指定当多段线低于地形时用于绘制多段线的材质。
 * @property {Property |ArcType} [arcType=ArcType.GEODESIC] 多段线段必须遵循的线类型。
 * @property {Property | boolean} [clampToGround=false] 一个布尔属性，指定是否应将 Polyline 固定在地面上。
 * @property {Property |ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定多段线是投射还是接收来自光源的阴影。
 * @property {Property |DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定此多段线将在距摄像机多远处显示。
 * @property {Property |ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定此多段线在地面上时是对地形、3D 瓦片进行分类，还是对两者进行分类。
 * @property {Property | number} [zIndex=0] 指定用于对地面几何图形进行排序的 zIndex 的属性。仅当 'clampToGround' 为 true 并且支持地形上的折线时才有效。
 */

/**
 * 描述多段线。前两个位置定义一条线段
 * ，每个额外的位置定义从前一个位置开始的线段。细分
 * 可以是线性连接点、大圆弧或固定到地形。
 *
 * @alias PolylineGraphics
 * @constructor
 *
 * @param {PolylineGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polyline.html|Cesium Sandcastle Polyline Demo}
 */
function PolylineGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._granularity = undefined;
  this._granularitySubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._depthFailMaterial = undefined;
  this._depthFailMaterialSubscription = undefined;
  this._arcType = undefined;
  this._arcTypeSubscription = undefined;
  this._clampToGround = undefined;
  this._clampToGroundSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PolylineGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
   * @memberof PolylineGraphics.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置boolean 指定多段线可见性的属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定 {@link Cartesian3} 数组的属性
   * 定义线带的位置。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置numeric 属性，用于指定宽度（以像素为单位）。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置numeric 属性，如果 arcType 不是 ArcType.NONE 且 clampToGround 为 false，则指定每个纬度和经度之间的角度距离。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default Cesium.Math.RADIANS_PER_DEGREE
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置指定用于绘制多段线的材料的属性。
   * @memberof PolylineGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定在深度测试失败时用于绘制多段线的材料的属性。
   * <p>
   * 需要 EXT_frag_depth WebGL 扩展才能正确呈现。如果该扩展不受支持，则
   * 可能存在伪影。
   * </p>
   * @memberof PolylineGraphics.prototype
   * @type {MaterialProperty}
   * @default undefined
   */
  depthFailMaterial: createMaterialPropertyDescriptor("depthFailMaterial"),

  /**
   * 获取或设置{@link ArcType} 指定线段应为大圆弧、恒向线还是线性连接的属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ArcType.GEODESIC
   */
  arcType: createPropertyDescriptor("arcType"),

  /**
   * 获取或设置boolean 属性，指定多段线是否
   * 应夹在地面上。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  clampToGround: createPropertyDescriptor("clampToGround"),

  /**
   * 获取或设置 enum 属性，指定 polyline 是否
   * 从光源投射或接收阴影。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此多段线将在距相机多远处显示的属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置{@link ClassificationType} 指定此多段线在地面上时是分类地形、3D 瓦片还是两者的属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置zIndex 属性指定折线的顺序。仅当 'clampToGround' 为 true 并且支持地形上的折线时才有效。
   * @memberof PolylineGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制实例。
 *
 * @param {PolylineGraphics} [result] 要在其上存储结果的对象。
 * @returns {PolylineGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
 */
PolylineGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolylineGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.width = this.width;
  result.granularity = this.granularity;
  result.material = this.material;
  result.depthFailMaterial = this.depthFailMaterial;
  result.arcType = this.arcType;
  result.clampToGround = this.clampToGround;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  return result;
};

/**
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {PolylineGraphics} source 要合并到此对象中的对象。
 */
PolylineGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.width = defaultValue(this.width, source.width);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.material = defaultValue(this.material, source.material);
  this.depthFailMaterial = defaultValue(
    this.depthFailMaterial,
    source.depthFailMaterial,
  );
  this.arcType = defaultValue(this.arcType, source.arcType);
  this.clampToGround = defaultValue(this.clampToGround, source.clampToGround);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.classificationType = defaultValue(
    this.classificationType,
    source.classificationType,
  );
  this.zIndex = defaultValue(this.zIndex, source.zIndex);
};
export default PolylineGraphics;
