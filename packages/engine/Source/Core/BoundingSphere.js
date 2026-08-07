// @ts-check

import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import Intersect from "./Intersect.js";
import Interval from "./Interval.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import Matrix4 from "./Matrix4.js";
import Rectangle from "./Rectangle.js";

/** @import {TypedArray} from "./globalTypes.js"; */
/** @import OrientedBoundingBox from "./OrientedBoundingBox.js"; */
/** @import Plane from "./Plane.js"; */
/** @import MapProjection from "./MapProjection.js"; */
/** @import Occluder from "./Occluder.js"; */

/**
 * 具有中心和半径的边界球。
 *
 * @see AxisAlignedBoundingBox
 * @see BoundingRectangle
 * @see Packable
 */
class BoundingSphere {
  /**
   * @param {Cartesian3} [center=Cartesian3.ZERO] 边界球的中心点。
   * @param {number} [radius=0.0] 边界球的半径。
   */
  constructor(center, radius) {
  /**
   * 球体的中心点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
    this.center = Cartesian3.clone(center ?? Cartesian3.ZERO);

  /**
   * 球体的半径。
   * @type {number}
   * @default 0.0
   */
    this.radius = radius ?? 0.0;
  }

  /**
   * 计算包围3D笛卡尔点列表的紧密边界球。
   * 边界球通过运行两种算法来计算：朴素算法和
   * Ritter算法。使用两个球中较小的那个以确保紧密拟合。
   *
   * @param {Cartesian3[]} [positions] 边界球将包围的点数组。每个点必须具有<code>x</code>、<code>y</code>和<code>z</code>属性。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   *
   * @see {@link http://help.agi.com/AGIComponents/html/BlogBoundingSphere.htm|边界球计算文章}
   */
  static fromPoints(positions, result) {
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
      Cartesian3.subtract(xMax, xMin, fromPointsScratch),
    );
    const ySpan = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(yMax, yMin, fromPointsScratch),
    );
    const zSpan = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(zMax, zMin, fromPointsScratch),
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
      diameter1 = zMin;
      diameter2 = zMax;
    }

    // 计算由Ritter算法找到的初始球体的中心
    const ritterCenter = fromPointsRitterCenter;
    ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
    ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
    ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

    // 计算由Ritter算法找到的初始球体的半径
    let radiusSquared = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch),
    );
    let ritterRadius = Math.sqrt(radiusSquared);

    // 使用朴素方法找到球体的中心。
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
      fromPointsNaiveCenterScratch,
    );

    // 开始第二次遍历以找到朴素半径并修改ritter球体。
    let naiveRadius = 0;
    for (i = 0; i < numPositions; i++) {
      Cartesian3.clone(positions[i], currentPos);

      // 找到距离朴素中心最远的点来计算朴素半径。
      const r = Cartesian3.magnitude(
        Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch),
      );
      if (r > naiveRadius) {
        naiveRadius = r;
      }

      // 调整Ritter球体以包含所有点。
      const oldCenterToPointSquared = Cartesian3.magnitudeSquared(
        Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch),
      );
      if (oldCenterToPointSquared > radiusSquared) {
        const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
        // 计算新半径以包含位于外部的点。
        ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
        radiusSquared = ritterRadius * ritterRadius;
        // 计算新Ritter球体的中心。
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
  }

  /**
   * 从投影到2D的矩形计算边界球。
   *
   * @param {Rectangle} [rectangle] 要创建边界球的矩形。
   * @param {MapProjection} [projection=GeographicProjection] 用于将矩形投影到2D的投影。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static fromRectangle2D(rectangle, projection, result) {
    return BoundingSphere.fromRectangleWithHeights2D(
      rectangle,
      projection,
      0.0,
      0.0,
      result,
    );
  }

  /**
   * 从投影到2D的矩形计算边界球。边界球考虑了
   * 矩形上对象的最小和最大高度。
   *
   * @param {Rectangle} [rectangle] 要创建边界球的矩形。
   * @param {MapProjection} [projection=GeographicProjection] 用于将矩形投影到2D的投影。
   * @param {number} [minimumHeight=0.0] 矩形上的最小高度。
   * @param {number} [maximumHeight=0.0] 矩形上的最大高度。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static fromRectangleWithHeights2D(
    rectangle,
    projection,
    minimumHeight,
    maximumHeight,
    result,
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
    projection = projection ?? defaultProjection;

    Rectangle.southwest(rectangle, fromRectangle2DSouthwest);
    fromRectangle2DSouthwest.height = minimumHeight;
    Rectangle.northeast(rectangle, fromRectangle2DNortheast);
    fromRectangle2DNortheast.height = maximumHeight;

    const lowerLeft = projection.project(
      fromRectangle2DSouthwest,
      fromRectangle2DLowerLeft,
    );
    const upperRight = projection.project(
      fromRectangle2DNortheast,
      fromRectangle2DUpperRight,
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
  }

  /**
   * 从3D矩形计算边界球。边界球使用椭球上并包含在矩形中的
   * 点的子采样创建。对于所有类型的椭球上的所有矩形，这可能不准确。
   *
   * @param {Rectangle} [rectangle] 用于创建边界球的有效矩形。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于确定矩形位置的椭球。
   * @param {number} [surfaceHeight=0.0] 椭球表面以上的高度。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static fromRectangle3D(rectangle, ellipsoid, surfaceHeight, result) {
    ellipsoid = ellipsoid ?? Ellipsoid.default;
    surfaceHeight = surfaceHeight ?? 0.0;

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
      fromRectangle3DScratch,
    );
    return BoundingSphere.fromPoints(positions, result);
  }

  /**
   * 计算包围3D点列表的紧密边界球，其中点以
   * X、Y、Z顺序存储在扁平数组中。边界球通过运行两种
   * 算法来计算：朴素算法和Ritter算法。使用两个球中较小的那个来
   * 确保紧密拟合。
   *
   * @param {number[]|TypedArray} [positions] 边界球将包围的点数组。每个点
   *        由数组中三个元素按X、Y、Z顺序组成。
   * @param {Cartesian3} [center=Cartesian3.ZERO] 位置相对于的参考点，不必是
   *        坐标系的原点。当位置用于
   *        相对中心（RTC）渲染时，这很有用。
   * @param {number} [stride=3] 每个顶点的数组元素数量。必须至少为3，但可以
   *        更高。无论此参数的值如何，第一个位置的X坐标
   *        位于数组索引0，Y坐标位于数组索引1，Z坐标位于数组索引
   *        2。当步幅为3时，下一个位置的X坐标从数组索引3开始。如果
   *        步幅为5，则跳过两个数组元素，下一个位置从数组
   *        索引5开始。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   *
   * @example
   * // 从3个位置计算边界球，每个位置相对于一个中心指定。
   * // 除了X、Y和Z坐标外，点数组还包含每个点额外的
   * // 两个元素，在计算边界球时会被忽略。
   * const center = new Cesium.Cartesian3(1.0, 2.0, 3.0);
   * const points = [1.0, 2.0, 3.0, 0.1, 0.2,
   *               4.0, 5.0, 6.0, 0.1, 0.2,
   *               7.0, 8.0, 9.0, 0.1, 0.2];
   * const sphere = Cesium.BoundingSphere.fromVertices(points, center, 5);
   *
   * @see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|边界球计算文章}
   */
  static fromVertices(positions, center, stride, result) {
    if (!defined(result)) {
      result = new BoundingSphere();
    }

    if (!defined(positions) || positions.length === 0) {
      result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
      result.radius = 0.0;
      return result;
    }

    center = center ?? Cartesian3.ZERO;

    stride = stride ?? 3;

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
      Cartesian3.subtract(xMax, xMin, fromPointsScratch),
    );
    const ySpan = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(yMax, yMin, fromPointsScratch),
    );
    const zSpan = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(zMax, zMin, fromPointsScratch),
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
      diameter1 = zMin;
      diameter2 = zMax;
    }

    // 计算由Ritter算法找到的初始球体的中心
    const ritterCenter = fromPointsRitterCenter;
    ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
    ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
    ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

    // 计算由Ritter算法找到的初始球体的半径
    let radiusSquared = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch),
    );
    let ritterRadius = Math.sqrt(radiusSquared);

    // 使用朴素方法找到球体的中心。
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
      fromPointsNaiveCenterScratch,
    );

    // 开始第二次遍历以找到朴素半径并修改ritter球体。
    let naiveRadius = 0;
    for (i = 0; i < numElements; i += stride) {
      currentPos.x = positions[i] + center.x;
      currentPos.y = positions[i + 1] + center.y;
      currentPos.z = positions[i + 2] + center.z;

      // 找到距离朴素中心最远的点来计算朴素半径。
      const r = Cartesian3.magnitude(
        Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch),
      );
      if (r > naiveRadius) {
        naiveRadius = r;
      }

      // 调整Ritter球体以包含所有点。
      const oldCenterToPointSquared = Cartesian3.magnitudeSquared(
        Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch),
      );
      if (oldCenterToPointSquared > radiusSquared) {
        const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
        // 计算新半径以包含位于外部的点。
        ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
        radiusSquared = ritterRadius * ritterRadius;
        // 计算新Ritter球体的中心。
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
  }

  /**
   * 计算包围EncodedCartesian3列表的紧密边界球，其中点
   * 以X、Y、Z顺序存储在并行扁平数组中。边界球通过运行两种
   * 算法来计算：朴素算法和Ritter算法。使用两个球中较小的那个来
   * 确保紧密拟合。
   *
   * @param {number[]} [positionsHigh] 边界球将包围的编码笛卡尔坐标高位位数组。每个点
   *        由数组中三个元素按X、Y、Z顺序组成。
   * @param {number[]} [positionsLow] 边界球将包围的编码笛卡尔坐标低位位数组。每个点
   *        由数组中三个元素按X、Y、Z顺序组成。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   *
   * @see {@link http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/|边界球计算文章}
   */
  static fromEncodedCartesianVertices(positionsHigh, positionsLow, result) {
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
      Cartesian3.subtract(xMax, xMin, fromPointsScratch),
    );
    const ySpan = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(yMax, yMin, fromPointsScratch),
    );
    const zSpan = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(zMax, zMin, fromPointsScratch),
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
      diameter1 = zMin;
      diameter2 = zMax;
    }

    // 计算由Ritter算法找到的初始球体的中心
    const ritterCenter = fromPointsRitterCenter;
    ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
    ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
    ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

    // 计算由Ritter算法找到的初始球体的半径
    let radiusSquared = Cartesian3.magnitudeSquared(
      Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch),
    );
    let ritterRadius = Math.sqrt(radiusSquared);

    // 使用朴素方法找到球体的中心。
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
      fromPointsNaiveCenterScratch,
    );

    // 开始第二次遍历以找到朴素半径并修改ritter球体。
    let naiveRadius = 0;
    for (i = 0; i < numElements; i += 3) {
      currentPos.x = positionsHigh[i] + positionsLow[i];
      currentPos.y = positionsHigh[i + 1] + positionsLow[i + 1];
      currentPos.z = positionsHigh[i + 2] + positionsLow[i + 2];

      // 找到距离朴素中心最远的点来计算朴素半径。
      const r = Cartesian3.magnitude(
        Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch),
      );
      if (r > naiveRadius) {
        naiveRadius = r;
      }

      // 调整Ritter球体以包含所有点。
      const oldCenterToPointSquared = Cartesian3.magnitudeSquared(
        Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch),
      );
      if (oldCenterToPointSquared > radiusSquared) {
        const oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
        // 计算新半径以包含位于外部的点。
        ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
        radiusSquared = ritterRadius * ritterRadius;
        // 计算新Ritter球体的中心。
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
  }

  /**
   * 从轴对齐边界框的角点计算边界球。该球
   * 紧密且完全包围该框。
   *
   * @param {Cartesian3} [corner] 矩形上的最小高度。
   * @param {Cartesian3} [oppositeCorner] 矩形上的最大高度。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   *
   * @example
   * // 在单位立方体周围创建边界球
   * const sphere = Cesium.BoundingSphere.fromCornerPoints(new Cesium.Cartesian3(-0.5, -0.5, -0.5), new Cesium.Cartesian3(0.5, 0.5, 0.5));
   */
  static fromCornerPoints(corner, oppositeCorner, result) {
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
  }

  /**
   * 创建包围椭球的边界球。
   *
   * @param {Ellipsoid} ellipsoid 要创建边界球的椭球。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   *
   * @example
   * const boundingSphere = Cesium.BoundingSphere.fromEllipsoid(ellipsoid);
   */
  static fromEllipsoid(ellipsoid, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("ellipsoid", ellipsoid);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new BoundingSphere();
    }

    Cartesian3.clone(Cartesian3.ZERO, result.center);
    result.radius = ellipsoid.maximumRadius;
    return result;
  }

  /**
   * 计算包围提供的边界球数组的紧密边界球。
   *
   * @param {BoundingSphere[]} [boundingSpheres] 边界球数组。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static fromBoundingSpheres(boundingSpheres, result) {
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
      return BoundingSphere.union(
        boundingSpheres[0],
        boundingSpheres[1],
        result,
      );
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
        Cartesian3.distance(center, tmp.center) + tmp.radius,
      );
    }
    result.radius = radius;

    return result;
  }

  /**
   * 计算包围提供的定向边界框的紧密边界球。
   *
   * @param {OrientedBoundingBox} orientedBoundingBox 定向边界框。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static fromOrientedBoundingBox(orientedBoundingBox, result) {
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
  }

  /**
   * 计算包围提供的仿射变换的紧密边界球。
   *
   * @param {Matrix4} transformation 仿射变换。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static fromTransformation(transformation, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("transformation", transformation);
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new BoundingSphere();
    }

    const center = Matrix4.getTranslation(
      transformation,
      scratchFromTransformationCenter,
    );
    const scale = Matrix4.getScale(
      transformation,
      scratchFromTransformationScale,
    );
    const radius = 0.5 * Cartesian3.magnitude(scale);
    result.center = Cartesian3.clone(center, result.center);
    result.radius = radius;

    return result;
  }

  /**
   * 复制BoundingSphere实例。
   *
   * @param {BoundingSphere} sphere 要复制的边界球。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。（如果sphere未定义则返回undefined）
   */
  static clone(sphere, result) {
    if (!defined(sphere)) {
      return undefined;
    }

    if (!defined(result)) {
      return new BoundingSphere(sphere.center, sphere.radius);
    }

    result.center = Cartesian3.clone(sphere.center, result.center);
    result.radius = sphere.radius;
    return result;
  }

  /**
   * 将提供的实例存储到提供的数组中。
   *
   * @param {BoundingSphere} value 要打包的值。
   * @param {number[]} array 要打包到的数组。
   * @param {number} [startingIndex=0] 开始打包元素的数组索引。
   *
   * @returns {number[]} 已打包的数组
   */
  static pack(value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("value", value);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    const center = value.center;
    array[startingIndex++] = center.x;
    array[startingIndex++] = center.y;
    array[startingIndex++] = center.z;
    array[startingIndex] = value.radius;

    return array;
  }

  /**
   * 从打包数组中检索实例。
   *
   * @param {number[]} array 打包数组。
   * @param {number} [startingIndex=0] 要解包元素的起始索引。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static unpack(array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined("array", array);
    //>>includeEnd('debug');

    startingIndex = startingIndex ?? 0;

    if (!defined(result)) {
      result = new BoundingSphere();
    }

    const center = result.center;
    center.x = array[startingIndex++];
    center.y = array[startingIndex++];
    center.z = array[startingIndex++];
    result.radius = array[startingIndex];
    return result;
  }

  /**
   * 计算同时包含左右边界球的边界球。
   *
   * @param {BoundingSphere} left 要包含在边界球中的球。
   * @param {BoundingSphere} right 要包含在边界球中的球。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static union(left, right, result) {
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
      unionScratch,
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
      unionScratchCenter,
    );
    Cartesian3.add(center, leftCenter, center);
    Cartesian3.clone(center, result.center);
    result.radius = halfDistanceBetweenTangentPoints;

    return result;
  }

  /**
   * 通过扩大提供的球以包含提供的点来计算边界球。
   *
   * @param {BoundingSphere} sphere 要扩展的球。
   * @param {Cartesian3} point 要包含在边界球中的点。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static expand(sphere, point, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("sphere", sphere);
    Check.typeOf.object("point", point);
    //>>includeEnd('debug');

    result = BoundingSphere.clone(sphere, result);

    const radius = Cartesian3.magnitude(
      Cartesian3.subtract(point, result.center, expandScratch),
    );
    if (radius > result.radius) {
      result.radius = radius;
    }

    return result;
  }

  /**
   * 确定球位于平面的哪一侧。
   *
   * @param {BoundingSphere} sphere 要测试的边界球。
   * @param {Plane} plane 要测试的平面。
   * @returns {Intersect} 如果整个球位于法线指向的平面一侧则返回{@link Intersect.INSIDE}，
   *                      如果整个球位于相反一侧则返回{@link Intersect.OUTSIDE}，
   *                      如果球与平面相交则返回{@link Intersect.INTERSECTING}。
   */
  static intersectPlane(sphere, plane) {
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
  }

  /**
   * 将4x4仿射变换矩阵应用于边界球。
   *
   * @param {BoundingSphere} sphere 要应用变换的边界球。
   * @param {Matrix4} transform 要应用于边界球的变换矩阵。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static transform(sphere, transform, result) {
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
      result.center,
    );
    result.radius = Matrix4.getMaximumScale(transform) * sphere.radius;

    return result;
  }

  /**
   * 计算从边界球上最近点到某点的估计距离的平方。
   *
   * @param {BoundingSphere} sphere 球体。
   * @param {Cartesian3} cartesian 该点
   * @returns {number} 从边界球到该点的距离平方。如果该点在球内则返回0。
   *
   * @example
   * // 从后到前对边界球排序
   * spheres.sort(function(a, b) {
   *     return Cesium.BoundingSphere.distanceSquaredTo(b, camera.positionWC) - Cesium.BoundingSphere.distanceSquaredTo(a, camera.positionWC);
   * });
   */
  static distanceSquaredTo(sphere, cartesian) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("sphere", sphere);
    Check.typeOf.object("cartesian", cartesian);
    //>>includeEnd('debug');

    const diff = Cartesian3.subtract(
      sphere.center,
      cartesian,
      distanceSquaredToScratch,
    );

    const distance = Cartesian3.magnitude(diff) - sphere.radius;
    if (distance <= 0.0) {
      return 0.0;
    }

    return distance * distance;
  }

  /**
   * 将4x4仿射变换矩阵应用于没有缩放的边界球。
   * 变换矩阵未经验证是否具有统一的1倍缩放。
   * 此方法比使用{@link BoundingSphere.transform}计算通用边界球变换更快。
   *
   * @param {BoundingSphere} sphere 要应用变换的边界球。
   * @param {Matrix4} transform 要应用于边界球的变换矩阵。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   *
   * @example
   * const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid);
   * const boundingSphere = new Cesium.BoundingSphere();
   * const newBoundingSphere = Cesium.BoundingSphere.transformWithoutScale(boundingSphere, modelMatrix);
   */
  static transformWithoutScale(sphere, transform, result) {
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
      result.center,
    );
    result.radius = sphere.radius;

    return result;
  }

  /**
   * 通过从边界球中心到位置的向量投影到方向计算的距离，
   * 加上/减去边界球的半径。
   * <br>
   * 如果想象无限多个具有法线方向的平面，这将计算从位置到
   * 与边界球相交的最近和最远平面的最小距离。
   *
   * @param {BoundingSphere} sphere 要计算距离的边界球。
   * @param {Cartesian3} position 要计算距离的位置。
   * @param {Cartesian3} direction 从位置出发的方向。
   * @param {Interval} [result] 用于存储最近和最远距离的Interval。
   * @returns {Interval} 从位置沿方向到边界球的最近和最远距离。
   */
  static computePlaneDistances(sphere, position, direction, result) {
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
      scratchCartesian3,
    );
    const mag = Cartesian3.dot(direction, toCenter);

    result.start = mag - sphere.radius;
    result.stop = mag + sphere.radius;
    return result;
  }

  /**
   * 从3D世界坐标中的边界球创建2D边界球。
   *
   * @param {BoundingSphere} sphere 要转换到2D的边界球。
   * @param {MapProjection} [projection=GeographicProjection] 到2D的投影。
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  static projectTo2D(sphere, projection, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("sphere", sphere);
    //>>includeEnd('debug');

    projectTo2DProjection._ellipsoid = Ellipsoid.default;
    projection = projection ?? projectTo2DProjection;

    const ellipsoid = projection.ellipsoid;
    let center = sphere.center;
    const radius = sphere.radius;

    let normal;
    if (Cartesian3.equals(center, Cartesian3.ZERO)) {
      // Bounding sphere is at the center. The geodetic surface normal is not
      // defined here so pick the x-axis as a fallback.
      normal = Cartesian3.clone(Cartesian3.UNIT_X, projectTo2DNormalScratch);
    } else {
      normal = ellipsoid.geodeticSurfaceNormal(
        center,
        projectTo2DNormalScratch,
      );
    }
    const east = Cartesian3.cross(
      Cartesian3.UNIT_Z,
      normal,
      projectTo2DEastScratch,
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
        projectTo2DCartographicScratch,
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
  }

  /**
   * 确定球是否被遮挡物遮挡而不可见。
   *
   * @param {BoundingSphere} sphere 包围被遮挡对象的边界球。
   * @param {Occluder} occluder 遮挡物。
   * @returns {boolean} 如果球不可见则返回<code>true</code>；否则返回<code>false</code>。
   */
  static isOccluded(sphere, occluder) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object("sphere", sphere);
    Check.typeOf.object("occluder", occluder);
    //>>includeEnd('debug');
    return !occluder.isBoundingSphereVisible(sphere);
  }

  /**
   * 逐组件比较提供的BoundingSphere，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {BoundingSphere} [left] 第一个BoundingSphere。
   * @param {BoundingSphere} [right] 第二个BoundingSphere。
   * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Cartesian3.equals(left.center, right.center) &&
        left.radius === right.radius)
    );
  }

  /**
   * 确定球位于平面的哪一侧。
   *
   * @param {Plane} plane 要测试的平面。
   * @returns {Intersect} 如果整个球位于法线指向的平面一侧则返回{@link Intersect.INSIDE}，
   *                      如果整个球位于相反一侧则返回{@link Intersect.OUTSIDE}，
   *                      如果球与平面相交则返回{@link Intersect.INTERSECTING}。
   */
  intersectPlane(plane) {
    return BoundingSphere.intersectPlane(this, plane);
  }

  /**
   * 计算从边界球上最近点到某点的估计距离的平方。
   *
   * @param {Cartesian3} cartesian 该点
   * @returns {number} 从边界球到该点的估计距离平方。
   *
   * @example
   * // 从后到前对边界球排序
   * spheres.sort(function(a, b) {
   *     return b.distanceSquaredTo(camera.positionWC) - a.distanceSquaredTo(camera.positionWC);
   * });
   */
  distanceSquaredTo(cartesian) {
    return BoundingSphere.distanceSquaredTo(this, cartesian);
  }

  /**
   * 通过从边界球中心到位置的向量投影到方向计算的距离，
   * 加上/减去边界球的半径。
   * <br>
   * 如果想象无限多个具有法线方向的平面，这将计算从位置到
   * 与边界球相交的最近和最远平面的最小距离。
   *
   * @param {Cartesian3} position 要计算距离的位置。
   * @param {Cartesian3} direction 从位置出发的方向。
   * @param {Interval} [result] 用于存储最近和最远距离的Interval。
   * @returns {Interval} 从位置沿方向到边界球的最近和最远距离。
   */
  computePlaneDistances(position, direction, result) {
    return BoundingSphere.computePlaneDistances(
      this,
      position,
      direction,
      result,
    );
  }

  /**
   * 确定球是否被遮挡物遮挡而不可见。
   *
   * @param {Occluder} occluder 遮挡物。
   * @returns {boolean} 如果球不可见则返回<code>true</code>；否则返回<code>false</code>。
   */
  isOccluded(occluder) {
    return BoundingSphere.isOccluded(this, occluder);
  }

  /**
   * 逐组件将此BoundingSphere与提供的BoundingSphere进行比较，如果相等则返回
   * <code>true</code>，否则返回<code>false</code>。
   *
   * @param {BoundingSphere} [right] 右侧的BoundingSphere。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(right) {
    return BoundingSphere.equals(this, right);
  }

  /**
   * 复制此BoundingSphere实例。
   *
   * @param {BoundingSphere} [result] 存储结果的对象。
   * @returns {BoundingSphere} 修改后的结果参数；如果未提供则返回新的BoundingSphere实例。
   */
  clone(result) {
    return BoundingSphere.clone(this, result);
  }

  /**
   * 计算BoundingSphere的半径。
   * @returns {number} BoundingSphere的半径。
   */
  volume() {
    const radius = this.radius;
    return volumeConstant * radius * radius * radius;
  }
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
BoundingSphere.packedLength = 4;

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

const defaultProjection = new GeographicProjection();
const fromRectangle2DLowerLeft = new Cartesian3();
const fromRectangle2DUpperRight = new Cartesian3();
const fromRectangle2DSouthwest = new Cartographic();
const fromRectangle2DNortheast = new Cartographic();

const fromRectangle3DScratch = /** @type {Cartesian3[]} */ ([]);

const fromOrientedBoundingBoxScratchU = new Cartesian3();
const fromOrientedBoundingBoxScratchV = new Cartesian3();
const fromOrientedBoundingBoxScratchW = new Cartesian3();

const scratchFromTransformationCenter = new Cartesian3();
const scratchFromTransformationScale = new Cartesian3();

const unionScratch = new Cartesian3();
const unionScratchCenter = new Cartesian3();

const expandScratch = new Cartesian3();

const distanceSquaredToScratch = new Cartesian3();

const scratchCartesian3 = new Cartesian3();

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
export default BoundingSphere;
