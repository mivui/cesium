import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import Intersect from "./Intersect.js";

/**
 * 从沿x、y和z轴的最小点和最大点创建AxisAlignedBoundingBox实例。
 * @alias AxisAlignedBoundingBox
 * @constructor
 *
 * @param {Cartesian3} [minimum=Cartesian3.ZERO] 沿x、y和z轴的最小点。
 * @param {Cartesian3} [maximum=Cartesian3.ZERO] 沿x、y和z轴的最大点。
 * @param {Cartesian3} [center] 边界框的中心；如果未提供则自动计算。
 *
 * @see BoundingSphere
 * @see BoundingRectangle
 */
function AxisAlignedBoundingBox(minimum, maximum, center) {
  /**
   * 定义边界框的最小点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.minimum = Cartesian3.clone(minimum ?? Cartesian3.ZERO);

  /**
   * 定义边界框的最大点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.maximum = Cartesian3.clone(maximum ?? Cartesian3.ZERO);

  // If center was not defined, compute it.
  if (!defined(center)) {
    center = Cartesian3.midpoint(this.minimum, this.maximum, new Cartesian3());
  } else {
    center = Cartesian3.clone(center);
  }

  /**
   * 边界框的中心点。
   * @type {Cartesian3}
   */
  this.center = center;
}

/**
 * 从其角点创建AxisAlignedBoundingBox实例。
 *
 * @param {Cartesian3} minimum 沿x、y和z轴的最小点。
 * @param {Cartesian3} maximum 沿x、y和z轴的最大点。
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数；如果未提供则返回新的AxisAlignedBoundingBox实例。
 *
 * @example
 * // 从两个角点计算轴对齐边界框。
 * const box = Cesium.AxisAlignedBoundingBox.fromCorners(new Cesium.Cartesian3(-1, -1, -1), new Cesium.Cartesian3(1, 1, 1));
 */
AxisAlignedBoundingBox.fromCorners = function (minimum, maximum, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("minimum", minimum);
  Check.defined("maximum", maximum);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new AxisAlignedBoundingBox();
  }

  result.minimum = Cartesian3.clone(minimum, result.minimum);
  result.maximum = Cartesian3.clone(maximum, result.maximum);
  result.center = Cartesian3.midpoint(minimum, maximum, result.center);

  return result;
};

/**
 * 计算一个AxisAlignedBoundingBox实例。通过查找在x、y和z轴上相距最远的点来确定边界框。
 *
 * @param {Cartesian3[]} positions 边界框将包围的点列表。每个点必须具有<code>x</code>、<code>y</code>和<code>z</code>属性。
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数；如果未提供则返回新的AxisAlignedBoundingBox实例。
 *
 * @example
 * // 计算包围两个点的轴对齐边界框。
 * const box = Cesium.AxisAlignedBoundingBox.fromPoints([new Cesium.Cartesian3(2, 0, 0), new Cesium.Cartesian3(-2, 0, 0)]);
 */
AxisAlignedBoundingBox.fromPoints = function (positions, result) {
  if (!defined(result)) {
    result = new AxisAlignedBoundingBox();
  }

  if (!defined(positions) || positions.length === 0) {
    result.minimum = Cartesian3.clone(Cartesian3.ZERO, result.minimum);
    result.maximum = Cartesian3.clone(Cartesian3.ZERO, result.maximum);
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    return result;
  }

  let minimumX = positions[0].x;
  let minimumY = positions[0].y;
  let minimumZ = positions[0].z;

  let maximumX = positions[0].x;
  let maximumY = positions[0].y;
  let maximumZ = positions[0].z;

  const length = positions.length;
  for (let i = 1; i < length; i++) {
    const p = positions[i];
    const x = p.x;
    const y = p.y;
    const z = p.z;

    minimumX = Math.min(x, minimumX);
    maximumX = Math.max(x, maximumX);
    minimumY = Math.min(y, minimumY);
    maximumY = Math.max(y, maximumY);
    minimumZ = Math.min(z, minimumZ);
    maximumZ = Math.max(z, maximumZ);
  }

  const minimum = result.minimum;
  minimum.x = minimumX;
  minimum.y = minimumY;
  minimum.z = minimumZ;

  const maximum = result.maximum;
  maximum.x = maximumX;
  maximum.y = maximumY;
  maximum.z = maximumZ;

  result.center = Cartesian3.midpoint(minimum, maximum, result.center);

  return result;
};

/**
 * 复制一个AxisAlignedBoundingBox实例。
 *
 * @param {AxisAlignedBoundingBox} box 要复制的边界框。
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数；如果未提供则返回新的AxisAlignedBoundingBox实例。（如果box未定义则返回undefined）
 */
AxisAlignedBoundingBox.clone = function (box, result) {
  if (!defined(box)) {
    return undefined;
  }

  if (!defined(result)) {
    return new AxisAlignedBoundingBox(box.minimum, box.maximum, box.center);
  }

  result.minimum = Cartesian3.clone(box.minimum, result.minimum);
  result.maximum = Cartesian3.clone(box.maximum, result.maximum);
  result.center = Cartesian3.clone(box.center, result.center);
  return result;
};

/**
 * 逐组件比较提供的AxisAlignedBoundingBox，如果相等则返回
 * <code>true</code>，否则返回<code>false</code>。
 *
 * @param {AxisAlignedBoundingBox} [left] 第一个AxisAlignedBoundingBox。
 * @param {AxisAlignedBoundingBox} [right] 第二个AxisAlignedBoundingBox。
 * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
 */
AxisAlignedBoundingBox.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Cartesian3.equals(left.center, right.center) &&
      Cartesian3.equals(left.minimum, right.minimum) &&
      Cartesian3.equals(left.maximum, right.maximum))
  );
};

let intersectScratch = new Cartesian3();
/**
 * 确定边界框位于平面的哪一侧。
 *
 * @param {AxisAlignedBoundingBox} box 要测试的边界框。
 * @param {Plane} plane 要测试的平面。
 * @returns {Intersect} 如果整个边界框位于法线指向的平面一侧则返回{@link Intersect.INSIDE}，
 *                      如果整个边界框位于相反一侧则返回{@link Intersect.OUTSIDE}，
 *                      如果边界框与平面相交则返回{@link Intersect.INTERSECTING}。
 */
AxisAlignedBoundingBox.intersectPlane = function (box, plane) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("box", box);
  Check.defined("plane", plane);
  //>>includeEnd('debug');

  intersectScratch = Cartesian3.subtract(
    box.maximum,
    box.minimum,
    intersectScratch,
  );
  const h = Cartesian3.multiplyByScalar(
    intersectScratch,
    0.5,
    intersectScratch,
  ); //The positive half diagonal
  const normal = plane.normal;
  const e =
    h.x * Math.abs(normal.x) +
    h.y * Math.abs(normal.y) +
    h.z * Math.abs(normal.z);
  const s = Cartesian3.dot(box.center, normal) + plane.distance; //signed distance from center

  if (s - e > 0) {
    return Intersect.INSIDE;
  }

  if (s + e < 0) {
    //Not in front because normals point inward
    return Intersect.OUTSIDE;
  }

  return Intersect.INTERSECTING;
};

/**
 * 确定两个轴对齐边界框是否相交。
 *
 * @param {AxisAlignedBoundingBox} box 第一个边界框
 * @param {AxisAlignedBoundingBox} other 第二个边界框
 * @returns {boolean} 如果边界框相交则返回<code>true</code>，否则返回<code>false</code>。
 */
AxisAlignedBoundingBox.intersectAxisAlignedBoundingBox = function (box, other) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("box", box);
  Check.defined("other", other);
  //>>includeEnd('debug');

  // This short circuits in favor of AABBs that do not intersect.
  return (
    box.minimum.x <= other.maximum.x &&
    box.maximum.x >= other.minimum.x &&
    box.minimum.y <= other.maximum.y &&
    box.maximum.y >= other.minimum.y &&
    box.minimum.z <= other.maximum.z &&
    box.maximum.z >= other.minimum.z
  );
};

/**
 * 复制此AxisAlignedBoundingBox实例。
 *
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数；如果未提供则返回新的AxisAlignedBoundingBox实例。
 */
AxisAlignedBoundingBox.prototype.clone = function (result) {
  return AxisAlignedBoundingBox.clone(this, result);
};

/**
 * 确定此边界框位于平面的哪一侧。
 *
 * @param {Plane} plane 要测试的平面。
 * @returns {Intersect} 如果整个边界框位于法线指向的平面一侧则返回{@link Intersect.INSIDE}，
 *                      如果整个边界框位于相反一侧则返回{@link Intersect.OUTSIDE}，
 *                      如果边界框与平面相交则返回{@link Intersect.INTERSECTING}。
 */
AxisAlignedBoundingBox.prototype.intersectPlane = function (plane) {
  return AxisAlignedBoundingBox.intersectPlane(this, plane);
};

/**
 * 确定其他轴对齐边界框是否与此边界框相交。
 *
 * @param {AxisAlignedBoundingBox} other 其他轴对齐边界框。
 * @returns {boolean} 如果边界框相交则返回<code>true</code>，否则返回<code>false</code>。
 */
AxisAlignedBoundingBox.prototype.intersectAxisAlignedBoundingBox = function (
  other,
) {
  return AxisAlignedBoundingBox.intersectAxisAlignedBoundingBox(this, other);
};

/**
 * 逐组件将此AxisAlignedBoundingBox与提供的AxisAlignedBoundingBox进行比较，如果相等则返回
 * <code>true</code>，否则返回<code>false</code>。
 *
 * @param {AxisAlignedBoundingBox} [right] 右侧的AxisAlignedBoundingBox。
 * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
 */
AxisAlignedBoundingBox.prototype.equals = function (right) {
  return AxisAlignedBoundingBox.equals(this, right);
};
export default AxisAlignedBoundingBox;
