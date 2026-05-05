import Frozen from "../Core/Frozen.js";
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
 * @property {Property | boolean} [show=true] 布尔属性，指定折线的可见性。
 * @property {Property | Cartesian3[]} [positions] 指定定义线带（line strip）的 {@link Cartesian3} 位置数组的属性。
 * @property {Property | number} [width=1.0] 数值属性，指定宽度（像素）。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 数值属性，如果 arcType 不是 ArcType.NONE，则指定每个经纬度之间的角距离。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于绘制折线的材质的属性。
 * @property {MaterialProperty | Color} [depthFailMaterial] 指定当折线在地形下方时用于绘制折线的材质的属性。
 * @property {Property | ArcType} [arcType=ArcType.GEODESIC] 折线线段必须遵循的线条类型。
 * @property {Property | boolean} [clampToGround=false] 布尔属性，指定折线是否应贴合地面。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 枚举属性，指定折线是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定从相机多远距离显示此折线的属性。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 枚举属性，指定此折线在贴地时是否对地形、3D Tiles 或两者进行分类。
 * @property {Property | number} [zIndex=0] 指定用于排序地面几何体的 zIndex 的属性。仅在 `clampToGround` 为 true 且支持地形上的折线时有效。
 */

/**
 * 描述一条折线。前两个位置定义一条线段，每个附加位置定义从前一个位置开始的线段。
 * 这些线段可以是线性连接点、大圆弧或贴合地形。
 *
 * @alias PolylineGraphics
 * @constructor
 *
 * @param {PolylineGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?id=polyline|Cesium Sandcastle 折线演示}
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

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(PolylineGraphics.prototype, {
  /**
   * 获取当属性或子属性更改或修改时引发的事件。
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
   * 获取或设置指定折线可见性的布尔属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定定义线带的 {@link Cartesian3} 位置数组的属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置指定宽度（像素）的数值属性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置数值属性，如果 arcType 不是 ArcType.NONE 且 clampToGround 为 false，则指定每个经纬度之间的角距离。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default Cesium.Math.RADIANS_PER_DEGREE
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置指定用于绘制折线的材质的属性。
   * @memberof PolylineGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定当折线未通过深度测试时用于绘制折线的材质的属性。
   * <p>
   * 需要 EXT_frag_depth WebGL 扩展才能正确渲染。如果不支持该扩展，
   * 可能会出现伪影。
   * </p>
   * @memberof PolylineGraphics.prototype
   * @type {MaterialProperty}
   * @default undefined
   */
  depthFailMaterial: createMaterialPropertyDescriptor("depthFailMaterial"),

  /**
   * 获取或设置 {@link ArcType} 属性，指定线段应为大圆弧、等角航线还是线性连接。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ArcType.GEODESIC
   */
  arcType: createPropertyDescriptor("arcType"),

  /**
   * 获取或设置布尔属性，指定折线是否应贴合地面。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  clampToGround: createPropertyDescriptor("clampToGround"),

  /**
   * 获取或设置枚举属性，指定折线是否从光源投射或接收阴影。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机多远距离显示此折线。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置 {@link ClassificationType} 属性，指定此折线在贴地时是否对地形、3D Tiles 或两者进行分类。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置 zIndex 属性，指定折线的排序顺序。仅在 `clampToGround` 为 true 且支持地形上的折线时有效。
   * @memberof PolylineGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制此实例。
 *
 * @param {PolylineGraphics} [result] 用于存储结果的object。
 * @returns {PolylineGraphics} 修改后的结果参数，如果未提供则返回新实例。
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
 * 将此对象上每个未赋值的属性设置为提供的源对象上相同属性的值。
 *
 * @param {PolylineGraphics} source 要合并到此对象中的对象。
 */
PolylineGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.positions = this.positions ?? source.positions;
  this.width = this.width ?? source.width;
  this.granularity = this.granularity ?? source.granularity;
  this.material = this.material ?? source.material;
  this.depthFailMaterial = this.depthFailMaterial ?? source.depthFailMaterial;
  this.arcType = this.arcType ?? source.arcType;
  this.clampToGround = this.clampToGround ?? source.clampToGround;
  this.shadows = this.shadows ?? source.shadows;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.classificationType =
    this.classificationType ?? source.classificationType;
  this.zIndex = this.zIndex ?? source.zIndex;
};
export default PolylineGraphics;
