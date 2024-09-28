/* eslint-disable new-cap */
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import FeatureDetection from "./FeatureDetection.js";
import RuntimeError from "./RuntimeError.js";

/**
 * 第 2 季
 * --
 *
 * 此实现基于 S2 C++ 参考实现：https://github.com/google/s2geometry
 *
 *
 *概述：
 * ---------
 * S2 库将单位球体分解为单元层次结构。像元是由 4 个测地线界定的四边形。
 * 通过将立方体的 6 个面投影到一个单位球体上来获得 6 个根单元。每个根单元都遵循一个四叉树
 * 细分方案，即每个单元格细分为 4 个较小的单元格，这些单元格覆盖与父单元格相同的区域。S2 细胞
 * 层次结构从级别 0（根单元）扩展到级别 30（叶单元）。旋转根单元以启用连续的 Hilbert
 * 曲线来映射立方体的所有 6 个面。
 *
 *
 * 小区 ID：
 * --------
 * S2 中的每个单元格都可以使用 64 位无符号整数（其单元格 ID）进行唯一标识。cell ID 的前 3 位是 face 位，即
 * 它们表示一个单元格位于立方体的 6 个面上的哪一个。面位之后是位置位，即它们表示位置
 * 沿希尔伯特曲线的单元格。位置位后面是 sentinel 位，它始终设置为 1，它表示
 *细胞。同样，在 S2 中，级别可以介于 0 和 30 之间。
 *
 * 注意：在下图中，面位标有“f”，位置位标有“p”，零位标有“-”。
 *
 * 单元格 ID（以 10 为基数）：3170534137668829184
 * 小区 ID（以 2 为基数）：0010110000000000000000000000000000000000000000000000000000000000
 *
 *   001 0110000000000000000000000000000000000000000000000000000000000
 * FFF PPS----------------------------------------------------------
 *
 * 对于上面的单元格，我们可以看到它位于面 1 （01） 上，希尔伯特指数为 1 （1）。
 *
 *
 * 细胞细分：
 * ------------------
 * S2 中的单元格使用四叉树细分递归细分。对于每个单元格，您可以获取索引为 [0-3] 的子项。要计算索引 i 处的子项，
 * 将 i 的 base 2 表示形式插入到父级位置位的右侧。确保 sentinel 位也向右移动两位。
 *
 * 父小区 ID（以 10 为基数）：3170534137668829184
 * 父单元 ID（以 2 为基数）：0010110000000000000000000000000000000000000000000000000000000000
 *
 *   001 0110000000000000000000000000000000000000000000000000000000000
 * FFF PPS----------------------------------------------------------
 *
 * 为了获得上面单元格的第 3 个子项，我们将 3 的二进制表示形式插入到父项位置位的右侧：
 *
 * 注意：在下图中，要添加的位用 '^' 突出显示。
 *
 *   001 0111100000000000000000000000000000000000000000000000000000000
 * fff pppps--------------------------------------------------------
 *         ^^
 *
 * 儿童（3） 小区 ID（以 10 为基数）：3386706919782612992
 * 儿童（3） 小区 ID（以 2 为基）：0010111100000000000000000000000000000000000000000000000000000000
 *
 * Cell Token：
 * -----------
 * 为了提供更简洁的 S2 单元格 ID 表示，我们可以使用它们的十六进制表示。
 *
 * 单元格 ID（以 10 为基数）：3170534137668829184
 * 小区 ID（以 2 为基数）：0010110000000000000000000000000000000000000000000000000000000000
 *
 * 我们删除所有尾随的零位，直到我们到达包含 sentinel 位的 nybble （4 位）。
 *
 * 注意：在下图中，要删除的位用“X”突出显示。
 *
 *   0010110000000000000000000000000000000000000000000000000000000000
 * fffpps--XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *
 * 我们将剩余的位转换为它们的十六进制表示。
 *
 * 底座 2：0010 1100
 * 16 进制：“2” “c”
 *
 * Cell Token：“2c”
 *
 * 要从 Token 中计算 Cell ID，我们只需在右侧添加足够的 0，使 ID 跨越 64 位。
 *
 * 坐标变换：
 * ----------------------
 *
 * 要从 S2 中的单元格转到椭球体上的某个点，将应用以下转换顺序：
 *
 *   1.（小区 ID）：S2 小区 ID
 *   2.（Face， I， J）：叶单元坐标，其中 i 和 j 在 [0， 2^30 - 1] 范围内
 *   3.（Face， S， T）：像元空间坐标，其中 s 和 t 在 [0， 1] 范围内。
 *   4.（面、Si、Ti）：离散单元空间坐标，其中 si 和 ti 在 [0， 2^31] 范围内
 *   5.（面、U、V）：立方体空间坐标，其中 u 和 v 在 [-1， 1] 范围内。我们在这里应用非线性二次变换。
 *   6.（X， Y， Z）：方向向量，其中向量不能为单位长度。可以归一化以获得单位球体上的点
 *   7.（纬度、经度）：方向向量，其中纬度在 [-90， 90] 范围内，经度在 [-180， 180] 范围内
 *
 * @ignore
 */

// The maximum level supported within an S2 cell ID. Each level is represented by two bits in the final cell ID
const S2_MAX_LEVEL = 30;

// The maximum index of a valid leaf cell plus one.  The range of valid leaf cell indices is [0..S2_LIMIT_IJ-1].
const S2_LIMIT_IJ = 1 << S2_MAX_LEVEL;

// The maximum value of an si- or ti-coordinate.  The range of valid (si,ti) values is [0..S2_MAX_SITI].  Use `>>>` to convert to unsigned.
const S2_MAX_SITI = (1 << (S2_MAX_LEVEL + 1)) >>> 0;

// The number of bits in a S2 cell ID used for specifying the position along the Hilbert curve
const S2_POSITION_BITS = 2 * S2_MAX_LEVEL + 1;

// The number of bits per I and J in the lookup tables
const S2_LOOKUP_BITS = 4;

// Lookup table for mapping 10 bits of IJ + orientation to 10 bits of Hilbert curve position + orientation.
const S2_LOOKUP_POSITIONS = [];

// Lookup table for mapping 10 bits of IJ + orientation to 10 bits of Hilbert curve position + orientation.
const S2_LOOKUP_IJ = [];

// Lookup table of two bits of IJ from two bits of curve position, based also on the current curve orientation from the swap and invert bits
const S2_POSITION_TO_IJ = [
  [0, 1, 3, 2], // 0: Normal order, no swap or invert
  [0, 2, 3, 1], // 1: Swap bit set, swap I and J bits
  [3, 2, 0, 1], // 2: Invert bit set, invert bits
  [3, 1, 0, 2], // 3: Swap and invert bits set
];

// Mask that specifies the swap orientation bit for the Hilbert curve
const S2_SWAP_MASK = 1;

// Mask that specifies the invert orientation bit for the Hilbert curve
const S2_INVERT_MASK = 2;

// Lookup for the orientation update mask of one of the four sub-cells within a higher level cell.
// This mask is XOR'ed with the current orientation to get the sub-cell orientation.
const S2_POSITION_TO_ORIENTATION_MASK = [
  S2_SWAP_MASK,
  0,
  0,
  S2_SWAP_MASK | S2_INVERT_MASK,
];

/**
 * 表示 S2 几何图形库中的单元格。
 *
 * @alias S2Cell
 * @constructor
 *
 * @param {bigint} [cellId] The 64-bit S2CellId.
 * @private
 */
function S2Cell(cellId) {
  if (!FeatureDetection.supportsBigInt()) {
    throw new RuntimeError("S2 required BigInt support");
  }
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cellId)) {
    throw new DeveloperError("cell ID is required.");
  }
  if (!S2Cell.isValidId(cellId)) {
    throw new DeveloperError("cell ID is invalid.");
  }
  //>>includeEnd('debug');

  this._cellId = cellId;
  this._level = S2Cell.getLevel(cellId);
}

/**
 * 从令牌创建新的 S2Cell。令牌是 64 位 S2CellId 的十六进制表示形式。
 *
 * @param {string} token S2 Cell 的令牌。
 * @returns {S2Cell} 返回一个新的 S2Cell。
 * @private
 */
S2Cell.fromToken = function (token) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("token", token);
  if (!S2Cell.isValidToken(token)) {
    throw new DeveloperError("token is invalid.");
  }
  //>>includeEnd('debug');

  return new S2Cell(S2Cell.getIdFromToken(token));
};

/**
 * 验证 S2 单元 ID。
 *
 * @param {bigint} [cellId] S2CellId.
 * @returns {boolean} 如果单元格 ID 有效，则返回 true，否则返回 false。
 * @private
 */
S2Cell.isValidId = function (cellId) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.bigint("cellId", cellId);
  //>>includeEnd('debug');

  // Check if sentinel bit is missing.
  if (cellId <= 0) {
    return false;
  }

  // Check if face bits indicate a valid value, in range [0-5].
  // eslint-disable-next-line
  if (cellId >> BigInt(S2_POSITION_BITS) > 5) {
    return false;
  }

  // Check trailing 1 bit is in one of the even bit positions allowed for the 30 levels, using a bitmask.
  // eslint-disable-next-line no-undef
  const lowestSetBit = cellId & (~cellId + BigInt(1));
  // eslint-disable-next-line
  if (!(lowestSetBit & BigInt("0x1555555555555555"))) {
    return false;
  }

  return true;
};

/**
 * 验证 S2 单元令牌。
 *
 * @param {string} [token] S2CellId 的十六进制表示形式。
 * @returns {boolean} 如果令牌有效，则返回 true，否则返回 false。
 * @private
 */
S2Cell.isValidToken = function (token) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("token", token);
  //>>includeEnd('debug');

  if (!/^[0-9a-fA-F]{1,16}$/.test(token)) {
    return false;
  }

  return S2Cell.isValidId(S2Cell.getIdFromToken(token));
};

/**
 * 将 S2 cell token 转换为 64 位 S2 cell ID。
 *
 * @param {string} [token] S2CellId 的十六进制表示形式。应为有效的 S2 令牌。
 * @returns {bigint} 返回 S2 单元格 ID。
 * @private
 */
S2Cell.getIdFromToken = function (token) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("token", token);
  //>>includeEnd('debug');

  return BigInt("0x" + token + "0".repeat(16 - token.length)); // eslint-disable-line
};

/**
 * 将 64 位 S2 Cell ID 转换为 S2 Cell Token。
 *
 * @param {bigint} [cellId] S2 小区 ID。
 * @returns {string} 返回 S2CellId 的十六进制表示形式。
 * @private
 */
S2Cell.getTokenFromId = function (cellId) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.bigint("cellId", cellId);
  //>>includeEnd('debug');

  const trailingZeroHexChars = Math.floor(countTrailingZeroBits(cellId) / 4);
  const hexString = cellId.toString(16).replace(/0*$/, "");

  const zeroString = Array(17 - trailingZeroHexChars - hexString.length).join(
    "0",
  );
  return zeroString + hexString;
};

/**
 * 从单元格 ID 获取单元格的级别。
 *
 * @param {bigint} [cellId] S2 小区 ID。
 * @returns {number} 返回单元格的级别。
 * @private
 */
S2Cell.getLevel = function (cellId) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.bigint("cellId", cellId);
  if (!S2Cell.isValidId(cellId)) {
    throw new DeveloperError();
  }
  //>>includeEnd('debug');

  let lsbPosition = 0;
  // eslint-disable-next-line
  while (cellId !== BigInt(0)) {
    // eslint-disable-next-line
    if (cellId & BigInt(1)) {
      break;
    }
    lsbPosition++;
    cellId = cellId >> BigInt(1); // eslint-disable-line
  }

  // We use (>> 1) because there are 2 bits per level.
  return S2_MAX_LEVEL - (lsbPosition >> 1);
};

/**
 * 获取给定索引处的单元格的子单元格。
 *
 * @param {number} index 子项的整数索引。
 * @returns {S2Cell} S2Cell 的子项。
 * @private
 */
S2Cell.prototype.getChild = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  if (index < 0 || index > 3) {
    throw new DeveloperError("child index must be in the range [0-3].");
  }
  if (this._level === 30) {
    throw new DeveloperError("cannot get child of leaf cell.");
  }
  //>>includeEnd('debug');

  // Shift sentinel bit 2 positions to the right.
  // eslint-disable-next-line no-undef
  const newLsb = lsb(this._cellId) >> BigInt(2);
  // Insert child index before the sentinel bit.
  // eslint-disable-next-line no-undef
  const childCellId = this._cellId + BigInt(2 * index + 1 - 4) * newLsb;
  return new S2Cell(childCellId);
};

/**
 * 获取 S2Cell 的父单元格。
 *
 * @returns {S2Cell} 返回 S2Cell 的父级。
 * @private
 */
S2Cell.prototype.getParent = function () {
  //>>includeStart('debug', pragmas.debug);
  if (this._level === 0) {
    throw new DeveloperError("cannot get parent of root cell.");
  }
  //>>includeEnd('debug');
  // Shift the sentinel bit 2 positions to the left.
  // eslint-disable-next-line no-undef
  const newLsb = lsb(this._cellId) << BigInt(2);
  // Erase the left over bits to the right of the sentinel bit.
  // eslint-disable-next-line no-undef
  return new S2Cell((this._cellId & (~newLsb + BigInt(1))) | newLsb);
};

/**
 * 获取给定级别的父单元格。
 *
 * @returns {S2Cell} 返回 S2Cell 的父级。
 * @private
 */
S2Cell.prototype.getParentAtLevel = function (level) {
  //>>includeStart('debug', pragmas.debug);
  if (this._level === 0 || level < 0 || this._level < level) {
    throw new DeveloperError("cannot get parent at invalid level.");
  }
  //>>includeEnd('debug');
  const newLsb = lsbForLevel(level);
  return new S2Cell((this._cellId & -newLsb) | newLsb);
};

/**
 * 获取 S2 单元格的中心。
 *
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] 椭球体。
 * @returns {Cartesian3} S2 单元的中心位置。
 * @private
 */
S2Cell.prototype.getCenter = function (ellipsoid) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

  let center = getS2Center(this._cellId, this._level);
  // Normalize XYZ.
  center = Cartesian3.normalize(center, center);
  const cartographic = new Cartographic.fromCartesian(
    center,
    Ellipsoid.UNIT_SPHERE,
  );
  // Interpret as geodetic coordinates on the ellipsoid.
  return Cartographic.toCartesian(cartographic, ellipsoid, new Cartesian3());
};

/**
 * 获取 S2 单元的顶点。顶点按 CCW 顺序编制索引。
 *
 * @param {number} index 顶点的整数索引。必须在 [0-3] 范围内。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] 椭球体。
 * @returns {Cartesian3} S2 单元顶点的位置。
 * @private
 */
S2Cell.prototype.getVertex = function (index, ellipsoid) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  if (index < 0 || index > 3) {
    throw new DeveloperError("vertex index must be in the range [0-3].");
  }
  //>>includeEnd('debug');

  ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

  let vertex = getS2Vertex(this._cellId, this._level, index);
  // Normalize XYZ.
  vertex = Cartesian3.normalize(vertex, vertex);
  const cartographic = new Cartographic.fromCartesian(
    vertex,
    Ellipsoid.UNIT_SPHERE,
  );
  // Interpret as geodetic coordinates on the ellipsoid.
  return Cartographic.toCartesian(cartographic, ellipsoid, new Cartesian3());
};

/**
 * 从其面创建一个 S2Cell，该位置沿给定级别的 Hilbert 曲线。
 *
 * @param {number} face 此单元格所在的 S2 的根面。必须在 [0-5] 范围内。
 * @param {bigint} position 沿希尔伯特曲线的位置。必须在 [0-4**级别） 范围内。
 * @param {number} level S2 曲线的级别。必须在 [0-30] 范围内。
 * @returns {S2Cell} 来自给定参数的新 S2Cell。
 * @private
 */
S2Cell.fromFacePositionLevel = function (face, position, level) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.bigint("position", position);
  if (face < 0 || face > 5) {
    throw new DeveloperError("Invalid S2 Face (must be within 0-5)");
  }

  if (level < 0 || level > S2_MAX_LEVEL) {
    throw new DeveloperError("Invalid level (must be within 0-30)");
  }
  if (position < 0 || position >= Math.pow(4, level)) {
    throw new DeveloperError("Invalid Hilbert position for level");
  }
  //>>includeEnd('debug');

  const faceBitString =
    (face < 4 ? "0" : "") + (face < 2 ? "0" : "") + face.toString(2);
  const positionBitString = position.toString(2);
  const positionPrefixPadding = Array(
    2 * level - positionBitString.length + 1,
  ).join("0");
  const positionSuffixPadding = Array(S2_POSITION_BITS - 2 * level).join("0");

  // eslint-disable-next-line no-undef
  const cellId = BigInt(
    `0b${faceBitString}${positionPrefixPadding}${positionBitString}1${
      // Adding the sentinel bit that always follows the position bits.
      positionSuffixPadding
    }`,
  );
  return new S2Cell(cellId);
};

/**
 * @private
 */
function getS2Center(cellId, level) {
  const faceSiTi = convertCellIdToFaceSiTi(cellId, level);
  return convertFaceSiTitoXYZ(faceSiTi[0], faceSiTi[1], faceSiTi[2]);
}
/**
 * @private
 */
function getS2Vertex(cellId, level, index) {
  const faceIJ = convertCellIdToFaceIJ(cellId, level);
  const uv = convertIJLeveltoBoundUV([faceIJ[1], faceIJ[2]], level);
  // Handles CCW ordering of the vertices.
  const y = (index >> 1) & 1;
  return convertFaceUVtoXYZ(faceIJ[0], uv[0][y ^ (index & 1)], uv[1][y]);
}

// S2 Coordinate Conversions

/**
 * @private
 */
function convertCellIdToFaceSiTi(cellId, level) {
  const faceIJ = convertCellIdToFaceIJ(cellId);
  const face = faceIJ[0];
  const i = faceIJ[1];
  const j = faceIJ[2];

  // We're resolving the center when we do the coordinate transform here. For the leaf cells, we're adding half the cell size
  // (remember that this space has 31 levels - which allows us to pick center and edges of the leaf cells). For non leaf cells,
  // we get one of either two cells diagonal to the cell center. The correction is used to make sure we pick the leaf cell edges
  // that represent the parent cell center.
  const isLeaf = level === 30;
  const shouldCorrect =
    !isLeaf && (BigInt(i) ^ (cellId >> BigInt(2))) & BigInt(1); // eslint-disable-line
  const correction = isLeaf ? 1 : shouldCorrect ? 2 : 0;
  const si = (i << 1) + correction;
  const ti = (j << 1) + correction;
  return [face, si, ti];
}

/**
 * @private
 */
function convertCellIdToFaceIJ(cellId) {
  if (S2_LOOKUP_POSITIONS.length === 0) {
    generateLookupTable();
  }

  // eslint-disable-next-line no-undef
  const face = Number(cellId >> BigInt(S2_POSITION_BITS));
  let bits = face & S2_SWAP_MASK;
  const lookupMask = (1 << S2_LOOKUP_BITS) - 1;

  let i = 0;
  let j = 0;

  for (let k = 7; k >= 0; k--) {
    const numberOfBits =
      k === 7 ? S2_MAX_LEVEL - 7 * S2_LOOKUP_BITS : S2_LOOKUP_BITS;
    const extractMask = (1 << (2 * numberOfBits)) - 1;
    bits +=
      Number(
        (cellId >> BigInt(k * 2 * S2_LOOKUP_BITS + 1)) & BigInt(extractMask), // eslint-disable-line
      ) << 2;

    bits = S2_LOOKUP_IJ[bits];

    const offset = k * S2_LOOKUP_BITS;
    i += (bits >> (S2_LOOKUP_BITS + 2)) << offset;
    j += ((bits >> 2) & lookupMask) << offset;

    bits &= S2_SWAP_MASK | S2_INVERT_MASK;
  }

  return [face, i, j];
}

/**
 * @private
 */
function convertFaceSiTitoXYZ(face, si, ti) {
  const s = convertSiTitoST(si);
  const t = convertSiTitoST(ti);

  const u = convertSTtoUV(s);
  const v = convertSTtoUV(t);
  return convertFaceUVtoXYZ(face, u, v);
}

/**
 * @private
 */
function convertFaceUVtoXYZ(face, u, v) {
  switch (face) {
    case 0:
      return new Cartesian3(1, u, v);
    case 1:
      return new Cartesian3(-u, 1, v);
    case 2:
      return new Cartesian3(-u, -v, 1);
    case 3:
      return new Cartesian3(-1, -v, -u);
    case 4:
      return new Cartesian3(v, -1, -u);
    default:
      return new Cartesian3(v, u, -1);
  }
}

/**
 * S2 提供了 3 种非线性变换方法：线性、二次和切向。
 * 此实现使用二次方法，因为它提供了
 * 准确性和速度。
 *
 * 有关这些转换方法的更详细比较，请参阅
 * {@link https://github.com/google/s2geometry/blob/0c4c460bdfe696da303641771f9def900b3e440f/src/s2/s2metrics.cc}
 * @private
 */
function convertSTtoUV(s) {
  if (s >= 0.5) {
    return (1 / 3) * (4 * s * s - 1);
  }
  return (1 / 3) * (1 - 4 * (1 - s) * (1 - s));
}

/**
 * @private
 */
function convertSiTitoST(si) {
  return (1.0 / S2_MAX_SITI) * si;
}

/**
 * @private
 */
function convertIJLeveltoBoundUV(ij, level) {
  const result = [[], []];
  const cellSize = getSizeIJ(level);
  for (let d = 0; d < 2; ++d) {
    const ijLow = ij[d] & -cellSize;
    const ijHigh = ijLow + cellSize;
    result[d][0] = convertSTtoUV(convertIJtoSTMinimum(ijLow));
    result[d][1] = convertSTtoUV(convertIJtoSTMinimum(ijHigh));
  }
  return result;
}

/**
 * @private
 */
function getSizeIJ(level) {
  return (1 << (S2_MAX_LEVEL - level)) >>> 0;
}

/**
 * @private
 */
function convertIJtoSTMinimum(i) {
  return (1.0 / S2_LIMIT_IJ) * i;
}

// Utility Functions

/**
 * 此函数根据 4 级希尔伯特曲线生成 4 级希尔伯特曲线的 4 个变体，S2_POSITION_TO_IJ表用于快速查找 （i， j）
 * 沿希尔伯特曲线定位。参考 C++ 实现使用迭代方法，但是，此函数是实现的
 * 递 归。
 *
 * See {@link https://github.com/google/s2geometry/blob/c59d0ca01ae3976db7f8abdc83fcc871a3a95186/src/s2/s2cell_id.cc#L75-L109}
 * @private
 */
function generateLookupCell(
  level,
  i,
  j,
  originalOrientation,
  position,
  orientation,
) {
  if (level === S2_LOOKUP_BITS) {
    const ij = (i << S2_LOOKUP_BITS) + j;
    S2_LOOKUP_POSITIONS[(ij << 2) + originalOrientation] =
      (position << 2) + orientation;
    S2_LOOKUP_IJ[(position << 2) + originalOrientation] =
      (ij << 2) + orientation;
  } else {
    level++;
    i <<= 1;
    j <<= 1;
    position <<= 2;
    const r = S2_POSITION_TO_IJ[orientation];
    generateLookupCell(
      level,
      i + (r[0] >> 1),
      j + (r[0] & 1),
      originalOrientation,
      position,
      orientation ^ S2_POSITION_TO_ORIENTATION_MASK[0],
    );
    generateLookupCell(
      level,
      i + (r[1] >> 1),
      j + (r[1] & 1),
      originalOrientation,
      position + 1,
      orientation ^ S2_POSITION_TO_ORIENTATION_MASK[1],
    );
    generateLookupCell(
      level,
      i + (r[2] >> 1),
      j + (r[2] & 1),
      originalOrientation,
      position + 2,
      orientation ^ S2_POSITION_TO_ORIENTATION_MASK[2],
    );
    generateLookupCell(
      level,
      i + (r[3] >> 1),
      j + (r[3] & 1),
      originalOrientation,
      position + 3,
      orientation ^ S2_POSITION_TO_ORIENTATION_MASK[3],
    );
  }
}

/**
 * @private
 */
function generateLookupTable() {
  generateLookupCell(0, 0, 0, 0, 0, 0);
  generateLookupCell(0, 0, 0, S2_SWAP_MASK, 0, S2_SWAP_MASK);
  generateLookupCell(0, 0, 0, S2_INVERT_MASK, 0, S2_INVERT_MASK);
  generateLookupCell(
    0,
    0,
    0,
    S2_SWAP_MASK | S2_INVERT_MASK,
    0,
    S2_SWAP_MASK | S2_INVERT_MASK,
  );
}

/**
 * 返回此小区 ID 的最低编号位
 * @private
 */
function lsb(cellId) {
  return cellId & (~cellId + BigInt(1)); // eslint-disable-line
}

/**
 * 返回给定级别的 cells 的最低编号位。
 * @private
 */
function lsbForLevel(level) {
  return BigInt(1) << BigInt(2 * (S2_MAX_LEVEL - level)); // eslint-disable-line
}

// Lookup table for getting trailing zero bits.
// https://graphics.stanford.edu/~seander/bithacks.html
const Mod67BitPosition = [
  64, 0, 1, 39, 2, 15, 40, 23, 3, 12, 16, 59, 41, 19, 24, 54, 4, 64, 13, 10, 17,
  62, 60, 28, 42, 30, 20, 51, 25, 44, 55, 47, 5, 32, 65, 38, 14, 22, 11, 58, 18,
  53, 63, 9, 61, 27, 29, 50, 43, 46, 31, 37, 21, 57, 52, 8, 26, 49, 45, 36, 56,
  7, 48, 35, 6, 34, 33, 0,
];

/**
 * 返回 number 中尾随 0 的个数。
 * @private
 */
function countTrailingZeroBits(x) {
  return Mod67BitPosition[(-x & x) % BigInt(67)]; // eslint-disable-line
}

export default S2Cell;
