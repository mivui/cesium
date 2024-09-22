import Cartesian3 from "../Core/Cartesian3.js";
import DynamicAtmosphereLightingType from "./DynamicAtmosphereLightingType.js";

/**
 * 3D 瓦片和模型用于渲染天空大气、地面大气和雾的常见大气设置。
 *
 * <p>
 * 不要将此类与负责渲染天空的 {@link SkyAtmosphere} 混淆。
 * </p>
 * <p>
 * 虽然大气设置会影响雾的颜色，请参阅 {@link Fog} 来控制雾的渲染方式。
 * </p>
 *
 * @alias Atmosphere
 * @constructor
 *
 * @example
 * // Turn on dynamic atmosphere lighting using the sun direction
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SUNLIGHT;
 *
 * @example
 * // Turn on dynamic lighting using whatever light source is in the scene
 * scene.light = new Cesium.DirectionalLight({
 *   direction: new Cesium.Cartesian3(1, 0, 0)
 * });
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SCENE_LIGHT;
 *
 * @example
 * // Adjust the color of the atmosphere effects.
 * scene.atmosphere.hueShift = 0.4; // Cycle 40% around the color wheel
 * scene.atmosphere.brightnessShift = 0.25; // Increase the brightness
 * scene.atmosphere.saturationShift = -0.1; // Desaturate the colors
 *
 * @see SkyAtmosphere
 * @see Globe
 * @see Fog
 */
function Atmosphere() {
  /**
   * 用于计算地面大气颜色的光的强度。
   *
   * @type {number}
   * @default 10.0
   */
  this.lightIntensity = 10.0;

  /**
   * 地面大气的大气散射方程中使用的瑞利散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
   */
  this.rayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

  /**
   * 地面大气的大气散射方程中使用的 Mie 散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(21e-6, 21e-6, 21e-6)
   */
  this.mieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

  /**
   * 地面大气的大气散射方程中使用的瑞利标尺高度，以米为单位。
   *
   * @type {number}
   * @default 10000.0
   */
  this.rayleighScaleHeight = 10000.0;

  /**
   * 地面大气的大气散射方程中使用的 Mie 标尺高度，以米为单位。
   *
   * @type {number}
   * @default 3200.0
   */
  this.mieScaleHeight = 3200.0;

  /**
   * 米氏散射要考虑的介质的各向异性。
   * <p>
   * 有效值介于 -1.0 和 1.0 之间。
   * </p>
   *
   * @type {number}
   * @default 0.9
   */
  this.mieAnisotropy = 0.9;

  /**
   * 应用于大气的色相偏移。默认为 0.0（无偏移）。
   * 色相偏移 1.0 表示可用色相完全旋转。
   *
   * @type {number}
   * @default 0.0
   */
  this.hueShift = 0.0;

  /**
   * 应用于大气的饱和度偏移。默认为 0.0（无偏移）。
   * -1.0 的饱和度偏移为单色。
   *
   * @type {number}
   * @default 0.0
   */
  this.saturationShift = 0.0;

  /**
   * 应用于大气的亮度偏移。默认为 0.0（无偏移）。
   * -1.0 的亮度偏移是完全黑暗的，这将使空间透出。
   *
   * @type {number}
   * @default 0.0
   */
  this.brightnessShift = 0.0;

  /**
   * 当不是 DynamicAtmosphereLightingType.NONE 时，所选光源将会
   * 用于动态照亮所有与大气相关的渲染效果。
   *
   * @type {DynamicAtmosphereLightingType}
   * @default DynamicAtmosphereLightingType.NONE
   */
  this.dynamicLighting = DynamicAtmosphereLightingType.NONE;
}

export default Atmosphere;
