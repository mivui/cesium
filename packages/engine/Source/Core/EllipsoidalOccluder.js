import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Rectangle from "./Rectangle.js";

/**
 * 确定其他对象在可见地平线后面是可见的还是隐藏的，由
 * 一个 {@link Ellipsoid} 和一个相机位置。 假设椭球体位于
 * 坐标系的原点。 此类使用
 * {@link https://cesium.com/blog/2013/04/25/Horizon-culling/|Horizon Culling} 博客文章。
 *
 * @alias EllipsoidalOccluder
 *
 * @param {Ellipsoid} ellipsoid 用作遮挡物的椭球体。
 * @param {Cartesian3} [cameraPosition] 查看器/相机的坐标。 如果此参数不是
 * 指定后，必须在 {@link EllipsoidalOccluder#cameraPosition} 之前调用
 * 测试能见度。
 *
 * @constructor
 *
 * @example
 * // Construct an ellipsoidal occluder with radii 1.0, 1.1, and 0.9.
 * const cameraPosition = new Cesium.Cartesian3(5.0, 6.0, 7.0);
 * const occluderEllipsoid = new Cesium.Ellipsoid(1.0, 1.1, 0.9);
 * const occluder = new Cesium.EllipsoidalOccluder(occluderEllipsoid, cameraPosition);
 *
 * @private
 */
function EllipsoidalOccluder(ellipsoid, cameraPosition) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("ellipsoid", ellipsoid);
  //>>includeEnd('debug');

  this._ellipsoid = ellipsoid;
  this._cameraPosition = new Cartesian3();
  this._cameraPositionInScaledSpace = new Cartesian3();
  this._distanceToLimbInScaledSpaceSquared = 0.0;

  // cameraPosition fills in the above values
  if (defined(cameraPosition)) {
    this.cameraPosition = cameraPosition;
  }
}

Object.defineProperties(EllipsoidalOccluder.prototype, {
  /**
   * 获取遮挡椭球体。
   * @memberof EllipsoidalOccluder.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
  /**
   * 获取或设置位置。
   * @memberof EllipsoidalOccluder.prototype
   * @type {Cartesian3}
   */
  cameraPosition: {
    get: function () {
      return this._cameraPosition;
    },
    set: function (cameraPosition) {
      // See https://cesium.com/blog/2013/04/25/Horizon-culling/
      const ellipsoid = this._ellipsoid;
      const cv = ellipsoid.transformPositionToScaledSpace(
        cameraPosition,
        this._cameraPositionInScaledSpace
      );
      const vhMagnitudeSquared = Cartesian3.magnitudeSquared(cv) - 1.0;

      Cartesian3.clone(cameraPosition, this._cameraPosition);
      this._cameraPositionInScaledSpace = cv;
      this._distanceToLimbInScaledSpaceSquared = vhMagnitudeSquared;
    },
  },
});

const scratchCartesian = new Cartesian3();

/**
 * 确定某个点<code>occludee</code>是否被遮挡物隐藏在视图中。
 *
 * @param {Cartesian3} occludee 要测试可见性的点。
 * @returns {boolean} <code>true</code>，如果被遮挡对象可见;否则<code>为 false</code>。
 *
 * @example
 * const cameraPosition = new Cesium.Cartesian3(0, 0, 2.5);
 * const ellipsoid = new Cesium.Ellipsoid(1.0, 1.1, 0.9);
 * const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, cameraPosition);
 * const point = new Cesium.Cartesian3(0, -3, -3);
 * occluder.isPointVisible(point); //returns true
 */
EllipsoidalOccluder.prototype.isPointVisible = function (occludee) {
  const ellipsoid = this._ellipsoid;
  const occludeeScaledSpacePosition = ellipsoid.transformPositionToScaledSpace(
    occludee,
    scratchCartesian
  );
  return isScaledSpacePointVisible(
    occludeeScaledSpacePosition,
    this._cameraPositionInScaledSpace,
    this._distanceToLimbInScaledSpaceSquared
  );
};

/**
 * 确定在椭球标度空间中表示的点是否被
 * 封堵器。 变换与椭球对齐的坐标系中的笛卡尔 X、Y、Z 位置
 * 拖动到缩放的空间中，调用 {@link Ellipsoid#transformPositionToScaledSpace}。
 *
 * @param {Cartesian3} occludeeScaledSpacePosition 要测试可见性的点，以缩放空间表示。
 * @returns {boolean} <code>true</code>，如果被遮挡对象可见;否则<code>为 false</code>。
 *
 * @example
 * const cameraPosition = new Cesium.Cartesian3(0, 0, 2.5);
 * const ellipsoid = new Cesium.Ellipsoid(1.0, 1.1, 0.9);
 * const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, cameraPosition);
 * const point = new Cesium.Cartesian3(0, -3, -3);
 * const scaledSpacePoint = ellipsoid.transformPositionToScaledSpace(point);
 * occluder.isScaledSpacePointVisible(scaledSpacePoint); //returns true
 */
EllipsoidalOccluder.prototype.isScaledSpacePointVisible = function (
  occludeeScaledSpacePosition
) {
  return isScaledSpacePointVisible(
    occludeeScaledSpacePosition,
    this._cameraPositionInScaledSpace,
    this._distanceToLimbInScaledSpaceSquared
  );
};

const scratchCameraPositionInScaledSpaceShrunk = new Cartesian3();

/**
 * 类似于 {@link EllipsoidalOccluder#isScaledSpacePointVisible}，不同之处在于针对
 * 当最小高度低于最小高度时，椭球体已缩小最小高度
 * 椭球体。这旨在与
 * {@link EllipsoidalOccluder#computeHorizonCullingPointPossiblyUnderEllipsoid} 或
 * {@link EllipsoidalOccluder#computeHorizonCullingPointFromVerticesPossiblyUnderEllipsoid}.
 *
 * @param {Cartesian3} occludeeScaledSpacePosition 用于测试可见性的点，以可能缩小的椭球体的缩放空间表示。
 * @returns {boolean} <code>true</code>，如果被遮挡对象可见;否则<code>false</code>。
 */
EllipsoidalOccluder.prototype.isScaledSpacePointVisiblePossiblyUnderEllipsoid = function (
  occludeeScaledSpacePosition,
  minimumHeight
) {
  const ellipsoid = this._ellipsoid;
  let vhMagnitudeSquared;
  let cv;

  if (
    defined(minimumHeight) &&
    minimumHeight < 0.0 &&
    ellipsoid.minimumRadius > -minimumHeight
  ) {
    // This code is similar to the cameraPosition setter, but unrolled for performance because it will be called a lot.
    cv = scratchCameraPositionInScaledSpaceShrunk;
    cv.x = this._cameraPosition.x / (ellipsoid.radii.x + minimumHeight);
    cv.y = this._cameraPosition.y / (ellipsoid.radii.y + minimumHeight);
    cv.z = this._cameraPosition.z / (ellipsoid.radii.z + minimumHeight);
    vhMagnitudeSquared = cv.x * cv.x + cv.y * cv.y + cv.z * cv.z - 1.0;
  } else {
    cv = this._cameraPositionInScaledSpace;
    vhMagnitudeSquared = this._distanceToLimbInScaledSpaceSquared;
  }

  return isScaledSpacePointVisible(
    occludeeScaledSpacePosition,
    cv,
    vhMagnitudeSquared
  );
};

/**
 * 从位置列表中计算可用于水平面剔除的点。 如果点在下方
 * 地平线，所有位置也保证低于地平线。 返回的点
 * 在椭球标度空间中表示，适合与
 * {@link EllipsoidalOccluder#isScaledSpacePointVisible}.
 *
 * @param {Cartesian3} directionToPoint 计算点将沿其移动的方向。
 * 合理的使用方向是从椭球体中心到
 * 根据位置计算的边界球体的中心。 方向不需要
 * 标准化。
 * @param {Cartesian3[]} positions 计算水平剔除点的位置。 位置
 * 必须在以椭球体为中心的参考系中表示，并与
 * 椭球体的轴。
 * @param {Cartesian3} [result] 存储结果而不是分配新实例的实例。
 * @returns {Cartesian3} 计算出的水平面剔除点，以椭球体缩放空间表示。
 */
EllipsoidalOccluder.prototype.computeHorizonCullingPoint = function (
  directionToPoint,
  positions,
  result
) {
  return computeHorizonCullingPointFromPositions(
    this._ellipsoid,
    directionToPoint,
    positions,
    result
  );
};

const scratchEllipsoidShrunk = Ellipsoid.clone(Ellipsoid.UNIT_SPHERE);

/**
 * 类似于 {@link EllipsoidalOccluder#computeHorizonCullingPoint}，但计算剔除
 * 当最小高度低于最小高度时，相对于已缩小最小高度的椭球体的点
 * 椭球体。返回的点在可能缩小的椭球体缩放空间中表示，并且是合适的
 * 用于 {@link EllipsoidalOccluder#isScaledSpacePointVisiblePossiblyUnderEllipsoid}。
 *
 * @param {Cartesian3} directionToPoint 计算点将沿其移动的方向。
 * 合理的使用方向是从椭球体中心到
 * 根据位置计算的边界球体的中心。 方向不需要
 * 标准化。
 * @param {Cartesian3[]} positions 计算水平剔除点的位置。 位置
 * 必须在以椭球体为中心的参考系中表示，并与
 * 椭球体的轴。
 * @param {number} [minimumHeight] 所有位置的最小高度。如果未定义此值，则假定所有位置都位于椭球体上方。
 * @param {Cartesian3} [result] 存储结果而不是分配新实例的实例。
 * @returns {Cartesian3} 计算出的水平剔除点，以可能缩小的椭球体缩放空间表示。
 */
EllipsoidalOccluder.prototype.computeHorizonCullingPointPossiblyUnderEllipsoid = function (
  directionToPoint,
  positions,
  minimumHeight,
  result
) {
  const possiblyShrunkEllipsoid = getPossiblyShrunkEllipsoid(
    this._ellipsoid,
    minimumHeight,
    scratchEllipsoidShrunk
  );
  return computeHorizonCullingPointFromPositions(
    possiblyShrunkEllipsoid,
    directionToPoint,
    positions,
    result
  );
};
/**
 * 从位置列表中计算可用于水平面剔除的点。 如果点在下方
 * 地平线，所有位置也保证低于地平线。 返回的点
 * 在椭球标度空间中表示，适合与
 * {@link EllipsoidalOccluder#isScaledSpacePointVisible}.
 *
 * @param {Cartesian3} directionToPoint 计算点将沿其移动的方向。
 * 合理的使用方向是从椭球体中心到
 * 根据位置计算的边界球体的中心。 方向不需要
 * 标准化。
 * @param {number[]} vertices 计算地平线剔除点的顶点。 位置
 * 必须在以椭球体为中心的参考系中表示，并与
 * 椭球体的轴。
 * @param {number} [stride=3]
 * @param {Cartesian3} [center=Cartesian3.ZERO]
 * @param {Cartesian3} [result] 存储结果而不是分配新实例的实例。
 * @returns {Cartesian3} 计算出的水平面剔除点，以椭球体缩放空间表示。
 */
EllipsoidalOccluder.prototype.computeHorizonCullingPointFromVertices = function (
  directionToPoint,
  vertices,
  stride,
  center,
  result
) {
  return computeHorizonCullingPointFromVertices(
    this._ellipsoid,
    directionToPoint,
    vertices,
    stride,
    center,
    result
  );
};

/**
 * 类似于 {@link EllipsoidalOccluder#computeHorizonCullingPointFromVertices}，但计算剔除
 * 当最小高度低于最小高度时，相对于已缩小最小高度的椭球体的点
 * 椭球体。返回的点在可能缩小的椭球体缩放空间中表示，并且是合适的
 * 用于 {@link EllipsoidalOccluder#isScaledSpacePointVisiblePossiblyUnderEllipsoid}。
 *
 * @param {Cartesian3} directionToPoint 计算点将沿其移动的方向。
 * 合理的使用方向是从椭球体中心到
 * 根据位置计算的边界球体的中心。 方向不需要
 * 标准化。
 * @param {number[]} vertices 计算地平线剔除点的顶点。 位置
 * 必须在以椭球体为中心的参考系中表示，并与
 * 椭球体的轴。
 * @param {number} [stride=3]
 * @param {Cartesian3} [center=Cartesian3.ZERO]
 * @param {number} [minimumHeight] 所有顶点的最小高度。如果未定义此值，则假定所有顶点都位于椭球体上方。
 * @param {Cartesian3} [result] 存储结果而不是分配新实例的实例。
 * @returns {Cartesian3} 计算出的水平剔除点，以可能缩小的椭球体缩放空间表示。
 */
EllipsoidalOccluder.prototype.computeHorizonCullingPointFromVerticesPossiblyUnderEllipsoid = function (
  directionToPoint,
  vertices,
  stride,
  center,
  minimumHeight,
  result
) {
  const possiblyShrunkEllipsoid = getPossiblyShrunkEllipsoid(
    this._ellipsoid,
    minimumHeight,
    scratchEllipsoidShrunk
  );
  return computeHorizonCullingPointFromVertices(
    possiblyShrunkEllipsoid,
    directionToPoint,
    vertices,
    stride,
    center,
    result
  );
};

const subsampleScratch = [];

/**
 * 计算可用于矩形水平剔除的点。 如果点在下方
 * 地平线，符合椭球体的矩形也保证低于地平线。
 * 返回的点以椭球标度空间表示，适合与
 * {@link EllipsoidalOccluder#isScaledSpacePointVisible}.
 *
 * @param {Rectangle} rectangle 要计算地平线剔除点的矩形。
 * @param {Ellipsoid} 椭球体 定义矩形的椭球体。 这可能不同于
 * 此实例用于遮挡测试的椭球体。
 * @param {Cartesian3} [result] 存储结果而不是分配新实例的实例。
 * @returns {Cartesian3} 计算出的水平面剔除点，以椭球体缩放空间表示。
 */
EllipsoidalOccluder.prototype.computeHorizonCullingPointFromRectangle = function (
  rectangle,
  ellipsoid,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);
  //>>includeEnd('debug');

  const positions = Rectangle.subsample(
    rectangle,
    ellipsoid,
    0.0,
    subsampleScratch
  );
  const bs = BoundingSphere.fromPoints(positions);

  // If the bounding sphere center is too close to the center of the occluder, it doesn't make
  // sense to try to horizon cull it.
  if (Cartesian3.magnitude(bs.center) < 0.1 * ellipsoid.minimumRadius) {
    return undefined;
  }

  return this.computeHorizonCullingPoint(bs.center, positions, result);
};

const scratchEllipsoidShrunkRadii = new Cartesian3();

function getPossiblyShrunkEllipsoid(ellipsoid, minimumHeight, result) {
  if (
    defined(minimumHeight) &&
    minimumHeight < 0.0 &&
    ellipsoid.minimumRadius > -minimumHeight
  ) {
    const ellipsoidShrunkRadii = Cartesian3.fromElements(
      ellipsoid.radii.x + minimumHeight,
      ellipsoid.radii.y + minimumHeight,
      ellipsoid.radii.z + minimumHeight,
      scratchEllipsoidShrunkRadii
    );
    ellipsoid = Ellipsoid.fromCartesian3(ellipsoidShrunkRadii, result);
  }
  return ellipsoid;
}

function computeHorizonCullingPointFromPositions(
  ellipsoid,
  directionToPoint,
  positions,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("directionToPoint", directionToPoint);
  Check.defined("positions", positions);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  const scaledSpaceDirectionToPoint = computeScaledSpaceDirectionToPoint(
    ellipsoid,
    directionToPoint
  );
  let resultMagnitude = 0.0;

  for (let i = 0, len = positions.length; i < len; ++i) {
    const position = positions[i];
    const candidateMagnitude = computeMagnitude(
      ellipsoid,
      position,
      scaledSpaceDirectionToPoint
    );
    if (candidateMagnitude < 0.0) {
      // all points should face the same direction, but this one doesn't, so return undefined
      return undefined;
    }
    resultMagnitude = Math.max(resultMagnitude, candidateMagnitude);
  }

  return magnitudeToPoint(scaledSpaceDirectionToPoint, resultMagnitude, result);
}

const positionScratch = new Cartesian3();

function computeHorizonCullingPointFromVertices(
  ellipsoid,
  directionToPoint,
  vertices,
  stride,
  center,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("directionToPoint", directionToPoint);
  Check.defined("vertices", vertices);
  Check.typeOf.number("stride", stride);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  stride = defaultValue(stride, 3);
  center = defaultValue(center, Cartesian3.ZERO);
  const scaledSpaceDirectionToPoint = computeScaledSpaceDirectionToPoint(
    ellipsoid,
    directionToPoint
  );
  let resultMagnitude = 0.0;

  for (let i = 0, len = vertices.length; i < len; i += stride) {
    positionScratch.x = vertices[i] + center.x;
    positionScratch.y = vertices[i + 1] + center.y;
    positionScratch.z = vertices[i + 2] + center.z;

    const candidateMagnitude = computeMagnitude(
      ellipsoid,
      positionScratch,
      scaledSpaceDirectionToPoint
    );
    if (candidateMagnitude < 0.0) {
      // all points should face the same direction, but this one doesn't, so return undefined
      return undefined;
    }
    resultMagnitude = Math.max(resultMagnitude, candidateMagnitude);
  }

  return magnitudeToPoint(scaledSpaceDirectionToPoint, resultMagnitude, result);
}

function isScaledSpacePointVisible(
  occludeeScaledSpacePosition,
  cameraPositionInScaledSpace,
  distanceToLimbInScaledSpaceSquared
) {
  // See https://cesium.com/blog/2013/04/25/Horizon-culling/
  const cv = cameraPositionInScaledSpace;
  const vhMagnitudeSquared = distanceToLimbInScaledSpaceSquared;
  const vt = Cartesian3.subtract(
    occludeeScaledSpacePosition,
    cv,
    scratchCartesian
  );
  const vtDotVc = -Cartesian3.dot(vt, cv);
  // If vhMagnitudeSquared < 0 then we are below the surface of the ellipsoid and
  // in this case, set the culling plane to be on V.
  const isOccluded =
    vhMagnitudeSquared < 0
      ? vtDotVc > 0
      : vtDotVc > vhMagnitudeSquared &&
        (vtDotVc * vtDotVc) / Cartesian3.magnitudeSquared(vt) >
          vhMagnitudeSquared;
  return !isOccluded;
}

const scaledSpaceScratch = new Cartesian3();
const directionScratch = new Cartesian3();

function computeMagnitude(ellipsoid, position, scaledSpaceDirectionToPoint) {
  const scaledSpacePosition = ellipsoid.transformPositionToScaledSpace(
    position,
    scaledSpaceScratch
  );
  let magnitudeSquared = Cartesian3.magnitudeSquared(scaledSpacePosition);
  let magnitude = Math.sqrt(magnitudeSquared);
  const direction = Cartesian3.divideByScalar(
    scaledSpacePosition,
    magnitude,
    directionScratch
  );

  // For the purpose of this computation, points below the ellipsoid are consider to be on it instead.
  magnitudeSquared = Math.max(1.0, magnitudeSquared);
  magnitude = Math.max(1.0, magnitude);

  const cosAlpha = Cartesian3.dot(direction, scaledSpaceDirectionToPoint);
  const sinAlpha = Cartesian3.magnitude(
    Cartesian3.cross(direction, scaledSpaceDirectionToPoint, direction)
  );
  const cosBeta = 1.0 / magnitude;
  const sinBeta = Math.sqrt(magnitudeSquared - 1.0) * cosBeta;

  return 1.0 / (cosAlpha * cosBeta - sinAlpha * sinBeta);
}

function magnitudeToPoint(
  scaledSpaceDirectionToPoint,
  resultMagnitude,
  result
) {
  // The horizon culling point is undefined if there were no positions from which to compute it,
  // the directionToPoint is pointing opposite all of the positions,  or if we computed NaN or infinity.
  if (
    resultMagnitude <= 0.0 ||
    resultMagnitude === 1.0 / 0.0 ||
    resultMagnitude !== resultMagnitude
  ) {
    return undefined;
  }

  return Cartesian3.multiplyByScalar(
    scaledSpaceDirectionToPoint,
    resultMagnitude,
    result
  );
}

const directionToPointScratch = new Cartesian3();

function computeScaledSpaceDirectionToPoint(ellipsoid, directionToPoint) {
  if (Cartesian3.equals(directionToPoint, Cartesian3.ZERO)) {
    return directionToPoint;
  }

  ellipsoid.transformPositionToScaledSpace(
    directionToPoint,
    directionToPointScratch
  );
  return Cartesian3.normalize(directionToPointScratch, directionToPointScratch);
}
export default EllipsoidalOccluder;
