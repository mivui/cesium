import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
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
 * 具有构成顶点的属性和可选索引数据的几何表示
 * 定义基元。 几何图形和 {@link 外观}（描述阴影）、
 * 可以分配给 {@link Primitive} 以进行可视化。 <code>Primitive</code> 可以
 * 由许多异构 - 在许多情况下 - 几何图形创建以提高性能。
 * <p>
 * 可以使用 {@link GeometryPipeline} 中的函数转换和优化几何图形。
 * </p>
 *
 * @alias Geometry
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {GeometryAttributes} options.attributes 属性，它们构成了几何体的顶点。
 * @param {PrimitiveType} [options.primitiveType=PrimitiveType.TRIANGLES] 几何体中基元的类型。
 * @param {Uint16Array|Uint32Array} [options.indices] 确定几何体中基元的可选索引数据。
 * @param {BoundingSphere} [options.boundingSphere] 一个完全封闭几何体的可选边界球体。
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
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Geometry%20and%20Appearances.html|Geometry and Appearances Demo}
 *
 * @example
 * // Create geometry with a position attribute and indexed lines.
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.attributes", options.attributes);
  //>>includeEnd('debug');

  /**
   * 属性，构成几何体的顶点。 此对象中的每个属性都对应于一个
   * {@link GeometryAttribute} 包含属性的数据。
   * <p>
   * 属性始终以非交错方式存储在 Geometry 中。
   * </p>
   * <p>
   * 存在具有已知语义的保留属性名称。 以下属性
   * 由 Geometry 创建（取决于提供的 {@link VertexFormat}）。
   * <ul>
   * <li><code>position</code> - 3D 顶点位置。 64 位浮点（用于精度）。 每个属性 3 个组件。 参见 {@link VertexFormat#position}。</li>
   * <li><code>normal</code> - 正常（标准化），通常用于照明。 32 位浮点。 每个属性 3 个组件。 参见 {@link VertexFormat#normal}。</li>
   * <li><code>st</code> - 2D 纹理坐标。 32 位浮点。 每个属性 2 个组件。 参见 {@link VertexFormat#st}。</li>
   * <li><code>bitangent</code> - 双切线（标准化），用于凹凸贴图等切线空间效果。 32 位浮点。 每个属性 3 个组件。 参见 {@link VertexFormat#bitangent}。</li>
   * <li><code>tangent</code> - 切线（规格化），用于凹凸贴图等切线空间效果。 32 位浮点。 每个属性 3 个组件。 参见 {@link VertexFormat#tangent}。</li>
   * </ul>
   * </p>
   * <p>
   * 以下属性名称通常不是由 Geometry 创建的，而是添加的
   * 通过 {@link Primitive} 或 {@link GeometryPipeline} 函数准备
   * 用于渲染的几何体。
   * <ul>
   * <li><code>position3DHigh</code> - 使用 {@link GeometryPipeline.encodeAttribute} 计算的编码 64 位的高 32 位。 32 位浮点。 每个属性 4 个组件。</li>
   * <li><code>position3DLow</code> - 对于使用 {@link GeometryPipeline.encodeAttribute} 计算的编码 64 位位置，为低 32 位。 32 位浮点。 每个属性 4 个组件。</li>
   * <li><code>position2DHigh</code> - 使用 {@link GeometryPipeline.encodeAttribute} 计算的编码 64 位 2D（哥伦布视图）位置的高 32 位。 32 位浮点。 每个属性 4 个组件。</li>
   * <li><code>position2DLow</code> - 对于使用 {@link GeometryPipeline.encodeAttribute} 计算的编码 64 位 2D（哥伦布视图）位置，为低 32 位。 32 位浮点。 每个属性 4 个组件。</li>
   * <li><code>color</code> - RGBA 颜色（标准化），通常来自 {@link GeometryInstance#color}。 32 位浮点。 每个属性 4 个组件。</li>
   * <li><code>pickColor</code> - 用于拾取的 RGBA 颜色。 32 位浮点。 每个属性 4 个组件。</li>
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
   * 可选的索引数据 - 以及 {@link Geometry#primitiveType} -
   * 确定几何体中的基元。
   *
   * @type {Array|undefined}
   *
   * @default undefined
   */
  this.indices = options.indices;

  /**
   * 几何体中基元的类型。 这通常是 {@link PrimitiveType.TRIANGLES}，
   * 但可以根据特定几何图形而变化。
   *
   * @type {PrimitiveType|undefined}
   *
   * @default PrimitiveType.TRIANGLES
   */
  this.primitiveType = defaultValue(
    options.primitiveType,
    PrimitiveType.TRIANGLES,
  );

  /**
   * 一个完全封闭几何体的可选边界球体。 这是
   * 通常用于剔除。
   *
   * @type {BoundingSphere|undefined}
   *
   * @default undefined
   */
  this.boundingSphere = options.boundingSphere;

  /**
   * @private
   */
  this.geometryType = defaultValue(options.geometryType, GeometryType.NONE);

  /**
   * @private
   */
  this.boundingSphereCV = options.boundingSphereCV;

  /**
   * 用于使用 applyOffset 顶点属性计算几何体的边界球体
   * @private
   */
  this.offsetAttribute = options.offsetAttribute;
}

/**
 * 计算几何图形中的顶点数。 运行时间与
 * 相对于顶点中的属性数，而不是顶点数。
 *
 * @param {Geometry} geometry 几何图形。
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
 * 用于在使用材质渲染 GroundPrimitive 时重新映射纹理坐标。
 * 计算 GroundPrimitive 纹理坐标以与地球上的制图坐标系对齐。
 * 但是，EllipseGeometry、RectangleGeometry 和 PolygonGeometry 都将旋转烘焙到每个顶点的纹理坐标
 * 使用不同的策略。
 *
 * EllipseGeometry 和 PolygonGeometry 使用此方法来近似相同的视觉效果。
 * 我们通过计算 “transformed” 纹理坐标系和计算来封装旋转和缩放
 * 一组参考点，“制图”纹理坐标可以从中重新映射到“变换的”
 * 在 2D 中使用到线的距离的系统。
 *
 * 随着覆盖面积的增加，这种近似值会变得不那么准确，特别是对于极点附近的 GroundPrimitives。
 * 但对于美国各州大小的多边形和椭圆通常是合理的。
 *
 * RectangleGeometry 有自己的此方法版本，该方法使用制图空间计算重映射坐标
 * 作为中介而不是本地 ENU，后者对于大面积矩形更准确。
 *
 * @param {Cartesian3[]} positions 轮廓几何的位置数组
 * @param {number} stRotation 纹理坐标旋转。
 * @param {Ellipsoid} 椭球体，用于投影和生成局部向量。
 * @param {Rectangle} boundingRectangle 围绕位置的边界矩形。
 * @returns {number[]} 一个由 6 个数字组成的数组，指定 [minimum point, u extent, v extent] 作为“制图”系统中的点。
 * @private
 */
Geometry._textureCoordinateRotationPoints = function (
  positions,
  stRotation,
  ellipsoid,
  boundingRectangle,
) {
  let i;

  // Create a local east-north-up coordinate system centered on the polygon's bounding rectangle.
  // Project the southwest, northwest, and southeast corners of the bounding rectangle into the plane of ENU as 2D points.
  // These are the equivalents of (0,0), (0,1), and (1,0) in the texture coordinate system computed in ShadowVolumeAppearanceFS,
  // aka "ENU texture space."
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

  // Rotate each point in the polygon around the up vector in the ENU by -stRotation and project into ENU as 2D.
  // Compute the bounding box of these rotated points in the 2D ENU plane.
  // Rotate the corners back by stRotation, then compute their equivalents in the ENU texture space using the corners computed earlier.
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
