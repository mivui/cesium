import DeveloperError from "../Core/DeveloperError.js";

/**
 * 光源。此类型描述接口，不打算直接实例化。<code>颜色</code>和<code>强度</code>共同产生高动态范围的光色。<code>Intensity</code> 也可以单独用于在不改变色调的情况下调暗或调亮光线。
 *
 * @alias Light
 * @constructor
 *
 * @see DirectionalLight
 * @see SunLight
 */
function Light() {}

Object.defineProperties(Light.prototype, {
  /**
   * 光的颜色。
   * @memberof Light.prototype
   * @type {Color}
   */
  color: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 强度控制光线的强度。<code>强度</code>的最小值为 0.0，没有最大值。
   * @memberof Light.prototype
   * @type {number}
   */
  intensity: {
    get: DeveloperError.throwInstantiationError,
  },
});

export default Light;
