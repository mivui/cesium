import ArcType from "../Core/ArcType.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import Matrix4 from "../Core/Matrix4.js";
import PolylineGeometry from "../Core/PolylineGeometry.js";
import PolylineColorAppearance from "./PolylineColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * 绘制由转换为 world 的矩阵定义的参考系的轴
 * 坐标，即地球的 WGS84 坐标。 最突出的例子是
 * 一个基元 <code>modelMatrix</code>。
 * <p>
 * X 轴为红色;Y 为绿色;Z 为蓝色。
 * </p>
 * <p>
 * 这仅用于调试;它未针对生产使用进行优化。
 * </p>
 *
 * @alias DebugModelMatrixPrimitive
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {number} [options.length=10000000.0] 轴的长度，以米为单位。
 * @param {number} [options.width=2.0] 宽度轴（以像素为单位）。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 定义要可视化的参考系（即原点加轴）的 4x4 矩阵。
 * @param {boolean} [options.show=true] 决定是否显示此基元。
 * @param {object} [options.id] 使用 {@link Scene#pick} 选取实例时返回的用户定义对象
 *
 * @example
 * primitives.add(new Cesium.DebugModelMatrixPrimitive({
 *   modelMatrix : primitive.modelMatrix,  // primitive to debug
 *   length : 100000.0,
 *   width : 10.0
 * }));
 */
function DebugModelMatrixPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 轴的长度（以米为单位）。
   *
   * @type {number}
   * @default 10000000.0
   */
  this.length = defaultValue(options.length, 10000000.0);
  this._length = undefined;

  /**
   * 轴的宽度（以像素为单位）。
   *
   * @type {number}
   * @default 2.0
   */
  this.width = defaultValue(options.width, 2.0);
  this._width = undefined;

  /**
   * 确定是否显示此基元。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 定义要可视化的参考帧（即原点加轴）的 4x4 矩阵。
   *
   * @type {Matrix4}
   * @default {@link Matrix4.IDENTITY}
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );
  this._modelMatrix = new Matrix4();

  /**
   * 选取基元时返回的 User-defined 值。
   *
   * @type {*}
   * @default undefined
   *
   * @see Scene#pick
   */
  this.id = options.id;
  this._id = undefined;

  this._primitive = undefined;
}

/**
 * @private
 */
DebugModelMatrixPrimitive.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  if (
    !defined(this._primitive) ||
    !Matrix4.equals(this._modelMatrix, this.modelMatrix) ||
    this._length !== this.length ||
    this._width !== this.width ||
    this._id !== this.id
  ) {
    this._modelMatrix = Matrix4.clone(this.modelMatrix, this._modelMatrix);
    this._length = this.length;
    this._width = this.width;
    this._id = this.id;

    if (defined(this._primitive)) {
      this._primitive.destroy();
    }

    // Workaround projecting (0, 0, 0)
    if (
      this.modelMatrix[12] === 0.0 &&
      this.modelMatrix[13] === 0.0 &&
      this.modelMatrix[14] === 0.0
    ) {
      this.modelMatrix[14] = 0.01;
    }

    const x = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: [Cartesian3.ZERO, Cartesian3.UNIT_X],
        width: this.width,
        vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        colors: [Color.RED, Color.RED],
        arcType: ArcType.NONE,
      }),
      modelMatrix: Matrix4.multiplyByUniformScale(
        this.modelMatrix,
        this.length,
        new Matrix4(),
      ),
      id: this.id,
      pickPrimitive: this,
    });
    const y = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: [Cartesian3.ZERO, Cartesian3.UNIT_Y],
        width: this.width,
        vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        colors: [Color.GREEN, Color.GREEN],
        arcType: ArcType.NONE,
      }),
      modelMatrix: Matrix4.multiplyByUniformScale(
        this.modelMatrix,
        this.length,
        new Matrix4(),
      ),
      id: this.id,
      pickPrimitive: this,
    });
    const z = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: [Cartesian3.ZERO, Cartesian3.UNIT_Z],
        width: this.width,
        vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        colors: [Color.BLUE, Color.BLUE],
        arcType: ArcType.NONE,
      }),
      modelMatrix: Matrix4.multiplyByUniformScale(
        this.modelMatrix,
        this.length,
        new Matrix4(),
      ),
      id: this.id,
      pickPrimitive: this,
    });

    this._primitive = new Primitive({
      geometryInstances: [x, y, z],
      appearance: new PolylineColorAppearance(),
      asynchronous: false,
    });
  }

  this._primitive.update(frameState);
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <p>
 * 如果此对象已销毁，则不应使用;调用
 *  <code> isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象被销毁，<code>则为 true</code>;否则为 <code>false</code>。
 *
 * @see DebugModelMatrixPrimitive#destroy
 */
DebugModelMatrixPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <p>
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * p = p && p.destroy();
 *
 * @see DebugModelMatrixPrimitive#isDestroyed
 */
DebugModelMatrixPrimitive.prototype.destroy = function () {
  this._primitive = this._primitive && this._primitive.destroy();
  return destroyObject(this);
};
export default DebugModelMatrixPrimitive;
