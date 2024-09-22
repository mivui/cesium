import Check from "../../Core/Check.js";
import defaultValue from "../../Core/defaultValue.js";
import defined from "../../Core/defined.js";
import destroyObject from "../../Core/destroyObject.js";
import DeveloperError from "../../Core/DeveloperError.js";
import CustomShaderMode from "./CustomShaderMode.js";
import UniformType from "./UniformType.js";
import TextureManager from "./TextureManager.js";
import CustomShaderTranslucencyMode from "./CustomShaderTranslucencyMode.js";

/**
 * 描述 uniform、其类型和初始值的对象
 *
 * @typedef {object} UniformSpecifier
 * @property {UniformType} type 制服的 Glsl 类型。
 * @property {boolean|number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|TextureUniform} value uniform 的初始值
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */

/**
 * 从用户定义的着色器代码中解析的一组变量。这些可以是
 * 用于生成整体着色器时的优化。虽然他们是
 * 表示为 JS 对象，则预期用途类似于集合，因此只有
 * 密钥的存在很重要。如果满足以下条件，则值将始终为 <code>true</code>
 *定义。使用此数据结构是因为：
 * <ul>
 * <li>我们尚不能使用 ES6 Set 对象</li>
 * <li>使用字典会自动删除重复的变量名称</li>
 * <li><code>诸如 variableSet.hasOwnProperty（“position”）</code> 之类的查询非常简单</li>
 * </ul>
 * @typedef {Object<string, boolean>} VariableSet
 * @private
 */

/**
 * 从用户定义的顶点着色器文本解析的变量集。
 * @typedef {object} VertexVariableSets
 * @property {VariableSet} attributeSet 通过 <code>vsInput.attributes</code> 结构在顶点着色器中使用的一组所有唯一属性。
 * @property {VariableSet} featureIdSet 通过 <code>vsInput.featureIds</code> 结构在顶点着色器中使用的一组所有唯一特征 ID 集。
 * @property {VariableSet} metadataSet 通过 <code>vsInput.metadata</code> 结构在顶点着色器中使用的一组所有唯一元数据属性。
 * @private
 */

/**
 * 从用户定义的片段着色器文本中解析的变量集。
 * @typedef {object} FragmentVariableSets
 * @property {VariableSet} attributeSet 通过 <code>fsInput.attributes</code> 结构在片段着色器中使用的一组所有唯一属性
 * @property {VariableSet} featureIdSet 通过 <code>fsInput.featureIds</code> 结构体在片段着色器中使用的一组所有唯一特征 ID 集。
 * @property {VariableSet} metadataSet 通过 <code>fsInput.metadata</code> 结构在片段着色器中使用的一组唯一元数据属性。
 * @property {VariableSet} materialSet 通过<code>材质</code>结构在片段着色器中使用的所有材质变量（如漫反射、镜面反射或 Alpha）的集合。
 * @private
 */

/**
 * 用户定义的 GLSL 着色器也与 {@link Model} 一起使用
 * 为 {@link Cesium3DTileset}。
 * <p>
 * 如果使用纹理 uniform，则必须进行额外的资源管理：
 * </p>
 * <ul>
 *   <li>
 *     必须每帧调用 <code>update</code> 函数。当
 *      自定义着色器传递给 {@link Model} 或
 *     {@link Cesium3DTileset}，此步骤会自动处理
 *   </li>
 *   <li>
 *      {@link CustomShader#destroy} 当自定义着色器为
 *      不再需要正确清理 GPU 资源。应用
 *      负责调用该方法。
 *   </li>
 * </ul>
 * <p>
 * See the {@link https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide|Custom Shader Guide} for more detailed documentation.
 * </p>
 *
 * @param {object} options 具有以下选项的对象
 * @param {CustomShaderMode} [options.mode=CustomShaderMode.MODIFY_MATERIAL] 自定义着色器模式，用于确定如何将自定义着色器代码插入到片段着色器中。
 * @param {LightingModel} [options.lightingModel] 照明模型（例如 PBR 或无光照）。如果存在，这将覆盖模型的默认照明。
 * @param {CustomShaderTranslucencyMode} [options.translucencyMode=CustomShaderTranslucencyMode.INHERIT] 半透明模式，用于确定自定义着色器的应用方式。如果值为 CustomShaderTransulcencyMode.OPAQUE 或 CustomShaderTransulcencyMode.TRANSLUCENT，则自定义着色器将覆盖模型材质的设置。如果值为 CustomShaderTransulcencyMode.INHERIT，则自定义着色器将渲染为不透明或半透明，具体取决于基元的材质设置。
 * @param {Object<string, UniformSpecifier>} [options.uniforms] 用户定义的 uniform 的字典。key 是将出现在 GLSL 代码中的统一名称。该值是描述 uniform 类型和初始值的对象
 * @param {Object<string, VaryingType>} [options.varyings] 用于声明着色器中使用的其他 GLSL 变体的字典。关键是将出现在 GLSL 代码中的不同名称。该值是 varying 的数据类型。对于每个变化，声明将自动添加到着色器的顶部。调用方负责在顶点着色器中分配值，并在片段着色器中使用该值。
 * @param {string} [options.vertexShaderText] 自定义顶点着色器，作为 GLSL 代码字符串。它必须包含一个名为 vertexMain 的 GLSL 函数。有关预期签名，请参阅示例。如果未指定，将在计算的顶点着色器中跳过自定义顶点着色器步骤。
 * @param {string} [options.fragmentShaderText] 作为 GLSL 代码字符串的自定义片段着色器。它必须包含一个名为 fragmentMain 的 GLSL 函数。有关预期签名，请参阅示例。如果未指定，则将在计算的片段着色器中跳过自定义片段着色器步骤。
 *
 * @alias CustomShader
 * @constructor
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
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
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 一个值，用于确定自定义着色器如何与整体
   * 片段着色器。它由 {@link CustomShaderPipelineStage} 使用
   *
   * @type {CustomShaderMode}
   * @readonly
   */
  this.mode = defaultValue(options.mode, CustomShaderMode.MODIFY_MATERIAL);
  /**
   * 使用自定义着色器时要使用的照明模型。
   * 这由 {@link CustomShaderPipelineStage} 使用
   *
   * @type {LightingModel}
   * @readonly
   */
  this.lightingModel = options.lightingModel;
  /**
   * 用户声明的额外制服。
   *
   * @type {Object<string, UniformSpecifier>}
   * @readonly
   */
  this.uniforms = defaultValue(options.uniforms, defaultValue.EMPTY_OBJECT);
  /**
   * 用户声明的其他变化。
   * 这由 {@link CustomShaderPipelineStage} 使用
   *
   * @type {Object<string, VaryingType>}
   * @readonly
   */
  this.varyings = defaultValue(options.varyings, defaultValue.EMPTY_OBJECT);
  /**
   * 顶点着色器的用户定义 GLSL 代码
   *
   * @type {string}
   * @readonly
   */
  this.vertexShaderText = options.vertexShaderText;
  /**
   * 用户定义的片段着色器的 GLSL 代码
   *
   * @type {string}
   * @readonly
   */
  this.fragmentShaderText = options.fragmentShaderText;

  /**
   * 半透明模式，用于确定如何应用自定义着色器。如果值为
   * CustomShaderTransulcencyMode.OPAQUE 或 CustomShaderTransulcencyMode.TRANSLUCENT，自定义着色器
   * 将覆盖模型材质的设置。如果值为 CustomShaderTransulcencyMode.INHERIT，则
   * 自定义着色器将渲染为 Opaque 或 Translucent，具体取决于图元的材质设置。
   *
   * @type {CustomShaderTranslucencyMode}
   * @default CustomShaderTranslucencyMode.INHERIT
   * @readonly
   */
  this.translucencyMode = defaultValue(
    options.translucencyMode,
    CustomShaderTranslucencyMode.INHERIT
  );

  /**
   * 纹理 uniform 需要一些异步处理。这是委托的
   * 添加到纹理管理器中。
   *
   * @type {TextureManager}
   * @readonly
   * @private
   */
  this._textureManager = new TextureManager();
  /**
   * 要使用的默认纹理（来自 {@link Context}）while textures
   * 正在加载
   *
   * @type {Texture}
   * @readonly
   * @private
   */
  this._defaultTexture = undefined;
  /**
   * uniform names 到返回值的函数的 map。这张地图
   * 与 {@link DrawCommand} 使用的整体统一映射组合
   *
   * @type {Object<string, Function>}
   * @readonly
   * @private
   */
  this.uniformMap = buildUniformMap(this);

  /**
   * <code>vertexShaderText</code> 中使用的变量集合。这
   * 仅用于 {@link CustomShaderPipelineStage} 中的优化。
   * @type {VertexVariableSets}
   * @private
   */
  this.usedVariablesVertex = {
    attributeSet: {},
    featureIdSet: {},
    metadataSet: {},
  };
  /**
   * <code>fragmentShaderText</code> 中使用的变量集合。这
   * 仅用于 {@link CustomShaderPipelineStage} 中的优化。
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
          "CustomShader does not support samplerCube uniforms"
        );
      }
      //>>includeEnd('debug');

      if (type === UniformType.SAMPLER_2D) {
        customShader._textureManager.loadTexture2D(uniformName, uniform.value);
        uniformMap[uniformName] = createUniformTexture2DFunction(
          customShader,
          uniformName
        );
      } else {
        uniformMap[uniformName] = createUniformFunction(
          customShader,
          uniformName
        );
      }
    }
  }
  return uniformMap;
}

function createUniformTexture2DFunction(customShader, uniformName) {
  return function () {
    return defaultValue(
      customShader._textureManager.getTexture(uniformName),
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
  const metadataRegex = /[vf]sInput\.metadata.(\w+)/g;
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
  vertexOrFragment
) {
  if (variableSet.hasOwnProperty(incorrectVariable)) {
    const message = `${expandCoordinateAbbreviations(
      incorrectVariable
    )} is not available in the ${vertexOrFragment} shader. Did you mean ${expandCoordinateAbbreviations(
      correctVariable
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
 * 更新着色器中声明的 uniform 的值
 * @param {string} uniformName 制服的 GLSL 名称。这必须与构造函数中声明的 uniform 之一匹配
 * @param {boolean|number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|string|Resource|TextureUniform} value uniform 的新值。
 */
CustomShader.prototype.setUniform = function (uniformName, value) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("uniformName", uniformName);
  Check.defined("value", value);
  if (!defined(this.uniforms[uniformName])) {
    throw new DeveloperError(
      `Uniform ${uniformName} must be declared in the CustomShader constructor.`
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
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see CustomShader#destroy
 * @private
 */
CustomShader.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将 return value （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已销毁，即调用 destroy() 。
 *
 * @example
 * customShader = customShader && customShader.destroy();
 *
 * @see CustomShader#isDestroyed
 * @private
 */
CustomShader.prototype.destroy = function () {
  this._textureManager = this._textureManager && this._textureManager.destroy();
  destroyObject(this);
};

export default CustomShader;
