/**
 * Internal class for texture coordinate and index range computations.
 *
 * @private
 */
class CartesianRectangle {
  /**
   * 创建一个新实例
   *
   * @param {number} [minX=0] 最小x坐标
   * @param {number} [minY=0] 最小y坐标
   * @param {number} [maxX=0] 最大x坐标
   * @param {number} [maxY=0] 最大y坐标
   */
  constructor(minX, minY, maxX, maxY) {
    this._minX = minX ?? 0.0;
    this._minY = minY ?? 0.0;
    this._maxX = maxX ?? 0.0;
    this._maxY = maxY ?? 0.0;
  }

  /**
   * 返回最小x坐标
   *
   * @returns {number} 坐标值
   */
  get minX() {
    return this._minX;
  }
  set minX(value) {
    this._minX = value;
  }

  /**
   * 返回最小y坐标
   *
   * @returns {number} 坐标值
   */
  get minY() {
    return this._minY;
  }
  set minY(value) {
    this._minY = value;
  }

  /**
   * 返回最大x坐标
   *
   * @returns {number} 坐标值
   */
  get maxX() {
    return this._maxX;
  }
  set maxX(value) {
    this._maxX = value;
  }

  /**
   * 返回最大y坐标
   *
   * @returns {number} 坐标值
   */
  get maxY() {
    return this._maxY;
  }
  set maxY(value) {
    this._maxY = value;
  }

  /**
   * 返回此矩形是否包含给定坐标，
   * 使用默认的包含检查，包含最小点，
   * 但不包含最大点
   *
   * @param {number} x x坐标
   * @param {number} y y坐标
   * @returns {boolean} 结果
   */
  contains(x, y) {
    return x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY;
  }

  /**
   * 返回此矩形是否包含给定坐标，
   * 不包含边界
   *
   * @param {number} x x坐标
   * @param {number} y y坐标
   * @returns {boolean} 结果
   */
  containsExclusive(x, y) {
    return x > this.minX && x < this.maxX && y > this.minY && y < this.maxY;
  }

  /**
   * 返回此矩形是否包含给定坐标，
   * 包含边界
   *
   * @param {number} x x坐标
   * @param {number} y y坐标
   * @returns {boolean} 结果
   */
  containsInclusive(x, y) {
    return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
  }
}

export default CartesianRectangle;
