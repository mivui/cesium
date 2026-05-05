import Cartographic from "../Core/Cartographic.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Cesium3DTileFeature from "./Cesium3DTileFeature.js";
import createBillboardPointCallback from "./createBillboardPointCallback.js";

/** @import Billboard from "./Billboard.js"; */
/** @import Cesium3DTileContent from "./Cesium3DTileContent.js"; */
/** @import Cesium3DTileset from "./Cesium3DTileset.js"; */
/** @import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js"; */
/** @import HorizontalOrigin from "./HorizontalOrigin.js"; */
/** @import Label from "./Label.js"; */
/** @import NearFarScalar from "../Core/NearFarScalar.js"; */
/** @import Polyline from "./Polyline.js"; */
/** @import VerticalOrigin from "./VerticalOrigin.js"; */

/** @ignore */
const scratchCartographic = new Cartographic();

/**
 * {@link Cesium3DTileset} 的点要素。
 * <p>
 * 提供对存储在瓦片批处理表中的要素属性的访问，以及
 * 显示/隐藏要素和更改其点属性的能力
 * </p>
 * <p>
 * 对 <code>Cesium3DTilePointFeature</code> 对象的修改具有瓦片内容生命周期。
 * 如果瓦片内容被卸载（例如，由于超出视野并需要为可见瓦片释放缓存空间），
 * 请监听 {@link Cesium3DTileset#tileUnload} 事件以保存任何修改。
 * 同时监听 {@link Cesium3DTileset#tileVisible} 事件以重新应用任何修改。
 * </p>
 * <p>
 * 不要直接构造此对象。通过 {@link Cesium3DTileContent#getFeature}
 * 或使用 {@link Scene#pick} 和 {@link Scene#pickPosition} 拾取来访问它。
 * </p>
 *
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 *
 * @example
 * // 鼠标悬停时，在控制台日志中显示要素的所有属性。
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTilePointFeature) {
 *         const propertyIds = feature.getPropertyIds();
 *         const length = propertyIds.length;
 *         for (let i = 0; i < length; ++i) {
 *             const propertyId = propertyIds[i];
 *             console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 *         }
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
class Cesium3DTilePointFeature {
  static defaultColor = Color.WHITE;
  static defaultPointOutlineColor = Color.BLACK;
  static defaultPointOutlineWidth = 0.0;
  static defaultPointSize = 8.0;

  /**
   * @param {Cesium3DTileContent} content
   * @param {number} batchId
   * @param {Billboard} billboard
   * @param {Label} label
   * @param {Polyline} polyline
   */
  constructor(content, batchId, billboard, label, polyline) {
    this._content = content;
    this._billboard = billboard;
    this._label = label;
    this._polyline = polyline;

    this._batchId = batchId;
    this._billboardImage = undefined;
    this._billboardColor = undefined;
    this._billboardOutlineColor = undefined;
    this._billboardOutlineWidth = undefined;
    this._billboardSize = undefined;
    this._pointSize = undefined;
    this._color = undefined;
    this._pointSize = undefined;
    this._pointOutlineColor = undefined;
    this._pointOutlineWidth = undefined;
    this._heightOffset = undefined;

    this._pickIds = new Array(3);

    setBillboardImage(this);
  }

  /**
   * 获取或设置是否显示要素。当评估样式的 show 时，会为所有要素设置此值。
   *
   * @type {boolean}
   *
   * @default true
   */
  get show() {
    return this._label.show;
  }

  set show(value) {
    this._label.show = value;
    this._billboard.show = value;
    this._polyline.show = value;
  }

  /**
   * 获取或设置此要素点的颜色。
   * <p>
   * 仅在 <code>image</code> 为 <code>undefined</code> 时应用。
   * </p>
   *
   * @type {Color}
   */
  get color() {
    return this._color;
  }

  set color(value) {
    this._color = Color.clone(value, this._color);
    setBillboardImage(this);
  }

  /**
   * 获取或设置此要素的点大小。
   * <p>
   * 仅在 <code>image</code> 为 <code>undefined</code> 时应用。
   * </p>
   *
   * @type {number}
   */
  get pointSize() {
    return this._pointSize;
  }

  set pointSize(value) {
    this._pointSize = value;
    setBillboardImage(this);
  }

  /**
   * 获取或设置此要素的点轮廓颜色。
   * <p>
   * 仅在 <code>image</code> 为 <code>undefined</code> 时应用。
   * </p>
   *
   * @type {Color}
   */
  get pointOutlineColor() {
    return this._pointOutlineColor;
  }

  set pointOutlineColor(value) {
    this._pointOutlineColor = Color.clone(value, this._pointOutlineColor);
    setBillboardImage(this);
  }

  /**
   * 获取或设置此要素的点轮廓宽度（以像素为单位）。
   * <p>
   * 仅在 <code>image</code> 为 <code>undefined</code> 时应用。
   * </p>
   *
   * @type {number}
   */
  get pointOutlineWidth() {
    return this._pointOutlineWidth;
  }

  set pointOutlineWidth(value) {
    this._pointOutlineWidth = value;
    setBillboardImage(this);
  }

  /**
   * 获取或设置此要素的标签颜色。
   * <p>
   * 如果定义了 <code>labelText</code>，则颜色将应用于标签。
   * </p>
   *
   * @type {Color}
   */
  get labelColor() {
    return this._label.fillColor;
  }

  set labelColor(value) {
    this._label.fillColor = value;
    this._polyline.show = this._label.show && value.alpha > 0.0;
  }

  /**
   * 获取或设置此要素的标签轮廓颜色。
   * <p>
   * 如果定义了 <code>labelText</code>，则轮廓颜色将应用于标签。
   * </p>
   *
   * @type {Color}
   */
  get labelOutlineColor() {
    return this._label.outlineColor;
  }

  set labelOutlineColor(value) {
    this._label.outlineColor = value;
  }

  /**
   * 获取或设置此要素的轮廓宽度（以像素为单位）。
   * <p>
   * 如果定义了 <code>labelText</code>，则轮廓宽度将应用于点。
   * </p>
   *
   * @type {number}
   */
  get labelOutlineWidth() {
    return this._label.outlineWidth;
  }

  set labelOutlineWidth(value) {
    this._label.outlineWidth = value;
  }

  /**
   * 获取或设置此要素的字体。
   * <p>
   * 仅在定义了 <code>labelText</code> 时应用。
   * </p>
   *
   * @type {string}
   */
  get font() {
    return this._label.font;
  }

  set font(value) {
    this._label.font = value;
  }

  /**
   * 获取或设置此要素的填充和轮廓样式。
   * <p>
   * 仅在定义了 <code>labelText</code> 时应用。
   * </p>
   *
   * @type {LabelStyle}
   */
  get labelStyle() {
    return this._label.style;
  }

  set labelStyle(value) {
    this._label.style = value;
  }

  /**
   * 获取或设置此要素的文本。
   *
   * @type {string}
   */
  get labelText() {
    return this._label.text;
  }

  set labelText(value) {
    if (!defined(value)) {
      value = "";
    }
    this._label.text = value;
  }

  /**
   * 获取或设置此要素文本的背景颜色。
   * <p>
   * 仅在定义了 <code>labelText</code> 时应用。
   * </p>
   *
   * @type {Color}
   */
  get backgroundColor() {
    return this._label.backgroundColor;
  }

  set backgroundColor(value) {
    this._label.backgroundColor = value;
  }

  /**
   * 获取或设置此要素文本的背景内边距。
   * <p>
   * 仅在定义了 <code>labelText</code> 时应用。
   * </p>
   *
   * @type {Cartesian2}
   */
  get backgroundPadding() {
    return this._label.backgroundPadding;
  }

  set backgroundPadding(value) {
    this._label.backgroundPadding = value;
  }

  /**
   * 获取或设置是否显示此要素文本的背景。
   * <p>
   * 仅在定义了 <code>labelText</code> 时应用。
   * </p>
   *
   * @type {boolean}
   */
  get backgroundEnabled() {
    return this._label.showBackground;
  }

  set backgroundEnabled(value) {
    this._label.showBackground = value;
  }

  /**
   * 获取或设置此要素的近端和远端缩放属性。
   *
   * @type {NearFarScalar}
   */
  get scaleByDistance() {
    return this._label.scaleByDistance;
  }

  set scaleByDistance(value) {
    this._label.scaleByDistance = value;
    this._billboard.scaleByDistance = value;
  }

  /**
   * 获取或设置此要素的近端和远端透明度属性。
   *
   * @type {NearFarScalar}
   */
  get translucencyByDistance() {
    return this._label.translucencyByDistance;
  }

  set translucencyByDistance(value) {
    this._label.translucencyByDistance = value;
    this._billboard.translucencyByDistance = value;
  }

  /**
   * 获取或设置指定从此要素的摄像机距离的条件，在该距离处将显示此要素。
   *
   * @type {DistanceDisplayCondition}
   */
  get distanceDisplayCondition() {
    return this._label.distanceDisplayCondition;
  }

  set distanceDisplayCondition(value) {
    this._label.distanceDisplayCondition = value;
    this._polyline.distanceDisplayCondition = value;
    this._billboard.distanceDisplayCondition = value;
  }

  /**
   * 获取或设置此要素的高度偏移量（以米为单位）。
   *
   * @type {number}
   */
  get heightOffset() {
    return this._heightOffset;
  }

  set heightOffset(value) {
    const offset = this._heightOffset ?? 0.0;

    const ellipsoid = this._content.tileset.ellipsoid;
    const cart = ellipsoid.cartesianToCartographic(
      this._billboard.position,
      scratchCartographic,
    );
    cart.height = cart.height - offset + value;
    const newPosition = ellipsoid.cartographicToCartesian(cart);

    this._billboard.position = newPosition;
    this._label.position = this._billboard.position;
    this._polyline.positions = [this._polyline.positions[0], newPosition];

    this._heightOffset = value;
  }

  /**
   * 获取或设置是否显示锚线。
   * <p>
   * 仅在定义了 <code>heightOffset</code> 时应用。
   * </p>
   *
   * @type {boolean}
   */
  get anchorLineEnabled() {
    return this._polyline.show;
  }

  set anchorLineEnabled(value) {
    this._polyline.show = value;
  }

  /**
   * 获取或设置锚线的颜色。
   * <p>
   * 仅在定义了 <code>heightOffset</code> 时应用。
   * </p>
   *
   * @type {Color}
   */
  get anchorLineColor() {
    return this._polyline.material.uniforms.color;
  }

  set anchorLineColor(value) {
    this._polyline.material.uniforms.color = Color.clone(
      value,
      this._polyline.material.uniforms.color,
    );
  }

  /**
   * 获取或设置此要素的图像。
   *
   * @type {string}
   */
  get image() {
    return this._billboardImage;
  }

  set image(value) {
    const imageChanged = this._billboardImage !== value;
    this._billboardImage = value;
    if (imageChanged) {
      setBillboardImage(this);
    }
  }

  /**
   * 获取或设置将禁用深度测试的距离。
   *
   * @type {number}
   */
  get disableDepthTestDistance() {
    return this._label.disableDepthTestDistance;
  }

  set disableDepthTestDistance(value) {
    this._label.disableDepthTestDistance = value;
    this._billboard.disableDepthTestDistance = value;
  }

  /**
   * 获取或设置此点的水平原点，它确定点位于其锚定位置的左侧、中心还是右侧。
   *
   * @type {HorizontalOrigin}
   */
  get horizontalOrigin() {
    return this._billboard.horizontalOrigin;
  }

  set horizontalOrigin(value) {
    this._billboard.horizontalOrigin = value;
  }

  /**
   * 获取或设置此点的垂直原点，它确定点位于其锚定位置的底部、中心还是顶部。
   *
   * @type {VerticalOrigin}
   */
  get verticalOrigin() {
    return this._billboard.verticalOrigin;
  }

  set verticalOrigin(value) {
    this._billboard.verticalOrigin = value;
  }

  /**
   * 获取或设置此点文本的水平原点，它确定点文本位于其锚定位置的左侧、中心还是右侧。
   *
   * @type {HorizontalOrigin}
   */
  get labelHorizontalOrigin() {
    return this._label.horizontalOrigin;
  }

  set labelHorizontalOrigin(value) {
    this._label.horizontalOrigin = value;
  }

  /**
   * 获取或设置此点文本的垂直原点，它确定点文本位于其锚定位置的底部、中心、顶部还是基线。
   *
   * @type {VerticalOrigin}
   */
  get labelVerticalOrigin() {
    return this._label.verticalOrigin;
  }

  set labelVerticalOrigin(value) {
    this._label.verticalOrigin = value;
  }

  /**
   * Gets the content of the tile containing the feature.
   *
   * @type {Cesium3DTileContent}
   *
   * @readonly
   * @private
   */
  get content() {
    return this._content;
  }

  /**
   * 获取包含要素的瓦片集。
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */
  get tileset() {
    return this._content.tileset;
  }

  /**
   * 由 {@link Scene#pick} 返回的所有对象都有一个 <code>primitive</code> 属性。此属性返回
   * 包含要素的瓦片集。
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */
  get primitive() {
    return this._content.tileset;
  }

  /**
   * @private
   */
  get pickIds() {
    const ids = this._pickIds;
    ids[0] = this._billboard.pickId;
    ids[1] = this._label.pickId;
    ids[2] = this._polyline.pickId;
    return ids;
  }

  /**
   * 返回要素是否包含此属性。这包括来自此要素的
   * 类以及使用批处理表层次结构时的继承类的属性。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
   *
   * @param {string} name 属性的区分大小写名称。
   * @returns {boolean} 要素是否包含此属性。
   */
  hasProperty(name) {
    return this._content.batchTable.hasProperty(this._batchId, name);
  }

  /**
   * 返回要素的属性 ID 数组。这包括来自此要素的
   * 类以及使用批处理表层次结构时的继承类的属性。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
   *
   * @param {string[]} [results] 用于存储结果的数组。
   * @returns {string[]} 要素属性的 ID。
   */
  getPropertyIds(results) {
    return this._content.batchTable.getPropertyIds(this._batchId, results);
  }

  /**
   * 返回具有给定名称的要素属性值的副本。这包括来自此要素的
   * 类以及使用批处理表层次结构时的继承类的属性。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
   *
   * @param {string} name 属性的区分大小写名称。
   * @returns {*} 属性的值，如果要素没有此属性，则为 <code>undefined</code>。
   *
   * @example
   * // 在控制台日志中显示要素的所有属性。
   * const propertyIds = feature.getPropertyIds();
   * const length = propertyIds.length;
   * for (let i = 0; i < length; ++i) {
   *     const propertyId = propertyIds[i];
   *     console.log(`{propertyId} : ${feature.getProperty(propertyId)}`);
   * }
   */
  getProperty(name) {
    return this._content.batchTable.getProperty(this._batchId, name);
  }

  /**
   * Returns a copy of the value of the feature's property with the given name.
   * If the feature is contained within a tileset that has metadata (3D Tiles 1.1)
   * or uses the <code>3DTILES_metadata</code> extension, tileset, group and tile metadata is
   * inherited.
   * <p>
   * To resolve name conflicts, this method resolves names from most specific to
   * least specific by metadata granularity in the order: feature, tile, group,
   * tileset. Within each granularity, semantics are resolved first, then other
   * properties.
   * </p>
   * @param {string} name The case-sensitive name of the property.
   * @returns {*} The value of the property or <code>undefined</code> if the feature does not have this property.
   * @private
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   */
  getPropertyInherited(name) {
    return Cesium3DTileFeature.getPropertyInherited(
      this._content,
      this._batchId,
      name,
    );
  }

  /**
   * 设置具有给定名称的要素属性的值。
   * <p>
   * 如果不存在具有给定名称的属性，则会创建该属性。
   * </p>
   *
   * @param {string} name 属性的区分大小写名称。
   * @param {*} value 将被复制的属性值。
   *
   * @exception {DeveloperError} 继承的批处理表层次结构属性为只读。
   *
   * @example
   * const height = feature.getProperty('Height'); // 例如，建筑物的高度
   *
   * @example
   * const name = 'clicked';
   * if (feature.getProperty(name)) {
   *     console.log('already clicked');
   * } else {
   *     feature.setProperty(name, true);
   *     console.log('first click');
   * }
   */
  setProperty(name, value) {
    this._content.batchTable.setProperty(this._batchId, name, value);

    // PERFORMANCE_IDEA: Probably overkill, but maybe only mark the tile dirty if the
    // property is in one of the style's expressions or - if it can be done quickly -
    // if the new property value changed the result of an expression.
    this._content.featurePropertiesDirty = true;
  }

  /**
   * Returns whether the feature's class name equals <code>className</code>. Unlike {@link Cesium3DTilePointFeature#isClass}
   * this function only checks the feature's exact class and not inherited classes.
   * <p>
   * This function returns <code>false</code> if no batch table hierarchy is present.
   * </p>
   *
   * @param {string} className The name to check against.
   * @returns {boolean} Whether the feature's class name equals <code>className</code>
   *
   * @private
   */
  isExactClass(className) {
    return this._content.batchTable.isExactClass(this._batchId, className);
  }

  /**
   * Returns whether the feature's class or any inherited classes are named <code>className</code>.
   * <p>
   * This function returns <code>false</code> if no batch table hierarchy is present.
   * </p>
   *
   * @param {string} className The name to check against.
   * @returns {boolean} Whether the feature's class or inherited classes are named <code>className</code>
   *
   * @private
   */
  isClass(className) {
    return this._content.batchTable.isClass(this._batchId, className);
  }

  /**
   * Returns the feature's class name.
   * <p>
   * This function returns <code>undefined</code> if no batch table hierarchy is present.
   * </p>
   *
   * @returns {string} The feature's class name.
   *
   * @private
   */
  getExactClassName() {
    return this._content.batchTable.getExactClassName(this._batchId);
  }
}

/**
 * @param {Cesium3DTilePointFeature} feature
 * @ignore
 */
function setBillboardImage(feature) {
  const b = feature._billboard;
  if (defined(feature._billboardImage) && feature._billboardImage !== b.image) {
    b.image = feature._billboardImage;
    return;
  }

  if (defined(feature._billboardImage)) {
    return;
  }

  const newColor = feature._color ?? Cesium3DTilePointFeature.defaultColor;
  const newOutlineColor =
    feature._pointOutlineColor ??
    Cesium3DTilePointFeature.defaultPointOutlineColor;
  const newOutlineWidth =
    feature._pointOutlineWidth ??
    Cesium3DTilePointFeature.defaultPointOutlineWidth;
  const newPointSize =
    feature._pointSize ?? Cesium3DTilePointFeature.defaultPointSize;

  const currentColor = feature._billboardColor;
  const currentOutlineColor = feature._billboardOutlineColor;
  const currentOutlineWidth = feature._billboardOutlineWidth;
  const currentPointSize = feature._billboardSize;

  if (
    Color.equals(newColor, currentColor) &&
    Color.equals(newOutlineColor, currentOutlineColor) &&
    newOutlineWidth === currentOutlineWidth &&
    newPointSize === currentPointSize
  ) {
    return;
  }

  feature._billboardColor = Color.clone(newColor, feature._billboardColor);
  feature._billboardOutlineColor = Color.clone(
    newOutlineColor,
    feature._billboardOutlineColor,
  );
  feature._billboardOutlineWidth = newOutlineWidth;
  feature._billboardSize = newPointSize;

  const centerAlpha = newColor.alpha;
  const cssColor = newColor.toCssColorString();
  const cssOutlineColor = newOutlineColor.toCssColorString();
  const textureId = JSON.stringify([
    cssColor,
    newPointSize,
    cssOutlineColor,
    newOutlineWidth,
  ]);

  b.setImage(
    textureId,
    createBillboardPointCallback(
      centerAlpha,
      cssColor,
      cssOutlineColor,
      newOutlineWidth,
      newPointSize,
    ),
  );
}

export default Cesium3DTilePointFeature;
