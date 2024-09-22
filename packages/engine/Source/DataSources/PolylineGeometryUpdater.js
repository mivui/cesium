import ArcType from "../Core/ArcType.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import DistanceDisplayConditionGeometryInstanceAttribute from "../Core/DistanceDisplayConditionGeometryInstanceAttribute.js";
import Event from "../Core/Event.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GroundPolylineGeometry from "../Core/GroundPolylineGeometry.js";
import Iso8601 from "../Core/Iso8601.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import PolylineGeometry from "../Core/PolylineGeometry.js";
import PolylinePipeline from "../Core/PolylinePipeline.js";
import ShowGeometryInstanceAttribute from "../Core/ShowGeometryInstanceAttribute.js";
import Entity from "../DataSources/Entity.js";
import ClassificationType from "../Scene/ClassificationType.js";
import GroundPolylinePrimitive from "../Scene/GroundPolylinePrimitive.js";
import PolylineCollection from "../Scene/PolylineCollection.js";
import PolylineColorAppearance from "../Scene/PolylineColorAppearance.js";
import PolylineMaterialAppearance from "../Scene/PolylineMaterialAppearance.js";
import ShadowMode from "../Scene/ShadowMode.js";
import BoundingSphereState from "./BoundingSphereState.js";
import ColorMaterialProperty from "./ColorMaterialProperty.js";
import ConstantProperty from "./ConstantProperty.js";
import MaterialProperty from "./MaterialProperty.js";
import Property from "./Property.js";

const defaultZIndex = new ConstantProperty(0);

//We use this object to create one polyline collection per-scene.
const polylineCollections = {};

const scratchColor = new Color();
const defaultMaterial = new ColorMaterialProperty(Color.WHITE);
const defaultShow = new ConstantProperty(true);
const defaultShadows = new ConstantProperty(ShadowMode.DISABLED);
const defaultDistanceDisplayCondition = new ConstantProperty(
  new DistanceDisplayCondition()
);
const defaultClassificationType = new ConstantProperty(ClassificationType.BOTH);

function GeometryOptions() {
  this.vertexFormat = undefined;
  this.positions = undefined;
  this.width = undefined;
  this.arcType = undefined;
  this.granularity = undefined;
}

function GroundGeometryOptions() {
  this.positions = undefined;
  this.width = undefined;
  this.arcType = undefined;
  this.granularity = undefined;
}

/**
 * 用于多段线的 {@link GeometryUpdater}。
 * 客户端通常不直接创建此类，而是依赖于 {@link DataSourceDisplay}。
 * @alias PolylineGeometryUpdater
 * @constructor
 *
 * @param {Entity} entity 包含要可视化的几何体的实体。
 * @param {Scene} scene 正在进行可视化的场景。
 */
function PolylineGeometryUpdater(entity, scene) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required");
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required");
  }
  //>>includeEnd('debug');

  this._entity = entity;
  this._scene = scene;
  this._entitySubscription = entity.definitionChanged.addEventListener(
    PolylineGeometryUpdater.prototype._onEntityPropertyChanged,
    this
  );
  this._fillEnabled = false;
  this._dynamic = false;
  this._geometryChanged = new Event();
  this._showProperty = undefined;
  this._materialProperty = undefined;
  this._shadowsProperty = undefined;
  this._distanceDisplayConditionProperty = undefined;
  this._classificationTypeProperty = undefined;
  this._depthFailMaterialProperty = undefined;
  this._geometryOptions = new GeometryOptions();
  this._groundGeometryOptions = new GroundGeometryOptions();
  this._id = `polyline-${entity.id}`;
  this._clampToGround = false;
  this._supportsPolylinesOnTerrain = Entity.supportsPolylinesOnTerrain(scene);

  this._zIndex = 0;

  this._onEntityPropertyChanged(entity, "polyline", entity.polyline, undefined);
}

Object.defineProperties(PolylineGeometryUpdater.prototype, {
  /**
   * 获取与此更新程序关联的唯一 ID
   * @memberof PolylineGeometryUpdater.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * 获取与此几何体关联的实体。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {Entity}
   * @readonly
   */
  entity: {
    get: function () {
      return this._entity;
    },
  },
  /**
   * 获取一个值，该值指示几何图形是否具有填充组件。
   * @memberof PolylineGeometryUpdater.prototype
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
   * 获取一个值，该值指示填充可见性是否随模拟时间而变化。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  hasConstantFill: {
    get: function () {
      return (
        !this._fillEnabled ||
        (!defined(this._entity.availability) &&
          Property.isConstant(this._showProperty))
      );
    },
  },
  /**
   * 获取用于填充几何体的 material 属性。
   * @memberof PolylineGeometryUpdater.prototype
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
   * 获取深度测试失败时用于填充几何体的材质属性。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {MaterialProperty}
   * @readonly
   */
  depthFailMaterialProperty: {
    get: function () {
      return this._depthFailMaterialProperty;
    },
  },
  /**
   * 获取一个值，该值指示几何图形是否具有轮廓组件。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  outlineEnabled: {
    value: false,
  },
  /**
   * 获取一个值，该值指示轮廓可见性是否随模拟时间而变化。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  hasConstantOutline: {
    value: true,
  },
  /**
   * 获取几何轮廓的 {@link Color} 属性。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {Property}
   * @readonly
   */
  outlineColorProperty: {
    value: undefined,
  },
  /**
   * 获取指定几何图形是否
   * 从光源投射或接收阴影。
   * @memberof PolylineGeometryUpdater.prototype
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
   * 获取或设置{@link DistanceDisplayCondition}指定此几何体将在距摄像机多远处显示的属性。
   * @memberof PolylineGeometryUpdater.prototype
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
   * 获取或设置{@link ClassificationType} 属性指定此几何体在地面上时是否对地形、3D 瓦片或两者进行分类。
   * @memberof PolylineGeometryUpdater.prototype
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
   * 获取一个值，该值指示几何图形是否随时间变化。
   *
   * @memberof PolylineGeometryUpdater.prototype
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
   * 获取一个值，该值指示几何体是否闭合。
   * 此属性仅对静态几何体有效。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isClosed: {
    value: false,
  },
  /**
   * 获取一个事件，该事件在公共属性
   * 的更新程序更改。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  geometryChanged: {
    get: function () {
      return this._geometryChanged;
    },
  },

  /**
   * 获取一个值，该值指示行的路径是否为。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {ArcType}
   * @readonly
   */
  arcType: {
    get: function () {
      return this._arcType;
    },
  },

  /**
   * 获取一个值，该值指示几何图形是否被固定到地面。
   * 如果不支持 terrain 上的折线，则返回 false。
   * @memberof PolylineGeometryUpdater.prototype
   *
   * @type {boolean}
   * @readonly
   */
  clampToGround: {
    get: function () {
      return this._clampToGround && this._supportsPolylinesOnTerrain;
    },
  },

  /**
   * Gets the zindex
   * @type {number}
   * @memberof PolylineGeometryUpdater.prototype
   * @readonly
   */
  zIndex: {
    get: function () {
      return this._zIndex;
    },
  },
});

/**
 * 检查是否在提供的时间勾勒出几何图形。
 *
 * @param {JulianDate} time 检索可见性的时间。
 * @returns {boolean} true 如果在提供的时间勾勒出几何图形，则为 false 。
 */
PolylineGeometryUpdater.prototype.isOutlineVisible = function (time) {
  return false;
};

/**
 * 检查几何图形是否在提供的时间填充。
 *
 * @param {JulianDate} time 检索可见性的时间。
 * @returns {boolean} true，如果在提供的时间填充几何图形，则为 false。
 */
PolylineGeometryUpdater.prototype.isFilled = function (time) {
  const entity = this._entity;
  const visible =
    this._fillEnabled &&
    entity.isAvailable(time) &&
    this._showProperty.getValue(time);
  return defaultValue(visible, false);
};

/**
 * 创建表示几何图形填充的几何实例。
 *
 * @param {JulianDate} time 检索初始属性值时使用的时间。
 * @returns {GeometryInstance} 表示几何体的填充部分的 geometry 实例。
 *
 * @exception {DeveloperError} This instance does not represent a filled geometry.
 */
PolylineGeometryUpdater.prototype.createFillGeometryInstance = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }

  if (!this._fillEnabled) {
    throw new DeveloperError(
      "This instance does not represent a filled geometry."
    );
  }
  //>>includeEnd('debug');

  const entity = this._entity;
  const isAvailable = entity.isAvailable(time);
  const show = new ShowGeometryInstanceAttribute(
    isAvailable && entity.isShowing && this._showProperty.getValue(time)
  );
  const distanceDisplayCondition = this._distanceDisplayConditionProperty.getValue(
    time
  );
  const distanceDisplayConditionAttribute = DistanceDisplayConditionGeometryInstanceAttribute.fromDistanceDisplayCondition(
    distanceDisplayCondition
  );

  const attributes = {
    show: show,
    distanceDisplayCondition: distanceDisplayConditionAttribute,
  };

  let currentColor;
  if (this._materialProperty instanceof ColorMaterialProperty) {
    if (
      defined(this._materialProperty.color) &&
      (this._materialProperty.color.isConstant || isAvailable)
    ) {
      currentColor = this._materialProperty.color.getValue(time, scratchColor);
    }
    if (!defined(currentColor)) {
      currentColor = Color.WHITE;
    }
    attributes.color = ColorGeometryInstanceAttribute.fromColor(currentColor);
  }

  if (this.clampToGround) {
    return new GeometryInstance({
      id: entity,
      geometry: new GroundPolylineGeometry(this._groundGeometryOptions),
      attributes: attributes,
    });
  }

  if (
    defined(this._depthFailMaterialProperty) &&
    this._depthFailMaterialProperty instanceof ColorMaterialProperty
  ) {
    if (
      defined(this._depthFailMaterialProperty.color) &&
      (this._depthFailMaterialProperty.color.isConstant || isAvailable)
    ) {
      currentColor = this._depthFailMaterialProperty.color.getValue(
        time,
        scratchColor
      );
    }
    if (!defined(currentColor)) {
      currentColor = Color.WHITE;
    }
    attributes.depthFailColor = ColorGeometryInstanceAttribute.fromColor(
      currentColor
    );
  }

  return new GeometryInstance({
    id: entity,
    geometry: new PolylineGeometry(this._geometryOptions),
    attributes: attributes,
  });
};

/**
 * 创建表示几何轮廓的几何实例。
 *
 * @param {JulianDate} time 检索初始属性值时使用的时间。
 * @returns {GeometryInstance} 表示几何体轮廓部分的 geometry 实例。
 *
 * @exception {DeveloperError} This instance does not represent an outlined geometry.
 */
PolylineGeometryUpdater.prototype.createOutlineGeometryInstance = function (
  time
) {
  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "This instance does not represent an outlined geometry."
  );
  //>>includeEnd('debug');
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 */
PolylineGeometryUpdater.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁对象使用的资源。 一旦对象被销毁，就不应该使用它。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 */
PolylineGeometryUpdater.prototype.destroy = function () {
  this._entitySubscription();
  destroyObject(this);
};

PolylineGeometryUpdater.prototype._onEntityPropertyChanged = function (
  entity,
  propertyName,
  newValue,
  oldValue
) {
  if (!(propertyName === "availability" || propertyName === "polyline")) {
    return;
  }

  const polyline = this._entity.polyline;

  if (!defined(polyline)) {
    if (this._fillEnabled) {
      this._fillEnabled = false;
      this._geometryChanged.raiseEvent(this);
    }
    return;
  }

  const positionsProperty = polyline.positions;

  const show = polyline.show;
  if (
    (defined(show) &&
      show.isConstant &&
      !show.getValue(Iso8601.MINIMUM_VALUE)) || //
    !defined(positionsProperty)
  ) {
    if (this._fillEnabled) {
      this._fillEnabled = false;
      this._geometryChanged.raiseEvent(this);
    }
    return;
  }

  const zIndex = polyline.zIndex;
  const material = defaultValue(polyline.material, defaultMaterial);
  const isColorMaterial = material instanceof ColorMaterialProperty;
  this._materialProperty = material;
  this._depthFailMaterialProperty = polyline.depthFailMaterial;
  this._showProperty = defaultValue(show, defaultShow);
  this._shadowsProperty = defaultValue(polyline.shadows, defaultShadows);
  this._distanceDisplayConditionProperty = defaultValue(
    polyline.distanceDisplayCondition,
    defaultDistanceDisplayCondition
  );
  this._classificationTypeProperty = defaultValue(
    polyline.classificationType,
    defaultClassificationType
  );
  this._fillEnabled = true;
  this._zIndex = defaultValue(zIndex, defaultZIndex);

  const width = polyline.width;
  const arcType = polyline.arcType;
  const clampToGround = polyline.clampToGround;
  const granularity = polyline.granularity;

  if (
    !positionsProperty.isConstant ||
    !Property.isConstant(width) ||
    !Property.isConstant(arcType) ||
    !Property.isConstant(granularity) ||
    !Property.isConstant(clampToGround) ||
    !Property.isConstant(zIndex)
  ) {
    if (!this._dynamic) {
      this._dynamic = true;
      this._geometryChanged.raiseEvent(this);
    }
  } else {
    const geometryOptions = this._geometryOptions;
    const positions = positionsProperty.getValue(
      Iso8601.MINIMUM_VALUE,
      geometryOptions.positions
    );

    //Because of the way we currently handle reference properties,
    //we can't automatically assume the positions are always valid.
    if (!defined(positions) || positions.length < 2) {
      if (this._fillEnabled) {
        this._fillEnabled = false;
        this._geometryChanged.raiseEvent(this);
      }
      return;
    }

    let vertexFormat;
    if (
      isColorMaterial &&
      (!defined(this._depthFailMaterialProperty) ||
        this._depthFailMaterialProperty instanceof ColorMaterialProperty)
    ) {
      vertexFormat = PolylineColorAppearance.VERTEX_FORMAT;
    } else {
      vertexFormat = PolylineMaterialAppearance.VERTEX_FORMAT;
    }

    geometryOptions.vertexFormat = vertexFormat;
    geometryOptions.positions = positions;
    geometryOptions.width = defined(width)
      ? width.getValue(Iso8601.MINIMUM_VALUE)
      : undefined;
    geometryOptions.arcType = defined(arcType)
      ? arcType.getValue(Iso8601.MINIMUM_VALUE)
      : undefined;
    geometryOptions.granularity = defined(granularity)
      ? granularity.getValue(Iso8601.MINIMUM_VALUE)
      : undefined;

    const groundGeometryOptions = this._groundGeometryOptions;
    groundGeometryOptions.positions = positions;
    groundGeometryOptions.width = geometryOptions.width;
    groundGeometryOptions.arcType = geometryOptions.arcType;
    groundGeometryOptions.granularity = geometryOptions.granularity;

    this._clampToGround = defined(clampToGround)
      ? clampToGround.getValue(Iso8601.MINIMUM_VALUE)
      : false;

    if (!this._clampToGround && defined(zIndex)) {
      oneTimeWarning(
        "Entity polylines must have clampToGround: true when using zIndex.  zIndex will be ignored."
      );
    }

    this._dynamic = false;
    this._geometryChanged.raiseEvent(this);
  }
};

/**
 * 创建要在 GeometryUpdater#isDynamic 为 true 时使用的动态更新程序。
 *
 * @param {PrimitiveCollection} primitives 要使用的基元集合。
 * @param {PrimitiveCollection|OrderedGroundPrimitiveCollection} groundPrimitives 用于有序地面基元的基元集合。
 * @returns {DynamicGeometryUpdater} 用于更新每帧几何体的动态更新器。
 *
 * @exception {DeveloperError} This instance does not represent dynamic geometry.
 * @private
 */
PolylineGeometryUpdater.prototype.createDynamicUpdater = function (
  primitives,
  groundPrimitives
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("primitives", primitives);
  Check.defined("groundPrimitives", groundPrimitives);

  if (!this._dynamic) {
    throw new DeveloperError(
      "This instance does not represent dynamic geometry."
    );
  }
  //>>includeEnd('debug');

  return new DynamicGeometryUpdater(primitives, groundPrimitives, this);
};

/**
 * @private
 */
const generateCartesianArcOptions = {
  positions: undefined,
  granularity: undefined,
  height: undefined,
  ellipsoid: undefined,
};

function DynamicGeometryUpdater(primitives, groundPrimitives, geometryUpdater) {
  this._line = undefined;
  this._primitives = primitives;
  this._groundPrimitives = groundPrimitives;
  this._groundPolylinePrimitive = undefined;
  this._material = undefined;
  this._geometryUpdater = geometryUpdater;
  this._positions = [];
}

function getLine(dynamicGeometryUpdater) {
  if (defined(dynamicGeometryUpdater._line)) {
    return dynamicGeometryUpdater._line;
  }

  const primitives = dynamicGeometryUpdater._primitives;
  const polylineCollectionId =
    dynamicGeometryUpdater._geometryUpdater._scene.id + primitives._guid;
  let polylineCollection = polylineCollections[polylineCollectionId];
  if (!defined(polylineCollection) || polylineCollection.isDestroyed()) {
    polylineCollection = new PolylineCollection();
    polylineCollections[polylineCollectionId] = polylineCollection;
    primitives.add(polylineCollection);
  } else if (!primitives.contains(polylineCollection)) {
    primitives.add(polylineCollection);
  }

  const line = polylineCollection.add();
  line.id = dynamicGeometryUpdater._geometryUpdater._entity;
  dynamicGeometryUpdater._line = line;
  return line;
}

DynamicGeometryUpdater.prototype.update = function (time) {
  const geometryUpdater = this._geometryUpdater;
  const entity = geometryUpdater._entity;
  const polyline = entity.polyline;

  const positionsProperty = polyline.positions;
  let positions = Property.getValueOrUndefined(
    positionsProperty,
    time,
    this._positions
  );

  // Synchronize with geometryUpdater for GroundPolylinePrimitive
  geometryUpdater._clampToGround = Property.getValueOrDefault(
    polyline._clampToGround,
    time,
    false
  );
  geometryUpdater._groundGeometryOptions.positions = positions;
  geometryUpdater._groundGeometryOptions.width = Property.getValueOrDefault(
    polyline._width,
    time,
    1
  );
  geometryUpdater._groundGeometryOptions.arcType = Property.getValueOrDefault(
    polyline._arcType,
    time,
    ArcType.GEODESIC
  );
  geometryUpdater._groundGeometryOptions.granularity = Property.getValueOrDefault(
    polyline._granularity,
    time,
    9999
  );

  const groundPrimitives = this._groundPrimitives;

  if (defined(this._groundPolylinePrimitive)) {
    groundPrimitives.remove(this._groundPolylinePrimitive); // destroys by default
    this._groundPolylinePrimitive = undefined;
  }

  if (geometryUpdater.clampToGround) {
    if (
      !entity.isShowing ||
      !entity.isAvailable(time) ||
      !Property.getValueOrDefault(polyline._show, time, true)
    ) {
      return;
    }

    if (!defined(positions) || positions.length < 2) {
      return;
    }

    const fillMaterialProperty = geometryUpdater.fillMaterialProperty;
    let appearance;
    if (fillMaterialProperty instanceof ColorMaterialProperty) {
      appearance = new PolylineColorAppearance();
    } else {
      const material = MaterialProperty.getValue(
        time,
        fillMaterialProperty,
        this._material
      );
      appearance = new PolylineMaterialAppearance({
        material: material,
        translucent: material.isTranslucent(),
      });
      this._material = material;
    }

    this._groundPolylinePrimitive = groundPrimitives.add(
      new GroundPolylinePrimitive({
        geometryInstances: geometryUpdater.createFillGeometryInstance(time),
        appearance: appearance,
        classificationType: geometryUpdater.classificationTypeProperty.getValue(
          time
        ),
        asynchronous: false,
      }),
      Property.getValueOrUndefined(geometryUpdater.zIndex, time)
    );

    // Hide the polyline in the collection, if any
    if (defined(this._line)) {
      this._line.show = false;
    }
    return;
  }

  const line = getLine(this);

  if (
    !entity.isShowing ||
    !entity.isAvailable(time) ||
    !Property.getValueOrDefault(polyline._show, time, true)
  ) {
    line.show = false;
    return;
  }

  if (!defined(positions) || positions.length < 2) {
    line.show = false;
    return;
  }

  let arcType = ArcType.GEODESIC;
  arcType = Property.getValueOrDefault(polyline._arcType, time, arcType);

  const globe = geometryUpdater._scene.globe;
  const ellipsoid = geometryUpdater._scene.ellipsoid;
  if (arcType !== ArcType.NONE && defined(globe)) {
    generateCartesianArcOptions.ellipsoid = ellipsoid;
    generateCartesianArcOptions.positions = positions;
    generateCartesianArcOptions.granularity = Property.getValueOrUndefined(
      polyline._granularity,
      time
    );
    generateCartesianArcOptions.height = PolylinePipeline.extractHeights(
      positions,
      ellipsoid
    );
    if (arcType === ArcType.GEODESIC) {
      positions = PolylinePipeline.generateCartesianArc(
        generateCartesianArcOptions
      );
    } else {
      positions = PolylinePipeline.generateCartesianRhumbArc(
        generateCartesianArcOptions
      );
    }
  }

  line.show = true;
  line.positions = positions.slice();
  line.material = MaterialProperty.getValue(
    time,
    geometryUpdater.fillMaterialProperty,
    line.material
  );
  line.width = Property.getValueOrDefault(polyline._width, time, 1);
  line.distanceDisplayCondition = Property.getValueOrUndefined(
    polyline._distanceDisplayCondition,
    time,
    line.distanceDisplayCondition
  );
};

DynamicGeometryUpdater.prototype.getBoundingSphere = function (result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("result", result);
  //>>includeEnd('debug');

  if (!this._geometryUpdater.clampToGround) {
    const line = getLine(this);
    if (line.show && line.positions.length > 0) {
      BoundingSphere.fromPoints(line.positions, result);
      return BoundingSphereState.DONE;
    }
  } else {
    const groundPolylinePrimitive = this._groundPolylinePrimitive;
    if (
      defined(groundPolylinePrimitive) &&
      groundPolylinePrimitive.show &&
      groundPolylinePrimitive.ready
    ) {
      const attributes = groundPolylinePrimitive.getGeometryInstanceAttributes(
        this._geometryUpdater._entity
      );
      if (defined(attributes) && defined(attributes.boundingSphere)) {
        BoundingSphere.clone(attributes.boundingSphere, result);
        return BoundingSphereState.DONE;
      }
    }

    if (defined(groundPolylinePrimitive) && !groundPolylinePrimitive.ready) {
      return BoundingSphereState.PENDING;
    }

    return BoundingSphereState.DONE;
  }

  return BoundingSphereState.FAILED;
};

DynamicGeometryUpdater.prototype.isDestroyed = function () {
  return false;
};

DynamicGeometryUpdater.prototype.destroy = function () {
  const geometryUpdater = this._geometryUpdater;
  const polylineCollectionId =
    geometryUpdater._scene.id + this._primitives._guid;
  const polylineCollection = polylineCollections[polylineCollectionId];
  if (defined(polylineCollection)) {
    polylineCollection.remove(this._line);
    if (polylineCollection.length === 0) {
      this._primitives.removeAndDestroy(polylineCollection);
      delete polylineCollections[polylineCollectionId];
    }
  }
  if (defined(this._groundPolylinePrimitive)) {
    this._groundPrimitives.remove(this._groundPolylinePrimitive);
  }
  destroyObject(this);
};
export default PolylineGeometryUpdater;
