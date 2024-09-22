import defined from "./defined.js";

/**
 * 定义多边形及其孔的线性环的层次结构。
 * 孔本身也可能具有嵌套内部多边形的孔。
 * @alias PolygonHierarchy
 * @constructor
 *
 * @param {Cartesian3[]} [positions] 定义多边形或孔的外边界的线性环。
 * @param {PolygonHierarchy[]} [holes] 定义多边形中孔的多边形层次结构数组。
 */
function PolygonHierarchy(positions, holes) {
  /**
   * 定义多边形或孔的外边界的线性环。
   * @type {Cartesian3[]}
   */
  this.positions = defined(positions) ? positions : [];

  /**
   * 定义多边形中孔的多边形层次结构数组。
   * @type {PolygonHierarchy[]}
   */
  this.holes = defined(holes) ? holes : [];
}
export default PolygonHierarchy;
