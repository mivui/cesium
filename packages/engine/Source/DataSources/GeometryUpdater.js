import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import Event from "../Core/Event.js";
import Iso8601 from "../Core/Iso8601.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import ClassificationType from "../Scene/ClassificationType.js";
import ShadowMode from "../Scene/ShadowMode.js";
import ColorMaterialProperty from "./ColorMaterialProperty.js";
import ConstantProperty from "./ConstantProperty.js";
import Entity from "./Entity.js";
import Property from "./Property.js";

const defaultMaterial = new ColorMaterialProperty(Color.WHITE);
const defaultShow = new ConstantProperty(true);
const defaultFill = new ConstantProperty(true);
const defaultOutline = new ConstantProperty(false);
const defaultOutlineColor = new ConstantProperty(Color.BLACK);
const defaultShadows = new ConstantProperty(ShadowMode.DISABLED);
const defaultDistanceDisplayCondition = new ConstantProperty(
  new DistanceDisplayCondition(),
);
const defaultClassificationType = new ConstantProperty(ClassificationType.BOTH);

/**
 * 用于更新几何实体的抽象类。
 * @alias GeometryUpdater
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Entity} options.entity 包含要可视化的几何的实体。
 * @param {Scene} options.scene 进行可视化的场景。
 * @param {object} options.geometryOptions 几何选项
 * @param {string} options.geometryPropertyName 几何属性名称
 * @param {string[]} options.observedPropertyNames 此几何关注的实体属性
 */
function GeometryUpdater(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.entity", options.entity);
  Check.defined("options.scene", options.scene);
  Check.defined("options.geometryOptions", options.geometryOptions);
  Check.defined("options.geometryPropertyName", options.geometryPropertyName);
  Check.defined("options.observedPropertyNames", options.observedPropertyNames);
  //>>includeEnd('debug');

  const entity = options.entity;
  const geometryPropertyName = options.geometryPropertyName;

  this._entity = entity;
  this._scene = options.scene;
  this._fillEnabled = false;
  this._isClosed = false;
  this._onTerrain = false;
  this._dynamic = false;
  this._outlineEnabled = false;
  this._geometryChanged = new Event();
  this._showProperty = undefined;
  this._materialProperty = undefined;
  this._showOutlineProperty = undefined;
  this._outlineColorProperty = undefined;
  this._outlineWidth = 1.0;
  this._shadowsProperty = undefined;
  this._distanceDisplayConditionProperty = undefined;
  this._classificationTypeProperty = undefined;
  this._options = options.geometryOptions;
  this._geometryPropertyName = geometryPropertyName;
  this._id = `${geometryPropertyName}-${entity.id}`;
  this._observedPropertyNames = options.observedPropertyNames;
  this._supportsMaterialsforEntitiesOnTerrain =
    Entity.supportsMaterialsforEntitiesOnTerrain(options.scene);
}

Object.defineProperties(GeometryUpdater.prototype, {
  /**
   * 获取与此更新器关联的唯一 ID
   * @memberof GeometryUpdater.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * 获取一个值，指示几何是否具有轮廓组件。
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  entity: {
    get: function () {
      return this._entity;
    },
  },
  /**
   * 获取一个值，指示几何是否具有填充组件。
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  fillEnabled: {
    get: function () {
      return this._fillEnabled;
    },
  },
  /**
   * 获取一个值，指示填充可见性是否随模拟时间变化。
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  hasConstantFill: {
    get: function () {
      return (
        !this._fillEnabled ||
        (!defined(this._entity.availability) &&
          Property.isConstant(this._showProperty) &&
          Property.isConstant(this._fillProperty))
      );
    },
  },
  /**
   * 获取用于填充几何的材质属性。
   * @memberof GeometryUpdater.prototype
   *
   * @type {MaterialProperty}
   * @readonly
   */
  fillMaterialProperty: {
    get: function () {
      return this._materialProperty;
    },
  },
  /**
   * Gets a value indicating if the geometry has an outline component.
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  outlineEnabled: {
    get: function () {
      return this._outlineEnabled;
    },
  },
  /**
   * Gets a value indicating if the geometry has an outline component.
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  hasConstantOutline: {
    get: function () {
      return (
        !this._outlineEnabled ||
        (!defined(this._entity.availability) &&
          Property.isConstant(this._showProperty) &&
          Property.isConstant(this._showOutlineProperty))
      );
    },
  },
  /**
   * 获取几何轮廓的 {@link Color} 属性。
   * @memberof GeometryUpdater.prototype
   *
   * @type {Property}
   * @readonly
   */
  outlineColorProperty: {
    get: function () {
      return this._outlineColorProperty;
    },
  },
  /**
   * 获取几何轮廓的常量宽度，单位为像素。
   * 此值仅在 isDynamic 为 false 时有效。
   * @memberof GeometryUpdater.prototype
   *
   * @type {number}
   * @readonly
   */
  outlineWidth: {
    get: function () {
      return this._outlineWidth;
    },
  },
  /**
   * 获取指定几何是否从光源投射或接收阴影的属性。
   * @memberof GeometryUpdater.prototype
   *
   * @type {Property}
   * @readonly
   */
  shadowsProperty: {
    get: function () {
      return this._shadowsProperty;
    },
  },
  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机多远距离显示此几何。
   * @memberof GeometryUpdater.prototype
   *
   * @type {Property}
   * @readonly
   */
  distanceDisplayConditionProperty: {
    get: function () {
      return this._distanceDisplayConditionProperty;
    },
  },
  /**
   * 获取或设置 {@link ClassificationType} 属性，指定此几何在地面上时是对地形、3D Tiles 还是两者进行分类。
   * @memberof GeometryUpdater.prototype
   *
   * @type {Property}
   * @readonly
   */
  classificationTypeProperty: {
    get: function () {
      return this._classificationTypeProperty;
    },
  },
  /**
   * 获取一个值，指示几何是否随时间变化。
   *
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isDynamic: {
    get: function () {
      return this._dynamic;
    },
  },
  /**
   * 获取一个值，指示几何是否闭合。
   * 此属性仅对静态几何有效。
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isClosed: {
    get: function () {
      return this._isClosed;
    },
  },
  /**
   * 获取一个值，指示几何是否应在地形上绘制。
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  onTerrain: {
    get: function () {
      return this._onTerrain;
    },
  },
  /**
   * 获取一个事件，当此更新器的公共属性更改时触发。
   * @memberof GeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  geometryChanged: {
    get: function () {
      return this._geometryChanged;
    },
  },
});

/**
 * 检查在提供的时间几何是否有轮廓。
 *
 * @param {JulianDate} time 用于检索可见性的时间。
 * @returns {boolean} 如果在提供的时间几何有轮廓则返回 true，否则返回 false。
 */
GeometryUpdater.prototype.isOutlineVisible = function (time) {
  const entity = this._entity;
  const visible =
    this._outlineEnabled &&
    entity.isAvailable(time) &&
    this._showProperty.getValue(time) &&
    this._showOutlineProperty.getValue(time);
  return visible ?? false;
};

/**
 * 检查在提供的时间几何是否被填充。
 *
 * @param {JulianDate} time 用于检索可见性的时间。
 * @returns {boolean} 如果在提供的时间几何被填充则返回 true，否则返回 false。
 */
GeometryUpdater.prototype.isFilled = function (time) {
  const entity = this._entity;
  const visible =
    this._fillEnabled &&
    entity.isAvailable(time) &&
    this._showProperty.getValue(time) &&
    this._fillProperty.getValue(time);
  return visible ?? false;
};

/**
 * 创建表示几何填充的几何实例。
 *
 * @function
 * @param {JulianDate} time 检索初始属性值时使用的时间。
 * @returns {GeometryInstance} 表示几何填充部分的几何实例。
 *
 * @exception {DeveloperError} 此实例不表示填充几何。
 */
GeometryUpdater.prototype.createFillGeometryInstance =
  DeveloperError.throwInstantiationError;

/**
 * 创建表示几何轮廓的几何实例。
 *
 * @function
 * @param {JulianDate} time 检索初始属性值时使用的时间。
 * @returns {GeometryInstance} 表示几何轮廓部分的几何实例。
 *
 * @exception {DeveloperError} 此实例不表示有轮廓的几何。
 */
GeometryUpdater.prototype.createOutlineGeometryInstance =
  DeveloperError.throwInstantiationError;

/**
 * 如果此对象已被销毁则返回 true，否则返回 false。
 *
 * @returns {boolean} 如果此对象已被销毁则返回 true，否则返回 false。
 */
GeometryUpdater.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁对象使用的资源。一旦对象被销毁，就不应再使用它。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */
GeometryUpdater.prototype.destroy = function () {
  destroyObject(this);
};
/**
 * @param {Entity} entity
 * @param {object} geometry
 * @private
 */
GeometryUpdater.prototype._isHidden = function (entity, geometry) {
  const show = geometry.show;
  return (
    defined(show) && show.isConstant && !show.getValue(Iso8601.MINIMUM_VALUE)
  );
};

/**
 * @param {Entity} entity
 * @param {object} geometry
 * @private
 */
GeometryUpdater.prototype._isOnTerrain = function (entity, geometry) {
  return false;
};

/**
 * @param {GeometryOptions} options
 * @private
 */
GeometryUpdater.prototype._getIsClosed = function (options) {
  return true;
};

/**
 * @param {Entity} entity
 * @param {object} geometry
 * @private
 */
GeometryUpdater.prototype._isDynamic = DeveloperError.throwInstantiationError;

/**
 * @param {Entity} entity
 * @param {object} geometry
 * @private
 */
GeometryUpdater.prototype._setStaticOptions =
  DeveloperError.throwInstantiationError;

/**
 * @param {Entity} entity
 * @param {string} propertyName
 * @param {*} newValue
 * @param {*} oldValue
 * @private
 */
GeometryUpdater.prototype._onEntityPropertyChanged = function (
  entity,
  propertyName,
  newValue,
  oldValue,
) {
  if (this._observedPropertyNames.indexOf(propertyName) === -1) {
    return;
  }

  const geometry = this._entity[this._geometryPropertyName];

  if (!defined(geometry)) {
    if (this._fillEnabled || this._outlineEnabled) {
      this._fillEnabled = false;
      this._outlineEnabled = false;
      this._geometryChanged.raiseEvent(this);
    }
    return;
  }

  const fillProperty = geometry.fill;
  const fillEnabled =
    defined(fillProperty) && fillProperty.isConstant
      ? fillProperty.getValue(Iso8601.MINIMUM_VALUE)
      : true;

  const outlineProperty = geometry.outline;
  let outlineEnabled = defined(outlineProperty);
  if (outlineEnabled && outlineProperty.isConstant) {
    outlineEnabled = outlineProperty.getValue(Iso8601.MINIMUM_VALUE);
  }

  if (!fillEnabled && !outlineEnabled) {
    if (this._fillEnabled || this._outlineEnabled) {
      this._fillEnabled = false;
      this._outlineEnabled = false;
      this._geometryChanged.raiseEvent(this);
    }
    return;
  }

  const show = geometry.show;
  if (this._isHidden(entity, geometry)) {
    if (this._fillEnabled || this._outlineEnabled) {
      this._fillEnabled = false;
      this._outlineEnabled = false;
      this._geometryChanged.raiseEvent(this);
    }
    return;
  }

  this._materialProperty = geometry.material ?? defaultMaterial;
  this._fillProperty = fillProperty ?? defaultFill;
  this._showProperty = show ?? defaultShow;
  this._showOutlineProperty = geometry.outline ?? defaultOutline;
  this._outlineColorProperty = outlineEnabled
    ? (geometry.outlineColor ?? defaultOutlineColor)
    : undefined;
  this._shadowsProperty = geometry.shadows ?? defaultShadows;
  this._distanceDisplayConditionProperty =
    geometry.distanceDisplayCondition ?? defaultDistanceDisplayCondition;
  this._classificationTypeProperty =
    geometry.classificationType ?? defaultClassificationType;

  this._fillEnabled = fillEnabled;

  const onTerrain =
    this._isOnTerrain(entity, geometry) &&
    (this._supportsMaterialsforEntitiesOnTerrain ||
      this._materialProperty instanceof ColorMaterialProperty);

  if (outlineEnabled && onTerrain) {
    oneTimeWarning(oneTimeWarning.geometryOutlines);
    outlineEnabled = false;
  }

  this._onTerrain = onTerrain;
  this._outlineEnabled = outlineEnabled;

  if (this._isDynamic(entity, geometry)) {
    if (!this._dynamic) {
      this._dynamic = true;
      this._geometryChanged.raiseEvent(this);
    }
  } else {
    this._setStaticOptions(entity, geometry);
    this._isClosed = this._getIsClosed(this._options);
    const outlineWidth = geometry.outlineWidth;
    this._outlineWidth = defined(outlineWidth)
      ? outlineWidth.getValue(Iso8601.MINIMUM_VALUE)
      : 1.0;
    this._dynamic = false;
    this._geometryChanged.raiseEvent(this);
  }
};

/**
 * Creates the dynamic updater to be used when GeometryUpdater#isDynamic is true.
 *
 * @param {PrimitiveCollection} primitives The primitive collection to use.
 * @param {PrimitiveCollection} [groundPrimitives] The primitive collection to use for ground primitives.
 *
 * @returns {DynamicGeometryUpdater} The dynamic updater used to update the geometry each frame.
 *
 * @exception {DeveloperError} This instance does not represent dynamic geometry.
 * @private
 */
GeometryUpdater.prototype.createDynamicUpdater = function (
  primitives,
  groundPrimitives,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("primitives", primitives);
  Check.defined("groundPrimitives", groundPrimitives);

  if (!this._dynamic) {
    throw new DeveloperError(
      "This instance does not represent dynamic geometry.",
    );
  }
  //>>includeEnd('debug');

  return new this.constructor.DynamicGeometryUpdater(
    this,
    primitives,
    groundPrimitives,
  );
};
export default GeometryUpdater;
