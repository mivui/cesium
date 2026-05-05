import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import GeometryType from "./GeometryType.js";
import Matrix2 from "./Matrix2.js";
import Matrix3 from "./Matrix3.js";
import Matrix4 from "./Matrix4.js";
import PrimitiveType from "./PrimitiveType.js";
import Quaternion from "./Quaternion.js";
import Rectangle from "./Rectangle.js";
import Transforms from "./Transforms.js";

/**
 * 由构成顶点的属性和定义图元的可选索引数据组成的几何表示。
 * 几何体和描述着色的 {@link Appearance} 可以分配给 {@link Primitive} 进行可视化。
 * 在许多情况下，一个 <code>Primitive</code> 可以由许多异构几何体创建，以提高性能。
 * <p>
 * 可以使用 {@link GeometryPipeline} 中的函数对几何体进行变换和优化。
 * </p>
 *
 * @alias Geometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {GeometryAttributes} options.attributes 构成几何体顶点的属性。
 * @param {PrimitiveType} [options.primitiveType=PrimitiveType.TRIANGLES] 几何体中图元的类型。
 * @param {Uint16Array|Uint32Array} [options.indices] 定义几何体中图元的可选索引数据。
 * @param {BoundingSphere} [options.boundingSphere] 完全包围几何体的可选边界球。
 *
 * @see PolygonGeometry
 * @see RectangleGeometry
 * @see EllipseGeometry
 * @see CircleGeometry
 * @see WallGeometry
 * @see SimplePolylineGeometry
 * @see BoxGeometry
 * @see EllipsoidGeometry
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=geometry-and-appearances|几何体和外观演示}
 *
 * @example
 * // 创建一个带有位置属性和索引线的几何体。
 * const positions = new Float64Array([
 *   0.0, 0.0, 0.0,
 *   7500000.0, 0.0, 0.0,
 *   0.0, 7500000.0, 0.0
 * ]);
 *
 * const geometry = new Cesium.Geometry({
 *   attributes : {
 *     position : new Cesium.GeometryAttribute({
 *       componentDatatype : Cesium.ComponentDatatype.DOUBLE,
 *       componentsPerAttribute : 3,
 *       values : positions
 *     })
 *   },
 *   indices : new Uint16Array([0, 1, 1, 2, 2, 0]),
 *   primitiveType : Cesium.PrimitiveType.LINES,
 *   boundingSphere : Cesium.BoundingSphere.fromVertices(positions)
 * });
 */
function Geometry(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.attributes", options.attributes);
  //>>includeEnd('debug');

  /**
   * 构成几何体顶点的属性。此对象中的每个属性对应于一个
   * {@link GeometryAttribute}，包含该属性的数据。
   * <p>
   * 在几何体中，属性始终以非交错方式存储。
   * </p>
   * <p>
   * 有保留的属性名称具有众所周知的语义。根据提供的 {@link VertexFormat}，
   * 几何体（取决于提供的 {@link VertexFormat}）会创建以下属性。
   * <ul>
   *    <li><code>position</code> - 3D顶点位置。64位浮点数（用于精度）。每个属性3个分量。参见 {@link VertexFormat#position}。</li>
   *    <li><code>normal</code> - 法线（归一化），通常用于光照。32位浮点数。每个属性3个分量。参见 {@link VertexFormat#normal}。</li>
   *    <li><code>st</code> - 2D纹理坐标。32位浮点数。每个属性2个分量。参见 {@link VertexFormat#st}。</li>
   *    <li><code>bitangent</code> - 副切线（归一化），用于切线空间效果，如凹凸贴图。32位浮点数。每个属性3个分量。参见 {@link VertexFormat#bitangent}。</li>
   *    <li><code>tangent</code> - 切线（归一化），用于切线空间效果，如凹凸贴图。32位浮点数。每个属性3个分量。参见 {@link VertexFormat#tangent}。</li>
   * </ul>
   * </p>
   * <p>
   * 以下属性名称通常不是由几何体创建的，而是由 {@link Primitive} 或 {@link GeometryPipeline} 函数添加到几何体，
   * 以准备渲染几何体。
   * <ul>
   *    <li><code>position3DHigh</code> - 使用 {@link GeometryPipeline.encodeAttribute} 计算的编码64位位置的高32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>position3DLow</code> - 使用 {@link GeometryPipeline.encodeAttribute} 计算的编码64位位置的低32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>position2DHigh</code> - 使用 {@link GeometryPipeline.encodeAttribute} 计算的编码64位2D（哥伦布视图）位置的高32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>position2DLow</code> - 使用 {@link GeometryPipeline.encodeAttribute} 计算的编码64位2D（哥伦布视图）位置的低32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>color</code> - 通常来自 {@link GeometryInstance#color} 的RGBA颜色（归一化）。32位浮点数。每个属性4个分量。</li>
   *    <li><code>pickColor</code> - 用于拾取的RGBA颜色。32位浮点数。每个属性4个分量。</li>
   * </ul>
   * </p>
   *
   * @type GeometryAttributes
   *
   *
   * @example
   * geometry.attributes.position = new Cesium.GeometryAttribute({
   *   componentDatatype : Cesium.ComponentDatatype.FLOAT,
   *   componentsPerAttribute : 3,
   *   values : new Float32Array(0)
   * });
   *
   * @see GeometryAttribute
   * @see VertexFormat
   */
  this.attributes = options.attributes;

  /**
   * 可选的索引数据，与 {@link Geometry#primitiveType} 一起
   * 确定几何体中的图元。
   *
   * @type {Array|undefined}
   *
   * @default undefined
   */
  this.indices = options.indices;

  /**
   * 几何体中图元的类型。这通常为 {@link PrimitiveType.TRIANGLES}，
   * 但可以根据具体几何体而变化。
   *
   * @type {PrimitiveType|undefined}
   *
   * @default PrimitiveType.TRIANGLES
   */
  this.primitiveType = options.primitiveType ?? PrimitiveType.TRIANGLES;

  /**
   * 完全包围几何体的可选边界球。这通常用于视锥剔除。
   *
   * @type {BoundingSphere|undefined}
   *
   * @default undefined
   */
  this.boundingSphere = options.boundingSphere;

  /**
   * @private
   */
  this.geometryType = options.geometryType ?? GeometryType.NONE;

  /**
   * @private
   */
  this.boundingSphereCV = options.boundingSphereCV;

  /**
   * 用于使用applyOffset顶点属性计算几何体的边界球
   * @private
   */
  this.offsetAttribute = options.offsetAttribute;
}

/**
 * 计算几何体中的顶点数。运行时间与顶点中属性的数量成线性关系，
 * 而不是与顶点数成线性关系。
 *
 * @param {Geometry} geometry 几何体。
 * @returns {number} 几何体中的顶点数。
 *
 * @example
 * const numVertices = Cesium.Geometry.computeNumberOfVertices(geometry);
 */
Geometry.computeNumberOfVertices = function (geometry) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("geometry", geometry);
  //>>includeEnd('debug');

  let numberOfVertices = -1;
  for (const property in geometry.attributes) {
    if (
      geometry.attributes.hasOwnProperty(property) &&
      defined(geometry.attributes[property]) &&
      defined(geometry.attributes[property].values)
    ) {
      const attribute = geometry.attributes[property];
      const num = attribute.values.length / attribute.componentsPerAttribute;
      //>>includeStart('debug', pragmas.debug);
      if (numberOfVertices !== num && numberOfVertices !== -1) {
        throw new DeveloperError(
          "All attribute lists must have the same number of attributes.",
        );
      }
      //>>includeEnd('debug');
      numberOfVertices = num;
    }
  }

  return numberOfVertices;
};

const rectangleCenterScratch = new Cartographic();
const enuCenterScratch = new Cartesian3();
const fixedFrameToEnuScratch = new Matrix4();
const boundingRectanglePointsCartographicScratch = [
  new Cartographic(),
  new Cartographic(),
  new Cartographic(),
];
const boundingRectanglePointsEnuScratch = [
  new Cartesian2(),
  new Cartesian2(),
  new Cartesian2(),
];
const points2DScratch = [new Cartesian2(), new Cartesian2(), new Cartesian2()];
const pointEnuScratch = new Cartesian3();
const enuRotationScratch = new Quaternion();
const enuRotationMatrixScratch = new Matrix4();
const rotation2DScratch = new Matrix2();

/**
 * 用于在使用材质渲染GroundPrimitives时重新映射纹理坐标。
 * GroundPrimitive纹理坐标计算为与地球上的制图坐标系对齐。
 * 然而，EllipseGeometry、RectangleGeometry和PolygonGeometry都使用不同的策略将旋转烘焙到逐顶点纹理坐标中。
 *
 * 此方法是EllipseGeometry和PolygonGeometry用来近似相同视觉效果的。
 * 我们通过计算"变换后的"纹理坐标系统和计算一组参考点来封装旋转和缩放，
 * 从而可以使用2D中的距离将"制图"纹理坐标重新映射到"变换后"的系统。
 *
 * 随着覆盖面积的增加，这种近似会变得不太准确，特别是对于靠近极地的GroundPrimitives，
 * 但对于美国各州大小的多边形和椭圆来说通常是合理的。
 *
 * RectangleGeometry有自己的此方法的版本，它使用制图空间作为中间媒介而不是局部ENU来计算重新映射坐标，
 * 这对于大面积矩形更准确。
 *
 * @param {Cartesian3[]} positions 勾勒几何体位置的数组
 * @param {number} stRotation 纹理坐标旋转。
 * @param {Ellipsoid} ellipsoid 用于投影和生成局部向量的椭球。
 * @param {Rectangle} boundingRectangle 位置周围的边界矩形。
 * @returns {number[]} 一个包含6个数字的数组，指定"制图"系统中的[最小点、u范围、v范围]作为点。
 * @private
 */
Geometry._textureCoordinateRotationPoints = function (
  positions,
  stRotation,
  ellipsoid,
  boundingRectangle,
) {
  let i;

  // 创建一个以多边形边界矩形为中心的局部东-北-上坐标系。
  // 将边界矩形的西南、西北和东南角投影到ENU平面中作为2D点。
  // 这些等价于ShadowVolumeAppearanceFS中计算的纹理坐标系统中的(0,0)、(0,1)和(1,0)，
  // 也称为"ENU纹理空间"。
  const rectangleCenter = Rectangle.center(
    boundingRectangle,
    rectangleCenterScratch,
  );
  const enuCenter = Cartographic.toCartesian(
    rectangleCenter,
    ellipsoid,
    enuCenterScratch,
  );
  const enuToFixedFrame = Transforms.eastNorthUpToFixedFrame(
    enuCenter,
    ellipsoid,
    fixedFrameToEnuScratch,
  );
  const fixedFrameToEnu = Matrix4.inverse(
    enuToFixedFrame,
    fixedFrameToEnuScratch,
  );

  const boundingPointsEnu = boundingRectanglePointsEnuScratch;
  const boundingPointsCarto = boundingRectanglePointsCartographicScratch;

  boundingPointsCarto[0].longitude = boundingRectangle.west;
  boundingPointsCarto[0].latitude = boundingRectangle.south;

  boundingPointsCarto[1].longitude = boundingRectangle.west;
  boundingPointsCarto[1].latitude = boundingRectangle.north;

  boundingPointsCarto[2].longitude = boundingRectangle.east;
  boundingPointsCarto[2].latitude = boundingRectangle.south;

  let posEnu = pointEnuScratch;

  for (i = 0; i < 3; i++) {
    Cartographic.toCartesian(boundingPointsCarto[i], ellipsoid, posEnu);
    posEnu = Matrix4.multiplyByPointAsVector(fixedFrameToEnu, posEnu, posEnu);
    boundingPointsEnu[i].x = posEnu.x;
    boundingPointsEnu[i].y = posEnu.y;
  }

  // 将多边形中的每个点绕ENU中的上向量旋转-stRotation并投影到ENU中作为2D。
  // 计算这些旋转点在2D ENU平面中的边界框。
  // 将角点旋转回stRotation，然后使用前面计算的角点计算它们在ENU纹理空间中的等效值。
  const rotation = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Z,
    -stRotation,
    enuRotationScratch,
  );
  const textureMatrix = Matrix3.fromQuaternion(
    rotation,
    enuRotationMatrixScratch,
  );

  const positionsLength = positions.length;
  let enuMinX = Number.POSITIVE_INFINITY;
  let enuMinY = Number.POSITIVE_INFINITY;
  let enuMaxX = Number.NEGATIVE_INFINITY;
  let enuMaxY = Number.NEGATIVE_INFINITY;
  for (i = 0; i < positionsLength; i++) {
    posEnu = Matrix4.multiplyByPointAsVector(
      fixedFrameToEnu,
      positions[i],
      posEnu,
    );
    posEnu = Matrix3.multiplyByVector(textureMatrix, posEnu, posEnu);

    enuMinX = Math.min(enuMinX, posEnu.x);
    enuMinY = Math.min(enuMinY, posEnu.y);
    enuMaxX = Math.max(enuMaxX, posEnu.x);
    enuMaxY = Math.max(enuMaxY, posEnu.y);
  }

  const toDesiredInComputed = Matrix2.fromRotation(
    stRotation,
    rotation2DScratch,
  );

  const points2D = points2DScratch;
  points2D[0].x = enuMinX;
  points2D[0].y = enuMinY;

  points2D[1].x = enuMinX;
  points2D[1].y = enuMaxY;

  points2D[2].x = enuMaxX;
  points2D[2].y = enuMinY;

  const boundingEnuMin = boundingPointsEnu[0];
  const boundingPointsWidth = boundingPointsEnu[2].x - boundingEnuMin.x;
  const boundingPointsHeight = boundingPointsEnu[1].y - boundingEnuMin.y;

  for (i = 0; i < 3; i++) {
    const point2D = points2D[i];
    // rotate back
    Matrix2.multiplyByVector(toDesiredInComputed, point2D, point2D);

    // Convert point into east-north texture coordinate space
    point2D.x = (point2D.x - boundingEnuMin.x) / boundingPointsWidth;
    point2D.y = (point2D.y - boundingEnuMin.y) / boundingPointsHeight;
  }

  const minXYCorner = points2D[0];
  const maxYCorner = points2D[1];
  const maxXCorner = points2D[2];
  const result = new Array(6);
  Cartesian2.pack(minXYCorner, result);
  Cartesian2.pack(maxYCorner, result, 2);
  Cartesian2.pack(maxXCorner, result, 4);

  return result;
};
export default Geometry;
