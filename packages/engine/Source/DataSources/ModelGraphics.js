import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import NodeTransformationProperty from "./NodeTransformationProperty.js";
import PropertyBag from "./PropertyBag.js";

function createNodeTransformationProperty(value) {
  return new NodeTransformationProperty(value);
}

function createNodeTransformationPropertyBag(value) {
  return new PropertyBag(value, createNodeTransformationProperty);
}

function createArticulationStagePropertyBag(value) {
  return new PropertyBag(value);
}

function createEnvironmentMapPropertyBag(value) {
  return new PropertyBag(value);
}

/**
 * @typedef {object} ModelGraphics.ConstructorOptions
 *
 * ModelGraphics构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定模型可见性的布尔属性。
 * @property {Property | string | Resource} [uri] 指定glTF资源URI的字符串或Resource属性。
 * @property {Property | number} [scale=1.0] 指定均匀线性缩放的数值属性。
 * @property {Property | boolean} [enableVerticalExaggeration=true] 指定当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 值时，模型是否沿椭圆体法线夸张的布尔属性。
 * @property {Property | number} [minimumPixelSize=0.0] 指定模型近似最小像素大小（无论缩放如何）的数值属性。
 * @property {Property | number} [maximumScale] 模型的最大缩放大小。minimumPixelSize的上限。
 * @property {Property | boolean} [incrementallyLoadTextures=true] 确定模型加载后纹理是否继续流式传输。
 * @property {Property | boolean} [runAnimations=true] 指定是否启动模型中指定的glTF动画的布尔属性。
 * @property {Property | boolean} [clampAnimations=true] 指定glTF动画是否在没有关键帧的时间段保持最后一帧姿势的布尔属性。
 * @property {Property | ShadowMode} [shadows=ShadowMode.ENABLED] 指定模型是否从光源投射或接收阴影的枚举属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对参照的属性。
 * @property {Property | Color} [silhouetteColor=Color.RED] 指定轮廓 {@link Color} 的属性。
 * @property {Property | number} [silhouetteSize=0.0] 指定轮廓大小（像素）的数值属性。
 * @property {Property | Color} [color=Color.WHITE] 指定与模型渲染颜色混合的 {@link Color} 的属性。
 * @property {Property | ColorBlendMode} [colorBlendMode=ColorBlendMode.HIGHLIGHT] 指定颜色如何与模型混合的枚举属性。
 * @property {Property | number} [colorBlendAmount=0.5] 当 <code>colorBlendMode</code> 为 <code>MIX</code> 时指定颜色强度的数值属性。值为0.0时显示模型渲染颜色，值为1.0时显示纯色，中间值则为两者混合。
 * @property {Property | Cartesian2} [imageBasedLightingFactor=new Cartesian2(1.0, 1.0)] 指定漫反射和镜面反射基于图像的照明贡献的属性。
 * @property {PropertyBag | Object<string, *>} [environmentMapOptions] 用于管理此实体上动态环境贴图的属性。
 * @property {Property | Color} [lightColor] 指定着色模型时灯光颜色的属性。当 <code>undefined</code> 时使用场景的灯光颜色。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定模型在距离相机多远时显示的属性。
 * @property {PropertyBag | Object<string, TranslationRotationScale>} [nodeTransformations] 一个对象，键为节点名称，值为描述要应用于该节点的变换的 {@link TranslationRotationScale} 属性。该变换在glTF中指定的节点现有变换之后应用，不替换节点的现有变换。
 * @property {PropertyBag | Object<string, number>} [articulations] 一个对象，键由关节名称、单个空格和阶段名称组成，值为数值属性。
 * @property {Property | ClippingPlaneCollection} [clippingPlanes] 指定用于选择性禁用模型渲染的 {@link ClippingPlaneCollection} 的属性。
 * @property {Property | CustomShader} [customShader] 指定要应用于此模型的 {@link CustomShader} 的属性。
 */

/**
 * 基于 {@link https://github.com/KhronosGroup/glTF|glTF}（WebGL、OpenGL ES和OpenGL的运行时资源格式）的3D模型。
 * 模型的位置和方向由包含的 {@link Entity} 决定。
 * <p>
 * Cesium支持glTF几何、材质、动画和蒙皮。
 * 当前不支持摄像机和灯光。
 * </p>
 *
 * @alias ModelGraphics
 * @constructor
 *
 * @param {ModelGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=3d-models|Cesium Sandcastle 3D模型演示}
 */
function ModelGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._uri = undefined;
  this._uriSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;
  this._hasVerticalExaggeration = undefined;
  this._hasVerticalExaggerationSubscription = undefined;
  this._enableVerticalExaggeration = undefined;
  this._enableVerticalExaggerationSubscription = undefined;
  this._minimumPixelSize = undefined;
  this._minimumPixelSizeSubscription = undefined;
  this._maximumScale = undefined;
  this._maximumScaleSubscription = undefined;
  this._incrementallyLoadTextures = undefined;
  this._incrementallyLoadTexturesSubscription = undefined;
  this._runAnimations = undefined;
  this._runAnimationsSubscription = undefined;
  this._clampAnimations = undefined;
  this._clampAnimationsSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._silhouetteColor = undefined;
  this._silhouetteColorSubscription = undefined;
  this._silhouetteSize = undefined;
  this._silhouetteSizeSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._colorBlendMode = undefined;
  this._colorBlendModeSubscription = undefined;
  this._colorBlendAmount = undefined;
  this._colorBlendAmountSubscription = undefined;
  this._imageBasedLightingFactor = undefined;
  this._imageBasedLightingFactorSubscription = undefined;
  this._environmentMapOptions = undefined;
  this._environmentMapOptionsSubscription = undefined;
  this._lightColor = undefined;
  this._lightColorSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._nodeTransformations = undefined;
  this._nodeTransformationsSubscription = undefined;
  this._articulations = undefined;
  this._articulationsSubscription = undefined;
  this._clippingPlanes = undefined;
  this._clippingPlanesSubscription = undefined;
  this._customShader = undefined;
  this._customShaderSubscription = undefined;

  this.merge(options ?? Frozen.EMPTY_OBJECT);
}

Object.defineProperties(ModelGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof ModelGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置指定模型可见性的布尔属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定glTF资源URI的字符串属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  uri: createPropertyDescriptor("uri"),

  /**
   * 获取或设置指定此模型均匀线性缩放的数值属性。
   * 大于1.0的值会增大模型尺寸，小于1.0的值会减小模型尺寸。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 值时，模型是否沿椭圆体法线夸张的布尔属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  enableVerticalExaggeration: createPropertyDescriptor(
    "enableVerticalExaggeration",
  ),

  /**
   * 获取或设置指定模型近似最小像素大小（无论缩放如何）的数值属性。
   * 这可用于确保即使观察者缩小时模型仍然可见。当 <code>0.0</code> 时不强制最小尺寸。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumPixelSize: createPropertyDescriptor("minimumPixelSize"),

  /**
   * 获取或设置指定模型最大缩放大小的数值属性。
   * 此属性用作 {@link ModelGraphics#minimumPixelSize} 的上限。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  maximumScale: createPropertyDescriptor("maximumScale"),

  /**
   * 获取或设置指定模型加载后纹理是否继续流式传输的布尔属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  incrementallyLoadTextures: createPropertyDescriptor(
    "incrementallyLoadTextures",
  ),

  /**
   * 获取或设置指定是否运行glTF动画的布尔属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  runAnimations: createPropertyDescriptor("runAnimations"),

  /**
   * 获取或设置指定glTF动画是否在没有关键帧的时间段保持最后一帧姿势的布尔属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  clampAnimations: createPropertyDescriptor("clampAnimations"),

  /**
   * 获取或设置指定模型是否从光源投射或接收阴影的枚举属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.ENABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定轮廓 {@link Color} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default Color.RED
   */
  silhouetteColor: createPropertyDescriptor("silhouetteColor"),

  /**
   * 获取或设置指定轮廓大小（像素）的数值属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  silhouetteSize: createPropertyDescriptor("silhouetteSize"),

  /**
   * 获取或设置指定与模型渲染颜色混合的 {@link Color} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定颜色如何与模型混合的枚举属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default ColorBlendMode.HIGHLIGHT
   */
  colorBlendMode: createPropertyDescriptor("colorBlendMode"),

  /**
   * 指定当 <code>colorBlendMode</code> 为MIX时的颜色强度的数值属性。
   * 值为0.0时显示模型渲染颜色，值为1.0时显示纯色，中间值则为两者混合。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.5
   */
  colorBlendAmount: createPropertyDescriptor("colorBlendAmount"),

  /**
   * 指定用于缩放漫反射和镜面反射基于图像的照明对最终颜色贡献的 {@link Cartesian2} 属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  imageBasedLightingFactor: createPropertyDescriptor(
    "imageBasedLightingFactor",
  ),

  /**
   * 获取或设置要应用于此模型的 {@link DynamicEnvironmentMapManager.ConstructorOptions}。这表示为 {@link PropertyBag}。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  environmentMapOptions: createPropertyDescriptor(
    "environmentMapOptions",
    undefined,
    createEnvironmentMapPropertyBag,
  ),

  /**
   * 指定着色模型时的 {@link Cartesian3} 灯光颜色的属性。当 <code>undefined</code> 时使用场景的灯光颜色。
   * @memberOf ModelGraphics.prototype
   * @type {Property|undefined}
   */
  lightColor: createPropertyDescriptor("lightColor"),

  /**
   * 获取或设置指定模型在距离相机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置要应用于此模型的节点变换集合。这表示为 {@link PropertyBag}，其中键是节点名称，值是描述要应用于该节点的变换的 {@link TranslationRotationScale} 属性。
   * 该变换在glTF中指定的节点现有变换之后应用，不替换节点的现有变换。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  nodeTransformations: createPropertyDescriptor(
    "nodeTransformations",
    undefined,
    createNodeTransformationPropertyBag,
  ),

  /**
   * 获取或设置要应用于此模型的关节值集合。这表示为 {@link PropertyBag}，其中键由关节名称、单个空格和阶段名称组成。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  articulations: createPropertyDescriptor(
    "articulations",
    undefined,
    createArticulationStagePropertyBag,
  ),

  /**
   * 指定用于选择性禁用模型渲染的 {@link ClippingPlaneCollection} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  clippingPlanes: createPropertyDescriptor("clippingPlanes"),

  /**
   * 获取或设置要应用于此模型的 {@link CustomShader}。当 <code>undefined</code> 时不使用自定义着色器代码。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  customShader: createPropertyDescriptor("customShader"),
});

/**
 * 复制此实例。
 *
 * @param {ModelGraphics} [result] 存储结果的对象。
 * @returns {ModelGraphics} 修改后的结果参数，如果未提供则返回新实例。
 */
ModelGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new ModelGraphics(this);
  }
  result.show = this.show;
  result.uri = this.uri;
  result.scale = this.scale;
  result.enableVerticalExaggeration = this.enableVerticalExaggeration;
  result.minimumPixelSize = this.minimumPixelSize;
  result.maximumScale = this.maximumScale;
  result.incrementallyLoadTextures = this.incrementallyLoadTextures;
  result.runAnimations = this.runAnimations;
  result.clampAnimations = this.clampAnimations;
  result.heightReference = this._heightReference;
  result.silhouetteColor = this.silhouetteColor;
  result.silhouetteSize = this.silhouetteSize;
  result.color = this.color;
  result.colorBlendMode = this.colorBlendMode;
  result.colorBlendAmount = this.colorBlendAmount;
  result.imageBasedLightingFactor = this.imageBasedLightingFactor;
  result.environmentMapOptions = this.environmentMapOptions;
  result.lightColor = this.lightColor;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.nodeTransformations = this.nodeTransformations;
  result.articulations = this.articulations;
  result.clippingPlanes = this.clippingPlanes;
  result.customShader = this.customShader;
  return result;
};

/**
 * 将此对象上每个未赋值的属性分配给提供的源对象上相同属性的值。
 *
 * @param {ModelGraphics} source 要合并到此对象中的对象。
 */
ModelGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = this.show ?? source.show;
  this.uri = this.uri ?? source.uri;
  this.scale = this.scale ?? source.scale;
  this.enableVerticalExaggeration =
    this.enableVerticalExaggeration ?? source.enableVerticalExaggeration;
  this.minimumPixelSize = this.minimumPixelSize ?? source.minimumPixelSize;
  this.maximumScale = this.maximumScale ?? source.maximumScale;
  this.incrementallyLoadTextures =
    this.incrementallyLoadTextures ?? source.incrementallyLoadTextures;
  this.runAnimations = this.runAnimations ?? source.runAnimations;
  this.clampAnimations = this.clampAnimations ?? source.clampAnimations;
  this.shadows = this.shadows ?? source.shadows;
  this.heightReference = this.heightReference ?? source.heightReference;
  this.silhouetteColor = this.silhouetteColor ?? source.silhouetteColor;
  this.silhouetteSize = this.silhouetteSize ?? source.silhouetteSize;
  this.color = this.color ?? source.color;
  this.colorBlendMode = this.colorBlendMode ?? source.colorBlendMode;
  this.colorBlendAmount = this.colorBlendAmount ?? source.colorBlendAmount;
  this.imageBasedLightingFactor =
    this.imageBasedLightingFactor ?? source.imageBasedLightingFactor;
  this.environmentMapOptions =
    this.environmentMapOptions ?? source.environmentMapOptions;
  this.lightColor = this.lightColor ?? source.lightColor;
  this.distanceDisplayCondition =
    this.distanceDisplayCondition ?? source.distanceDisplayCondition;
  this.clippingPlanes = this.clippingPlanes ?? source.clippingPlanes;
  this.customShader = this.customShader ?? source.customShader;

  const sourceNodeTransformations = source.nodeTransformations;
  if (defined(sourceNodeTransformations)) {
    const targetNodeTransformations = this.nodeTransformations;
    if (defined(targetNodeTransformations)) {
      targetNodeTransformations.merge(sourceNodeTransformations);
    } else {
      this.nodeTransformations = new PropertyBag(
        sourceNodeTransformations,
        createNodeTransformationProperty,
      );
    }
  }

  const sourceArticulations = source.articulations;
  if (defined(sourceArticulations)) {
    const targetArticulations = this.articulations;
    if (defined(targetArticulations)) {
      targetArticulations.merge(sourceArticulations);
    } else {
      this.articulations = new PropertyBag(sourceArticulations);
    }
  }
};
export default ModelGraphics;
