import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import Intersect from "./Intersect.js";
import Interval from "./Interval.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import Matrix4 from "./Matrix4.js";
import Rectangle from "./Rectangle.js";

/**
 * 一个有中心和半径的边界球。
 * @alias BoundingSphere
 * @constructor
 *
 * @param {Cartesian3} [center=Cartesian3.ZERO] 边界球的中心。
 * @param {number} [radius=0.0] 边界范围的半径。
 *
 * @see AxisAlignedBoundingBox
 * @see BoundingRectangle
 * @see Packable
 */
function BoundingSphere(center, radius) {
  /**
   * 球体的中心点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.center = Cartesian3.clone(defaultValue(center, Cartesian3.ZERO));

  /**
   * 球面的半径。
   * @type {number}
   * @default 0.0
   */
  this.radius = defaultValue(radius, 0.0);
}

const fromPointsXMin = new Cartesian3();
const fromPointsYMin = new Cartesian3();
const fromPointsZMin = new Cartesian3();
const fromPointsXMax = new Cartesian3();
const fromPointsYMax = new Cartesian3();
const fromPointsZMax = new Cartesian3();
const fromPointsCurrentPos = new Cartesian3();
const fromPointsScratch = new Cartesian3();
const fromPointsRitterCenter = new Cartesian3();
const fromPointsMinBoxPt = new Cartesian3();
const fromPointsMaxBoxPt = new Cartesian3();
const fromPointsNaiveCenterScratch = new Cartesian3();
const volumeConstant = (4.0 / 3.0) * CesiumMath.PI;

/**
 * 计算一个紧密拟合的边界球，包含一个3D笛卡尔点列表。
 * 边界球是通过运行两种算法来计算的，一个朴素算法和
 * 里特算法。两个球体中较小的一个用于确保紧密配合。
 *
 * @param {Cartesian3[]} [positions] 边界球将包围的点数组。每个点必须具有<code>x</code>、<code>y</code>和<code>z</code>属性。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数或新的BoundingSphere实例(如果没有提供)。
 *
 * @see {@link http://help.agi.com/AGIComponents/html/BlogBoundingSphere.htm|Bounding Sphere computation article}
 */
BoundingSphere.fromPoints = function (positions, result) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(positions) || positions.length === 0) {
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  const currentPos = Cartesian3.clone(positions[0], fromPointsCurrentPos);

  const xMin = Cartesian3.clone(currentPos, fromPointsXMin);
  const yMin = Cartesian3.clone(currentPos, fromPointsYMin);
  const zMin = Cartesian3.clone(currentPos, fromPointsZMin);

  const xMax = Cartesian3.clone(currentPos, fromPointsXMax);
  const yMax = Cartesian3.clone(currentPos, fromPointsYMax);
  const zMax = Cartesian3.clone(currentPos, fromPointsZMax);

  const numPositions = positions.length;
  let i;
  for (i = 1; i < numPositions; i++) {
    Cartesian3.clone(positions[i], currentPos);

    const x = currentPos.x;
    const y = currentPos.y;
    const z = currentPos.z;

    // Store points containing the the smallest and largest components
    if (x < xMin.x) {
      Cartesian3.clone(currentPos, xMin);
    }

    if (x > xMax.x) {
      Cartesian3.clone(currentPos, xMax);
    }

    if (y < yMin.y) {
      Cartesian3.clone(currentPos, yMin);
    }

    if (y > yMax.y) {
      Cartesian3.clone(currentPos, yMax);
    }

    if (z < zMin.z) {
      Cartesian3.clone(currentPos, zMin);
    }

    if (z > zMax.z) {
      Cartesian3.clone(currentPos, zMax);
    }
  }

  // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
  const xSpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(xMax, xMin, fromPointsScratch)
  );
  const ySpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(yMax, yMin, fromPointsScratch)
  );
  const zSpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(zMax, zMin, fromPointsScratch)
  );

  // Set the diameter endpoints to the largest span.
  let diameter1 = xMin;
  let diameter2 = xMax;
  let maxSpan = xSpan;
  if (ySpan > maxSpan) {
    maxSpan = ySpan;
    diameter1 = yMin;
    diameter2 = yMax;
  }
  if (zSpan > maxSpan) {
    maxSpan = zSpan;
    diameter1 = zMin;
    diameter2 = zMax;
  }

  // Calculate the center of the initial sphere found by Ritter's algorithm
  const ritterCenter = fromPointsRitterCenter;
  ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
  ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
  ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

  // Calculate the radius of the initial sphere found by Ritter's algorithm
  let radiusSquared = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch)
  );
  let ritterRadius = Math.sqrt(radiusSquared);

  // Find the center of the sphere found using the Naive method.
  const minBoxPt = fromPointsMinBoxPt;
  minBoxPt.x = xMin.x;
  minBoxPt.y = yMin.y;
  minBoxPt.z = zMin.z;

  const maxBoxPt = fromPointsMaxBoxPt;
  maxBoxPt.x = xMax.x;
  maxBoxPt.y = yMax.y;
  maxBoxPt.z = zMax.z;

  const naiveCenter = Cartesian3.midpoint(
    minBoxPt,
    maxBoxPt,
    fromPointsNaiveCenterScratch
  );

  // Begin 2nd pass to find naive radius and modify the ritter sphere.
  let naiveRadius = 0;
  for (i = 0; i < numPositions; i++) {
    Cartesian3.clone(positions[i], currentPos);

    // Find the furthest point from the naive center to calculate the naive radius.
    const r = Cartesian3.magnitude(
      Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch)
    );
    if (r > naiveRadius) {
      naiveRadius = r;
    }

    // Make adjustments to the Ritter Sphere to include all points.
    const oldCenterToPointSquared = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch)
    );
    if (oldCenterToPointSquared > radiusSquared) {
      const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
      // Calculate new radius to include the point that lies outside
      ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
      radiusSquared = ritterRadius * ritterRadius;
      // Calculate center of new Ritter sphere
      const oldToNew = oldCenterToPoint - ritterRadius;
      ritterCenter.x =
        (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) /
        oldCenterToPoint;
      ritterCenter.y =
        (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) /
        oldCenterToPoint;
      ritterCenter.z =
        (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) /
        oldCenterToPoint;
    }
  }

  if (ritterRadius < naiveRadius) {
    Cartesian3.clone(ritterCenter, result.center);
    result.radius = ritterRadius;
  } else {
    Cartesian3.clone(naiveCenter, result.center);
    result.radius = naiveRadius;
  }

  return result;
};

const defaultProjection = new GeographicProjection();
const fromRectangle2DLowerLeft = new Cartesian3();
const fromRectangle2DUpperRight = new Cartesian3();
const fromRectangle2DSouthwest = new Cartographic();
const fromRectangle2DNortheast = new Cartographic();

/**
 * 从2D中投影的矩形计算边界球。
 *
 * @param {Rectangle} [rectangle] 要在其周围创建边界球的矩形。
 * @param {object} [projection=GeographicProjection] 用于将矩形投影到2D中的投影。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.fromRectangle2D = function (rectangle, projection, result) {
  return BoundingSphere.fromRectangleWithHeights2D(
    rectangle,
    projection,
    0.0,
    0.0,
    result
  );
};

/**
 * 从2D中投影的矩形计算边界球。边界球解释了
 * 对象在矩形上的最小和最大高度。
 *
 * @param {Rectangle} [rectangle] 要在其周围创建边界球的矩形。
 * @param {object} [projection=GeographicProjection] 用于将矩形投影到2D中的投影。
 * @param {number} [minimumHeight=0.0] 最小高度 rectangle.
 * @param {number} [maximumHeight=0.0] 最大高度 rectangle.
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.fromRectangleWithHeights2D = function (
  rectangle,
  projection,
  minimumHeight,
  maximumHeight,
  result
) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(rectangle)) {
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  defaultProjection._ellipsoid = Ellipsoid.default;
  projection = defaultValue(projection, defaultProjection);

  Rectangle.southwest(rectangle, fromRectangle2DSouthwest);
  fromRectangle2DSouthwest.height = minimumHeight;
  Rectangle.northeast(rectangle, fromRectangle2DNortheast);
  fromRectangle2DNortheast.height = maximumHeight;

  const lowerLeft = projection.project(
    fromRectangle2DSouthwest,
    fromRectangle2DLowerLeft
  );
  const upperRight = projection.project(
    fromRectangle2DNortheast,
    fromRectangle2DUpperRight
  );

  const width = upperRight.x - lowerLeft.x;
  const height = upperRight.y - lowerLeft.y;
  const elevation = upperRight.z - lowerLeft.z;

  result.radius =
    Math.sqrt(width * width + height * height + elevation * elevation) * 0.5;
  const center = result.center;
  center.x = lowerLeft.x + width * 0.5;
  center.y = lowerLeft.y + height * 0.5;
  center.z = lowerLeft.z + elevation * 0.5;
  return result;
};

const fromRectangle3DScratch = [];

/**
 * 在3D中从矩形计算一个边界球。边界球是使用点的子样本创建的
 * 在椭球体上并包含在矩形中。它可能对所有类型椭球上的所有矩形都不准确。
 *
 * @param {Rectangle} [rectangle] 用于创建边界球的有效矩形。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用来确定矩形位置的椭球体。
 * @param {number} [surfaceHeight=0.0] 椭球表面以上的高度。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.fromRectangle3D = function (
  rectangle,
  ellipsoid,
  surfaceHeight,
  result
) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  surfaceHeight = defaultValue(surfaceHeight, 0.0);

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(rectangle)) {
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  const positions = Rectangle.subsample(
    rectangle,
    ellipsoid,
    surfaceHeight,
    fromRectangle3DScratch
  );
  return BoundingSphere.fromPoints(positions, result);
};

/**
 * 计算一个紧密拟合的边界球，包含一个3D点的列表，即点所在的位置
 * 按X, Y, Z顺序存储在平面数组中。边界球是通过运行2来计算的
 * 算法，朴素算法和里特算法。两个球体中较小的那个被用来
 * 确保贴身。
 *
 * @param {number[]} [positions] 边界球将包围的点数组。每一个点
 *        由数组中的三个元素按顺序X, Y, Z组成。
 * @param {Cartesian3} [center=Cartesian3.ZERO] 位置相对的位置，不需要是
 *        坐标系统的原点。当要使用位置时，这是有用的
 *        相对中心(RTC)渲染。
 * @param {number} [stride=3] 每个顶点的数组元素的数量。它必须至少3个,但它可能
 *                            更高。不管这个参数的值是什么,x的第一个位置
 *                            在数组索引0中,Y坐标在数组索引1上,Z坐标在数组索引中
 *                             2。当跨步为3时,x的下一个位置,然后从数组索引3开始。如果
 *                             但是,步程是5,但是跳过两个数组元素,下一个位置从数组开始
 *                            指数5。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数或新的BoundingSphere实例(如果没有提供)。
 *
 * @example
 * // Compute the bounding sphere from 3 positions, each specified relative to a center.
 * // In addition to the X, Y, and Z coordinates, the points array contains two additional
 * // elements per point which are ignored for the purpose of computing the bounding sphere.
 * const center = new Cesium.Cartesian3(1.0, 2.0, 3.0);
 * const points = [1.0, 2.0, 3.0, 0.1, 0.2,
 *               4.0, 5.0, 6.0, 0.1, 0.2,
 *               7.0, 8.0, 9.0, 0.1, 0.2];
 * const sphere = Cesium.BoundingSphere.fromVertices(points, center, 5);
 *
 * @see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}
 */
BoundingSphere.fromVertices = function (positions, center, stride, result) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(positions) || positions.length === 0) {
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  center = defaultValue(center, Cartesian3.ZERO);

  stride = defaultValue(stride, 3);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("stride", stride, 3);
  //>>includeEnd('debug');

  const currentPos = fromPointsCurrentPos;
  currentPos.x = positions[0] + center.x;
  currentPos.y = positions[1] + center.y;
  currentPos.z = positions[2] + center.z;

  const xMin = Cartesian3.clone(currentPos, fromPointsXMin);
  const yMin = Cartesian3.clone(currentPos, fromPointsYMin);
  const zMin = Cartesian3.clone(currentPos, fromPointsZMin);

  const xMax = Cartesian3.clone(currentPos, fromPointsXMax);
  const yMax = Cartesian3.clone(currentPos, fromPointsYMax);
  const zMax = Cartesian3.clone(currentPos, fromPointsZMax);

  const numElements = positions.length;
  let i;
  for (i = 0; i < numElements; i += stride) {
    const x = positions[i] + center.x;
    const y = positions[i + 1] + center.y;
    const z = positions[i + 2] + center.z;

    currentPos.x = x;
    currentPos.y = y;
    currentPos.z = z;

    // Store points containing the the smallest and largest components
    if (x < xMin.x) {
      Cartesian3.clone(currentPos, xMin);
    }

    if (x > xMax.x) {
      Cartesian3.clone(currentPos, xMax);
    }

    if (y < yMin.y) {
      Cartesian3.clone(currentPos, yMin);
    }

    if (y > yMax.y) {
      Cartesian3.clone(currentPos, yMax);
    }

    if (z < zMin.z) {
      Cartesian3.clone(currentPos, zMin);
    }

    if (z > zMax.z) {
      Cartesian3.clone(currentPos, zMax);
    }
  }

  // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
  const xSpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(xMax, xMin, fromPointsScratch)
  );
  const ySpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(yMax, yMin, fromPointsScratch)
  );
  const zSpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(zMax, zMin, fromPointsScratch)
  );

  // Set the diameter endpoints to the largest span.
  let diameter1 = xMin;
  let diameter2 = xMax;
  let maxSpan = xSpan;
  if (ySpan > maxSpan) {
    maxSpan = ySpan;
    diameter1 = yMin;
    diameter2 = yMax;
  }
  if (zSpan > maxSpan) {
    maxSpan = zSpan;
    diameter1 = zMin;
    diameter2 = zMax;
  }

  // Calculate the center of the initial sphere found by Ritter's algorithm
  const ritterCenter = fromPointsRitterCenter;
  ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
  ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
  ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

  // Calculate the radius of the initial sphere found by Ritter's algorithm
  let radiusSquared = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch)
  );
  let ritterRadius = Math.sqrt(radiusSquared);

  // Find the center of the sphere found using the Naive method.
  const minBoxPt = fromPointsMinBoxPt;
  minBoxPt.x = xMin.x;
  minBoxPt.y = yMin.y;
  minBoxPt.z = zMin.z;

  const maxBoxPt = fromPointsMaxBoxPt;
  maxBoxPt.x = xMax.x;
  maxBoxPt.y = yMax.y;
  maxBoxPt.z = zMax.z;

  const naiveCenter = Cartesian3.midpoint(
    minBoxPt,
    maxBoxPt,
    fromPointsNaiveCenterScratch
  );

  // Begin 2nd pass to find naive radius and modify the ritter sphere.
  let naiveRadius = 0;
  for (i = 0; i < numElements; i += stride) {
    currentPos.x = positions[i] + center.x;
    currentPos.y = positions[i + 1] + center.y;
    currentPos.z = positions[i + 2] + center.z;

    // Find the furthest point from the naive center to calculate the naive radius.
    const r = Cartesian3.magnitude(
      Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch)
    );
    if (r > naiveRadius) {
      naiveRadius = r;
    }

    // Make adjustments to the Ritter Sphere to include all points.
    const oldCenterToPointSquared = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch)
    );
    if (oldCenterToPointSquared > radiusSquared) {
      const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
      // Calculate new radius to include the point that lies outside
      ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
      radiusSquared = ritterRadius * ritterRadius;
      // Calculate center of new Ritter sphere
      const oldToNew = oldCenterToPoint - ritterRadius;
      ritterCenter.x =
        (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) /
        oldCenterToPoint;
      ritterCenter.y =
        (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) /
        oldCenterToPoint;
      ritterCenter.z =
        (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) /
        oldCenterToPoint;
    }
  }

  if (ritterRadius < naiveRadius) {
    Cartesian3.clone(ritterCenter, result.center);
    result.radius = ritterRadius;
  } else {
    Cartesian3.clone(naiveCenter, result.center);
    result.radius = naiveRadius;
  }

  return result;
};

/**
 * 计算一个紧密拟合的边界球，包含一个encodedcartesians列表，其中点在哪里
 * 按X, Y, Z顺序存储在并行平面数组中。边界球是通过运行2来计算的
 * 算法，朴素算法和里特算法。两个球体中较小的那个被用来
 * 确保贴身。
 *
 * @param {number[]} [positionsHigh] 边界球将包围的编码笛卡尔坐标的高位数组。每一个点
 *        由数组中的三个元素按顺序X, Y, Z组成。
 * @param {number[]} [positionsLow] 边界球将包围的编码笛卡尔坐标的低位数组。每一个点
 *        由数组中的三个元素按顺序X, Y, Z组成。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数或新的BoundingSphere实例(如果没有提供)。
 *
 * @see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|Bounding Sphere computation article}
 */
BoundingSphere.fromEncodedCartesianVertices = function (
  positionsHigh,
  positionsLow,
  result
) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (
    !defined(positionsHigh) ||
    !defined(positionsLow) ||
    positionsHigh.length !== positionsLow.length ||
    positionsHigh.length === 0
  ) {
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  const currentPos = fromPointsCurrentPos;
  currentPos.x = positionsHigh[0] + positionsLow[0];
  currentPos.y = positionsHigh[1] + positionsLow[1];
  currentPos.z = positionsHigh[2] + positionsLow[2];

  const xMin = Cartesian3.clone(currentPos, fromPointsXMin);
  const yMin = Cartesian3.clone(currentPos, fromPointsYMin);
  const zMin = Cartesian3.clone(currentPos, fromPointsZMin);

  const xMax = Cartesian3.clone(currentPos, fromPointsXMax);
  const yMax = Cartesian3.clone(currentPos, fromPointsYMax);
  const zMax = Cartesian3.clone(currentPos, fromPointsZMax);

  const numElements = positionsHigh.length;
  let i;
  for (i = 0; i < numElements; i += 3) {
    const x = positionsHigh[i] + positionsLow[i];
    const y = positionsHigh[i + 1] + positionsLow[i + 1];
    const z = positionsHigh[i + 2] + positionsLow[i + 2];

    currentPos.x = x;
    currentPos.y = y;
    currentPos.z = z;

    // Store points containing the the smallest and largest components
    if (x < xMin.x) {
      Cartesian3.clone(currentPos, xMin);
    }

    if (x > xMax.x) {
      Cartesian3.clone(currentPos, xMax);
    }

    if (y < yMin.y) {
      Cartesian3.clone(currentPos, yMin);
    }

    if (y > yMax.y) {
      Cartesian3.clone(currentPos, yMax);
    }

    if (z < zMin.z) {
      Cartesian3.clone(currentPos, zMin);
    }

    if (z > zMax.z) {
      Cartesian3.clone(currentPos, zMax);
    }
  }

  // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
  const xSpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(xMax, xMin, fromPointsScratch)
  );
  const ySpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(yMax, yMin, fromPointsScratch)
  );
  const zSpan = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(zMax, zMin, fromPointsScratch)
  );

  // Set the diameter endpoints to the largest span.
  let diameter1 = xMin;
  let diameter2 = xMax;
  let maxSpan = xSpan;
  if (ySpan > maxSpan) {
    maxSpan = ySpan;
    diameter1 = yMin;
    diameter2 = yMax;
  }
  if (zSpan > maxSpan) {
    maxSpan = zSpan;
    diameter1 = zMin;
    diameter2 = zMax;
  }

  // Calculate the center of the initial sphere found by Ritter's algorithm
  const ritterCenter = fromPointsRitterCenter;
  ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
  ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
  ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

  // Calculate the radius of the initial sphere found by Ritter's algorithm
  let radiusSquared = Cartesian3.magnitudeSquared(
    Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch)
  );
  let ritterRadius = Math.sqrt(radiusSquared);

  // Find the center of the sphere found using the Naive method.
  const minBoxPt = fromPointsMinBoxPt;
  minBoxPt.x = xMin.x;
  minBoxPt.y = yMin.y;
  minBoxPt.z = zMin.z;

  const maxBoxPt = fromPointsMaxBoxPt;
  maxBoxPt.x = xMax.x;
  maxBoxPt.y = yMax.y;
  maxBoxPt.z = zMax.z;

  const naiveCenter = Cartesian3.midpoint(
    minBoxPt,
    maxBoxPt,
    fromPointsNaiveCenterScratch
  );

  // Begin 2nd pass to find naive radius and modify the ritter sphere.
  let naiveRadius = 0;
  for (i = 0; i < numElements; i += 3) {
    currentPos.x = positionsHigh[i] + positionsLow[i];
    currentPos.y = positionsHigh[i + 1] + positionsLow[i + 1];
    currentPos.z = positionsHigh[i + 2] + positionsLow[i + 2];

    // Find the furthest point from the naive center to calculate the naive radius.
    const r = Cartesian3.magnitude(
      Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch)
    );
    if (r > naiveRadius) {
      naiveRadius = r;
    }

    // Make adjustments to the Ritter Sphere to include all points.
    const oldCenterToPointSquared = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch)
    );
    if (oldCenterToPointSquared > radiusSquared) {
      const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
      // Calculate new radius to include the point that lies outside
      ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
      radiusSquared = ritterRadius * ritterRadius;
      // Calculate center of new Ritter sphere
      const oldToNew = oldCenterToPoint - ritterRadius;
      ritterCenter.x =
        (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) /
        oldCenterToPoint;
      ritterCenter.y =
        (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) /
        oldCenterToPoint;
      ritterCenter.z =
        (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) /
        oldCenterToPoint;
    }
  }

  if (ritterRadius < naiveRadius) {
    Cartesian3.clone(ritterCenter, result.center);
    result.radius = ritterRadius;
  } else {
    Cartesian3.clone(naiveCenter, result.center);
    result.radius = naiveRadius;
  }

  return result;
};

/**
 * 从一个轴对齐的边界框的角点计算一个边界球。球面
 * 紧紧地包裹住盒子。
 *
 * @param {Cartesian3} [corner] 最小高度 rectangle.
 * @param {Cartesian3} [oppositeCorner] 最大高度 rectangle.
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 *
 * @example
 * // Create a bounding sphere around the unit cube
 * const sphere = Cesium.BoundingSphere.fromCornerPoints(new Cesium.Cartesian3(-0.5, -0.5, -0.5), new Cesium.Cartesian3(0.5, 0.5, 0.5));
 */
BoundingSphere.fromCornerPoints = function (corner, oppositeCorner, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("corner", corner);
  Check.typeOf.object("oppositeCorner", oppositeCorner);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  const center = Cartesian3.midpoint(corner, oppositeCorner, result.center);
  result.radius = Cartesian3.distance(center, oppositeCorner);
  return result;
};

/**
 * 创建一个包围椭球的边界球。
 *
 * @param {Ellipsoid} ellipsoid 在其周围创建边界球的椭球体。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 *
 * @example
 * const boundingSphere = Cesium.BoundingSphere.fromEllipsoid(ellipsoid);
 */
BoundingSphere.fromEllipsoid = function (ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("ellipsoid", ellipsoid);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  Cartesian3.clone(Cartesian3.ZERO, result.center);
  result.radius = ellipsoid.maximumRadius;
  return result;
};

const fromBoundingSpheresScratch = new Cartesian3();

/**
 * 计算包含所提供的边界球数组的紧密拟合边界球。
 *
 * @param {BoundingSphere[]} [boundingSpheres] 边界球体的数组。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.fromBoundingSpheres = function (boundingSpheres, result) {
  if (!defined(result)) {
    result = new BoundingSphere();
  }

  if (!defined(boundingSpheres) || boundingSpheres.length === 0) {
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = 0.0;
    return result;
  }

  const length = boundingSpheres.length;
  if (length === 1) {
    return BoundingSphere.clone(boundingSpheres[0], result);
  }

  if (length === 2) {
    return BoundingSphere.union(boundingSpheres[0], boundingSpheres[1], result);
  }

  const positions = [];
  let i;
  for (i = 0; i < length; i++) {
    positions.push(boundingSpheres[i].center);
  }

  result = BoundingSphere.fromPoints(positions, result);

  const center = result.center;
  let radius = result.radius;
  for (i = 0; i < length; i++) {
    const tmp = boundingSpheres[i];
    radius = Math.max(
      radius,
      Cartesian3.distance(center, tmp.center, fromBoundingSpheresScratch) +
        tmp.radius
    );
  }
  result.radius = radius;

  return result;
};

const fromOrientedBoundingBoxScratchU = new Cartesian3();
const fromOrientedBoundingBoxScratchV = new Cartesian3();
const fromOrientedBoundingBoxScratchW = new Cartesian3();

/**
 * 计算封闭所提供的定向边界框的紧密配合边界球。
 *
 * @param {OrientedBoundingBox} orientedBoundingBox 定向边界框。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.fromOrientedBoundingBox = function (
  orientedBoundingBox,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("orientedBoundingBox", orientedBoundingBox);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  const halfAxes = orientedBoundingBox.halfAxes;
  const u = Matrix3.getColumn(halfAxes, 0, fromOrientedBoundingBoxScratchU);
  const v = Matrix3.getColumn(halfAxes, 1, fromOrientedBoundingBoxScratchV);
  const w = Matrix3.getColumn(halfAxes, 2, fromOrientedBoundingBoxScratchW);

  Cartesian3.add(u, v, u);
  Cartesian3.add(u, w, u);

  result.center = Cartesian3.clone(orientedBoundingBox.center, result.center);
  result.radius = Cartesian3.magnitude(u);

  return result;
};

const scratchFromTransformationCenter = new Cartesian3();
const scratchFromTransformationScale = new Cartesian3();

/**
 * 计算包含给定仿射变换的紧密拟合边界球。
 *
 * @param {Matrix4} transformation 仿射变换。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.fromTransformation = function (transformation, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("transformation", transformation);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  const center = Matrix4.getTranslation(
    transformation,
    scratchFromTransformationCenter
  );
  const scale = Matrix4.getScale(
    transformation,
    scratchFromTransformationScale
  );
  const radius = 0.5 * Cartesian3.magnitude(scale);
  result.center = Cartesian3.clone(center, result.center);
  result.radius = radius;

  return result;
};

/**
 * 复制BoundingSphere instance.
 *
 * @param {BoundingSphere} sphere 要复制的边界球体。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。 (如果球体未定义则返回未定义)
 */
BoundingSphere.clone = function (sphere, result) {
  if (!defined(sphere)) {
    return undefined;
  }

  if (!defined(result)) {
    return new BoundingSphere(sphere.center, sphere.radius);
  }

  result.center = Cartesian3.clone(sphere.center, result.center);
  result.radius = sphere.radius;
  return result;
};

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
BoundingSphere.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中。
 *
 * @param {BoundingSphere} value 要打包的值。
 * @param {number[]} array 要装入的数组。
 * @param {number} [startingIndex=0] 开始打包元素的数组的索引。
 *
 * @returns {number[]} 被装入的数组
 */
BoundingSphere.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const center = value.center;
  array[startingIndex++] = center.x;
  array[startingIndex++] = center.y;
  array[startingIndex++] = center.z;
  array[startingIndex] = value.radius;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 打包数组。
 * @param {number} [startingIndex=0] 要解压缩的元素的起始索引。
 * @param {BoundingSphere} [result] 要在其中存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数或新的BoundingSphere实例(如果没有提供)。
 */
BoundingSphere.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  const center = result.center;
  center.x = array[startingIndex++];
  center.y = array[startingIndex++];
  center.z = array[startingIndex++];
  result.radius = array[startingIndex];
  return result;
};

const unionScratch = new Cartesian3();
const unionScratchCenter = new Cartesian3();
/**
 * 计算包含左边界球和右边界球的边界球。
 *
 * @param {BoundingSphere} left 一个被包围在边界球中的球体。
 * @param {BoundingSphere} right 一个被包围在边界球中的球体。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.union = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  const leftCenter = left.center;
  const leftRadius = left.radius;
  const rightCenter = right.center;
  const rightRadius = right.radius;

  const toRightCenter = Cartesian3.subtract(
    rightCenter,
    leftCenter,
    unionScratch
  );
  const centerSeparation = Cartesian3.magnitude(toRightCenter);

  if (leftRadius >= centerSeparation + rightRadius) {
    // Left sphere wins.
    left.clone(result);
    return result;
  }

  if (rightRadius >= centerSeparation + leftRadius) {
    // Right sphere wins.
    right.clone(result);
    return result;
  }

  // There are two tangent points, one on far side of each sphere.
  const halfDistanceBetweenTangentPoints =
    (leftRadius + centerSeparation + rightRadius) * 0.5;

  // Compute the center point halfway between the two tangent points.
  const center = Cartesian3.multiplyByScalar(
    toRightCenter,
    (-leftRadius + halfDistanceBetweenTangentPoints) / centerSeparation,
    unionScratchCenter
  );
  Cartesian3.add(center, leftCenter, center);
  Cartesian3.clone(center, result.center);
  result.radius = halfDistanceBetweenTangentPoints;

  return result;
};

const expandScratch = new Cartesian3();
/**
 * Computes a bounding sphere by enlarging the provided sphere to contain the provided point.
 *
 * @param {BoundingSphere} sphere A sphere to expand.
 * @param {Cartesian3} point A point to enclose in a bounding sphere.
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.expand = function (sphere, point, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("point", point);
  //>>includeEnd('debug');

  result = BoundingSphere.clone(sphere, result);

  const radius = Cartesian3.magnitude(
    Cartesian3.subtract(point, result.center, expandScratch)
  );
  if (radius > result.radius) {
    result.radius = radius;
  }

  return result;
};

/**
 * 确定球体位于平面的哪一边。
 *
 * @param {BoundingSphere} sphere 要测试的边界球。
 * @param {Plane} plane 要测试的飞机。
 * @returns {Intersect} {@link Intersect.INSIDE} 如果整个球体在平面的一侧,
 *                      法线是指向的，{@link Intersect.OUTSIDE}。如果整个球体是
 *                      在对面，和{@link Intersect.INTERSECTING}。与球面相交
 *                      与平面相交。
 */
BoundingSphere.intersectPlane = function (sphere, plane) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("plane", plane);
  //>>includeEnd('debug');

  const center = sphere.center;
  const radius = sphere.radius;
  const normal = plane.normal;
  const distanceToPlane = Cartesian3.dot(normal, center) + plane.distance;

  if (distanceToPlane < -radius) {
    // The center point is negative side of the plane normal
    return Intersect.OUTSIDE;
  } else if (distanceToPlane < radius) {
    // The center point is positive side of the plane, but radius extends beyond it; partial overlap
    return Intersect.INTERSECTING;
  }
  return Intersect.INSIDE;
};

/**
 * 应用一个4x4仿射变换矩阵到一个边界球。
 *
 * @param {BoundingSphere} sphere 要应用变换的边界球。
 * @param {Matrix4} transform 将变换矩阵应用于边界球。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.transform = function (sphere, transform, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("transform", transform);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  result.center = Matrix4.multiplyByPoint(
    transform,
    sphere.center,
    result.center
  );
  result.radius = Matrix4.getMaximumScale(transform) * sphere.radius;

  return result;
};

const distanceSquaredToScratch = new Cartesian3();

/**
 * 计算从边界球上最近的点到点的估计距离的平方。
 *
 * @param {BoundingSphere} sphere  sphere.
 * @param {Cartesian3} cartesian  point
 * @returns {number} 从边界球到该点的距离的平方。如果点在球体内则返回0。
 *
 * @example
 * // Sort bounding spheres from back to front
 * spheres.sort(function(a, b) {
 *     return Cesium.BoundingSphere.distanceSquaredTo(b, camera.positionWC) - Cesium.BoundingSphere.distanceSquaredTo(a, camera.positionWC);
 * });
 */
BoundingSphere.distanceSquaredTo = function (sphere, cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  const diff = Cartesian3.subtract(
    sphere.center,
    cartesian,
    distanceSquaredToScratch
  );

  const distance = Cartesian3.magnitude(diff) - sphere.radius;
  if (distance <= 0.0) {
    return 0.0;
  }

  return distance * distance;
};

/**
 * 将4x4仿射变换矩阵应用于没有尺度的边界球
 * 未验证变换矩阵具有1的统一标度。
 * 这个方法比使用 {@link BoundingSphere.transform} 计算一般的边界球变换要快。
 *
 * @param {BoundingSphere} sphere 要应用变换的边界球。
 * @param {Matrix4} transform 将变换矩阵应用于边界球。
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 *
 * @example
 * const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid);
 * const boundingSphere = new Cesium.BoundingSphere();
 * const newBoundingSphere = Cesium.BoundingSphere.transformWithoutScale(boundingSphere, modelMatrix);
 */
BoundingSphere.transformWithoutScale = function (sphere, transform, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("transform", transform);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingSphere();
  }

  result.center = Matrix4.multiplyByPoint(
    transform,
    sphere.center,
    result.center
  );
  result.radius = sphere.radius;

  return result;
};

const scratchCartesian3 = new Cartesian3();
/**
 * 由矢量计算的从边界球中心到投影到方向上的位置的距离
 * 正负边界范围的半径。
 * <br>
 * 如果你想象有无限个法线方向的平面，这计算出到
 * 距离与边界球相交的位置最近和最远的平面。
 *
 * @param {BoundingSphere} sphere 计算距离的边界球。
 * @param {Cartesian3} position 要计算距离的位置。
 * @param {Cartesian3} direction 从位置的方向。
 * @param {Interval} [result] 存储最近和最远距离的间隔。
 * @returns {Interval} 从方向上的位置到边界球上最近和最远的距离。
 */
BoundingSphere.computePlaneDistances = function (
  sphere,
  position,
  direction,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("position", position);
  Check.typeOf.object("direction", direction);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Interval();
  }

  const toCenter = Cartesian3.subtract(
    sphere.center,
    position,
    scratchCartesian3
  );
  const mag = Cartesian3.dot(direction, toCenter);

  result.start = mag - sphere.radius;
  result.stop = mag + sphere.radius;
  return result;
};

const projectTo2DNormalScratch = new Cartesian3();
const projectTo2DEastScratch = new Cartesian3();
const projectTo2DNorthScratch = new Cartesian3();
const projectTo2DWestScratch = new Cartesian3();
const projectTo2DSouthScratch = new Cartesian3();
const projectTo2DCartographicScratch = new Cartographic();
const projectTo2DPositionsScratch = new Array(8);
for (let n = 0; n < 8; ++n) {
  projectTo2DPositionsScratch[n] = new Cartesian3();
}

const projectTo2DProjection = new GeographicProjection();
/**
 * Creates a bounding sphere in 2D from a bounding sphere in 3D world coordinates.
 *
 * @param {BoundingSphere} sphere The bounding sphere to transform to 2D.
 * @param {object} [projection=GeographicProjection] The projection to 2D.
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.projectTo2D = function (sphere, projection, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  //>>includeEnd('debug');

  projectTo2DProjection._ellipsoid = Ellipsoid.default;
  projection = defaultValue(projection, projectTo2DProjection);

  const ellipsoid = projection.ellipsoid;
  let center = sphere.center;
  const radius = sphere.radius;

  let normal;
  if (Cartesian3.equals(center, Cartesian3.ZERO)) {
    // Bounding sphere is at the center. The geodetic surface normal is not
    // defined here so pick the x-axis as a fallback.
    normal = Cartesian3.clone(Cartesian3.UNIT_X, projectTo2DNormalScratch);
  } else {
    normal = ellipsoid.geodeticSurfaceNormal(center, projectTo2DNormalScratch);
  }
  const east = Cartesian3.cross(
    Cartesian3.UNIT_Z,
    normal,
    projectTo2DEastScratch
  );
  Cartesian3.normalize(east, east);
  const north = Cartesian3.cross(normal, east, projectTo2DNorthScratch);
  Cartesian3.normalize(north, north);

  Cartesian3.multiplyByScalar(normal, radius, normal);
  Cartesian3.multiplyByScalar(north, radius, north);
  Cartesian3.multiplyByScalar(east, radius, east);

  const south = Cartesian3.negate(north, projectTo2DSouthScratch);
  const west = Cartesian3.negate(east, projectTo2DWestScratch);

  const positions = projectTo2DPositionsScratch;

  // top NE corner
  let corner = positions[0];
  Cartesian3.add(normal, north, corner);
  Cartesian3.add(corner, east, corner);

  // top NW corner
  corner = positions[1];
  Cartesian3.add(normal, north, corner);
  Cartesian3.add(corner, west, corner);

  // top SW corner
  corner = positions[2];
  Cartesian3.add(normal, south, corner);
  Cartesian3.add(corner, west, corner);

  // top SE corner
  corner = positions[3];
  Cartesian3.add(normal, south, corner);
  Cartesian3.add(corner, east, corner);

  Cartesian3.negate(normal, normal);

  // bottom NE corner
  corner = positions[4];
  Cartesian3.add(normal, north, corner);
  Cartesian3.add(corner, east, corner);

  // bottom NW corner
  corner = positions[5];
  Cartesian3.add(normal, north, corner);
  Cartesian3.add(corner, west, corner);

  // bottom SW corner
  corner = positions[6];
  Cartesian3.add(normal, south, corner);
  Cartesian3.add(corner, west, corner);

  // bottom SE corner
  corner = positions[7];
  Cartesian3.add(normal, south, corner);
  Cartesian3.add(corner, east, corner);

  const length = positions.length;
  for (let i = 0; i < length; ++i) {
    const position = positions[i];
    Cartesian3.add(center, position, position);
    const cartographic = ellipsoid.cartesianToCartographic(
      position,
      projectTo2DCartographicScratch
    );
    projection.project(cartographic, position);
  }

  result = BoundingSphere.fromPoints(positions, result);

  // swizzle center components
  center = result.center;
  const x = center.x;
  const y = center.y;
  const z = center.z;
  center.x = z;
  center.y = x;
  center.z = y;

  return result;
};

/**
 * 确定球体是否被遮挡器从视图中隐藏。
 *
 * @param {BoundingSphere} sphere 包围被遮挡物体的边界球。
 * @param {Occluder} occluder 遮光板。
 * @returns {boolean} <code>true</code>如果球体不可见;否则<code>false</code>。
 */
BoundingSphere.isOccluded = function (sphere, occluder) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("sphere", sphere);
  Check.typeOf.object("occluder", occluder);
  //>>includeEnd('debug');
  return !occluder.isBoundingSphereVisible(sphere);
};

/**
 * 比较提供的BoundingSphere组件并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {BoundingSphere} [left] 第一个BoundingSphere.
 * @param {BoundingSphere} [right] 第二个 BoundingSphere.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
BoundingSphere.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Cartesian3.equals(left.center, right.center) &&
      left.radius === right.radius)
  );
};

/**
 * 确定球体位于平面的哪一边。
 *
 * @param {Plane} plane 要测试的飞机。
 * @returns {Intersect}{@link Intersect.INSIDE} 如果整个球体在平面的一侧,
 *                      法线是指向的，{@link Intersect.OUTSIDE}。如果整个球体是
 *                      在对面，和{@link Intersect.INTERSECTING}。与球面相交
 *                      与平面相交。
 */
BoundingSphere.prototype.intersectPlane = function (plane) {
  return BoundingSphere.intersectPlane(this, plane);
};

/**
 * 计算从边界球上最近的点到点的估计距离的平方。
 *
 * @param {Cartesian3} cartesian  point
 * @returns {number} 从边界球到该点的估计距离的平方。
 *
 * @example
 * // Sort bounding spheres from back to front
 * spheres.sort(function(a, b) {
 *     return b.distanceSquaredTo(camera.positionWC) - a.distanceSquaredTo(camera.positionWC);
 * });
 */
BoundingSphere.prototype.distanceSquaredTo = function (cartesian) {
  return BoundingSphere.distanceSquaredTo(this, cartesian);
};

/**
 * 由矢量计算的从边界球中心到投影到方向上的位置的距离
 * 正负边界范围的半径。
 * <br>
 * 如果你想象有无限个法线方向的平面，这计算出到
 * 距离与边界球相交的位置最近和最远的平面。
 *
 * @param {Cartesian3} position 要计算距离的位置。
 * @param {Cartesian3} direction 从位置的方向。
 * @param {Interval} [result] 存储最近和最远距离的间隔。
 * @returns {Interval} 从方向上的位置到边界球上最近和最远的距离。
 */
BoundingSphere.prototype.computePlaneDistances = function (
  position,
  direction,
  result
) {
  return BoundingSphere.computePlaneDistances(
    this,
    position,
    direction,
    result
  );
};

/**
 * 确定球体是否被遮挡器从视图中隐藏。
 *
 * @param {Occluder} occluder 遮光板。
 * @returns {boolean} <code>true</code>如果球体不可见;否则<code>false</code>。
 */
BoundingSphere.prototype.isOccluded = function (occluder) {
  return BoundingSphere.isOccluded(this, occluder);
};

/**
 * 比较这个BoundingSphere和提供的BoundingSphere组件并返回
 * <code>true</code>，否则为<code>false</code>。
 *
 * @param {BoundingSphere} [right] 右边 BoundingSphere.
 * @returns {boolean} <code>true</code>，否则为<code>false</code>。
 */
BoundingSphere.prototype.equals = function (right) {
  return BoundingSphere.equals(this, right);
};

/**
 * 复制BoundingSphere instance.
 *
 * @param {BoundingSphere} [result] 要在其上存储结果的对象。
 * @returns {BoundingSphere} 修改后的结果参数，如果没有提供，则为新的BoundingSphere实例。
 */
BoundingSphere.prototype.clone = function (result) {
  return BoundingSphere.clone(this, result);
};

/**
 * 计算BoundingSphere的半径。
 * @returns {number} BoundingSphere的半径。
 */
BoundingSphere.prototype.volume = function () {
  const radius = this.radius;
  return volumeConstant * radius * radius * radius;
};
export default BoundingSphere;
