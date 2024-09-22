import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import Matrix4 from "../Core/Matrix4.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * 创建一个 {@link Primitive} 来可视化已知的向量顶点属性：
 * <code>法线</code>、<code>切线</code>和<code>双切线</code>。 正常
 * 为红色;tangent 为绿色;Bitangent 是蓝色的。 如果属性不是
 * present，则不绘制。
 *
 * @function
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Geometry} options.geometry 具有属性的 <code>Geometry</code> 实例。
 * @param {number} [options.length=10000.0] 每条线段的长度，以米为单位。 这可以是负数，以将向量指向相反的方向。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 转换以将几何体从模型坐标转换为世界坐标的模型矩阵。
 * @returns {Primitive} 一个新的 <code>Primitive</code> 实例，带有向量的几何体。
 *
 * @example
 * scene.primitives.add(Cesium.createTangentSpaceDebugPrimitive({
 *    geometry : instance.geometry,
 *    length : 100000.0,
 *    modelMatrix : instance.modelMatrix
 * }));
 */
function createTangentSpaceDebugPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const instances = [];
  let geometry = options.geometry;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(geometry)) {
    throw new DeveloperError("options.geometry is required.");
  }
  //>>includeEnd('debug');

  if (!defined(geometry.attributes) || !defined(geometry.primitiveType)) {
    // to create the debug lines, we need the computed attributes.
    // compute them if they are undefined.
    geometry = geometry.constructor.createGeometry(geometry);
  }

  const attributes = geometry.attributes;
  const modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY)
  );
  const length = defaultValue(options.length, 10000.0);

  if (defined(attributes.normal)) {
    instances.push(
      new GeometryInstance({
        geometry: GeometryPipeline.createLineSegmentsForVectors(
          geometry,
          "normal",
          length
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0),
        },
        modelMatrix: modelMatrix,
      })
    );
  }

  if (defined(attributes.tangent)) {
    instances.push(
      new GeometryInstance({
        geometry: GeometryPipeline.createLineSegmentsForVectors(
          geometry,
          "tangent",
          length
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0),
        },
        modelMatrix: modelMatrix,
      })
    );
  }

  if (defined(attributes.bitangent)) {
    instances.push(
      new GeometryInstance({
        geometry: GeometryPipeline.createLineSegmentsForVectors(
          geometry,
          "bitangent",
          length
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 1.0),
        },
        modelMatrix: modelMatrix,
      })
    );
  }

  if (instances.length > 0) {
    return new Primitive({
      asynchronous: false,
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: false,
      }),
    });
  }

  return undefined;
}
export default createTangentSpaceDebugPrimitive;
