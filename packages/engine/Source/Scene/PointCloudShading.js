import defaultValue from "../Core/defaultValue.js";
import PointCloudEyeDomeLighting from "./PointCloudEyeDomeLighting.js";

/**
 * 渲染时根据几何误差执行点衰减的选项
 * 使用 3D 瓦片的点云。
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.attenuation=false] 根据几何误差执行点衰减。
 * @param {number} [options.geometricErrorScale=1.0] 应用于每个图块的几何误差的比例。
 * @param {number} [options.maximumAttenuation] 最大衰减（以像素为单位）。默认为 Cesium3DTileset 的 maximumScreenSpaceError。
 * @param {number} [options.baseResolution] 数据集的平均基本分辨率（以米为单位）。Substitute for Geometric Error （几何误差） （如果不可用）。
 * @param {boolean} [options.eyeDomeLighting=true] 如果为 true，则在使用点衰减进行绘制时使用眼球照明。
 * @param {number} [options.eyeDomeLightingStrength=1.0] 增加此值会增加斜坡和边缘的对比度。
 * @param {number} [options.eyeDomeLightingRadius=1.0] 增加眼球照明的轮廓厚度。
 * @param {boolean} [options.backFaceCulling=false] 确定是否隐藏背面的点。仅当数据包含法线时，此选项才有效。
 * @param {boolean} [options.normalShading=true] 确定包含法线的点云是否由场景的光源着色。
 *
 * @alias PointCloudShading
 * @constructor
 */
function PointCloudShading(options) {
  const pointCloudShading = defaultValue(options, {});

  /**
   * Perform point attenuation based on geometric error.
   * @type {boolean}
   * @default false
   */
  this.attenuation = defaultValue(pointCloudShading.attenuation, false);

  /**
   * 在计算衰减之前应用于几何误差的比例。
   * @type {number}
   * @default 1.0
   */
  this.geometricErrorScale = defaultValue(
    pointCloudShading.geometricErrorScale,
    1.0,
  );

  /**
   * 最大点衰减（以像素为单位）。如果未定义，则将使用 Cesium3DTileset 的 maximumScreenSpaceError。
   * @type {number}
   */
  this.maximumAttenuation = pointCloudShading.maximumAttenuation;

  /**
   * 数据集的平均基本分辨率（以米为单位）。
   * 当几何误差为 0 时，用于代替几何误差。
   * 如果未定义，则将为几何误差为 0 的每个瓦片计算近似值。
   * @type {number}
   */
  this.baseResolution = pointCloudShading.baseResolution;

  /**
   * 使用点衰减绘图时使用眼球照明
   * 需要支持 WebGL 1.0 中的 EXT_frag_depth、OES_texture_float 和 WEBGL_draw_buffers 扩展，
   * 否则，将忽略 Eye Dome 照明。
   *
   * @type {boolean}
   * @default true
   */
  this.eyeDomeLighting = defaultValue(pointCloudShading.eyeDomeLighting, true);

  /**
   * 眼球照明强度（表观对比度）
   * @type {number}
   * @default 1.0
   */
  this.eyeDomeLightingStrength = defaultValue(
    pointCloudShading.eyeDomeLightingStrength,
    1.0,
  );

  /**
   * 眼球照明的轮廓厚度
   * @type {number}
   * @default 1.0
   */
  this.eyeDomeLightingRadius = defaultValue(
    pointCloudShading.eyeDomeLightingRadius,
    1.0,
  );

  /**
   * 确定是否隐藏背面的点。
   * 仅当数据包含法线时，此选项才有效。
   *
   * @type {boolean}
   * @default false
   */
  this.backFaceCulling = defaultValue(pointCloudShading.backFaceCulling, false);

  /**
   * 确定包含法线的点云是否由场景的光源着色。
   *
   * @type {boolean}
   * @default true
   */
  this.normalShading = defaultValue(pointCloudShading.normalShading, true);
}

/**
 * 确定是否支持点云着色。
 *
 * @param {Scene} scene 场景。
 * @returns {boolean} <code>true</code>（如果支持点云着色）;否则，返回 <code>false</code>
 */
PointCloudShading.isSupported = function (scene) {
  return PointCloudEyeDomeLighting.isSupported(scene.context);
};
export default PointCloudShading;
