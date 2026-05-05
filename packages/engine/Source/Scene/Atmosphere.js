import Cartesian3 from "../Core/Cartesian3.js";
import CesiumMath from "../Core/Math.js";
import DynamicAtmosphereLightingType from "./DynamicAtmosphereLightingType.js";

/**
 * 3D Tiles 和模型用于渲染天空大气、地面大气和雾的共同大气设置。
 *
 * <p>
 * 不要将此类与 {@link SkyAtmosphere} 混淆，后者负责渲染天空。
 * </p>
 * <p>
 * 虽然大气设置会影响雾的颜色，但请参阅 {@link Fog} 以控制雾的渲染方式。
 * </p>
 *
 * @alias Atmosphere
 * @constructor
 *
 * @example
 * // 使用太阳方向开启动态大气光照
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SUNLIGHT;
 *
 * @example
 * // 使用场景中的任何光源开启动态光照
 * scene.light = new Cesium.DirectionalLight({
 *   direction: new Cesium.Cartesian3(1, 0, 0)
 * });
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SCENE_LIGHT;
 *
 * @example
 * // 调整大气效果的颜色。
 * scene.atmosphere.hueShift = 0.4; // 在色轮上循环 40%
 * scene.atmosphere.brightnessShift = 0.25; // 增加亮度
 * scene.atmosphere.saturationShift = -0.1; // 降低颜色饱和度
 *
 * @see SkyAtmosphere
 * @see Globe
 * @see Fog
 */
function Atmosphere() {
   /**
    * 用于计算地面大气颜色的光照强度。
    *
    * @type {number}
    * @default 10.0
    */
  this.lightIntensity = 10.0;

   /**
    * 用于地面大气大气散射方程中的瑞利散射系数。
    *
    * @type {Cartesian3}
    * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
    */
  this.rayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

   /**
    * 用于地面大气大气散射方程中的米氏散射系数。
    *
    * @type {Cartesian3}
    * @default Cartesian3(21e-6, 21e-6, 21e-6)
    */
  this.mieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

   /**
    * 用于地面大气大气散射方程中的瑞利标高，单位为米。
    *
    * @type {number}
    * @default 10000.0
    */
  this.rayleighScaleHeight = 10000.0;

   /**
    * 用于地面大气大气散射方程中的米氏标高，单位为米。
    *
    * @type {number}
    * @default 3200.0
    */
  this.mieScaleHeight = 3200.0;

   /**
    * 用于米氏散射的介质各向异性。
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
    * 色相偏移 1.0 表示可用色相的完整旋转。
    *
    * @type {number}
    * @default 0.0
    */
  this.hueShift = 0.0;

   /**
    * 应用于大气的饱和度偏移。默认为 0.0（无偏移）。
    * 饱和度偏移 -1.0 表示单色。
    *
    * @type {number}
    * @default 0.0
    */
  this.saturationShift = 0.0;

   /**
    * 应用于大气的亮度偏移。默认为 0.0（无偏移）。
    * 亮度偏移 -1.0 表示完全黑暗，这将让太空显示出来。
    *
    * @type {number}
    * @default 0.0
    */
  this.brightnessShift = 0.0;

   /**
    * 当不为 DynamicAtmosphereLightingType.NONE 时，所选光源将用于动态照亮所有与大气相关的渲染效果。
    *
    * @type {DynamicAtmosphereLightingType}
    * @default DynamicAtmosphereLightingType.NONE
    */
  this.dynamicLighting = DynamicAtmosphereLightingType.NONE;
}

/**
 * 如果大气着色器需要颜色校正步骤，则返回 <code>true</code>。
 * @param {Atmosphere} atmosphere 要检查的大气实例
 * @returns {boolean} 如果大气着色器需要颜色校正步骤则返回 true
 */
Atmosphere.requiresColorCorrect = function (atmosphere) {
  return !(
    CesiumMath.equalsEpsilon(atmosphere.hueShift, 0.0, CesiumMath.EPSILON7) &&
    CesiumMath.equalsEpsilon(
      atmosphere.saturationShift,
      0.0,
      CesiumMath.EPSILON7,
    ) &&
    CesiumMath.equalsEpsilon(
      atmosphere.brightnessShift,
      0.0,
      CesiumMath.EPSILON7,
    )
  );
};

export default Atmosphere;
