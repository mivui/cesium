import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import Matrix4 from "../Core/Matrix4.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import SceneMode from "./SceneMode.js";
import SceneTransforms from "./SceneTransforms.js";
import SplitDirection from "./SplitDirection.js";

/**
 * <div class="notice">
 * 通过点调用 {@link PointPrimitiveCollection#add} 创建点并设置其初始属性，请勿直接调用构造函数。
 * </div>
 * 3D 场景中渲染的图形点，由 {@link PointPrimitiveCollection} 创建并渲染。
 *
 * @alias PointPrimitive
 *
 * @performance 读取属性（例如 {@link PointPrimitive#show}）的时间复杂度为常数。赋值属性同样为常数时间，但在调用 {@link PointPrimitiveCollection#update} 时会产生 CPU 到 GPU 的流量。无论更新多少属性，每个点的流量相同。如果集合中大多数点需要更新，使用 {@link PointPrimitiveCollection#removeAll} 清空集合并添加新点，而非逐个修改，可能更高效。
 *
 * @exception {DeveloperError} scaleByDistance.far 必须大于 scaleByDistance.near
 * @exception {DeveloperError} translucencyByDistance.far 必须大于 translucencyByDistance.near
 * @exception {DeveloperError} distanceDisplayCondition.far 必须大于 distanceDisplayCondition.near
 *
 * @see PointPrimitiveCollection
 * @see PointPrimitiveCollection#add
 *
 * @internalConstructor
 * @class
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=points|Cesium Sandcastle Points Demo}
 */
function PointPrimitive(options, pointPrimitiveCollection) {
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  if (
    defined(options.disableDepthTestDistance) &&
    options.disableDepthTestDistance < 0.0
  ) {
    throw new DeveloperError(
      "disableDepthTestDistance must be greater than or equal to 0.0.",
    );
  }
  //>>includeEnd('debug');

  let translucencyByDistance = options.translucencyByDistance;
  let scaleByDistance = options.scaleByDistance;
  let distanceDisplayCondition = options.distanceDisplayCondition;
  if (defined(translucencyByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (translucencyByDistance.far <= translucencyByDistance.near) {
      throw new DeveloperError(
        "translucencyByDistance.far must be greater than translucencyByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    translucencyByDistance = NearFarScalar.clone(translucencyByDistance);
  }
  if (defined(scaleByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (scaleByDistance.far <= scaleByDistance.near) {
      throw new DeveloperError(
        "scaleByDistance.far must be greater than scaleByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    scaleByDistance = NearFarScalar.clone(scaleByDistance);
  }
  if (defined(distanceDisplayCondition)) {
    //>>includeStart('debug', pragmas.debug);
    if (distanceDisplayCondition.far <= distanceDisplayCondition.near) {
      throw new DeveloperError(
        "distanceDisplayCondition.far must be greater than distanceDisplayCondition.near.",
      );
    }
    //>>includeEnd('debug');
    distanceDisplayCondition = DistanceDisplayCondition.clone(
      distanceDisplayCondition,
    );
  }

  this._show = options.show ?? true;
  this._position = Cartesian3.clone(options.position ?? Cartesian3.ZERO);
  this._actualPosition = Cartesian3.clone(this._position); // For columbus view and 2D
  this._color = Color.clone(options.color ?? Color.WHITE);
  this._outlineColor = Color.clone(options.outlineColor ?? Color.TRANSPARENT);
  this._outlineWidth = options.outlineWidth ?? 0.0;
  this._pixelSize = options.pixelSize ?? 10.0;
  this._scaleByDistance = scaleByDistance;
  this._translucencyByDistance = translucencyByDistance;
  this._distanceDisplayCondition = distanceDisplayCondition;
  this._disableDepthTestDistance = options.disableDepthTestDistance ?? 0.0;
  this._id = options.id;
  this._collection = options.collection ?? pointPrimitiveCollection;

  this._clusterShow = true;

  this._pickId = undefined;
  this._pointPrimitiveCollection = pointPrimitiveCollection;
  this._dirty = false;
  this._index = -1; //Used only by PointPrimitiveCollection

  this._splitDirection = options.splitDirection ?? SplitDirection.NONE;
}

const SHOW_INDEX = (PointPrimitive.SHOW_INDEX = 0);
const POSITION_INDEX = (PointPrimitive.POSITION_INDEX = 1);
const COLOR_INDEX = (PointPrimitive.COLOR_INDEX = 2);
const OUTLINE_COLOR_INDEX = (PointPrimitive.OUTLINE_COLOR_INDEX = 3);
const OUTLINE_WIDTH_INDEX = (PointPrimitive.OUTLINE_WIDTH_INDEX = 4);
const PIXEL_SIZE_INDEX = (PointPrimitive.PIXEL_SIZE_INDEX = 5);
const SCALE_BY_DISTANCE_INDEX = (PointPrimitive.SCALE_BY_DISTANCE_INDEX = 6);
const TRANSLUCENCY_BY_DISTANCE_INDEX =
  (PointPrimitive.TRANSLUCENCY_BY_DISTANCE_INDEX = 7);
const DISTANCE_DISPLAY_CONDITION_INDEX =
  (PointPrimitive.DISTANCE_DISPLAY_CONDITION_INDEX = 8);
const DISABLE_DEPTH_DISTANCE_INDEX =
  (PointPrimitive.DISABLE_DEPTH_DISTANCE_INDEX = 9);
const SPLIT_DIRECTION_INDEX = (PointPrimitive.SPLIT_DIRECTION_INDEX = 10);
PointPrimitive.NUMBER_OF_PROPERTIES = 11;

function makeDirty(pointPrimitive, propertyChanged) {
  const pointPrimitiveCollection = pointPrimitive._pointPrimitiveCollection;
  if (defined(pointPrimitiveCollection)) {
    pointPrimitiveCollection._updatePointPrimitive(
      pointPrimitive,
      propertyChanged,
    );
    pointPrimitive._dirty = true;
  }
}

Object.defineProperties(PointPrimitive.prototype, {
  /**
   * 确定是否显示此点。可用于隐藏或显示点，而无需从集合中移除再重新添加。
   * @memberof PointPrimitive.prototype
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

      if (this._show !== value) {
        this._show = value;
        makeDirty(this, SHOW_INDEX);
      }
    },
  },

  /**
   * 获取或设置此点的笛卡尔坐标位置。
   * @memberof PointPrimitive.prototype
   * @type {Cartesian3}
   */
  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const position = this._position;
      if (!Cartesian3.equals(position, value)) {
        Cartesian3.clone(value, position);
        Cartesian3.clone(value, this._actualPosition);

        makeDirty(this, POSITION_INDEX);
      }
    },
  },

  /**
   * 获取或设置基于点到相机距离远近缩放属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 范围内时，点的缩放将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，点的缩放将保持在最近的边界值。此缩放值乘以 pixelSize 和 outlineWidth 以影响点的总大小。如果未定义，则禁用 scaleByDistance。
   * @memberof PointPrimitive.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // 示例 1.
   * // 设置点的 scaleByDistance，当相机距离点 1500 米时缩放到 15，当距离接近 8.0e6 米时消失。
   * p.scaleByDistance = new Cesium.NearFarScalar(1.5e2, 15, 8.0e6, 0.0);
   *
   * @example
   * // 示例 2.
   * // 禁用距离缩放
   * p.scaleByDistance = undefined;
   */
  scaleByDistance: {
    get: function () {
      return this._scaleByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');

      const scaleByDistance = this._scaleByDistance;
      if (!NearFarScalar.equals(scaleByDistance, value)) {
        this._scaleByDistance = NearFarScalar.clone(value, scaleByDistance);
        makeDirty(this, SCALE_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 获取或设置基于点到相机距离远近的透明度属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 范围内时，点的透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，点的透明度将保持在最近的边界值。如果未定义，则禁用 translucencyByDistance。
   * @memberof PointPrimitive.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // 示例 1.
   * // 设置点的透明度，当相机距离点 1500 米时为 1.0，当距离接近 8.0e6 米时消失。
   * p.translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0);
   *
   * @example
   * // 示例 2.
   * // 禁用距离透明度
   * p.translucencyByDistance = undefined;
   */
  translucencyByDistance: {
    get: function () {
      return this._translucencyByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');

      const translucencyByDistance = this._translucencyByDistance;
      if (!NearFarScalar.equals(translucencyByDistance, value)) {
        this._translucencyByDistance = NearFarScalar.clone(
          value,
          translucencyByDistance,
        );
        makeDirty(this, TRANSLUCENCY_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 获取或设置点的内部像素大小。
   * @memberof PointPrimitive.prototype
   * @type {number}
   */
  pixelSize: {
    get: function () {
      return this._pixelSize;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._pixelSize !== value) {
        this._pixelSize = value;
        makeDirty(this, PIXEL_SIZE_INDEX);
      }
    },
  },

  /**
   * 获取或设置点的内部颜色。
   * 红、绿、蓝和 alpha 值由 <code>value</code> 的 <code>red</code>、<code>green</code>、<code>blue</code> 和 <code>alpha</code> 属性表示，如示例 1 所示。这些分量范围从 <code>0.0</code>（无强度）到 <code>1.0</code>（全强度）。
   * @memberof PointPrimitive.prototype
   * @type {Color}
   *
   * @example
   * // 示例 1. 设置为黄色。
   * p.color = Cesium.Color.YELLOW;
   *
   * @example
   * // 示例 2. 使点 50% 透明。
   * p.color = new Cesium.Color(1.0, 1.0, 1.0, 0.5);
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const color = this._color;
      if (!Color.equals(color, value)) {
        Color.clone(value, color);
        makeDirty(this, COLOR_INDEX);
      }
    },
  },

  /**
   * 获取或设置点的轮廓颜色。
   * @memberof PointPrimitive.prototype
   * @type {Color}
   */
  outlineColor: {
    get: function () {
      return this._outlineColor;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const outlineColor = this._outlineColor;
      if (!Color.equals(outlineColor, value)) {
        Color.clone(value, outlineColor);
        makeDirty(this, OUTLINE_COLOR_INDEX);
      }
    },
  },

  /**
   * 获取或设置点的轮廓宽度（像素）。此宽度会加到 pixelSize 上，增加点的总大小。
   * @memberof PointPrimitive.prototype
   * @type {number}
   */
  outlineWidth: {
    get: function () {
      return this._outlineWidth;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._outlineWidth !== value) {
        this._outlineWidth = value;
        makeDirty(this, OUTLINE_WIDTH_INDEX);
      }
    },
  },

  /**
   * 获取或设置指定点显示距离的条件，即距离相机多远时显示此点。
   * @memberof PointPrimitive.prototype
   * @type {DistanceDisplayCondition}
   * @default undefined
   */
  distanceDisplayCondition: {
    get: function () {
      return this._distanceDisplayCondition;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError("far must be greater than near");
      }
      //>>includeEnd('debug');
      if (
        !DistanceDisplayCondition.equals(this._distanceDisplayCondition, value)
      ) {
        this._distanceDisplayCondition = DistanceDisplayCondition.clone(
          value,
          this._distanceDisplayCondition,
        );
        makeDirty(this, DISTANCE_DISPLAY_CONDITION_INDEX);
      }
    },
  },

  /**
   * 获取或设置禁用深度测试的相机距离，例如用于防止与地形裁剪。当设置为 0 时，始终应用深度测试；当设置为 Number.POSITIVE_INFINITY 时，从不应用深度测试。
   * @memberof PointPrimitive.prototype
   * @type {number}
   * @default 0.0
   */
  disableDepthTestDistance: {
    get: function () {
      return this._disableDepthTestDistance;
    },
    set: function (value) {
      if (this._disableDepthTestDistance !== value) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(value) || value < 0.0) {
          throw new DeveloperError(
            "disableDepthTestDistance must be greater than or equal to 0.0.",
          );
        }
        //>>includeEnd('debug');
        this._disableDepthTestDistance = value;
        makeDirty(this, DISABLE_DEPTH_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 获取或设置点被拾取时返回的用户定义值。
   * @memberof PointPrimitive.prototype
   * @type {*}
   */
  id: {
    get: function () {
      return this._id;
    },
    set: function (value) {
      this._id = value;
      if (defined(this._pickId)) {
        this._pickId.object.id = value;
      }
    },
  },

  /**
   * @private
   */
  pickId: {
    get: function () {
      return this._pickId;
    },
  },

  /**
   * Determines whether or not this point will be shown or hidden because it was clustered.
   * @memberof PointPrimitive.prototype
   * @type {boolean}
   * @private
   */
  clusterShow: {
    get: function () {
      return this._clusterShow;
    },
    set: function (value) {
      if (this._clusterShow !== value) {
        this._clusterShow = value;
        makeDirty(this, SHOW_INDEX);
      }
    },
  },

  /**
   * 应用于此点的 {@link SplitDirection}。
   * @memberof PointPrimitive.prototype
   * @type {SplitDirection}
   * @default {@link SplitDirection.NONE}
   */
  splitDirection: {
    get: function () {
      return this._splitDirection;
    },
    set: function (value) {
      if (this._splitDirection !== value) {
        this._splitDirection = value;
        makeDirty(this, SPLIT_DIRECTION_INDEX);
      }
    },
  },
});

PointPrimitive.prototype.getPickId = function (context) {
  if (!defined(this._pickId)) {
    this._pickId = context.createPickId({
      primitive: this,
      collection: this._collection,
      id: this._id,
    });
  }

  return this._pickId;
};

PointPrimitive.prototype._getActualPosition = function () {
  return this._actualPosition;
};

PointPrimitive.prototype._setActualPosition = function (value) {
  Cartesian3.clone(value, this._actualPosition);
  makeDirty(this, POSITION_INDEX);
};

const tempCartesian3 = new Cartesian4();
PointPrimitive._computeActualPosition = function (
  position,
  frameState,
  modelMatrix,
) {
  if (frameState.mode === SceneMode.SCENE3D) {
    return position;
  }

  Matrix4.multiplyByPoint(modelMatrix, position, tempCartesian3);
  return SceneTransforms.computeActualEllipsoidPosition(
    frameState,
    tempCartesian3,
  );
};

const scratchCartesian4 = new Cartesian4();

// This function is basically a stripped-down JavaScript version of PointPrimitiveCollectionVS.glsl
PointPrimitive._computeScreenSpacePosition = function (
  modelMatrix,
  position,
  scene,
  result,
) {
  // Model to world coordinates
  const positionWorld = Matrix4.multiplyByVector(
    modelMatrix,
    Cartesian4.fromElements(
      position.x,
      position.y,
      position.z,
      1,
      scratchCartesian4,
    ),
    scratchCartesian4,
  );
  const positionWC = SceneTransforms.worldToWindowCoordinates(
    scene,
    positionWorld,
    result,
  );
  return positionWC;
};

/**
 * 计算点原点的屏幕空间位置。
 * 屏幕空间原点为画布的左上角；<code>x</code> 从左向右增加，<code>y</code> 从上向下增加。
 *
 * @param {Scene} scene 场景。
 * @param {Cartesian2} [result] 用于存储结果的对象。
 * @returns {Cartesian2} 点的屏幕空间位置。
 *
 * @exception {DeveloperError} 点必须在集合中。
 *
 * @example
 * console.log(p.computeScreenSpacePosition(scene).toString());
 */
PointPrimitive.prototype.computeScreenSpacePosition = function (scene, result) {
  const pointPrimitiveCollection = this._pointPrimitiveCollection;
  if (!defined(result)) {
    result = new Cartesian2();
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(pointPrimitiveCollection)) {
    throw new DeveloperError("PointPrimitive must be in a collection.");
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  const modelMatrix = pointPrimitiveCollection.modelMatrix;
  const windowCoordinates = PointPrimitive._computeScreenSpacePosition(
    modelMatrix,
    this._actualPosition,
    scene,
    result,
  );
  if (!defined(windowCoordinates)) {
    return undefined;
  }

  windowCoordinates.y = scene.canvas.clientHeight - windowCoordinates.y;
  return windowCoordinates;
};

/**
 * Gets a point's screen space bounding box centered around screenSpacePosition.
 * @param {PointPrimitive} point The point to get the screen space bounding box for.
 * @param {Cartesian2} screenSpacePosition The screen space center of the label.
 * @param {BoundingRectangle} [result] The object onto which to store the result.
 * @returns {BoundingRectangle} The screen space bounding box.
 *
 * @private
 */
PointPrimitive.getScreenSpaceBoundingBox = function (
  point,
  screenSpacePosition,
  result,
) {
  const size = point.pixelSize;
  const halfSize = size * 0.5;

  const x = screenSpacePosition.x - halfSize;
  const y = screenSpacePosition.y - halfSize;
  const width = size;
  const height = size;

  if (!defined(result)) {
    result = new BoundingRectangle();
  }

  result.x = x;
  result.y = y;
  result.width = width;
  result.height = height;

  return result;
};

/**
 * 确定此点是否与另一个点相等。当所有属性都相等时，两个点相等。不同集合中的点也可以相等。
 *
 * @param {PointPrimitive} [other] 用于比较相等的点。
 * @returns {boolean} 如果点相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */
PointPrimitive.prototype.equals = function (other) {
  return (
    this === other ||
    (defined(other) &&
      this._id === other._id &&
      Cartesian3.equals(this._position, other._position) &&
      Color.equals(this._color, other._color) &&
      this._pixelSize === other._pixelSize &&
      this._outlineWidth === other._outlineWidth &&
      this._show === other._show &&
      Color.equals(this._outlineColor, other._outlineColor) &&
      NearFarScalar.equals(this._scaleByDistance, other._scaleByDistance) &&
      NearFarScalar.equals(
        this._translucencyByDistance,
        other._translucencyByDistance,
      ) &&
      DistanceDisplayCondition.equals(
        this._distanceDisplayCondition,
        other._distanceDisplayCondition,
      ) &&
      this._disableDepthTestDistance === other._disableDepthTestDistance &&
      this._splitDirection === other._splitDirection)
  );
};

PointPrimitive.prototype._destroy = function () {
  this._pickId = this._pickId && this._pickId.destroy();
  this._pointPrimitiveCollection = undefined;
};
export default PointPrimitive;
