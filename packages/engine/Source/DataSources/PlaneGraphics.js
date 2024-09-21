import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PlaneGraphics.ConstructorOptions
 *
 * Initialization options for the PlaneGraphics constructor
 *
 * @property {Property | boolean} [show=true] A boolean Property specifying the visibility of the plane.
 * @property {Property | Plane} [plane] A {@link Plane} Property specifying the normal and distance for the plane.
 * @property {Property | Cartesian2} [dimensions] A {@link Cartesian2} Property specifying the width and height of the plane.
 * @property {Property | boolean} [fill=true] A boolean Property specifying whether the plane is filled with the provided material.
 * @property {MaterialProperty | Color} [material=Color.WHITE] A Property specifying the material used to fill the plane.
 * @property {Property | boolean} [outline=false] A boolean Property specifying whether the plane is outlined.
 * @property {Property | Color} [outlineColor=Color.BLACK] A Property specifying the {@link Color} of the outline.
 * @property {Property | number} [outlineWidth=1.0] A numeric Property specifying the width of the outline.
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] An enum Property specifying whether the plane casts or receives shadows from light sources.
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] A Property specifying at what distance from the camera that this plane will be displayed.
 */

/**
 * Describes a plane. The center position and orientation are determined by the containing {@link Entity}.
 *
 * @alias PlaneGraphics
 * @constructor
 *
 * @param {PlaneGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Plane.html|Cesium Sandcastle Plane Demo}
 */
function PlaneGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._plane = undefined;
  this._planeSubscription = undefined;
  this._dimensions = undefined;
  this._dimensionsSubscription = undefined;
  this._fill = undefined;
  this._fillSubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._outline = undefined;
  this._outlineSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PlaneGraphics.prototype, {
  /**
   * Gets the event that is raised whenever a property or sub-property is changed or modified.
   * @memberof PlaneGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置boolean Property specifying the visibility of the plane.
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置{@link Plane} Property specifying the normal and distance of the plane.
   *
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  plane: createPropertyDescriptor("plane"),

  /**
   * 获取或设置{@link Cartesian2} Property specifying the width and height of the plane.
   *
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  dimensions: createPropertyDescriptor("dimensions"),

  /**
   * 获取或设置boolean Property specifying whether the plane is filled with the provided material.
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置material used to fill the plane.
   * @memberof PlaneGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置Property specifying whether the plane is outlined.
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置Property specifying the {@link Color} of the outline.
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric Property specifying the width of the outline.
   * <p>
   * Note: This property will be ignored on all major browsers on Windows platforms. For details, see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * Get or sets the enum Property specifying whether the plane
   * casts or receives shadows from light sources.
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} Property specifying at what distance from the camera that this plane will be displayed.
   * @memberof PlaneGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),
});

/**
 * 复制instance.
 *
 * @param {PlaneGraphics} [result] 要在其上存储结果的对象。
 * @returns {PlaneGraphics} The modified result parameter or a new instance if one was not provided.
 */
PlaneGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PlaneGraphics(this);
  }
  result.show = this.show;
  result.plane = this.plane;
  result.dimensions = this.dimensions;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {PlaneGraphics} source The object to be merged into this object.
 */
PlaneGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.plane = defaultValue(this.plane, source.plane);
  this.dimensions = defaultValue(this.dimensions, source.dimensions);
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
};
export default PlaneGraphics;
