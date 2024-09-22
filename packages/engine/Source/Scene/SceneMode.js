/**
 * 指示场景是以 3D、2D 还是 2.5D 哥伦布视图查看。
 *
 * @enum {number}
 * @see Scene#mode
 */
const SceneMode = {
  /**
   * 在模式之间变形，例如，从 3D 到 2D。
   *
   * @type {number}
   * @constant
   */
  MORPHING: 0,

  /**
   * 哥伦布视图模式。 地图布局的 2.5D 透视图
   * 平面和高度不为零的对象将绘制在其上方。
   *
   * @type {number}
   * @constant
   */
  COLUMBUS_VIEW: 1,

  /**
   * 2D 模式。 地图使用正交投影自上而下查看。
   *
   * @type {number}
   * @constant
   */
  SCENE2D: 2,

  /**
   * 3D 模式。 地球的传统 3D 透视图。
   *
   * @type {number}
   * @constant
   */
  SCENE3D: 3,
};

/**
 * 返回给定场景模式的变形时间。
 *
 * @param {SceneMode} 值 场景模式
 * @returns {number} 变形时间
 */
SceneMode.getMorphTime = function (value) {
  if (value === SceneMode.SCENE3D) {
    return 1.0;
  } else if (value === SceneMode.MORPHING) {
    return undefined;
  }
  return 0.0;
};
export default Object.freeze(SceneMode);
