import defaultValue from "../Core/defaultValue.js";
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

/**
 * @typedef {object} ModelGraphics.ConstructorOptions
 *
 * ModelGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，用于指定模型的可见性。
 * @property {Property | string | Resource} [uri] 一个字符串或 Resource Property，用于指定 glTF 资产的 URI。
 * @property {Property | number} [scale=1.0] 指定均匀线性刻度的数值属性。
 * @property {Property | boolean} [enableVerticalExaggeration=true] 一个布尔属性，指定当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型是否沿椭球法线夸大。
 * @property {Property | number} [minimumPixelSize=0.0] 一个数值属性，指定模型的近似最小像素大小，而不考虑缩放。
 * @property {Property | number} [maximumScale] 模型的最大缩放大小。minimumPixelSize 的上限。
 * @property {Property | boolean} [incrementallyLoadTextures=true] 确定加载模型后纹理是否可以继续流入。
 * @property {Property | boolean} [runAnimations=true] 一个布尔属性，指定是否应启动模型中指定的 glTF 动画。
 * @property {Property | boolean} [clampAnimations=true] 一个布尔属性，指定 glTF 动画是否应在没有关键帧的持续时间内保持最后一个姿势。
 * @property {Property | ShadowMode} [shadows=ShadowMode.ENABLED] 一个枚举 Property，指定模型是投射还是接收来自光源的阴影。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度相对于什么的 Property。
 * @property {Property | Color} [silhouetteColor=Color.RED] 指定轮廓的 {@link Color} 的属性。
 * @property {Property | number} [silhouetteSize=0.0] 一个数字属性，用于指定轮廓的大小（以像素为单位）。
 * @property {Property | Color} [color=Color.WHITE] 一个 Property，用于指定与模型的渲染颜色混合的 {@link Color}。
 * @property {Property | ColorBlendMode} [colorBlendMode=ColorBlendMode.HIGHLIGHT] 一个 enum Property，指定颜色如何与模型混合。
 * @property {Property | number} [colorBlendAmount=0.5] 一个数字 Property，用于指定 <code>colorBlendMode</code> 为 <code>MIX</code> 时的颜色强度。值为 0.0 时，将产生模型的渲染颜色，而值为 1.0 时，将产生纯色，介于两者之间的任何值都会导致两者混合。
 * @property {Property | Cartesian2} [imageBasedLightingFactor=new Cartesian2(1.0, 1.0)] 一个属性，用于指定基于图像的漫射和镜面反射照明的贡献。
 * @property {Property | Color} [lightColor] 指定在对模型进行着色时光源颜色的属性。<code>如果未定义</code>，则使用场景的 light 颜色。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个 Property （属性），指定此模型将在距离相机多远处显示。
 * @property {PropertyBag | Object<string, TranslationRotationScale>} [nodeTransformations] 一个对象，其中键是节点的名称，值是 {@link TranslationRotationScale} 属性，用于描述要应用于该节点的转换。该转换在 glTF 中指定的节点现有转换之后应用，并且不会替换节点的现有转换。
 * @property {PropertyBag | Object<string, number>} [articulations] 一个对象，其中键由发音法名称、单个空格和舞台名称组成，值是数字属性。
 * @property {Property | ClippingPlaneCollection} [clippingPlanes] 一个属性，用于指定 {@link ClippingPlaneCollection}，用于选择性地禁用模型渲染。
 * @property {Property | CustomShader} [customShader] 指定要应用于此模型的 {@link CustomShader} 的属性。
 */

/**
 * 基于 {@link https://github.com/KhronosGroup/glTF|glTF}（WebGL、OpenGL ES 和 OpenGL 的运行时资产格式）的 3D 模型。
 * 模型的位置和方向由包含的 {@link Entity} 确定。
 * <p>
 * Cesium 包括对 glTF 几何体、材质、动画和蒙皮的支持。
 * 目前不支持相机和灯光。
 * </p>
 *
 * @alias ModelGraphics
 * @constructor
 *
 * @param {ModelGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=3D%20Models.html|Cesium Sandcastle 3D Models Demo}
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

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(ModelGraphics.prototype, {
  /**
   * 获取在更改或修改属性或子属性时引发的事件。
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
   * 获取或设置boolean 指定模型可见性的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置string 属性，用于指定 glTF 资源的 URI。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  uri: createPropertyDescriptor("uri"),

  /**
   * 获取或设置numeric 属性，用于指定均匀线性刻度
   * 对于此型号。大于 1.0 的值会增加模型的大小，而
   * 小于 1.0 的值会降低它。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置boolean 属性，指定当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型是否沿椭球法线夸大。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  enableVerticalExaggeration: createPropertyDescriptor(
    "enableVerticalExaggeration"
  ),

  /**
   * 获取或设置numeric 指定近似最小值的属性
   * 无论缩放如何，模型的像素大小。这可用于确保
   * 即使查看器缩小，模型也可见。 当 <code>0.0</code> 时，
   * 没有强制要求最小大小。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumPixelSize: createPropertyDescriptor("minimumPixelSize"),

  /**
   * 获取或设置指定最大比例的 numeric 属性
   * 模型的大小。此属性用作
   * {@link ModelGraphics#minimumPixelSize}.
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  maximumScale: createPropertyDescriptor("maximumScale"),

  /**
   * 获取或设置布尔属性，指定纹理
   * 在模型加载后可能会继续流式传输。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  incrementallyLoadTextures: createPropertyDescriptor(
    "incrementallyLoadTextures"
  ),

  /**
   * 获取或设置boolean 属性，指定是否应运行 glTF 动画。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  runAnimations: createPropertyDescriptor("runAnimations"),

  /**
   * 获取或设置boolean 属性，指定 glTF 动画是否应在没有关键帧的持续时间内保持最后一个姿势。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  clampAnimations: createPropertyDescriptor("clampAnimations"),

  /**
   * 获取或设置 enum 属性，指定模型是否
   * 从光源投射或接收阴影。
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
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default Color.RED
   */
  silhouetteColor: createPropertyDescriptor("silhouetteColor"),

  /**
   * 获取或设置numeric 指定轮廓大小（以像素为单位）的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  silhouetteSize: createPropertyDescriptor("silhouetteSize"),

  /**
   * 获取或设置指定与模型的渲染颜色混合的 {@link Color} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置enum 属性，用于指定颜色如何与模型混合。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default ColorBlendMode.HIGHLIGHT
   */
  colorBlendMode: createPropertyDescriptor("colorBlendMode"),

  /**
   * 一个数字属性，用于指定 <code>colorBlendMode</code> 为 MIX 时的颜色强度。
   * 值为 0.0 时，将产生模型的渲染颜色，而值为 1.0 时，将产生纯色，其中
   * 介于两者之间的任何值都会导致两者的混合。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.5
   */
  colorBlendAmount: createPropertyDescriptor("colorBlendAmount"),

  /**
   * 一个属性，用于指定 {@link Cartesian2}，用于将基于图像的漫反射和镜面反射照明贡献缩放到最终颜色。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  imageBasedLightingFactor: createPropertyDescriptor(
    "imageBasedLightingFactor"
  ),

  /**
   * 指定 { 的属性@linkCartesian3} light color when shading the model. When <code>undefined</code> the scene's light color is used instead.
   * @memberOf ModelGraphics.prototype
   * @type {Property|undefined}
   */
  lightColor: createPropertyDescriptor("lightColor"),

  /**
   * 获取或设置{@link DistanceDisplayCondition} 指定此模型将在距相机多远处显示的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition"
  ),

  /**
   * 获取或设置要应用于此模型的节点转换集。 这表示为 {@link PropertyBag}，其中键是
   * 节点名称和值是 {@link TranslationRotationScale} 属性，用于描述要应用于该节点的转换。
   * 转换在 glTF 中指定的节点现有转换之后应用，并且不会替换节点的现有转换。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  nodeTransformations: createPropertyDescriptor(
    "nodeTransformations",
    undefined,
    createNodeTransformationPropertyBag
  ),

  /**
   * 获取或设置要应用于此模型的清晰度值集。 这表示为 {@link PropertyBag}，其中键是
   * 组合为发音法的名称、单个空格和舞台的名称。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  articulations: createPropertyDescriptor(
    "articulations",
    undefined,
    createArticulationStagePropertyBag
  ),

  /**
   * 一个属性，用于指定 {@link ClippingPlaneCollection}，用于选择性地禁用模型渲染。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  clippingPlanes: createPropertyDescriptor("clippingPlanes"),

  /**
   * 获取或设置{@link CustomShader} 以应用于此模型。<code>undefined</code>，则不使用自定义着色器代码。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  customShader: createPropertyDescriptor("customShader"),
});

/**
 * 复制实例。
 *
 * @param {ModelGraphics} [result] 要在其上存储结果的对象。
 * @returns {ModelGraphics} 修改后的结果参数或者一个新实例（如果未提供）。
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
  result.lightColor = this.lightColor;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.nodeTransformations = this.nodeTransformations;
  result.articulations = this.articulations;
  result.clippingPlanes = this.clippingPlanes;
  result.customShader = this.customShader;
  return result;
};

/**
 * 将此对象上每个未分配的属性分配给值
 * 的 API 值。
 *
 * @param {ModelGraphics} source 要合并到此对象中的对象。
 */
ModelGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.uri = defaultValue(this.uri, source.uri);
  this.scale = defaultValue(this.scale, source.scale);
  this.enableVerticalExaggeration = defaultValue(
    this.enableVerticalExaggeration,
    source.enableVerticalExaggeration
  );
  this.minimumPixelSize = defaultValue(
    this.minimumPixelSize,
    source.minimumPixelSize
  );
  this.maximumScale = defaultValue(this.maximumScale, source.maximumScale);
  this.incrementallyLoadTextures = defaultValue(
    this.incrementallyLoadTextures,
    source.incrementallyLoadTextures
  );
  this.runAnimations = defaultValue(this.runAnimations, source.runAnimations);
  this.clampAnimations = defaultValue(
    this.clampAnimations,
    source.clampAnimations
  );
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference
  );
  this.silhouetteColor = defaultValue(
    this.silhouetteColor,
    source.silhouetteColor
  );
  this.silhouetteSize = defaultValue(
    this.silhouetteSize,
    source.silhouetteSize
  );
  this.color = defaultValue(this.color, source.color);
  this.colorBlendMode = defaultValue(
    this.colorBlendMode,
    source.colorBlendMode
  );
  this.colorBlendAmount = defaultValue(
    this.colorBlendAmount,
    source.colorBlendAmount
  );
  this.imageBasedLightingFactor = defaultValue(
    this.imageBasedLightingFactor,
    source.imageBasedLightingFactor
  );
  this.lightColor = defaultValue(this.lightColor, source.lightColor);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition
  );
  this.clippingPlanes = defaultValue(
    this.clippingPlanes,
    source.clippingPlanes
  );
  this.customShader = defaultValue(this.customShader, source.customShader);

  const sourceNodeTransformations = source.nodeTransformations;
  if (defined(sourceNodeTransformations)) {
    const targetNodeTransformations = this.nodeTransformations;
    if (defined(targetNodeTransformations)) {
      targetNodeTransformations.merge(sourceNodeTransformations);
    } else {
      this.nodeTransformations = new PropertyBag(
        sourceNodeTransformations,
        createNodeTransformationProperty
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
