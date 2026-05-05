import Check from "../../Core/Check.js";
import Frozen from "../../Core/Frozen.js";
import defined from "../../Core/defined.js";
import destroyObject from "../../Core/destroyObject.js";
import DeveloperError from "../../Core/DeveloperError.js";
import CustomShaderMode from "./CustomShaderMode.js";
import UniformType from "./UniformType.js";
import TextureManager from "./TextureManager.js";
import CustomShaderTranslucencyMode from "./CustomShaderTranslucencyMode.js";

/**
 * 描述统一变量、其类型和初始值的对象
 *
 * @typedef {object} UniformSpecifier
 * @property {UniformType} type 统一变量的 GLSL 类型。
 * @property {boolean|number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|TextureUniform} value 统一变量的初始值
 *
 * @experimental 此功能使用了 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用策略的情况下更改。
 */

/**
 * A set of variables parsed from the user-defined shader code. These can be
 * used for optimizations when generating the overall shader. Though they are
 * represented as JS objects, the intended use is like a set, so only the
 * existence of keys matter. The values will always be <code>true</code> if
 * defined. This data structure is used because:
 * <ul>
 *   <li>We cannot yet use ES6 Set objects</li>
 *   <li>Using a dictionary automatically de-duplicates variable names</li>
 *   <li>Queries such as <code>variableSet.hasOwnProperty("position")</code> are straightforward</li>
 * </ul>
 * @typedef {Object<string, boolean>} VariableSet
 * @private
 */

/**
 * Variable sets parsed from the user-defined vertex shader text.
 * @typedef {object} VertexVariableSets
 * @property {VariableSet} attributeSet A set of all unique attributes used in the vertex shader via the <code>vsInput.attributes</code> struct.
 * @property {VariableSet} featureIdSet A set of all unique feature ID sets used in the vertex shader via the <code>vsInput.featureIds</code> struct.
 * @property {VariableSet} metadataSet A set of all unique metadata properties used in the vertex shader via the <code>vsInput.metadata</code> struct.
 * @private
 */

/**
 * Variable sets parsed from the user-defined fragment shader text.
 * @typedef {object} FragmentVariableSets
 * @property {VariableSet} attributeSet A set of all unique attributes used in the fragment shader via the <code>fsInput.attributes</code> struct
 * @property {VariableSet} featureIdSet A set of all unique feature ID sets used in the fragment shader via the <code>fsInput.featureIds</code> struct.
 * @property {VariableSet} metadataSet A set of all unique metadata properties used in the fragment shader via the <code>fsInput.metadata</code> struct.
 * @property {VariableSet} materialSet A set of all material variables such as diffuse, specular or alpha that are used in the fragment shader via the <code>material</code> struct.
 * @private
 */

/**
 * 与 {@link Model} 和 {@link Cesium3DTileset} 一起使用的用户定义 GLSL 着色器。
 * <p>
 * 如果使用纹理统一变量，必须进行额外的资源管理：
 * </p>
 * <ul>
 *   <li>
 *      <code>update</code> 函数必须在每一帧都被调用。当自定义着色器传递给
 *      {@link Model} 或 {@link Cesium3DTileset} 时，此步骤会自动处理
 *   </li>
 *   <li>
 *      不再需要自定义着色器时，必须调用 {@link CustomShader#destroy} 以正确清理 GPU 资源。
 *      应用程序负责调用此方法。
 *   </li>
 * </ul>
 * <p>
 * 有关更详细的文档，请参阅 {@link https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide|自定义着色器指南}。
 * </p>
 *
 * @param {object} options 具有以下选项的对象
 * @param {CustomShaderMode} [options.mode=CustomShaderMode.MODIFY_MATERIAL] 自定义着色器模式，决定自定义着色器代码如何插入到片段着色器中。
 * @param {LightingModel} [options.lightingModel] 光照模型（如 PBR 或无光照）。如果存在，将覆盖模型的默认光照。
 * @param {CustomShaderTranslucencyMode} [options.translucencyMode=CustomShaderTranslucencyMode.INHERIT] 透明度模式，决定自定义着色器如何应用。如果值为 CustomShaderTransulcencyMode.OPAQUE 或 CustomShaderTransulcencyMode.TRANSLUCENT，自定义着色器将覆盖模型材质的设置。如果值为 CustomShaderTransulcencyMode.INHERIT，自定义着色器将根据图元材质设置渲染为不透明或半透明。
 * @param {Object<string, UniformSpecifier>} [options.uniforms] 用户定义统一变量的字典。键是出现在 GLSL 代码中的统一变量名称。值是描述统一变量类型和初始值的对象
 * @param {Object<string, VaryingType>} [options.varyings] 用于声明着色器中使用的额外 GLSL 变量的字典。键是将出现在 GLSL 代码中的变量名称。值是变量的数据类型。对于每个变量，声明将自动添加到着色器顶部。调用者负责在顶点着色器中赋值并在片段着色器中使用该值。
 * @param {string} [options.vertexShaderText] 自定义顶点着色器，以 GLSL 代码字符串形式提供。必须包含一个名为 vertexMain 的 GLSL 函数。有关预期签名，请参阅示例。如果未指定，将在计算的顶点着色器中跳过自定义顶点着色器步骤。
 * @param {string} [options.fragmentShaderText] 自定义片段着色器，以 GLSL 代码字符串形式提供。必须包含一个名为 fragmentMain 的 GLSL 函数。有关预期签名，请参阅示例。如果未指定，将在计算的片段着色器中跳过自定义片段着色器步骤。
 *
 * @alias CustomShader
 * @constructor
 *
 * @experimental 此功能使用了 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用策略的情况下更改。
 *
 * @example
 * const customShader = new CustomShader({
 *   uniforms: {
 *     u_colorIndex: {
 *       type: Cesium.UniformType.FLOAT,
 *       value: 1.0
 *     },
 *     u_normalMap: {
 *       type: Cesium.UniformType.SAMPLER_2D,
 *       value: new Cesium.TextureUniform({
 *         url: "http://example.com/normal.png"
 *       })
 *     }
 *   },
 *   varyings: {
 *     v_selectedColor: Cesium.VaryingType.VEC3
 *   },
 *   vertexShaderText: `
 *   void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
 *     v_selectedColor = mix(vsInput.attributes.color_0, vsInput.attributes.color_1, u_colorIndex);
 *     vsOutput.positionMC += 0.1 * vsInput.attributes.normal;
 *   }
 *   `,
 *   fragmentShaderText: `
 *   void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
 *     material.normal = texture(u_normalMap, fsInput.attributes.texCoord_0);
 *     material.diffuse = v_selectedColor;
 *   }
 *   `
 * });
 */
function CustomShader(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  /**
   * 决定自定义着色器如何与整体片段着色器交互的值。由 {@link CustomShaderPipelineStage} 使用
   *
   * @type {CustomShaderMode}
   * @readonly
   */
  this.mode = options.mode ?? CustomShaderMode.MODIFY_MATERIAL;
  /**
   * 使用自定义着色器时的光照模型。
   * 由 {@link CustomShaderPipelineStage} 使用
   *
   * @type {LightingModel}
   * @readonly
   */
  this.lightingModel = options.lightingModel;
  /**
   * 用户声明的额外统一变量。
   *
   * @type {Object<string, UniformSpecifier>}
   * @readonly
   */
  this.uniforms = options.uniforms ?? Frozen.EMPTY_OBJECT;
  /**
   * 用户声明的额外 varyings。
   * 由 {@link CustomShaderPipelineStage} 使用
   *
   * @type {Object<string, VaryingType>}
   * @readonly
   */
  this.varyings = options.varyings ?? Frozen.EMPTY_OBJECT;
  /**
   * 用户定义的顶点着色器 GLSL 代码
   *
   * @type {string}
   * @readonly
   */
  this.vertexShaderText = options.vertexShaderText;
  /**
   * 用户定义的片段着色器 GLSL 代码
   *
   * @type {string}
   * @readonly
   */
  this.fragmentShaderText = options.fragmentShaderText;

  /**
   * 透明度模式，决定自定义着色器如何应用。如果值为
   * CustomShaderTransulcencyMode.OPAQUE 或 CustomShaderTransulcencyMode.TRANSLUCENT，自定义着色器
   * 将覆盖模型材质的设置。如果值为 CustomShaderTransulcencyMode.INHERIT，
   * 自定义着色器将根据图元材质设置渲染为不透明或半透明。
   *
   * @type {CustomShaderTranslucencyMode}
   * @default CustomShaderTranslucencyMode.INHERIT
   * @readonly
   */
  this.translucencyMode =
    options.translucencyMode ?? CustomShaderTranslucencyMode.INHERIT;

  /**
   * texture uniforms require some asynchronous processing. This is delegated
   * to a texture manager.
   *
   * @type {TextureManager}
   * @readonly
   * @private
   */
  this._textureManager = new TextureManager();
  /**
   * The default texture (from the {@link Context}) to use while textures
   * are loading
   *
   * @type {Texture}
   * @readonly
   * @private
   */
  this._defaultTexture = undefined;
  /**
   * The map of uniform names to a function that returns a value. This map
   * is combined with the overall uniform map used by the {@link DrawCommand}
   *
   * @type {Object<string, Function>}
   * @readonly
   * @private
   */
  this.uniformMap = buildUniformMap(this);

  /**
   * A collection of variables used in <code>vertexShaderText</code>. This
   * is used only for optimizations in {@link CustomShaderPipelineStage}.
   * @type {VertexVariableSets}
   * @private
   */
  this.usedVariablesVertex = {
    attributeSet: {},
    featureIdSet: {},
    metadataSet: {},
  };
  /**
   * A collection of variables used in <code>fragmentShaderText</code>. This
   * is used only for optimizations in {@link CustomShaderPipelineStage}.
   * @type {FragmentVariableSets}
   * @private
   */
  this.usedVariablesFragment = {
    attributeSet: {},
    featureIdSet: {},
    metadataSet: {},
    materialSet: {},
  };

  findUsedVariables(this);
  validateBuiltinVariables(this);
}

function buildUniformMap(customShader) {
  const uniforms = customShader.uniforms;
  const uniformMap = {};
  for (const uniformName in uniforms) {
    if (uniforms.hasOwnProperty(uniformName)) {
      const uniform = uniforms[uniformName];
      const type = uniform.type;
      //>>includeStart('debug', pragmas.debug);
      if (type === UniformType.SAMPLER_CUBE) {
        throw new DeveloperError(
          "CustomShader does not support samplerCube uniforms",
        );
      }
      //>>includeEnd('debug');

      if (type === UniformType.SAMPLER_2D) {
        customShader._textureManager.loadTexture2D(uniformName, uniform.value);
        uniformMap[uniformName] = createUniformTexture2DFunction(
          customShader,
          uniformName,
        );
      } else {
        uniformMap[uniformName] = createUniformFunction(
          customShader,
          uniformName,
        );
      }
    }
  }
  return uniformMap;
}

function createUniformTexture2DFunction(customShader, uniformName) {
  return function () {
    return (
      customShader._textureManager.getTexture(uniformName) ??
      customShader._defaultTexture
    );
  };
}

function createUniformFunction(customShader, uniformName) {
  return function () {
    return customShader.uniforms[uniformName].value;
  };
}

function getVariables(shaderText, regex, outputSet) {
  let match;
  while ((match = regex.exec(shaderText)) !== null) {
    const variableName = match[1];

    // Using a dictionary like a set. The value doesn't
    // matter, as this will only be used for queries such as
    // if (set.hasOwnProperty(variableName)) { ... }
    outputSet[variableName] = true;
  }
}

function findUsedVariables(customShader) {
  const attributeRegex = /[vf]sInput\.attributes\.(\w+)/g;
  const featureIdRegex = /[vf]sInput\.featureIds\.(\w+)/g;
  // Metadata is a little more complex. Match the first identifier after:
  //  - vsInput.metadata.<property>
  //  - vsInput.metadataClass.<property>
  //  - vsInput.metadataStatistics.<property>
  const metadataRegex =
    /[vf]sInput\.(?:metadata|metadataClass|metadataStatistics)\.(\w+)/g;
  let attributeSet;

  const vertexShaderText = customShader.vertexShaderText;
  if (defined(vertexShaderText)) {
    attributeSet = customShader.usedVariablesVertex.attributeSet;
    getVariables(vertexShaderText, attributeRegex, attributeSet);

    attributeSet = customShader.usedVariablesVertex.featureIdSet;
    getVariables(vertexShaderText, featureIdRegex, attributeSet);

    attributeSet = customShader.usedVariablesVertex.metadataSet;
    getVariables(vertexShaderText, metadataRegex, attributeSet);
  }

  const fragmentShaderText = customShader.fragmentShaderText;
  if (defined(fragmentShaderText)) {
    attributeSet = customShader.usedVariablesFragment.attributeSet;
    getVariables(fragmentShaderText, attributeRegex, attributeSet);

    attributeSet = customShader.usedVariablesFragment.featureIdSet;
    getVariables(fragmentShaderText, featureIdRegex, attributeSet);

    attributeSet = customShader.usedVariablesFragment.metadataSet;
    getVariables(fragmentShaderText, metadataRegex, attributeSet);

    const materialRegex = /material\.(\w+)/g;
    const materialSet = customShader.usedVariablesFragment.materialSet;
    getVariables(fragmentShaderText, materialRegex, materialSet);
  }
}

function expandCoordinateAbbreviations(variableName) {
  const modelCoordinatesRegex = /^.*MC$/;
  const worldCoordinatesRegex = /^.*WC$/;
  const eyeCoordinatesRegex = /^.*EC$/;

  if (modelCoordinatesRegex.test(variableName)) {
    return `${variableName} (model coordinates)`;
  }

  if (worldCoordinatesRegex.test(variableName)) {
    return `${variableName} (Cartesian world coordinates)`;
  }

  if (eyeCoordinatesRegex.test(variableName)) {
    return `${variableName} (eye coordinates)`;
  }

  return variableName;
}

function validateVariableUsage(
  variableSet,
  incorrectVariable,
  correctVariable,
  vertexOrFragment,
) {
  if (variableSet.hasOwnProperty(incorrectVariable)) {
    const message = `${expandCoordinateAbbreviations(
      incorrectVariable,
    )} is not available in the ${vertexOrFragment} shader. Did you mean ${expandCoordinateAbbreviations(
      correctVariable,
    )} instead?`;
    throw new DeveloperError(message);
  }
}

function validateBuiltinVariables(customShader) {
  const attributesVS = customShader.usedVariablesVertex.attributeSet;

  // names without MC/WC/EC are ambiguous
  validateVariableUsage(attributesVS, "position", "positionMC", "vertex");
  validateVariableUsage(attributesVS, "normal", "normalMC", "vertex");
  validateVariableUsage(attributesVS, "tangent", "tangentMC", "vertex");
  validateVariableUsage(attributesVS, "bitangent", "bitangentMC", "vertex");

  // world and eye coordinate positions are only available in the fragment shader.
  validateVariableUsage(attributesVS, "positionWC", "positionMC", "vertex");
  validateVariableUsage(attributesVS, "positionEC", "positionMC", "vertex");

  // normal, tangent and bitangent are in model coordinates in the vertex shader
  validateVariableUsage(attributesVS, "normalEC", "normalMC", "vertex");
  validateVariableUsage(attributesVS, "tangentEC", "tangentMC", "vertex");
  validateVariableUsage(attributesVS, "bitangentEC", "bitangentMC", "vertex");

  const attributesFS = customShader.usedVariablesFragment.attributeSet;

  // names without MC/WC/EC are ambiguous
  validateVariableUsage(attributesFS, "position", "positionEC", "fragment");
  validateVariableUsage(attributesFS, "normal", "normalEC", "fragment");
  validateVariableUsage(attributesFS, "tangent", "tangentEC", "fragment");
  validateVariableUsage(attributesFS, "bitangent", "bitangentEC", "fragment");

  // normal, tangent, and bitangent are in eye coordinates in the fragment
  // shader.
  validateVariableUsage(attributesFS, "normalMC", "normalEC", "fragment");
  validateVariableUsage(attributesFS, "tangentMC", "tangentEC", "fragment");
  validateVariableUsage(attributesFS, "bitangentMC", "bitangentEC", "fragment");
}

/**
 * 更新着色器中声明的统一变量的值
 * @param {string} uniformName 统一变量的 GLSL 名称。必须与构造函数中声明的统一变量之一匹配
 * @param {boolean|number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|string|Resource|TextureUniform} value 统一变量的新值
 */
CustomShader.prototype.setUniform = function (uniformName, value) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("uniformName", uniformName);
  Check.defined("value", value);
  if (!defined(this.uniforms[uniformName])) {
    throw new DeveloperError(
      `Uniform ${uniformName} must be declared in the CustomShader constructor.`,
    );
  }
  //>>includeEnd('debug');
  const uniform = this.uniforms[uniformName];
  if (uniform.type === UniformType.SAMPLER_2D) {
    // Textures are loaded asynchronously
    this._textureManager.loadTexture2D(uniformName, value);
  } else if (defined(value.clone)) {
    // clone Cartesian and Matrix types.
    uniform.value = value.clone(uniform.value);
  } else {
    uniform.value = value;
  }
};

CustomShader.prototype.update = function (frameState) {
  this._defaultTexture = frameState.context.defaultTexture;
  this._textureManager.update(frameState);
};

/**
 * 如果此对象已被销毁则返回 true，否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则返回 true，否则返回 false。
 *
 * @see CustomShader#destroy
 */
CustomShader.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用它；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 应像示例中那样将返回值（<code>undefined</code>）赋给对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 * @example
 * customShader = customShader && customShader.destroy();
 *
 * @see CustomShader#isDestroyed
 */
CustomShader.prototype.destroy = function () {
  this._textureManager = this._textureManager && this._textureManager.destroy();
  destroyObject(this);
};

export default CustomShader;
