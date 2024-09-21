import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultGapColor = Color.TRANSPARENT;
const defaultDashLength = 16.0;
const defaultDashPattern = 255.0;

/**
 * A {@link MaterialProperty} that maps to polyline dash {@link Material} uniforms.
 * @alias PolylineDashMaterialProperty
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Property|Color} [options.color=Color.WHITE] A Property specifying the {@link Color} of the line.
 * @param {Property|Color} [options.gapColor=Color.TRANSPARENT] A Property specifying the {@link Color} of the gaps in the line.
 * @param {Property|number} [options.dashLength=16.0] A numeric Property specifying the length of the dash pattern in pixels.
 * @param {Property|number} [options.dashPattern=255.0] A numeric Property specifying a 16 bit pattern for the dash
 */
function PolylineDashMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._gapColor = undefined;
  this._gapColorSubscription = undefined;
  this._dashLength = undefined;
  this._dashLengthSubscription = undefined;
  this._dashPattern = undefined;
  this._dashPatternSubscription = undefined;

  this.color = options.color;
  this.gapColor = options.gapColor;
  this.dashLength = options.dashLength;
  this.dashPattern = options.dashPattern;
}

Object.defineProperties(PolylineDashMaterialProperty.prototype, {
  /**
   * Gets a value indicating if this property is constant.  A property is considered
   * constant if getValue always returns the same result for the current definition.
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._gapColor) &&
        Property.isConstant(this._dashLength) &&
        Property.isConstant(this._dashPattern)
      );
    },
  },
  /**
   * Gets the event that is raised whenever the definition of this property changes.
   * The definition is considered to have changed if a call to getValue would return
   * a different result for the same time.
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取或设置Property specifying the {@link Color} of the line.
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置Property specifying the {@link Color} of the gaps in the line.
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  gapColor: createPropertyDescriptor("gapColor"),

  /**
   * 获取或设置numeric Property specifying the length of a dash cycle
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  dashLength: createPropertyDescriptor("dashLength"),

  /**
   * 获取或设置numeric Property specifying a dash pattern
   * @memberof PolylineDashMaterialProperty.prototype
   * @type {Property|undefined}
   */
  dashPattern: createPropertyDescriptor("dashPattern"),
});

/**
 * Gets the {@link Material} type at the provided time.
 *
 * @param {JulianDate} time The time for which to retrieve the type.
 * @returns {string} The type of material.
 */
PolylineDashMaterialProperty.prototype.getType = function (time) {
  return "PolylineDash";
};

const timeScratch = new JulianDate();

/**
 * Gets the value of the property at the provided time.
 *
 * @param {JulianDate} [time=JulianDate.now()] The time for which to retrieve the value. If omitted, the current system time is used.
 * @param {object} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {object} 修改后的结果参数 or a new instance if the result parameter was not supplied.
 */
PolylineDashMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color
  );
  result.gapColor = Property.getValueOrClonedDefault(
    this._gapColor,
    time,
    defaultGapColor,
    result.gapColor
  );
  result.dashLength = Property.getValueOrDefault(
    this._dashLength,
    time,
    defaultDashLength,
    result.dashLength
  );
  result.dashPattern = Property.getValueOrDefault(
    this._dashPattern,
    time,
    defaultDashPattern,
    result.dashPattern
  );
  return result;
};

/**
 * Compares this property to the provided property and returns
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {Property} [other] The other property.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
PolylineDashMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PolylineDashMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._gapColor, other._gapColor) &&
      Property.equals(this._dashLength, other._dashLength) &&
      Property.equals(this._dashPattern, other._dashPattern))
  );
};
export default PolylineDashMaterialProperty;
