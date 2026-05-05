import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ConstantProperty from "./ConstantProperty.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

/**
 * 一个 {@link Property}，其值是属性名称到其他属性计算值的键值映射。
 *
 * @alias PropertyBag
 * @implements Record<string, any>
 * @constructor
 *
 * @param {object} [value] 包含属性名称到属性的键值映射的对象。
 * @param {Function} [createPropertyCallback] 当 value 中任何属性的值不是 Property 时调用的函数。
 */
function PropertyBag(value, createPropertyCallback) {
  this._propertyNames = [];
  this._definitionChanged = new Event();

  if (defined(value)) {
    this.merge(value, createPropertyCallback);
  }
}

Object.defineProperties(PropertyBag.prototype, {
  /**
   * 获取此实例上注册的所有属性名称。
   * @memberof PropertyBag.prototype
   * @type {Array}
   */
  propertyNames: {
    get: function () {
      return this._propertyNames;
    },
  },
  /**
   * 获取一个值，指示此属性是否为常量。如果此对象中的所有属性项都是常量，则此属性被视为常量。
   * @memberof PropertyBag.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      const propertyNames = this._propertyNames;
      for (let i = 0, len = propertyNames.length; i < len; i++) {
        if (!Property.isConstant(this[propertyNames[i]])) {
          return false;
        }
      }
      return true;
    },
  },
  /**
   * 获取当此对象中包含的属性集发生更改，或其中某个属性本身发生更改时引发的事件。
   *
   * @memberof PropertyBag.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
});

/**
 * 确定此对象是否已定义具有给定名称的属性。
 *
 * @param {string} propertyName 要检查的属性名称。
 *
 * @returns {boolean} 如果此对象已定义具有给定名称的属性则返回true，否则返回false。
 */
PropertyBag.prototype.hasProperty = function (propertyName) {
  return this._propertyNames.indexOf(propertyName) !== -1;
};

function createConstantProperty(value) {
  return new ConstantProperty(value);
}

/**
 * 向此对象添加属性。
 *
 * @param {string} propertyName 要添加的属性名称。
 * @param {*} [value] 新属性的值（如果提供）。
 * @param {Function} [createPropertyCallback] 当此新属性的值设置为非 Property 值时调用的函数。
 *
 * @exception {DeveloperError} "propertyName" 已是已注册的属性。
 */
PropertyBag.prototype.addProperty = function (
  propertyName,
  value,
  createPropertyCallback,
) {
  const propertyNames = this._propertyNames;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(propertyName)) {
    throw new DeveloperError("propertyName is required.");
  }
  if (propertyNames.indexOf(propertyName) !== -1) {
    throw new DeveloperError(
      `${propertyName} is already a registered property.`,
    );
  }
  //>>includeEnd('debug');

  propertyNames.push(propertyName);
  Object.defineProperty(
    this,
    propertyName,
    createPropertyDescriptor(
      propertyName,
      true,
      createPropertyCallback ?? createConstantProperty,
    ),
  );

  if (defined(value)) {
    this[propertyName] = value;
  }

  this._definitionChanged.raiseEvent(this);
};

/**
 * 移除先前通过 addProperty 添加的属性。
 *
 * @param {string} propertyName 要移除的属性名称。
 *
 * @exception {DeveloperError} "propertyName" 不是已注册的属性。
 */
PropertyBag.prototype.removeProperty = function (propertyName) {
  const propertyNames = this._propertyNames;
  const index = propertyNames.indexOf(propertyName);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(propertyName)) {
    throw new DeveloperError("propertyName is required.");
  }
  if (index === -1) {
    throw new DeveloperError(`${propertyName} is not a registered property.`);
  }
  //>>includeEnd('debug');

  this._propertyNames.splice(index, 1);
  delete this[propertyName];

  this._definitionChanged.raiseEvent(this);
};

const timeScratch = new JulianDate();

/**
 * 获取此属性的值。每个包含的属性将在给定时间进行评估，整体结果将是一个对象，将属性名称映射到这些值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 用于检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回新实例。
 * 注意：result 中不属于此 PropertyBag 的任何属性将保持原样。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回新实例。
 */
PropertyBag.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  if (!defined(result)) {
    result = {};
  }

  const propertyNames = this._propertyNames;
  for (let i = 0, len = propertyNames.length; i < len; i++) {
    const propertyName = propertyNames[i];
    result[propertyName] = Property.getValueOrUndefined(
      this[propertyName],
      time,
      result[propertyName],
    );
  }
  return result;
};

/**
 * 将此对象上每个未赋值的属性设置为提供的源对象上相同属性的值。
 *
 * @param {object} source 要合并到此对象中的对象。
 * @param {Function} [createPropertyCallback] 当 value 中任何属性的值不是 Property 时调用的函数。
 */
PropertyBag.prototype.merge = function (source, createPropertyCallback) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  const propertyNames = this._propertyNames;
  const sourcePropertyNames = defined(source._propertyNames)
    ? source._propertyNames
    : Object.keys(source);
  for (let i = 0, len = sourcePropertyNames.length; i < len; i++) {
    const name = sourcePropertyNames[i];

    const targetProperty = this[name];
    const sourceProperty = source[name];

    //Custom properties that are registered on the source must also be added to this.
    if (targetProperty === undefined && propertyNames.indexOf(name) === -1) {
      this.addProperty(name, undefined, createPropertyCallback);
    }

    if (sourceProperty !== undefined) {
      if (targetProperty !== undefined) {
        if (defined(targetProperty) && defined(targetProperty.merge)) {
          targetProperty.merge(sourceProperty);
        }
      } else if (
        defined(sourceProperty) &&
        defined(sourceProperty.merge) &&
        defined(sourceProperty.clone)
      ) {
        this[name] = sourceProperty.clone();
      } else {
        this[name] = sourceProperty;
      }
    }
  }
};

function propertiesEqual(a, b) {
  const aPropertyNames = a._propertyNames;
  const bPropertyNames = b._propertyNames;

  const len = aPropertyNames.length;
  if (len !== bPropertyNames.length) {
    return false;
  }

  for (let aIndex = 0; aIndex < len; ++aIndex) {
    const name = aPropertyNames[aIndex];
    const bIndex = bPropertyNames.indexOf(name);
    if (bIndex === -1) {
      return false;
    }
    if (!Property.equals(a[name], b[name])) {
      return false;
    }
  }
  return true;
}

/**
 * 将此属性与提供的属性进行比较，如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
PropertyBag.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PropertyBag && //
      propertiesEqual(this, other))
  );
};
export default PropertyBag;
