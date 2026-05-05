import defined from "./defined.js";

/**
 * 定义多边形及其孔洞的线性环层次结构。
 * 孔洞本身也可以包含嵌套内部多边形的孔洞。
 * @alias PolygonHierarchy
 * @constructor
 *
 * @param {Cartesian3[]} [positions] 定义多边形或孔洞外边界的线性环。
 * @param {PolygonHierarchy[]} [holes] 定义多边形中孔洞的多边形层次结构数组。
 */
function PolygonHierarchy(positions, holes) {
  /**
   * 定义多边形或孔洞外边界的线性环。
   * @type {Cartesian3[]}
   */
  this.positions = defined(positions) ? positions : [];

  /**
   * 定义多边形中孔洞的多边形层次结构数组。
   * @type {PolygonHierarchy[]}
   */
  this.holes = defined(holes) ? holes : [];
}
export default PolygonHierarchy;
