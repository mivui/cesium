import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import createGuid from "../Core/createGuid.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Quaternion from "../Core/Quaternion.js";
import TrackingReferenceFrame from "../Core/TrackingReferenceFrame.js";
import Transforms from "../Core/Transforms.js";
import GroundPolylinePrimitive from "../Scene/GroundPolylinePrimitive.js";
import GroundPrimitive from "../Scene/GroundPrimitive.js";
import HeightReference, {
  isHeightReferenceClamp,
} from "../Scene/HeightReference.js";
import BillboardGraphics from "./BillboardGraphics.js";
import BoxGraphics from "./BoxGraphics.js";
import ConstantPositionProperty from "./ConstantPositionProperty.js";
import CorridorGraphics from "./CorridorGraphics.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import createRawPropertyDescriptor from "./createRawPropertyDescriptor.js";
import CylinderGraphics from "./CylinderGraphics.js";
import EllipseGraphics from "./EllipseGraphics.js";
import EllipsoidGraphics from "./EllipsoidGraphics.js";
import LabelGraphics from "./LabelGraphics.js";
import ModelGraphics from "./ModelGraphics.js";
import Cesium3DTilesetGraphics from "./Cesium3DTilesetGraphics.js";
import PathGraphics from "./PathGraphics.js";
import PlaneGraphics from "./PlaneGraphics.js";
import PointGraphics from "./PointGraphics.js";
import PolygonGraphics from "./PolygonGraphics.js";
import PolylineGraphics from "./PolylineGraphics.js";
import PolylineVolumeGraphics from "./PolylineVolumeGraphics.js";
import Property from "./Property.js";
import PropertyBag from "./PropertyBag.js";
import RectangleGraphics from "./RectangleGraphics.js";
import WallGraphics from "./WallGraphics.js";

const cartoScratch = new Cartographic();

const ExtraPropertyNames = [];

function createConstantPositionProperty(value) {
  return new ConstantPositionProperty(value);
}

function createPositionPropertyDescriptor(name) {
  return createPropertyDescriptor(
    name,
    undefined,
    createConstantPositionProperty,
  );
}

function createPropertyTypeDescriptor(name, Type) {
  return createPropertyDescriptor(name, undefined, function (value) {
    if (value instanceof Type) {
      return value;
    }
    return new Type(value);
  });
}

/**
 * @typedef {object} Entity.ConstructorOptions
 *
 * Entity 构造函数的初始化选项
 *
 * @property {string} [id] 此对象的唯一标识符。如果未提供，则生成 GUID。
 * @property {string} [name] 显示给用户的可读名称。不需要唯一。
 * @property {TimeIntervalCollection} [availability] 与对象关联的可用性（如果有）。
 * @property {boolean} [show] 布尔值，指示是否显示实体及其子项。
 * @property {TrackingReferenceFrame} [trackingReferenceFrame=TrackingReferenceFrame.AUTODETECT] 跟踪此实体时使用的参考帧。<br/>如果 <code>undefined</code>，参考帧根据实体速度确定：近地面慢速移动实体使用局部东-北-上参考帧跟踪，而快速移动实体（如卫星）使用 VVLH（车辆速度，局部水平）跟踪。
 * @property {Property | string} [description] 字符串属性，指定此实体的 HTML 描述。
 * @property {PositionProperty | Cartesian3 | CallbackPositionProperty} [position] 指定实体位置的属性。
 * @property {Property | Quaternion} [orientation=Transforms.eastNorthUpToFixedFrame(position)] 指定实体相对于地固地球中心（ECF）方向的属性。如果未定义，则使用实体位置处的东-北-上方向。
 * @property {Property | Cartesian3} [viewFrom] 建议的查看此对象的初始偏移量。
 * @property {Entity} [parent] 与此实体关联的父实体。
 * @property {BillboardGraphics | BillboardGraphics.ConstructorOptions} [billboard] 与此实体关联的广告牌。
 * @property {BoxGraphics | BoxGraphics.ConstructorOptions} [box] 与此实体关联的盒子。
 * @property {CorridorGraphics | CorridorGraphics.ConstructorOptions} [corridor] 与此实体关联的走廊。
 * @property {CylinderGraphics | CylinderGraphics.ConstructorOptions} [cylinder] 与此实体关联的圆柱体。
 * @property {EllipseGraphics | EllipseGraphics.ConstructorOptions} [ellipse] 与此实体关联的椭圆。
 * @property {EllipsoidGraphics | EllipsoidGraphics.ConstructorOptions} [ellipsoid] 与此实体关联的椭球体。
 * @property {LabelGraphics | LabelGraphics.ConstructorOptions} [label] 与此实体关联的标签。
 * @property {ModelGraphics | ModelGraphics.ConstructorOptions} [model] 与此实体关联的模型。
 * @property {Cesium3DTilesetGraphics | Cesium3DTilesetGraphics.ConstructorOptions} [tileset] 与此实体关联的 3D Tiles 瓦片集。
 * @property {PathGraphics | PathGraphics.ConstructorOptions} [path] 与此实体关联的路径。
 * @property {PlaneGraphics | PlaneGraphics.ConstructorOptions} [plane] 与此实体关联的平面。
 * @property {PointGraphics | PointGraphics.ConstructorOptions} [point] 与此实体关联的点。
 * @property {PolygonGraphics | PolygonGraphics.ConstructorOptions} [polygon] 与此实体关联的多边形。
 * @property {PolylineGraphics | PolylineGraphics.ConstructorOptions} [polyline] 与此实体关联的折线。
 * @property {PropertyBag | Object<string,*>} [properties] 与此实体关联的任意属性。
 * @property {PolylineVolumeGraphics | PolylineVolumeGraphics.ConstructorOptions} [polylineVolume] 与此实体关联的折线体。
 * @property {RectangleGraphics | RectangleGraphics.ConstructorOptions} [rectangle] 与此实体关联的矩形。
 * @property {WallGraphics | WallGraphics.ConstructorOptions} [wall] 与此实体关联的墙。
 */

/**
 * Entity 实例将多种可视化形式聚合为单个高级对象。
 * 它们可以手动创建并添加到 {@link Viewer#entities}，或由
 * 数据源生成，例如 {@link CzmlDataSource} 和 {@link GeoJsonDataSource}。
 * @alias Entity
 * @constructor
 *
 * @param {Entity.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see {@link https://cesium.com/learn/cesiumjs-learn/cesiumjs-creating-entities/|创建实体}
 */
function Entity(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  let id = options.id;
  if (!defined(id)) {
    id = createGuid();
  }

  this._availability = undefined;
  this._id = id;
  this._definitionChanged = new Event();
  this._name = options.name;
  this._show = options.show ?? true;
  this._trackingReferenceFrame =
    options.trackingReferenceFrame ?? TrackingReferenceFrame.AUTODETECT;
  this._parent = undefined;
  this._propertyNames = [
    "billboard",
    "box",
    "corridor",
    "cylinder",
    "description",
    "ellipse",
    "ellipsoid",
    "label",
    "model",
    "tileset",
    "orientation",
    "path",
    "plane",
    "point",
    "polygon",
    "polyline",
    "polylineVolume",
    "position",
    "properties",
    "rectangle",
    "viewFrom",
    "wall",
    ...ExtraPropertyNames,
  ];

  this._billboard = undefined;
  this._billboardSubscription = undefined;
  this._box = undefined;
  this._boxSubscription = undefined;
  this._corridor = undefined;
  this._corridorSubscription = undefined;
  this._cylinder = undefined;
  this._cylinderSubscription = undefined;
  this._description = undefined;
  this._descriptionSubscription = undefined;
  this._ellipse = undefined;
  this._ellipseSubscription = undefined;
  this._ellipsoid = undefined;
  this._ellipsoidSubscription = undefined;
  this._label = undefined;
  this._labelSubscription = undefined;
  this._model = undefined;
  this._modelSubscription = undefined;
  this._tileset = undefined;
  this._tilesetSubscription = undefined;
  this._orientation = undefined;
  this._orientationSubscription = undefined;
  this._path = undefined;
  this._pathSubscription = undefined;
  this._plane = undefined;
  this._planeSubscription = undefined;
  this._point = undefined;
  this._pointSubscription = undefined;
  this._polygon = undefined;
  this._polygonSubscription = undefined;
  this._polyline = undefined;
  this._polylineSubscription = undefined;
  this._polylineVolume = undefined;
  this._polylineVolumeSubscription = undefined;
  this._position = undefined;
  this._positionSubscription = undefined;
  this._properties = undefined;
  this._propertiesSubscription = undefined;
  this._rectangle = undefined;
  this._rectangleSubscription = undefined;
  this._viewFrom = undefined;
  this._viewFromSubscription = undefined;
  this._wall = undefined;
  this._wallSubscription = undefined;
  this._children = [];

  /**
   * Gets or sets the entity collection that this entity belongs to.
   * @type {EntityCollection}
   */
  this.entityCollection = undefined;

  this.parent = options.parent;
  this.merge(options);
}

function updateShow(entity, children, isShowing) {
  const length = children.length;
  for (let i = 0; i < length; i++) {
    const child = children[i];
    const childShow = child._show;
    const oldValue = !isShowing && childShow;
    const newValue = isShowing && childShow;
    if (oldValue !== newValue) {
      updateShow(child, child._children, isShowing);
    }
  }
  entity._definitionChanged.raiseEvent(
    entity,
    "isShowing",
    isShowing,
    !isShowing,
  );
}

Object.defineProperties(Entity.prototype, {
  /**
   * 与对象关联的可用性（如果有）。
   * 如果可用性未定义，则假定此对象的
   * 其他属性将为任何提供的时间返回有效数据。
   * 如果存在可用性，则对象的其他属性
   * 仅在给定时间间隔内查询时提供有效数据。
   * @memberof Entity.prototype
   * @type {TimeIntervalCollection|undefined}
   */
  availability: createRawPropertyDescriptor("availability"),
  /**
   * 获取与此对象关联的唯一 ID。
   * @memberof Entity.prototype
   * @type {string}
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof Entity.prototype
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
   * 获取或设置对象的名称。名称面向最终用户，
   * 不需要唯一。
   * @memberof Entity.prototype
   * @type {string|undefined}
   */
  name: createRawPropertyDescriptor("name"),
  /**
   * 获取或设置是否应显示此实体。设置为 true 时，
   * 仅当父实体的 show 属性也为 true 时，实体才会显示。
   * @memberof Entity.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (value === this._show) {
        return;
      }

      const wasShowing = this.isShowing;
      this._show = value;
      const isShowing = this.isShowing;

      if (wasShowing !== isShowing) {
        updateShow(this, this._children, isShowing);
      }

      this._definitionChanged.raiseEvent(this, "show", value, !value);
    },
  },
  /**
   * 获取或设置实体的跟踪参考帧。
   * @demo {@link https://sandcastle.cesium.com/index.html?id=entity-tracking|Cesium Sandcastle 实体跟踪演示}
   *
   * @memberof Entity.prototype
   * @type {TrackingReferenceFrame}
   */
  trackingReferenceFrame: createRawPropertyDescriptor("trackingReferenceFrame"),
  /**
   * 获取是否显示此实体，同时考虑
   * 任何祖先实体的可见性。
   * @memberof Entity.prototype
   * @type {boolean}
   */
  isShowing: {
    get: function () {
      return (
        this._show &&
        (!defined(this.entityCollection) || this.entityCollection.show) &&
        (!defined(this._parent) || this._parent.isShowing)
      );
    },
  },
  /**
   * Gets or sets the parent object.
   * @memberof Entity.prototype
   * @type {Entity|undefined}
   */
  parent: {
    get: function () {
      return this._parent;
    },
    set: function (value) {
      const oldValue = this._parent;

      if (oldValue === value) {
        return;
      }

      const wasShowing = this.isShowing;
      if (defined(oldValue)) {
        const index = oldValue._children.indexOf(this);
        oldValue._children.splice(index, 1);
      }

      this._parent = value;
      if (defined(value)) {
        value._children.push(this);
      }

      const isShowing = this.isShowing;

      if (wasShowing !== isShowing) {
        updateShow(this, this._children, isShowing);
      }

      this._definitionChanged.raiseEvent(this, "parent", value, oldValue);
    },
  },
  /**
   * Gets the names of all properties registered on this instance.
   * @memberof Entity.prototype
   * @type {string[]}
   */
  propertyNames: {
    get: function () {
      return this._propertyNames;
    },
  },
  /**
   * 获取或设置广告牌。
   * @memberof Entity.prototype
   * @type {BillboardGraphics|undefined}
   */
  billboard: createPropertyTypeDescriptor("billboard", BillboardGraphics),
  /**
   * 获取或设置盒子。
   * @memberof Entity.prototype
   * @type {BoxGraphics|undefined}
   */
  box: createPropertyTypeDescriptor("box", BoxGraphics),
  /**
   * 获取或设置走廊。
   * @memberof Entity.prototype
   * @type {CorridorGraphics|undefined}
   */
  corridor: createPropertyTypeDescriptor("corridor", CorridorGraphics),
  /**
   * 获取或设置圆柱体。
   * @memberof Entity.prototype
   * @type {CylinderGraphics|undefined}
   */
  cylinder: createPropertyTypeDescriptor("cylinder", CylinderGraphics),
  /**
   * 获取或设置描述。
   * @memberof Entity.prototype
   * @type {Property|undefined}
   */
  description: createPropertyDescriptor("description"),
  /**
   * 获取或设置椭圆。
   * @memberof Entity.prototype
   * @type {EllipseGraphics|undefined}
   */
  ellipse: createPropertyTypeDescriptor("ellipse", EllipseGraphics),
  /**
   * 获取或设置椭球体。
   * @memberof Entity.prototype
   * @type {EllipsoidGraphics|undefined}
   */
  ellipsoid: createPropertyTypeDescriptor("ellipsoid", EllipsoidGraphics),
  /**
   * 获取或设置标签。
   * @memberof Entity.prototype
   * @type {LabelGraphics|undefined}
   */
  label: createPropertyTypeDescriptor("label", LabelGraphics),
  /**
   * 获取或设置模型。
   * @memberof Entity.prototype
   * @type {ModelGraphics|undefined}
   */
  model: createPropertyTypeDescriptor("model", ModelGraphics),
  /**
   * 获取或设置瓦片集。
   * @memberof Entity.prototype
   * @type {Cesium3DTilesetGraphics|undefined}
   */
  tileset: createPropertyTypeDescriptor("tileset", Cesium3DTilesetGraphics),
  /**
   * 获取或设置相对于地固地球中心（ECEF）的方向。
   * 默认为实体位置处的东-北-上方向。
   * @memberof Entity.prototype
   * @type {Property|undefined}
   */
  orientation: createPropertyDescriptor("orientation"),
  /**
   * 获取或设置路径。
   * @memberof Entity.prototype
   * @type {PathGraphics|undefined}
   */
  path: createPropertyTypeDescriptor("path", PathGraphics),
  /**
   * 获取或设置平面。
   * @memberof Entity.prototype
   * @type {PlaneGraphics|undefined}
   */
  plane: createPropertyTypeDescriptor("plane", PlaneGraphics),
  /**
   * 获取或设置点图形。
   * @memberof Entity.prototype
   * @type {PointGraphics|undefined}
   */
  point: createPropertyTypeDescriptor("point", PointGraphics),
  /**
   * 获取或设置多边形。
   * @memberof Entity.prototype
   * @type {PolygonGraphics|undefined}
   */
  polygon: createPropertyTypeDescriptor("polygon", PolygonGraphics),
  /**
   * 获取或设置折线。
   * @memberof Entity.prototype
   * @type {PolylineGraphics|undefined}
   */
  polyline: createPropertyTypeDescriptor("polyline", PolylineGraphics),
  /**
   * 获取或设置折线体。
   * @memberof Entity.prototype
   * @type {PolylineVolumeGraphics|undefined}
   */
  polylineVolume: createPropertyTypeDescriptor(
    "polylineVolume",
    PolylineVolumeGraphics,
  ),
  /**
   * 获取或设置与此实体关联的任意属性包。
   * @memberof Entity.prototype
   * @type {PropertyBag|undefined}
   */
  properties: createPropertyTypeDescriptor("properties", PropertyBag),
  /**
   * 获取或设置位置。
   * @memberof Entity.prototype
   * @type {PositionProperty|undefined}
   */
  position: createPositionPropertyDescriptor("position"),
  /**
   * 获取或设置矩形。
   * @memberof Entity.prototype
   * @type {RectangleGraphics|undefined}
   */
  rectangle: createPropertyTypeDescriptor("rectangle", RectangleGraphics),
  /**
   * 获取或设置跟踪此对象时建议的初始偏移量。
   * 偏移量通常在东-北-上参考帧中定义，
   * 但也可能根据对象的速度使用其他帧。
   * @memberof Entity.prototype
   * @type {Property|undefined}
   */
  viewFrom: createPropertyDescriptor("viewFrom"),
  /**
   * 获取或设置墙。
   * @memberof Entity.prototype
   * @type {WallGraphics|undefined}
   */
  wall: createPropertyTypeDescriptor("wall", WallGraphics),
});

/**
 * 添加指定类型并在 Entity 类中为其构造属性
 * @private
 * @param {string} propertyName 控制/访问此实体类型的属性名称
 * @param {{ constructor: function }} Type 与此实体类型关联的图形类
 */
Entity.registerEntityType = function (propertyName, Type) {
  Object.defineProperties(Entity.prototype, {
    [propertyName]: createPropertyTypeDescriptor(propertyName, Type),
  });
  if (!ExtraPropertyNames.includes(propertyName)) {
    ExtraPropertyNames.push(propertyName);
  }
};

/**
 * 给定时间，如果此对象在该时间段内应有数据则返回 true。
 *
 * @param {JulianDate} time 要检查可用性的时间。
 * @returns {boolean} 如果对象在提供的时间段内应有数据则返回 true，否则返回 false。
 */
Entity.prototype.isAvailable = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  //>>includeEnd('debug');

  const availability = this._availability;
  return !defined(availability) || availability.contains(time);
};

/**
 * 向此对象添加属性。添加后，属性可以被
 * {@link Entity#definitionChanged} 观察并与
 * {@link CompositeEntityCollection} 组合。
 *
 * @param {string} propertyName 要添加的属性名称。
 *
 * @exception {DeveloperError} "propertyName" 是保留属性名称。
 * @exception {DeveloperError} "propertyName" 已经是已注册属性。
 */
Entity.prototype.addProperty = function (propertyName) {
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
  if (propertyName in this) {
    throw new DeveloperError(`${propertyName} is a reserved property name.`);
  }
  //>>includeEnd('debug');

  propertyNames.push(propertyName);
  Object.defineProperty(
    this,
    propertyName,
    createRawPropertyDescriptor(propertyName, true),
  );
};

/**
 * 移除之前通过 addProperty 添加的属性。
 *
 * @param {string} propertyName 要移除的属性名称。
 *
 * @exception {DeveloperError} "propertyName" 是保留属性名称。
 * @exception {DeveloperError} "propertyName" 不是已注册属性。
 */
Entity.prototype.removeProperty = function (propertyName) {
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
};

/**
 * 将此对象上每个未赋值的属性分配给
 * 提供的源对象上相同属性的值。
 *
 * @param {Entity} source 要合并到此对象中的对象。
 */
Entity.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  //Name, show, and availability are not Property objects and are currently handled differently.
  //source.show is intentionally ignored because this.show always has a value.
  this.name = this.name ?? source.name;
  this.availability = this.availability ?? source.availability;

  const propertyNames = this._propertyNames;
  const sourcePropertyNames = defined(source._propertyNames)
    ? source._propertyNames
    : Object.keys(source);
  const propertyNamesLength = sourcePropertyNames.length;
  for (let i = 0; i < propertyNamesLength; i++) {
    const name = sourcePropertyNames[i];

    //While source is required by the API to be an Entity, we internally call this method from the
    //constructor with an options object to configure initial custom properties.
    //So we need to ignore reserved-non-property.
    if (
      name === "parent" ||
      name === "name" ||
      name === "availability" ||
      name === "children"
    ) {
      continue;
    }

    const targetProperty = this[name];
    const sourceProperty = source[name];

    //Custom properties that are registered on the source entity must also
    //get registered on this entity.
    if (!defined(targetProperty) && propertyNames.indexOf(name) === -1) {
      this.addProperty(name);
    }

    if (defined(sourceProperty)) {
      if (defined(targetProperty)) {
        if (defined(targetProperty.merge)) {
          targetProperty.merge(sourceProperty);
        }
      } else if (
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

const matrix3Scratch = new Matrix3();
const positionScratch = new Cartesian3();
const orientationScratch = new Quaternion();

/**
 * 计算指定时间的实体变换模型矩阵。如果位置未定义则返回 undefined
 *
 * @param {JulianDate} time 要检索模型矩阵的时间。
 * @param {Matrix4} [result] 存储结果的对象。
 *
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回新 Matrix4 实例。如果位置未定义则结果为 undefined。
 */
Entity.prototype.computeModelMatrix = function (time, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("time", time);
  //>>includeEnd('debug');
  const position = Property.getValueOrUndefined(
    this._position,
    time,
    positionScratch,
  );
  if (!defined(position)) {
    return undefined;
  }

  const orientation = Property.getValueOrUndefined(
    this._orientation,
    time,
    orientationScratch,
  );
  if (!defined(orientation)) {
    result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
  } else {
    result = Matrix4.fromRotationTranslation(
      Matrix3.fromQuaternion(orientation, matrix3Scratch),
      position,
      result,
    );
  }
  return result;
};

/**
 * @private
 */
Entity.prototype.computeModelMatrixForHeightReference = function (
  time,
  heightReferenceProperty,
  heightOffset,
  ellipsoid,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("time", time);
  //>>includeEnd('debug');
  const heightReference = Property.getValueOrDefault(
    heightReferenceProperty,
    time,
    HeightReference.NONE,
  );
  let position = Property.getValueOrUndefined(
    this._position,
    time,
    positionScratch,
  );
  if (
    heightReference === HeightReference.NONE ||
    !defined(position) ||
    Cartesian3.equalsEpsilon(position, Cartesian3.ZERO, CesiumMath.EPSILON8)
  ) {
    return this.computeModelMatrix(time, result);
  }

  const carto = ellipsoid.cartesianToCartographic(position, cartoScratch);
  if (isHeightReferenceClamp(heightReference)) {
    carto.height = heightOffset;
  } else {
    carto.height += heightOffset;
  }
  position = ellipsoid.cartographicToCartesian(carto, position);

  const orientation = Property.getValueOrUndefined(
    this._orientation,
    time,
    orientationScratch,
  );
  if (!defined(orientation)) {
    result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
  } else {
    result = Matrix4.fromRotationTranslation(
      Matrix3.fromQuaternion(orientation, matrix3Scratch),
      position,
      result,
    );
  }
  return result;
};

/**
 * 检查给定场景是否支持在贴地实体或 3D Tiles 上使用除颜色外的材质。
 * 如果此功能不受支持，则具有非颜色材质但没有 `height` 的实体
 * 将改为以高度为 0 的方式渲染。
 *
 * @param {Scene} scene 当前场景。
 * @returns {boolean} 当前场景是否支持地形上的实体材质。
 */
Entity.supportsMaterialsforEntitiesOnTerrain = function (scene) {
  return GroundPrimitive.supportsMaterials(scene);
};

/**
 * 检查给定场景是否支持贴地或 3D Tiles 的折线。
 * 如果此功能不受支持，则具有 PolylineGraphics 的实体将以
 * 提供的高度顶点和 `arcType` 参数渲染，而不是贴地。
 *
 * @param {Scene} scene 当前场景。
 * @returns {boolean} 当前场景是否支持地形或 3D Tiles 上的折线。
 */
Entity.supportsPolylinesOnTerrain = function (scene) {
  return GroundPolylinePrimitive.isSupported(scene);
};
export default Entity;
