import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} EllipsoidGraphics.ConstructorOptions
 *
 * Initialization options for the EllipsoidGraphics constructor
 *
 * @property {Property | boolean} [show=true] A boolean Property specifying the visibility of the ellipsoid.
 * @property {Property | Cartesian3} [radii] A {@link Cartesian3} Property specifying the radii of the ellipsoid.
 * @property {Property | Cartesian3} [innerRadii] A {@link Cartesian3} Property specifying the inner radii of the ellipsoid.
 * @property {Property | number} [minimumClock=0.0] A Property specifying the minimum clock angle of the ellipsoid.
 * @property {Property | number} [maximumClock=2*PI] A Property specifying the maximum clock angle of the ellipsoid.
 * @property {Property | number} [minimumCone=0.0] A Property specifying the minimum cone angle of the ellipsoid.
 * @property {Property | number} [maximumCone=PI] A Property specifying the maximum cone angle of the ellipsoid.
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] A Property specifying what the height from the entity position is relative to.
 * @property {Property | boolean} [fill=true] A boolean Property specifying whether the ellipsoid is filled with the provided material.
 * @property {MaterialProperty | Color} [material=Color.WHITE] A Property specifying the material used to fill the ellipsoid.
 * @property {Property | boolean} [outline=false] A boolean Property specifying whether the ellipsoid is outlined.
 * @property {Property | Color} [outlineColor=Color.BLACK] A Property specifying the {@link Color} of the outline.
 * @property {Property | number} [outlineWidth=1.0] A numeric Property specifying the width of the outline.
 * @property {Property | number} [stackPartitions=64] A Property specifying the number of stacks.
 * @property {Property | number} [slicePartitions=64] A Property specifying the number of radial slices.
 * @property {Property | number} [subdivisions=128] A Property specifying the number of samples per outline ring, determining the granularity of the curvature.
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] An enum Property specifying whether the ellipsoid casts or receives shadows from light sources.
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] A Property specifying at what distance from the camera that this ellipsoid will be displayed.
 */

/**
 * Describe an ellipsoid or sphere.  The center position and orientation are determined by the containing {@link Entity}.
 *
 * @alias EllipsoidGraphics
 * @constructor
 *
 * @param {EllipsoidGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Spheres%20and%20Ellipsoids.html|Cesium Sandcastle Spheres and Ellipsoids Demo}
 */
function EllipsoidGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._radii = undefined;
  this._radiiSubscription = undefined;
  this._innerRadii = undefined;
  this._innerRadiiSubscription = undefined;
  this._minimumClock = undefined;
  this._minimumClockSubscription = undefined;
  this._maximumClock = undefined;
  this._maximumClockSubscription = undefined;
  this._minimumCone = undefined;
  this._minimumConeSubscription = undefined;
  this._maximumCone = undefined;
  this._maximumConeSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
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
  this._stackPartitions = undefined;
  this._stackPartitionsSubscription = undefined;
  this._slicePartitions = undefined;
  this._slicePartitionsSubscription = undefined;
  this._subdivisions = undefined;
  this._subdivisionsSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(EllipsoidGraphics.prototype, {
  /**
   * Gets the event that is raised whenever a property or sub-property is changed or modified.
   * @memberof EllipsoidGraphics.prototype
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
   * 获取或设置boolean Property specifying the visibility of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置{@link Cartesian3} {@link Property} specifying the radii of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   */
  radii: createPropertyDescriptor("radii"),

  /**
   * 获取或设置{@link Cartesian3} {@link Property} specifying the inner radii of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default radii
   */
  innerRadii: createPropertyDescriptor("innerRadii"),

  /**
   * 获取或设置Property specifying the minimum clock angle of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumClock: createPropertyDescriptor("minimumClock"),

  /**
   * 获取或设置Property specifying the maximum clock angle of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 2*PI
   */
  maximumClock: createPropertyDescriptor("maximumClock"),

  /**
   * 获取或设置Property specifying the minimum cone angle of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumCone: createPropertyDescriptor("minimumCone"),

  /**
   * 获取或设置Property specifying the maximum cone angle of the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default PI
   */
  maximumCone: createPropertyDescriptor("maximumCone"),

  /**
   * 获取或设置Property specifying the {@link HeightReference}.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置boolean Property specifying whether the ellipsoid is filled with the provided material.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置Property specifying the material used to fill the ellipsoid.
   * @memberof EllipsoidGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置Property specifying whether the ellipsoid is outlined.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置Property specifying the {@link Color} of the outline.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置numeric Property specifying the width of the outline.
   * <p>
   * Note: This property will be ignored on all major browsers on Windows platforms. For details, see (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置Property specifying the number of stacks.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 64
   */
  stackPartitions: createPropertyDescriptor("stackPartitions"),

  /**
   * 获取或设置Property specifying the number of radial slices per 360 degrees.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 64
   */
  slicePartitions: createPropertyDescriptor("slicePartitions"),

  /**
   * 获取或设置Property specifying the number of samples per outline ring, determining the granularity of the curvature.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 128
   */
  subdivisions: createPropertyDescriptor("subdivisions"),

  /**
   * Get or sets the enum Property specifying whether the ellipsoid
   * casts or receives shadows from light sources.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} Property specifying at what distance from the camera that this ellipsoid will be displayed.
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),
});

/**
 * 复制instance.
 *
 * @param {EllipsoidGraphics} [result] 要在其上存储结果的对象。
 * @returns {EllipsoidGraphics} 修改后的结果参数 or a new instance if one was not provided.
 */
EllipsoidGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new EllipsoidGraphics(this);
  }
  result.show = this.show;
  result.radii = this.radii;
  result.innerRadii = this.innerRadii;
  result.minimumClock = this.minimumClock;
  result.maximumClock = this.maximumClock;
  result.minimumCone = this.minimumCone;
  result.maximumCone = this.maximumCone;
  result.heightReference = this.heightReference;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.stackPartitions = this.stackPartitions;
  result.slicePartitions = this.slicePartitions;
  result.subdivisions = this.subdivisions;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {EllipsoidGraphics} source The object to be merged into this object.
 */
EllipsoidGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.radii = defaultValue(this.radii, source.radii);
  this.innerRadii = defaultValue(this.innerRadii, source.innerRadii);
  this.minimumClock = defaultValue(this.minimumClock, source.minimumClock);
  this.maximumClock = defaultValue(this.maximumClock, source.maximumClock);
  this.minimumCone = defaultValue(this.minimumCone, source.minimumCone);
  this.maximumCone = defaultValue(this.maximumCone, source.maximumCone);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.stackPartitions = defaultValue(
    this.stackPartitions,
    source.stackPartitions
  );
  this.slicePartitions = defaultValue(
    this.slicePartitions,
    source.slicePartitions
  );
  this.subdivisions = defaultValue(this.subdivisions, source.subdivisions);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
};
export default EllipsoidGraphics;
