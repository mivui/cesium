import ArcType from "../Core/ArcType.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import Matrix4 from "../Core/Matrix4.js";
import PolylineGeometry from "../Core/PolylineGeometry.js";
import PolylineColorAppearance from "./PolylineColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * 绘制由转换至世界坐标系（即地球WGS84坐标系）的矩阵定义的参考系的各轴。
 * 最典型的示例是图元的 <code>modelMatrix</code>。
 * <p>
 * X轴为红色，Y轴为绿色，Z轴为蓝色。
 * </p>
 * <p>
 * 本功能仅用于调试，未针对生产环境优化。
 * </p>
 *
 * @alias DebugModelMatrixPrimitive
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {number} [options.length=10000000.0] 坐标轴的长度（单位：米）。
 * @param {number} [options.width=2.0] 坐标轴的宽度（单位：像素）。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 定义待可视化参考系（即原点加坐标轴）的4x4矩阵。
 * @param {boolean} [options.show=true] 确定是否显示该图元。
 * @param {object} [options.id] 用户定义的对象，当使用 {@link Scene#pick} 拾取实例时返回该对象。
 *
 * @example
 * primitives.add(new Cesium.DebugModelMatrixPrimitive({
 *   modelMatrix : primitive.modelMatrix,  // primitive to debug
 *   length : 100000.0,
 *   width : 10.0
 * }));
 */
function DebugModelMatrixPrimitive(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

/**
 * 坐标轴的长度（单位：米）。
 *
 * @type {number}
 * @default 10000000.0
 */
  this.length = options.length ?? 10000000.0;
  this._length = undefined;

/**
 * 坐标轴的宽度（单位：像素）。
 *
 * @type {number}
 * @default 2.0
 */
  this.width = options.width ?? 2.0;
  this._width = undefined;

/**
 * 确定是否显示该图元。
 *
 * @type {boolean}
 * @default true
 */
  this.show = options.show ?? true;

/**
 * 定义待可视化参考系（即原点加坐标轴）的4x4矩阵。
 *
 * @type {Matrix4}
 * @default {@link Matrix4.IDENTITY}
 */
  this.modelMatrix = Matrix4.clone(options.modelMatrix ?? Matrix4.IDENTITY);
  this._modelMatrix = new Matrix4();

/**
 * 拾取图元时返回的用户定义值。
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
 * 如果此对象已被销毁则返回 true，否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应再使用；调用 <code>isDestroyed</code> 以外的任何函数都将引发 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @see DebugModelMatrixPrimitive#isDestroyed
 */
DebugModelMatrixPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的WebGL资源。销毁对象可实现WebGL资源的确定性释放，而非依赖垃圾回收器来销毁该对象。
 * <p>
 * 对象一旦销毁便不应再使用；调用 <code>isDestroyed</code> 以外的任何函数都将引发 {@link DeveloperError} 异常。因此，请按照示例中的方式将返回值（<code>undefined</code>）赋给该对象。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
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
