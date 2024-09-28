import AxisAlignedBoundingBox from "./AxisAlignedBoundingBox.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import EllipsoidalOccluder from "./EllipsoidalOccluder.js";
import CesiumMath from "./Math.js";
import Matrix4 from "./Matrix4.js";
import OrientedBoundingBox from "./OrientedBoundingBox.js";
import Rectangle from "./Rectangle.js";
import TerrainEncoding from "./TerrainEncoding.js";
import Transforms from "./Transforms.js";
import WebMercatorProjection from "./WebMercatorProjection.js";

/**
 * 包含用于从高度贴图图像创建网格的函数。
 *
 * @namespace HeightmapTessellator
 *
 * @private
 */
const HeightmapTessellator = {};

/**
 * 高度贴图的默认结构，给定于 {@link HeightmapTessellator.computeVertices}。
 *
 * @constant
 */
HeightmapTessellator.DEFAULT_STRUCTURE = Object.freeze({
  heightScale: 1.0,
  heightOffset: 0.0,
  elementsPerHeight: 1,
  stride: 1,
  elementMultiplier: 256.0,
  isBigEndian: false,
});

const cartesian3Scratch = new Cartesian3();
const matrix4Scratch = new Matrix4();
const minimumScratch = new Cartesian3();
const maximumScratch = new Cartesian3();

/**
 * 填充高度贴图图像中的顶点数组。
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} options.heightmap 要镶嵌的高度贴图。
 * @param {number} options.width 高度贴图的宽度，以高度样本为单位。
 * @param {number} options.height 高度贴图的高度，以高度样本为单位。
 * @param {number} options.skirtHeight 要在高度图边缘覆盖的裙子的高度。
 * @param {Rectangle} options.nativeRectangle 高度图投影的原生坐标中的矩形。 为
 * 具有地理投影的高度贴图，这是度数。 对于 Web 墨卡托
 * 投影，这是米。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例尺。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 地形被夸大的高度。
 * @param {Rectangle} [options.rectangle] 高度贴图覆盖的矩形，在大地坐标中，北、南、东和
 * Radians 的 West 属性。 必须提供 rectangle 或 nativeRectangle。 如果两者都
 * 时，它们被假定为一致。
 * @param {boolean} [options.isGeographic=true] 如果高度贴图使用 {@link GeographicProjection}，则为 true，如果使用 { GeographicProjection} 则为 false。
 * {@link WebMercatorProjection}.
 * @param {Cartesian3} [options.relativeToCenter=Cartesian3.ZERO] 位置将计算为 <code>Cartesian3.subtract（worldPosition， relativeToCenter）。</code>
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 高度贴图所适用的椭球体。
 * @param {object} [options.structure] 描述高度数据结构的对象。
 * @param {number} [options.structure.heightScale=1.0] 将高度样本相乘以获得
 * heightOffset 以上的高度，以米为单位。 heightOffset 将添加到生成的
 * 乘以刻度后的高度。
 * @param {number} [options.structure.heightOffset=0.0] 要添加到缩放高度以获得最终
 * 高度（以米为单位）。 偏移量是在高度样本乘以
 * heightScale 的
 * @param {number} [options.structure.elementsPerHeight=1] 缓冲区中构成单个高度的元素数
 * 样本。 这通常为 1，表示每个元素都是一个单独的高度样本。 如果
 * 大于 1，则该数量的元素一起构成高度样本，即
 * 根据 structure.elementMultiplier 和 structure.isBigEndian 属性计算。
 * @param {number} [options.structure.stride=1] 从 的第一个元素开始跳过的元素数
 * 一个高度到下一个高度的第一个元素。
 * @param {number} [options.structure.elementMultiplier=256.0] 用于计算高度值的乘数，当
 * stride 属性大于 1。 例如，如果 stride 为 4，并且 strideMultiplier
 * 为 256，则高度的计算方式如下：
 * '高度 = 缓冲区[索引] + 缓冲区[索引 + 1] * 256 + 缓冲区[索引 + 2] * 256 * 256 + 缓冲区[索引 + 3] * 256 * 256 * 256'
 * 这是假设 isBigEndian 属性为 false。 如果为 true，则
 * 元素被反转。
 * @param {number} [options.structure.lowestEncodedHeight] 高度缓冲区中可以存储的最小值。 任何较低的高度
 * 小于该值，在使用 'heightScale' 和 'heightOffset' 编码后，该值被固定到该值。 例如，如果 height
 * buffer 是 'Uint16Array'，此值应为 0，因为 'Uint16Array' 无法存储负数。 如果该参数为
 * 未指定，不强制执行最小值。
 * @param {number} [options.structure.highestEncodedHeight] 高度缓冲区中可以存储的最大值。 任何更高的高度
 * 小于该值，在使用 'heightScale' 和 'heightOffset' 编码后，该值被固定到该值。 例如，如果 height
 * buffer 是 'Uint16Array'，此值应为 '256 * 256 - 1' 或 65535，因为 'Uint16Array' 无法存储更大的数字
 * 比 65535 多。 如果未指定此参数，则不强制实施最大值。
 * @param {boolean} [options.structure.isBigEndian=false] 表示缓冲区中元素的字节序，当
 * stride 属性大于 1。 如果此属性为 false，则第一个元素是
 * 低阶元素。 如果为 true，则第一个元素是高阶元素。
 *
 * @example
 * const width = 5;
 * const height = 5;
 * const statistics = Cesium.HeightmapTessellator.computeVertices({
 *     heightmap : [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0],
 *     width : width,
 *     height : height,
 *     skirtHeight : 0.0,
 *     nativeRectangle : {
 *         west : 10.0,
 *         east : 20.0,
 *         south : 30.0,
 *         north : 40.0
 *     }
 * });
 *
 * const encoding = statistics.encoding;
 * const position = encoding.decodePosition(statistics.vertices, index);
 */
HeightmapTessellator.computeVertices = function (options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.heightmap)) {
    throw new DeveloperError("options.heightmap is required.");
  }
  if (!defined(options.width) || !defined(options.height)) {
    throw new DeveloperError("options.width and options.height are required.");
  }
  if (!defined(options.nativeRectangle)) {
    throw new DeveloperError("options.nativeRectangle is required.");
  }
  if (!defined(options.skirtHeight)) {
    throw new DeveloperError("options.skirtHeight is required.");
  }
  //>>includeEnd('debug');

  // This function tends to be a performance hotspot for terrain rendering,
  // so it employs a lot of inlining and unrolling as an optimization.
  // In particular, the functionality of Ellipsoid.cartographicToCartesian
  // is inlined.

  const cos = Math.cos;
  const sin = Math.sin;
  const sqrt = Math.sqrt;
  const atan = Math.atan;
  const exp = Math.exp;
  const piOverTwo = CesiumMath.PI_OVER_TWO;
  const toRadians = CesiumMath.toRadians;

  const heightmap = options.heightmap;
  const width = options.width;
  const height = options.height;
  const skirtHeight = options.skirtHeight;
  const hasSkirts = skirtHeight > 0.0;

  const isGeographic = defaultValue(options.isGeographic, true);
  const ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);

  const oneOverGlobeSemimajorAxis = 1.0 / ellipsoid.maximumRadius;

  const nativeRectangle = Rectangle.clone(options.nativeRectangle);
  const rectangle = Rectangle.clone(options.rectangle);

  let geographicWest;
  let geographicSouth;
  let geographicEast;
  let geographicNorth;

  if (!defined(rectangle)) {
    if (isGeographic) {
      geographicWest = toRadians(nativeRectangle.west);
      geographicSouth = toRadians(nativeRectangle.south);
      geographicEast = toRadians(nativeRectangle.east);
      geographicNorth = toRadians(nativeRectangle.north);
    } else {
      geographicWest = nativeRectangle.west * oneOverGlobeSemimajorAxis;
      geographicSouth =
        piOverTwo -
        2.0 * atan(exp(-nativeRectangle.south * oneOverGlobeSemimajorAxis));
      geographicEast = nativeRectangle.east * oneOverGlobeSemimajorAxis;
      geographicNorth =
        piOverTwo -
        2.0 * atan(exp(-nativeRectangle.north * oneOverGlobeSemimajorAxis));
    }
  } else {
    geographicWest = rectangle.west;
    geographicSouth = rectangle.south;
    geographicEast = rectangle.east;
    geographicNorth = rectangle.north;
  }

  let relativeToCenter = options.relativeToCenter;
  const hasRelativeToCenter = defined(relativeToCenter);
  relativeToCenter = hasRelativeToCenter ? relativeToCenter : Cartesian3.ZERO;
  const includeWebMercatorT = defaultValue(options.includeWebMercatorT, false);

  const exaggeration = defaultValue(options.exaggeration, 1.0);
  const exaggerationRelativeHeight = defaultValue(
    options.exaggerationRelativeHeight,
    0.0,
  );
  const hasExaggeration = exaggeration !== 1.0;
  const includeGeodeticSurfaceNormals = hasExaggeration;

  const structure = defaultValue(
    options.structure,
    HeightmapTessellator.DEFAULT_STRUCTURE,
  );
  const heightScale = defaultValue(
    structure.heightScale,
    HeightmapTessellator.DEFAULT_STRUCTURE.heightScale,
  );
  const heightOffset = defaultValue(
    structure.heightOffset,
    HeightmapTessellator.DEFAULT_STRUCTURE.heightOffset,
  );
  const elementsPerHeight = defaultValue(
    structure.elementsPerHeight,
    HeightmapTessellator.DEFAULT_STRUCTURE.elementsPerHeight,
  );
  const stride = defaultValue(
    structure.stride,
    HeightmapTessellator.DEFAULT_STRUCTURE.stride,
  );
  const elementMultiplier = defaultValue(
    structure.elementMultiplier,
    HeightmapTessellator.DEFAULT_STRUCTURE.elementMultiplier,
  );
  const isBigEndian = defaultValue(
    structure.isBigEndian,
    HeightmapTessellator.DEFAULT_STRUCTURE.isBigEndian,
  );

  let rectangleWidth = Rectangle.computeWidth(nativeRectangle);
  let rectangleHeight = Rectangle.computeHeight(nativeRectangle);

  const granularityX = rectangleWidth / (width - 1);
  const granularityY = rectangleHeight / (height - 1);

  if (!isGeographic) {
    rectangleWidth *= oneOverGlobeSemimajorAxis;
    rectangleHeight *= oneOverGlobeSemimajorAxis;
  }

  const radiiSquared = ellipsoid.radiiSquared;
  const radiiSquaredX = radiiSquared.x;
  const radiiSquaredY = radiiSquared.y;
  const radiiSquaredZ = radiiSquared.z;

  let minimumHeight = 65536.0;
  let maximumHeight = -65536.0;

  const fromENU = Transforms.eastNorthUpToFixedFrame(
    relativeToCenter,
    ellipsoid,
  );
  const toENU = Matrix4.inverseTransformation(fromENU, matrix4Scratch);

  let southMercatorY;
  let oneOverMercatorHeight;
  if (includeWebMercatorT) {
    southMercatorY =
      WebMercatorProjection.geodeticLatitudeToMercatorAngle(geographicSouth);
    oneOverMercatorHeight =
      1.0 /
      (WebMercatorProjection.geodeticLatitudeToMercatorAngle(geographicNorth) -
        southMercatorY);
  }

  const minimum = minimumScratch;
  minimum.x = Number.POSITIVE_INFINITY;
  minimum.y = Number.POSITIVE_INFINITY;
  minimum.z = Number.POSITIVE_INFINITY;

  const maximum = maximumScratch;
  maximum.x = Number.NEGATIVE_INFINITY;
  maximum.y = Number.NEGATIVE_INFINITY;
  maximum.z = Number.NEGATIVE_INFINITY;

  let hMin = Number.POSITIVE_INFINITY;

  const gridVertexCount = width * height;
  const edgeVertexCount = skirtHeight > 0.0 ? width * 2 + height * 2 : 0;
  const vertexCount = gridVertexCount + edgeVertexCount;

  const positions = new Array(vertexCount);
  const heights = new Array(vertexCount);
  const uvs = new Array(vertexCount);
  const webMercatorTs = includeWebMercatorT ? new Array(vertexCount) : [];
  const geodeticSurfaceNormals = includeGeodeticSurfaceNormals
    ? new Array(vertexCount)
    : [];

  let startRow = 0;
  let endRow = height;
  let startCol = 0;
  let endCol = width;

  if (hasSkirts) {
    --startRow;
    ++endRow;
    --startCol;
    ++endCol;
  }

  const skirtOffsetPercentage = 0.00001;

  for (let rowIndex = startRow; rowIndex < endRow; ++rowIndex) {
    let row = rowIndex;
    if (row < 0) {
      row = 0;
    }
    if (row >= height) {
      row = height - 1;
    }

    let latitude = nativeRectangle.north - granularityY * row;

    if (!isGeographic) {
      latitude =
        piOverTwo - 2.0 * atan(exp(-latitude * oneOverGlobeSemimajorAxis));
    } else {
      latitude = toRadians(latitude);
    }

    let v = (latitude - geographicSouth) / (geographicNorth - geographicSouth);
    v = CesiumMath.clamp(v, 0.0, 1.0);

    const isNorthEdge = rowIndex === startRow;
    const isSouthEdge = rowIndex === endRow - 1;
    if (skirtHeight > 0.0) {
      if (isNorthEdge) {
        latitude += skirtOffsetPercentage * rectangleHeight;
      } else if (isSouthEdge) {
        latitude -= skirtOffsetPercentage * rectangleHeight;
      }
    }

    const cosLatitude = cos(latitude);
    const nZ = sin(latitude);
    const kZ = radiiSquaredZ * nZ;

    let webMercatorT;
    if (includeWebMercatorT) {
      webMercatorT =
        (WebMercatorProjection.geodeticLatitudeToMercatorAngle(latitude) -
          southMercatorY) *
        oneOverMercatorHeight;
    }

    for (let colIndex = startCol; colIndex < endCol; ++colIndex) {
      let col = colIndex;
      if (col < 0) {
        col = 0;
      }
      if (col >= width) {
        col = width - 1;
      }

      const terrainOffset = row * (width * stride) + col * stride;

      let heightSample;
      if (elementsPerHeight === 1) {
        heightSample = heightmap[terrainOffset];
      } else {
        heightSample = 0;

        let elementOffset;
        if (isBigEndian) {
          for (
            elementOffset = 0;
            elementOffset < elementsPerHeight;
            ++elementOffset
          ) {
            heightSample =
              heightSample * elementMultiplier +
              heightmap[terrainOffset + elementOffset];
          }
        } else {
          for (
            elementOffset = elementsPerHeight - 1;
            elementOffset >= 0;
            --elementOffset
          ) {
            heightSample =
              heightSample * elementMultiplier +
              heightmap[terrainOffset + elementOffset];
          }
        }
      }

      heightSample = heightSample * heightScale + heightOffset;

      maximumHeight = Math.max(maximumHeight, heightSample);
      minimumHeight = Math.min(minimumHeight, heightSample);

      let longitude = nativeRectangle.west + granularityX * col;

      if (!isGeographic) {
        longitude = longitude * oneOverGlobeSemimajorAxis;
      } else {
        longitude = toRadians(longitude);
      }

      let u = (longitude - geographicWest) / (geographicEast - geographicWest);
      u = CesiumMath.clamp(u, 0.0, 1.0);

      let index = row * width + col;

      if (skirtHeight > 0.0) {
        const isWestEdge = colIndex === startCol;
        const isEastEdge = colIndex === endCol - 1;
        const isEdge = isNorthEdge || isSouthEdge || isWestEdge || isEastEdge;
        const isCorner =
          (isNorthEdge || isSouthEdge) && (isWestEdge || isEastEdge);
        if (isCorner) {
          // Don't generate skirts on the corners.
          continue;
        } else if (isEdge) {
          heightSample -= skirtHeight;

          if (isWestEdge) {
            // The outer loop iterates north to south but the indices are ordered south to north, hence the index flip below
            index = gridVertexCount + (height - row - 1);
            longitude -= skirtOffsetPercentage * rectangleWidth;
          } else if (isSouthEdge) {
            // Add after west indices. South indices are ordered east to west.
            index = gridVertexCount + height + (width - col - 1);
          } else if (isEastEdge) {
            // Add after west and south indices. East indices are ordered north to south. The index is flipped like above.
            index = gridVertexCount + height + width + row;
            longitude += skirtOffsetPercentage * rectangleWidth;
          } else if (isNorthEdge) {
            // Add after west, south, and east indices. North indices are ordered west to east.
            index = gridVertexCount + height + width + height + col;
          }
        }
      }

      const nX = cosLatitude * cos(longitude);
      const nY = cosLatitude * sin(longitude);

      const kX = radiiSquaredX * nX;
      const kY = radiiSquaredY * nY;

      const gamma = sqrt(kX * nX + kY * nY + kZ * nZ);
      const oneOverGamma = 1.0 / gamma;

      const rSurfaceX = kX * oneOverGamma;
      const rSurfaceY = kY * oneOverGamma;
      const rSurfaceZ = kZ * oneOverGamma;

      const position = new Cartesian3();
      position.x = rSurfaceX + nX * heightSample;
      position.y = rSurfaceY + nY * heightSample;
      position.z = rSurfaceZ + nZ * heightSample;

      Matrix4.multiplyByPoint(toENU, position, cartesian3Scratch);
      Cartesian3.minimumByComponent(cartesian3Scratch, minimum, minimum);
      Cartesian3.maximumByComponent(cartesian3Scratch, maximum, maximum);
      hMin = Math.min(hMin, heightSample);

      positions[index] = position;
      uvs[index] = new Cartesian2(u, v);
      heights[index] = heightSample;

      if (includeWebMercatorT) {
        webMercatorTs[index] = webMercatorT;
      }

      if (includeGeodeticSurfaceNormals) {
        geodeticSurfaceNormals[index] =
          ellipsoid.geodeticSurfaceNormal(position);
      }
    }
  }

  const boundingSphere3D = BoundingSphere.fromPoints(positions);
  let orientedBoundingBox;
  if (defined(rectangle)) {
    orientedBoundingBox = OrientedBoundingBox.fromRectangle(
      rectangle,
      minimumHeight,
      maximumHeight,
      ellipsoid,
    );
  }

  let occludeePointInScaledSpace;
  if (hasRelativeToCenter) {
    const occluder = new EllipsoidalOccluder(ellipsoid);
    occludeePointInScaledSpace =
      occluder.computeHorizonCullingPointPossiblyUnderEllipsoid(
        relativeToCenter,
        positions,
        minimumHeight,
      );
  }

  const aaBox = new AxisAlignedBoundingBox(minimum, maximum, relativeToCenter);
  const encoding = new TerrainEncoding(
    relativeToCenter,
    aaBox,
    hMin,
    maximumHeight,
    fromENU,
    false,
    includeWebMercatorT,
    includeGeodeticSurfaceNormals,
    exaggeration,
    exaggerationRelativeHeight,
  );
  const vertices = new Float32Array(vertexCount * encoding.stride);

  let bufferIndex = 0;
  for (let j = 0; j < vertexCount; ++j) {
    bufferIndex = encoding.encode(
      vertices,
      bufferIndex,
      positions[j],
      uvs[j],
      heights[j],
      undefined,
      webMercatorTs[j],
      geodeticSurfaceNormals[j],
    );
  }

  return {
    vertices: vertices,
    maximumHeight: maximumHeight,
    minimumHeight: minimumHeight,
    encoding: encoding,
    boundingSphere3D: boundingSphere3D,
    orientedBoundingBox: orientedBoundingBox,
    occludeePointInScaledSpace: occludeePointInScaledSpace,
  };
};
export default HeightmapTessellator;
