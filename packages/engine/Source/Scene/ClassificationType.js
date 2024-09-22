/**
 * 分类是否影响地形、3D 瓦片或两者。
 *
 * @enum {number}
 */
const ClassificationType = {
  /**
   * 仅对地形进行分类。
   *
   * @type {number}
   * @constant
   */
  TERRAIN: 0,
  /**
   * 仅对 3D 图块进行分类。
   *
   * @type {number}
   * @constant
   */
  CESIUM_3D_TILE: 1,
  /**
   * 地形和 3D 瓦片都将被分类。
   *
   * @type {number}
   * @constant
   */
  BOTH: 2,
};

/**
 * @private
 */
ClassificationType.NUMBER_OF_CLASSIFICATION_TYPES = 3;

export default Object.freeze(ClassificationType);
