import Check from "../Core/Check.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";

/**
 * 描述 x、y 和 z 轴及辅助转换函数的枚举。
 *
 * @enum {number}
 */
const Axis = {
   /**
    * 表示 x 轴。
    *
    * @type {number}
    * @constant
    */
  X: 0,

   /**
    * 表示 y 轴。
    *
    * @type {number}
    * @constant
    */
  Y: 1,

   /**
    * 表示 z 轴。
    *
    * @type {number}
    * @constant
    */
  Z: 2,
};

/**
 * 用于从 y-up 转换为 z-up 的矩阵
 *
 * @type {Matrix4}
 * @constant
 */
Axis.Y_UP_TO_Z_UP = Matrix4.fromRotationTranslation(
  // Rotation about PI/2 around the X-axis
  Matrix3.fromArray([1, 0, 0, 0, 0, 1, 0, -1, 0]),
);

/**
 * 用于从 z-up 转换为 y-up 的矩阵
 *
 * @type {Matrix4}
 * @constant
 */
Axis.Z_UP_TO_Y_UP = Matrix4.fromRotationTranslation(
  // Rotation about -PI/2 around the X-axis
  Matrix3.fromArray([1, 0, 0, 0, 0, -1, 0, 1, 0]),
);

/**
 * 用于从 x-up 转换为 z-up 的矩阵
 *
 * @type {Matrix4}
 * @constant
 */
Axis.X_UP_TO_Z_UP = Matrix4.fromRotationTranslation(
  // Rotation about -PI/2 around the Y-axis
  Matrix3.fromArray([0, 0, 1, 0, 1, 0, -1, 0, 0]),
);

/**
 * 用于从 z-up 转换为 x-up 的矩阵
 *
 * @type {Matrix4}
 * @constant
 */
Axis.Z_UP_TO_X_UP = Matrix4.fromRotationTranslation(
  // Rotation about PI/2 around the Y-axis
  Matrix3.fromArray([0, 0, -1, 0, 1, 0, 1, 0, 0]),
);

/**
 * 用于从 x-up 转换为 y-up 的矩阵
 *
 * @type {Matrix4}
 * @constant
 */
Axis.X_UP_TO_Y_UP = Matrix4.fromRotationTranslation(
  // Rotation about PI/2 around the Z-axis
  Matrix3.fromArray([0, 1, 0, -1, 0, 0, 0, 0, 1]),
);

/**
 * 用于从 y-up 转换为 x-up 的矩阵
 *
 * @type {Matrix4}
 * @constant
 */
Axis.Y_UP_TO_X_UP = Matrix4.fromRotationTranslation(
  // Rotation about -PI/2 around the Z-axis
  Matrix3.fromArray([0, -1, 0, 1, 0, 0, 0, 0, 1]),
);

/**
 * 通过名称获取轴
 *
 * @param {string} name 轴的名称。
 * @returns {number} 轴枚举。
 */
Axis.fromName = function (name) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("name", name);
  //>>includeEnd('debug');

  return Axis[name];
};

Object.freeze(Axis);

export default Axis;
