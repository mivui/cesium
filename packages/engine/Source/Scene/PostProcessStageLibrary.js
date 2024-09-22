import buildModuleUrl from "../Core/buildModuleUrl.js";
import Color from "../Core/Color.js";
import createGuid from "../Core/createGuid.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import AcesTonemapping from "../Shaders/PostProcessStages/AcesTonemappingStage.js";
import AmbientOcclusionGenerate from "../Shaders/PostProcessStages/AmbientOcclusionGenerate.js";
import AmbientOcclusionModulate from "../Shaders/PostProcessStages/AmbientOcclusionModulate.js";
import BlackAndWhite from "../Shaders/PostProcessStages/BlackAndWhite.js";
import BloomComposite from "../Shaders/PostProcessStages/BloomComposite.js";
import Brightness from "../Shaders/PostProcessStages/Brightness.js";
import ContrastBias from "../Shaders/PostProcessStages/ContrastBias.js";
import DepthOfField from "../Shaders/PostProcessStages/DepthOfField.js";
import DepthView from "../Shaders/PostProcessStages/DepthView.js";
import EdgeDetection from "../Shaders/PostProcessStages/EdgeDetection.js";
import FilmicTonemapping from "../Shaders/PostProcessStages/FilmicTonemapping.js";
import PbrNeutralTonemapping from "../Shaders/PostProcessStages/PbrNeutralTonemapping.js";
import FXAA from "../Shaders/PostProcessStages/FXAA.js";
import GaussianBlur1D from "../Shaders/PostProcessStages/GaussianBlur1D.js";
import LensFlare from "../Shaders/PostProcessStages/LensFlare.js";
import ModifiedReinhardTonemapping from "../Shaders/PostProcessStages/ModifiedReinhardTonemapping.js";
import NightVision from "../Shaders/PostProcessStages/NightVision.js";
import ReinhardTonemapping from "../Shaders/PostProcessStages/ReinhardTonemapping.js";
import Silhouette from "../Shaders/PostProcessStages/Silhouette.js";
import FXAA3_11 from "../Shaders/FXAA3_11.js";
import AutoExposure from "./AutoExposure.js";
import PostProcessStage from "./PostProcessStage.js";
import PostProcessStageComposite from "./PostProcessStageComposite.js";
import PostProcessStageSampleMode from "./PostProcessStageSampleMode.js";

/**
 * 包含用于创建常见后处理阶段的函数。
 *
 * @namespace PostProcessStageLibrary
 */
const PostProcessStageLibrary = {};

function createBlur(name) {
  const delta = 1.0;
  const sigma = 2.0;
  const stepSize = 1.0;

  const blurShader = `#define USE_STEP_SIZE\n${GaussianBlur1D}`;
  const blurX = new PostProcessStage({
    name: `${name}_x_direction`,
    fragmentShader: blurShader,
    uniforms: {
      delta: delta,
      sigma: sigma,
      stepSize: stepSize,
      direction: 0.0,
    },
    sampleMode: PostProcessStageSampleMode.LINEAR,
  });
  const blurY = new PostProcessStage({
    name: `${name}_y_direction`,
    fragmentShader: blurShader,
    uniforms: {
      delta: delta,
      sigma: sigma,
      stepSize: stepSize,
      direction: 1.0,
    },
    sampleMode: PostProcessStageSampleMode.LINEAR,
  });

  const uniforms = {};
  Object.defineProperties(uniforms, {
    delta: {
      get: function () {
        return blurX.uniforms.delta;
      },
      set: function (value) {
        const blurXUniforms = blurX.uniforms;
        const blurYUniforms = blurY.uniforms;
        blurXUniforms.delta = blurYUniforms.delta = value;
      },
    },
    sigma: {
      get: function () {
        return blurX.uniforms.sigma;
      },
      set: function (value) {
        const blurXUniforms = blurX.uniforms;
        const blurYUniforms = blurY.uniforms;
        blurXUniforms.sigma = blurYUniforms.sigma = value;
      },
    },
    stepSize: {
      get: function () {
        return blurX.uniforms.stepSize;
      },
      set: function (value) {
        const blurXUniforms = blurX.uniforms;
        const blurYUniforms = blurY.uniforms;
        blurXUniforms.stepSize = blurYUniforms.stepSize = value;
      },
    },
  });
  return new PostProcessStageComposite({
    name: name,
    stages: [blurX, blurY],
    uniforms: uniforms,
  });
}

/**
 * 创建一个后期处理阶段，将高斯模糊应用于输入纹理。此阶段通常与另一个阶段结合使用。
 * <p>
 * 此 stage 具有以下 uniforms：<code>delta</code>、<code>sigma</code> 和 <code>stepSize</code>。
 * </p>
 * <p>
 * <code>delta</code> 和 <code>sigma</code> 用于计算高斯滤波器的权重。等式为 <code>exp（（-0.5 * delta * delta） / （sigma * sigma））。</code>
 * <code>delta</code> 的默认值为 <code>1.0</code>。<code>sigma</code> 的默认值为 <code>2.0</code>。
 * <code>stepSize</code> 是到下一个纹素的距离。默认值为 <code>1.0</code>。
 * </p>
 * @return {PostProcessStageComposite} 对输入纹理应用高斯模糊的后期处理阶段。
 */
PostProcessStageLibrary.createBlurStage = function () {
  return createBlur("czm_blur");
};

/**
 * 创建应用景深效果的后期处理舞台。
 * <p>
 * 景深模拟摄像机对焦。场景中的焦点对象
 * 将清晰，而未合焦的物体将变得模糊。
 * </p>
 * <p>
 * 此 stage 具有以下 uniforms：<code>focalDistance</code>、<code>delta</code>、<code>sigma</code> 和 <code>stepSize</code>。
 * </p>
 * <p>
 * <code>focalDistance</code> 是距摄像机的距离（以米为单位），用于设置摄像机焦点。
 * </p>
 * <p>
 * <code>delta</code>、<code>sigma</code> 和 <code>stepSize</code> 是与 {@link PostProcessStageLibrary#createBlurStage} 相同的属性。
 * 模糊应用于失焦区域。
 * </p>
 * @return {PostProcessStageComposite} 应用景深效果的后期处理舞台。
 */
PostProcessStageLibrary.createDepthOfFieldStage = function () {
  const blur = createBlur("czm_depth_of_field_blur");
  const dof = new PostProcessStage({
    name: "czm_depth_of_field_composite",
    fragmentShader: DepthOfField,
    uniforms: {
      focalDistance: 5.0,
      blurTexture: blur.name,
    },
  });

  const uniforms = {};
  Object.defineProperties(uniforms, {
    focalDistance: {
      get: function () {
        return dof.uniforms.focalDistance;
      },
      set: function (value) {
        dof.uniforms.focalDistance = value;
      },
    },
    delta: {
      get: function () {
        return blur.uniforms.delta;
      },
      set: function (value) {
        blur.uniforms.delta = value;
      },
    },
    sigma: {
      get: function () {
        return blur.uniforms.sigma;
      },
      set: function (value) {
        blur.uniforms.sigma = value;
      },
    },
    stepSize: {
      get: function () {
        return blur.uniforms.stepSize;
      },
      set: function (value) {
        blur.uniforms.stepSize = value;
      },
    },
  });
  return new PostProcessStageComposite({
    name: "czm_depth_of_field",
    stages: [blur, dof],
    inputPreviousStageTexture: false,
    uniforms: uniforms,
  });
};

/**
 * 是否支持景深舞台。
 * <p>
 * 此阶段需要 WEBGL_depth_texture 扩展。
 * </p>
 *
 * @param {Scene} scene 场景。
 * @return {boolean} 是否支持此后处理阶段。
 *
 * @see {Context#depthTexture}
 * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/|WEBGL_depth_texture}
 */
PostProcessStageLibrary.isDepthOfFieldSupported = function (scene) {
  return scene.context.depthTexture;
};

/**
 * 创建检测边缘的后处理阶段。
 * <p>
 * 当颜色位于边缘上时，将颜色写入输出纹理，并将 alpha 设置为 1.0。
 * </p>
 * <p>
 * 此阶段有以下制服：<code>颜色</code>和<code>长度</code>
 * </p>
 * <ul>
 * <li><code>color</code> 是高亮显示的边缘的颜色。默认值为 {@link Color#BLACK}。</li>
 * <li><code>length</code> 是边缘的长度（以像素为单位）。默认值为 <code>0.5</code>。</li>
 * </ul>
 * <p>
 * 2D 不支持此阶段。
 * </p>
 * @return {PostProcessStage} 应用边缘检测效果的后处理阶段。
 *
 * @example
 * // multiple silhouette effects
 * const yellowEdge = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
 * yellowEdge.uniforms.color = Cesium.Color.YELLOW;
 * yellowEdge.selected = [feature0];
 *
 * const greenEdge = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
 * greenEdge.uniforms.color = Cesium.Color.LIME;
 * greenEdge.selected = [feature1];
 *
 * // draw edges around feature0 and feature1
 * postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([yellowEdge, greenEdge]);
 */
PostProcessStageLibrary.createEdgeDetectionStage = function () {
  // unique name generated on call so more than one effect can be added
  const name = createGuid();
  return new PostProcessStage({
    name: `czm_edge_detection_${name}`,
    fragmentShader: EdgeDetection,
    uniforms: {
      length: 0.25,
      color: Color.clone(Color.BLACK),
    },
  });
};

/**
 * 是否支持边缘检测平台。
 * <p>
 * 此阶段需要 WEBGL_depth_texture 扩展。
 * </p>
 *
 * @param {Scene} scene 场景。
 * @return {boolean} 是否支持此后处理阶段。
 *
 * @see {Context#depthTexture}
 * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/|WEBGL_depth_texture}
 */
PostProcessStageLibrary.isEdgeDetectionSupported = function (scene) {
  return scene.context.depthTexture;
};

function getSilhouetteEdgeDetection(edgeDetectionStages) {
  if (!defined(edgeDetectionStages)) {
    return PostProcessStageLibrary.createEdgeDetectionStage();
  }

  const edgeDetection = new PostProcessStageComposite({
    name: "czm_edge_detection_multiple",
    stages: edgeDetectionStages,
    inputPreviousStageTexture: false,
  });

  const compositeUniforms = {};
  let fsDecl = "";
  let fsLoop = "";
  for (let i = 0; i < edgeDetectionStages.length; ++i) {
    fsDecl += `uniform sampler2D edgeTexture${i}; \n`;
    fsLoop +=
      `        vec4 edge${i} = texture(edgeTexture${i}, v_textureCoordinates); \n` +
      `        if (edge${i}.a > 0.0) \n` +
      `        { \n` +
      `            color = edge${i}; \n` +
      `            break; \n` +
      `        } \n`;
    compositeUniforms[`edgeTexture${i}`] = edgeDetectionStages[i].name;
  }

  const fs =
    `${fsDecl}in vec2 v_textureCoordinates; \n` +
    `void main() { \n` +
    `    vec4 color = vec4(0.0); \n` +
    `    for (int i = 0; i < ${edgeDetectionStages.length}; i++) \n` +
    `    { \n${fsLoop}    } \n` +
    `    out_FragColor = color; \n` +
    `} \n`;

  const edgeComposite = new PostProcessStage({
    name: "czm_edge_detection_combine",
    fragmentShader: fs,
    uniforms: compositeUniforms,
  });
  return new PostProcessStageComposite({
    name: "czm_edge_detection_composite",
    stages: [edgeDetection, edgeComposite],
  });
}

/**
 * 创建应用剪影效果的后处理舞台。
 * <p>
 * 剪影效果将边缘检测过程中的颜色与输入颜色纹理合成。
 * </p>
 * <p>
 * 当 <code>edgeDetectionStages</code> <code>未定义</code>时，此 stage 具有以下 uniforms：<code>color</code> 和 <code>length</code>
 * </p>
 * <p>
 * <code>color</code> 是高亮显示的边缘的颜色。默认值为 {@link Color#BLACK}。
 * <code>length</code> 是边缘的长度（以像素为单位）。默认值为 <code>0.5</code>。
 * </p>
 * @param {PostProcessStage[]} [edgeDetectionStages] 边缘检测后处理阶段的数组。
 * @return {PostProcessStageComposite} 应用剪影效果的后期处理舞台。
 */
PostProcessStageLibrary.createSilhouetteStage = function (edgeDetectionStages) {
  const edgeDetection = getSilhouetteEdgeDetection(edgeDetectionStages);
  const silhouetteProcess = new PostProcessStage({
    name: "czm_silhouette_color_edges",
    fragmentShader: Silhouette,
    uniforms: {
      silhouetteTexture: edgeDetection.name,
    },
  });

  return new PostProcessStageComposite({
    name: "czm_silhouette",
    stages: [edgeDetection, silhouetteProcess],
    inputPreviousStageTexture: false,
    uniforms: edgeDetection.uniforms,
  });
};

/**
 * 是否支持 Silhouette 舞台。
 * <p>
 * 此阶段需要 WEBGL_depth_texture 扩展。
 * </p>
 *
 * @param {Scene} scene 场景。
 * @return {boolean} 是否支持此后处理阶段。
 *
 * @see {Context#depthTexture}
 * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/|WEBGL_depth_texture}
 */
PostProcessStageLibrary.isSilhouetteSupported = function (scene) {
  return scene.context.depthTexture;
};

/**
 * 创建一个后期处理阶段，将泛光效果应用于输入纹理。
 * <p>
 * 泛光效果可添加发光效果，使明亮区域更亮，使黑暗区域更暗。
 * </p>
 * <p>
 * 此后处理阶段具有以下 uniforms：<code>contrast</code>、<code>brightness</code>、<code>glowOnly</code>、
 * <code>delta</code>、<code>sigma</code> 和 <code>stepSize</code>。
 * </p>
 * <ul>
 * <li><code>contrast</code> 是 [-255.0， 255.0] 范围内的标量值，会影响效果的收缩。默认值为 <code>128.0</code>。</li>
 * <li><code>brightness</code> 是一个标量值。输入纹理 RGB 值转换为色相、饱和度和亮度 （HSB），则该值为
 * 添加到亮度。默认值为 <code>-0.3</code>。</li>
 * <li><code>glowOnly</code> 是一个布尔值。如果<code>为 true</code>，则仅显示发光效果。如果<code>为 false</code>，则发光将添加到输入纹理中。
 * 默认值为 <code>false</code>。这是一个调试选项，用于在更改其他 uniform 值时查看效果。</li>
 * </ul>
 * <p>
 * <code>delta</code>、<code>sigma</code> 和 <code>stepSize</code> 是与 {@link PostProcessStageLibrary#createBlurStage} 相同的属性。
 * </p>
 * @return {PostProcessStageComposite} 用于应用泛光效果的后期处理阶段。
 *
 * @private
 */
PostProcessStageLibrary.createBloomStage = function () {
  const contrastBias = new PostProcessStage({
    name: "czm_bloom_contrast_bias",
    fragmentShader: ContrastBias,
    uniforms: {
      contrast: 128.0,
      brightness: -0.3,
    },
  });
  const blur = createBlur("czm_bloom_blur");
  const generateComposite = new PostProcessStageComposite({
    name: "czm_bloom_contrast_bias_blur",
    stages: [contrastBias, blur],
  });

  const bloomComposite = new PostProcessStage({
    name: "czm_bloom_generate_composite",
    fragmentShader: BloomComposite,
    uniforms: {
      glowOnly: false,
      bloomTexture: generateComposite.name,
    },
  });

  const uniforms = {};
  Object.defineProperties(uniforms, {
    glowOnly: {
      get: function () {
        return bloomComposite.uniforms.glowOnly;
      },
      set: function (value) {
        bloomComposite.uniforms.glowOnly = value;
      },
    },
    contrast: {
      get: function () {
        return contrastBias.uniforms.contrast;
      },
      set: function (value) {
        contrastBias.uniforms.contrast = value;
      },
    },
    brightness: {
      get: function () {
        return contrastBias.uniforms.brightness;
      },
      set: function (value) {
        contrastBias.uniforms.brightness = value;
      },
    },
    delta: {
      get: function () {
        return blur.uniforms.delta;
      },
      set: function (value) {
        blur.uniforms.delta = value;
      },
    },
    sigma: {
      get: function () {
        return blur.uniforms.sigma;
      },
      set: function (value) {
        blur.uniforms.sigma = value;
      },
    },
    stepSize: {
      get: function () {
        return blur.uniforms.stepSize;
      },
      set: function (value) {
        blur.uniforms.stepSize = value;
      },
    },
  });

  return new PostProcessStageComposite({
    name: "czm_bloom",
    stages: [generateComposite, bloomComposite],
    inputPreviousStageTexture: false,
    uniforms: uniforms,
  });
};

/**
 * 创建一个后期处理阶段，将基于地平线的环境光遮蔽 （HBAO） 应用于输入纹理。
 * <p>
 * 环境光遮挡模拟环境光的阴影。当
 * 表面接收光线，无论光线的位置如何。
 * </p>
 * <p>
 * uniforms 具有以下属性：<code>intensity</code>、<code>bias</code>、<code>lengthCap</code>、
 * <code>stepSize</code>、<code>frustumLength</code>、<code>randomTexture</code>、<code>ambientOcclusionOnly</code>、
 * <code>delta</code>、<code>sigma</code> 和 <code>blurStepSize</code> 的
 * </p>
 * <ul>
 * <li><code>强度</code> 是用于以指数方式使阴影变亮或变暗的标量值。较高的值会使阴影更暗。默认值为 <code>3.0</code>。</li>
 * <li><code>bias</code> 是表示以弧度为单位的角度的标量值。如果样本法线与相机向量之间的点积小于此值，则
 * 采样在当前方向停止。这用于从附近的平面边缘移除阴影。默认值为 <code>0.1</code>。</li>
 * <li><code>lengthCap</code> 是一个标量值，表示以米为单位的长度。如果从当前样本到第一个样本的距离大于此值，则
 * 采样在当前方向停止。默认值为 <code>0.26</code>。</li>
 * <li><code>stepSize</code> 是一个标量值，指示在当前方向上到下一个纹素样本的距离。默认值为 <code>1.95</code>。</li>
 * <li><code>frustumLength</code> 是以米为单位的标量值。如果当前片段与摄像机的距离大于此值，则不会计算该片段的环境光遮蔽。
 * 默认值为 <code>1000.0</code>。</li>
 * <li><code>randomTexture</code> 是一个纹理，其中红色通道是 [0.0， 1.0] 中的随机值。默认值为 <code>undefined</code>。需要设置此纹理。</li>
 * <li><code>ambientOcclusionOnly</code> 是一个布尔值。如果<code>为 true</code>，则仅将生成的阴影写入输出。当 <code>false</code> 时，将调制输入纹理
 * 替换为环境光遮蔽。这是一个有用的调试选项，用于查看更改 uniform 值的效果。默认值为 <code>false</code>。</li>
 * </ul>
 * <p>
 * <code>delta</code>、<code>sigma</code> 和 <code>blurStepSize</code> 是与 {@link PostProcessStageLibrary#createBlurStage} 相同的属性。
 * 模糊应用于图像生成的阴影，以使其更平滑。
 * </p>
 * @return {PostProcessStageComposite} 应用环境光遮蔽效果的后期处理阶段。
 *
 * @private
 */
PostProcessStageLibrary.createAmbientOcclusionStage = function () {
  const generate = new PostProcessStage({
    name: "czm_ambient_occlusion_generate",
    fragmentShader: AmbientOcclusionGenerate,
    uniforms: {
      intensity: 3.0,
      bias: 0.1,
      lengthCap: 0.26,
      stepSize: 1.95,
      frustumLength: 1000.0,
      randomTexture: undefined,
    },
  });
  const blur = createBlur("czm_ambient_occlusion_blur");
  blur.uniforms.stepSize = 0.86;
  const generateAndBlur = new PostProcessStageComposite({
    name: "czm_ambient_occlusion_generate_blur",
    stages: [generate, blur],
  });

  const ambientOcclusionModulate = new PostProcessStage({
    name: "czm_ambient_occlusion_composite",
    fragmentShader: AmbientOcclusionModulate,
    uniforms: {
      ambientOcclusionOnly: false,
      ambientOcclusionTexture: generateAndBlur.name,
    },
  });

  const uniforms = {};
  Object.defineProperties(uniforms, {
    intensity: {
      get: function () {
        return generate.uniforms.intensity;
      },
      set: function (value) {
        generate.uniforms.intensity = value;
      },
    },
    bias: {
      get: function () {
        return generate.uniforms.bias;
      },
      set: function (value) {
        generate.uniforms.bias = value;
      },
    },
    lengthCap: {
      get: function () {
        return generate.uniforms.lengthCap;
      },
      set: function (value) {
        generate.uniforms.lengthCap = value;
      },
    },
    stepSize: {
      get: function () {
        return generate.uniforms.stepSize;
      },
      set: function (value) {
        generate.uniforms.stepSize = value;
      },
    },
    frustumLength: {
      get: function () {
        return generate.uniforms.frustumLength;
      },
      set: function (value) {
        generate.uniforms.frustumLength = value;
      },
    },
    randomTexture: {
      get: function () {
        return generate.uniforms.randomTexture;
      },
      set: function (value) {
        generate.uniforms.randomTexture = value;
      },
    },
    delta: {
      get: function () {
        return blur.uniforms.delta;
      },
      set: function (value) {
        blur.uniforms.delta = value;
      },
    },
    sigma: {
      get: function () {
        return blur.uniforms.sigma;
      },
      set: function (value) {
        blur.uniforms.sigma = value;
      },
    },
    blurStepSize: {
      get: function () {
        return blur.uniforms.stepSize;
      },
      set: function (value) {
        blur.uniforms.stepSize = value;
      },
    },
    ambientOcclusionOnly: {
      get: function () {
        return ambientOcclusionModulate.uniforms.ambientOcclusionOnly;
      },
      set: function (value) {
        ambientOcclusionModulate.uniforms.ambientOcclusionOnly = value;
      },
    },
  });

  return new PostProcessStageComposite({
    name: "czm_ambient_occlusion",
    stages: [generateAndBlur, ambientOcclusionModulate],
    inputPreviousStageTexture: false,
    uniforms: uniforms,
  });
};

/**
 * 是否支持环境光遮蔽阶段。
 * <p>
 * 此阶段需要 WEBGL_depth_texture 扩展。
 * </p>
 *
 * @param {Scene} scene 场景。
 * @return {boolean} 是否支持此后处理阶段。
 *
 * @see {Context#depthTexture}
 * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/|WEBGL_depth_texture}
 */
PostProcessStageLibrary.isAmbientOcclusionSupported = function (scene) {
  return scene.context.depthTexture;
};

const fxaaFS = `#define FXAA_QUALITY_PRESET 39 \n${FXAA3_11}\n${FXAA}`;

/**
 * 创建一个后期处理阶段，将快速近似抗锯齿 （FXAA） 应用于输入纹理。
 * @return {PostProcessStage} 对输入纹理应用快速近似抗锯齿的后期处理阶段。
 *
 * @private
 */
PostProcessStageLibrary.createFXAAStage = function () {
  return new PostProcessStage({
    name: "czm_FXAA",
    fragmentShader: fxaaFS,
    sampleMode: PostProcessStageSampleMode.LINEAR,
  });
};

/**
 * 创建应用 ACES 色调映射运算符的后处理阶段。
 * @param {boolean} useAutoExposure 是否使用自动曝光。
 * @return {PostProcessStage} 应用 ACES 色调映射运算符的后处理阶段。
 * @private
 */
PostProcessStageLibrary.createAcesTonemappingStage = function (
  useAutoExposure
) {
  let fs = useAutoExposure ? "#define AUTO_EXPOSURE\n" : "";
  fs += AcesTonemapping;
  return new PostProcessStage({
    name: "czm_aces",
    fragmentShader: fs,
    uniforms: {
      autoExposure: undefined,
      exposure: 1.0,
    },
  });
};

/**
 * 创建应用胶片色调映射操作符的后期处理舞台。
 * @param {boolean} useAutoExposure 是否使用自动曝光。
 * @return {PostProcessStage} 应用电影色调映射操作符的后期处理阶段。
 * @private
 */
PostProcessStageLibrary.createFilmicTonemappingStage = function (
  useAutoExposure
) {
  let fs = useAutoExposure ? "#define AUTO_EXPOSURE\n" : "";
  fs += FilmicTonemapping;
  return new PostProcessStage({
    name: "czm_filmic",
    fragmentShader: fs,
    uniforms: {
      autoExposure: undefined,
      exposure: 1.0,
    },
  });
};

/**
 * 创建应用胶片色调映射操作符的后期处理舞台。
 * @param {boolean} useAutoExposure 是否使用自动曝光。
 * @return {PostProcessStage} 应用电影色调映射操作符的后期处理阶段。
 * @private
 */
PostProcessStageLibrary.createPbrNeutralTonemappingStage = function (
  useAutoExposure
) {
  let fs = useAutoExposure ? "#define AUTO_EXPOSURE\n" : "";
  fs += PbrNeutralTonemapping;
  return new PostProcessStage({
    name: "czm_pbr_neutral",
    fragmentShader: fs,
    uniforms: {
      autoExposure: undefined,
      exposure: 1.0,
    },
  });
};

/**
 * 创建应用 Reinhard 色调映射运算符的后期处理阶段。
 * @param {boolean} useAutoExposure 是否使用自动曝光。
 * @return {PostProcessStage} 应用 Reinhard 色调映射运算符的后处理阶段。
 * @private
 */
PostProcessStageLibrary.createReinhardTonemappingStage = function (
  useAutoExposure
) {
  let fs = useAutoExposure ? "#define AUTO_EXPOSURE\n" : "";
  fs += ReinhardTonemapping;
  return new PostProcessStage({
    name: "czm_reinhard",
    fragmentShader: fs,
    uniforms: {
      autoExposure: undefined,
      exposure: 1.0,
    },
  });
};

/**
 * 创建一个后期处理阶段，该阶段应用修改后的 Reinhard 色调映射操作符。
 * @param {boolean} useAutoExposure 是否使用自动曝光。
 * @return {PostProcessStage} 应用修改后的 Reinhard 色调映射运算符的后处理阶段。
 * @private
 */
PostProcessStageLibrary.createModifiedReinhardTonemappingStage = function (
  useAutoExposure
) {
  let fs = useAutoExposure ? "#define AUTO_EXPOSURE\n" : "";
  fs += ModifiedReinhardTonemapping;
  return new PostProcessStage({
    name: "czm_modified_reinhard",
    fragmentShader: fs,
    uniforms: {
      white: Color.WHITE,
      autoExposure: undefined,
      exposure: 1.0,
    },
  });
};

/**
 * 创建一个后期处理阶段，用于查找输入纹理的平均亮度。
 * @return {PostProcessStage} 一个后期处理阶段，用于查找输入纹理的平均亮度。
 * @private
 */
PostProcessStageLibrary.createAutoExposureStage = function () {
  return new AutoExposure();
};

/**
 * 创建一个后期处理舞台，该舞台使用黑色和白色渐变渲染输入纹理。
 * <p>
 * 此阶段有一个统一的值，即 <code>gradations（渐变</code>），用于缩放每个像素的明亮度。
 * </p>
 * @return {PostProcessStage} 一个后处理阶段，用黑白渐变渲染输入纹理。
 */
PostProcessStageLibrary.createBlackAndWhiteStage = function () {
  return new PostProcessStage({
    name: "czm_black_and_white",
    fragmentShader: BlackAndWhite,
    uniforms: {
      gradations: 5.0,
    },
  });
};

/**
 * 创建使输入纹理饱和的后期处理阶段。
 * <p>
 * 此阶段有一个统一的值 <code>brightness</code>，用于缩放每个像素的饱和度。
 * </p>
 * @return {PostProcessStage} 使输入纹理饱和的后期处理阶段。
 */
PostProcessStageLibrary.createBrightnessStage = function () {
  return new PostProcessStage({
    name: "czm_brightness",
    fragmentShader: Brightness,
    uniforms: {
      brightness: 0.5,
    },
  });
};

/**
 * 创建一个后期处理阶段，向输入纹理添加夜视效果。
 * @return {PostProcessStage} 一个后期处理阶段，用于向输入纹理添加夜视效果。
 */
PostProcessStageLibrary.createNightVisionStage = function () {
  return new PostProcessStage({
    name: "czm_night_vision",
    fragmentShader: NightVision,
  });
};

/**
 * 创建一个后处理阶段，将输入颜色纹理替换为表示每个像素的片段深度的黑白纹理。
 * @return {PostProcessStage} 一个后处理阶段，将输入颜色纹理替换为表示每个像素处片段深度的黑白纹理。
 *
 * @private
 */
PostProcessStageLibrary.createDepthViewStage = function () {
  return new PostProcessStage({
    name: "czm_depth_view",
    fragmentShader: DepthView,
  });
};

/**
 * 创建一个后期处理舞台，该舞台应用模拟光线眩光的摄像机镜头。
 * <p>
 * 此阶段有以下制服：<code>dirtTexture</code>、<code>starTexture</code>、<code>intensity</code>、<code>distortion</code>、<code>ghostDispersal</code>、
 * <code>haloWidth</code>、<code>dirtAmount</code> 和 <code>earthRadius</code>。
 * <ul>
 * <li><code>dirtTexture</code> 是为模拟镜头上的污垢而采样的纹理。</li>
 * <li><code>starTexture</code> 是为耀斑的星形图案采样的纹理。</li>
 * <li><code>强度</code>是标量乘以镜头眩光的结果。默认值为 <code>2.0</code>。</li>
 * <li><code>失真</code>是影响半音效果失真的标量值。默认值为 <code>10.0</code>。</li>
 * <li><code>ghostDispersal</code> 是一个标量，指示光晕效果与纹理中心的距离。默认值为 <code>0.4</code>。</li>
 * <li><code>haloWidth</code> 是一个标量，表示来自虚影扩散的 halo 的宽度。默认值为 <code>0.4</code>。</li>
 * <li><code>dirtAmount</code> 是表示镜头上污垢量的标量。默认值为 <code>0.4</code>。</li>
 * <li><code>earthRadius</code> 是地球的最大半径。默认值为 <code>Ellipsoid.WGS84.maximumRadius</code>。</li>
 * </ul>
 * </p>
 * @return {PostProcessStage} 用于应用镜头光晕效果的后期处理阶段。
 */
PostProcessStageLibrary.createLensFlareStage = function () {
  return new PostProcessStage({
    name: "czm_lens_flare",
    fragmentShader: LensFlare,
    uniforms: {
      dirtTexture: buildModuleUrl("Assets/Textures/LensFlare/DirtMask.jpg"),
      starTexture: buildModuleUrl("Assets/Textures/LensFlare/StarBurst.jpg"),
      intensity: 2.0,
      distortion: 10.0,
      ghostDispersal: 0.4,
      haloWidth: 0.4,
      dirtAmount: 0.4,
      earthRadius: Ellipsoid.WGS84.maximumRadius,
    },
  });
};
export default PostProcessStageLibrary;
