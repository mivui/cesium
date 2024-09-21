import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Intersect from "./Intersect.js";

/**
 * 从沿x、y和z轴的最小点和最大值创建axisalignedbboundingbox实例。
 * @alias AxisAlignedBoundingBox
 * @constructor
 *
 * @param {Cartesian3} [minimum=Cartesian3.ZERO] 沿着x, y, z轴的最小值点。
 * @param {Cartesian3} [maximum=Cartesian3.ZERO] x, y, z轴上的最大值。
 * @param {Cartesian3} [center] 盒子的中心;如果没有提供，自动计算。
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
  this.minimum = Cartesian3.clone(defaultValue(minimum, Cartesian3.ZERO));

  /**
   * 定义边界框的最大值。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.maximum = Cartesian3.clone(defaultValue(maximum, Cartesian3.ZERO));

  // If center was not defined, compute it.
  if (!defined(center)) {
    center = Cartesian3.midpoint(this.minimum, this.maximum, new Cartesian3());
  } else {
    center = Cartesian3.clone(center);
  }

  /**
   * 篮板的中心点。
   * @type {Cartesian3}
   */
  this.center = center;
}

/**
 * 从其角创建AxisAlignedBoundingBox的实例。
 *
 * @param {Cartesian3} minimum 沿着x, y, z轴的最小值点。
 * @param {Cartesian3} maximum x, y, z轴上的最大值。
 * @param {AxisAlignedBoundingBox} [result] 要在其上存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数或新的AxisAlignedBoundingBox实例(如果没有提供)。
 *
 * @example
 * // Compute an axis aligned bounding box from the two corners.
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
 * 计算AxisAlignedBoundingBox的实例。盒子是由
 * 找出x, y, z轴上距离最远的点。
 *
 * @param {Cartesian3[]} positions 边界框将包围的点列表。每个点必须有一个<code>x</code>、<code>y</code>和<code>z</code>属性。
 * @param {AxisAlignedBoundingBox} [result] 要在其上存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数或新的AxisAlignedBoundingBox实例(如果没有提供)。
 *
 * @example
 * // Compute an axis aligned bounding box enclosing two points.
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
 *  复制AxisAlignedBoundingBox实例。
 *
 * @param {AxisAlignedBoundingBox} box The bounding box to duplicate.
 * @param {AxisAlignedBoundingBox} [result] 要在其上存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数，如果没有提供，则为新的AxisAlignedBoundingBox实例。(如果box未定义则返回未定义)
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
 * 比较提供的AxisAlignedBoundingBox组件和返回
 * <code>为true</code>，否则为false</code>。
 *
 * @param {AxisAlignedBoundingBox} [left] 第一个AxisAlignedBoundingBox.
 * @param {AxisAlignedBoundingBox} [right] 第二个 AxisAlignedBoundingBox.
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
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
 * 确定盒子位于平面的哪一侧。
 *
 * @param {AxisAlignedBoundingBox} box 要测试的边界框。
 * @param {Plane} plane 要测试的飞机。
 * @returns {Intersect} {@link Intersect.INSIDE} 如果整个盒子都在飞机的一侧
 *                      法线指向， {@link Intersect.OUTSIDE} 如果整个盒子
 *                      在反面， 和 {@link Intersect.INTERSECTING} 如果盒子
 *                      与平面相交
 */
AxisAlignedBoundingBox.intersectPlane = function (box, plane) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("box", box);
  Check.defined("plane", plane);
  //>>includeEnd('debug');

  intersectScratch = Cartesian3.subtract(
    box.maximum,
    box.minimum,
    intersectScratch
  );
  const h = Cartesian3.multiplyByScalar(
    intersectScratch,
    0.5,
    intersectScratch
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
 * 复制AxisAlignedBoundingBox instance.
 *
 * @param {AxisAlignedBoundingBox} [result] 要在其上存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的结果参数或新的AxisAlignedBoundingBox实例(如果没有提供)。
 */
AxisAlignedBoundingBox.prototype.clone = function (result) {
  return AxisAlignedBoundingBox.clone(this, result);
};

/**
 * 确定此框位于平面的哪一侧。
 *
 * @param {Plane} plane 要测试的飞机。
 * @returns {Intersect} {@link Intersect.INSIDE}如果整个盒子都在飞机的一侧
 *                      法线指向， {@link Intersect.OUTSIDE} 如果整个盒子
 *                      在反面， 和 {@link Intersect.INTERSECTING} 如果盒子
 *                      与平面相交。
 */
AxisAlignedBoundingBox.prototype.intersectPlane = function (plane) {
  return AxisAlignedBoundingBox.intersectPlane(this, plane);
};

/**
 * 将此AxisAlignedBoundingBox与提供的AxisAlignedBoundingBox组件进行比较并返回
 * <code>为true</code>，否则为false</code>。
 *
 * @param {AxisAlignedBoundingBox} [right] 右边 AxisAlignedBoundingBox.
 * @returns {boolean} <code>为true</code>，否则为false</code>。
 */
AxisAlignedBoundingBox.prototype.equals = function (right) {
  return AxisAlignedBoundingBox.equals(this, right);
};
export default AxisAlignedBoundingBox;
