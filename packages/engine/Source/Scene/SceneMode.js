/**
 * 指示场景是从 3D、2D 还是 2.5D Columbus 视图观察的。
 *
 * @enum {number}
 * @see Scene#mode
 */
const SceneMode = {
  /**
   * 模式之间的过渡，例如从 3D 到 2D。
   *
   * @type {number}
   * @constant
   */
  MORPHING: 0,

  /**
   * Columbus 视图模式。2.5D 透视视图，地图平铺展开，
   * 具有非零高度的物体绘制在其上方。
   *
   * @type {number}
   * @constant
   */
  COLUMBUS_VIEW: 1,

  /**
   * 2D 模式。使用正交投影从正上方查看地图。
   *
   * @type {number}
   * @constant
   */
  SCENE2D: 2,

  /**
   * 3D 模式。传统的 3D 透视视图。
   *
   * @type {number}
   * @constant
   */
  SCENE3D: 3,
};

/**
 * 返回给定场景模式的过渡时间。
 *
 * @param {SceneMode} value 场景模式
 * @returns {number} 过渡时间
 */
SceneMode.getMorphTime = function (value) {
  if (value === SceneMode.SCENE3D) {
    return 1.0;
  } else if (value === SceneMode.MORPHING) {
    return undefined;
  }
  return 0.0;
};

Object.freeze(SceneMode);

export default SceneMode;
