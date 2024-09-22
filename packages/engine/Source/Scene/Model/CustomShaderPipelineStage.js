import combine from "../../Core/combine.js";
import defined from "../../Core/defined.js";
import oneTimeWarning from "../../Core/oneTimeWarning.js";
import ShaderDestination from "../../Renderer/ShaderDestination.js";
import Pass from "../../Renderer/Pass.js";
import CustomShaderStageVS from "../../Shaders/Model/CustomShaderStageVS.js";
import CustomShaderStageFS from "../../Shaders/Model/CustomShaderStageFS.js";
import CustomShaderMode from "./CustomShaderMode.js";
import FeatureIdPipelineStage from "./FeatureIdPipelineStage.js";
import MetadataPipelineStage from "./MetadataPipelineStage.js";
import ModelUtility from "./ModelUtility.js";
import CustomShaderTranslucencyMode from "./CustomShaderTranslucencyMode.js";

/**
 * 自定义着色器管道阶段从
 * {@link CustomShader} 并将它们插入到
 * {@link Model} 的模型。回调的输入是一个具有许多
 * 依赖于基元属性的属性。此着色器代码
 * 由此阶段自动生成。
 *
 * @namespace CustomShaderPipelineStage
 *
 * @private
 */
const CustomShaderPipelineStage = {
  name: "CustomShaderPipelineStage", // Helps with debugging

  STRUCT_ID_ATTRIBUTES_VS: "AttributesVS",
  STRUCT_ID_ATTRIBUTES_FS: "AttributesFS",
  STRUCT_NAME_ATTRIBUTES: "Attributes",
  STRUCT_ID_VERTEX_INPUT: "VertexInput",
  STRUCT_NAME_VERTEX_INPUT: "VertexInput",
  STRUCT_ID_FRAGMENT_INPUT: "FragmentInput",
  STRUCT_NAME_FRAGMENT_INPUT: "FragmentInput",
  FUNCTION_ID_INITIALIZE_INPUT_STRUCT_VS: "initializeInputStructVS",
  FUNCTION_SIGNATURE_INITIALIZE_INPUT_STRUCT_VS:
    "void initializeInputStruct(out VertexInput vsInput, ProcessedAttributes attributes)",
  FUNCTION_ID_INITIALIZE_INPUT_STRUCT_FS: "initializeInputStructFS",
  FUNCTION_SIGNATURE_INITIALIZE_INPUT_STRUCT_FS:
    "void initializeInputStruct(out FragmentInput fsInput, ProcessedAttributes attributes)",

  // Expose method for testing.
  _oneTimeWarning: oneTimeWarning,
};

/**
 * 处理原语。这将修改渲染的以下部分
 *资源：
 * <ul>
 * <li>修改着色器，将自定义着色器代码包含在顶点和片段着色器中</li>
 * <li>修改着色器以包含自动生成的结构，这些结构用作自定义着色器回调的输入 </li>
 * <li>修改着色器以包含任何其他用户定义的 uniform</li>
 * <li>修改着色器以包括任何其他用户定义的变化</li>
 * <li>将任何用户定义的 uniform 添加到 uniform 映射中</li>
 * <li>如果用户指定了照明模型，则渲染资源中的设置将被覆盖</li>
 * </ul>
 * <p>
 * 此 pipeline 阶段设计为在可能的情况下正常失败。如果
 * primitive 没有满足着色器代码的正确属性，
 * 将推断违约（在合理的情况下）。如果不是，则自定义
 * 着色器将被禁用。
 * <p>
 *
 * @param {PrimitiveRenderResources} renderResources 基元的渲染资源
 * @param {ModelComponents.Primitive} primitive 要渲染的基元
 * @param {FrameState} frameState 帧状态。
 * @private
 */
CustomShaderPipelineStage.process = function (
  renderResources,
  primitive,
  frameState
) {
  const { shaderBuilder, model, alphaOptions } = renderResources;
  const { customShader } = model;

  // Check the lighting model and translucent options first, as sometimes
  // these are used even if there is no vertex or fragment shader text.
  const { lightingModel, translucencyMode } = customShader;

  // if present, the lighting model overrides the material's lighting model.
  if (defined(lightingModel)) {
    renderResources.lightingOptions.lightingModel = lightingModel;
  }

  if (translucencyMode === CustomShaderTranslucencyMode.TRANSLUCENT) {
    alphaOptions.pass = Pass.TRANSLUCENT;
  } else if (translucencyMode === CustomShaderTranslucencyMode.OPAQUE) {
    // Use the default opqaue pass (either OPAQUE or 3D_TILES), regardless of whether
    // the material pipeline stage used translucent. The default is configured
    // in AlphaPipelineStage
    alphaOptions.pass = undefined;
  }
  // For CustomShaderTranslucencyMode.INHERIT, do not modify alphaOptions.pass

  // Generate lines of code for the shader, but don't add them to the shader
  // yet.
  const generatedCode = generateShaderLines(customShader, primitive);

  // In some corner cases, the primitive may not be compatible with the
  // shader. In this case, skip the custom shader.
  if (!generatedCode.customShaderEnabled) {
    return;
  }
  addLinesToShader(shaderBuilder, customShader, generatedCode);

  // the input to the fragment shader may include a low-precision ECEF position
  if (generatedCode.shouldComputePositionWC) {
    shaderBuilder.addDefine(
      "COMPUTE_POSITION_WC_CUSTOM_SHADER",
      undefined,
      ShaderDestination.BOTH
    );
  }

  if (defined(customShader.vertexShaderText)) {
    shaderBuilder.addDefine(
      "HAS_CUSTOM_VERTEX_SHADER",
      undefined,
      ShaderDestination.VERTEX
    );
  }

  if (defined(customShader.fragmentShaderText)) {
    shaderBuilder.addDefine(
      "HAS_CUSTOM_FRAGMENT_SHADER",
      undefined,
      ShaderDestination.FRAGMENT
    );

    // add defines like CUSTOM_SHADER_MODIFY_MATERIAL
    const shaderModeDefine = CustomShaderMode.getDefineName(customShader.mode);
    shaderBuilder.addDefine(
      shaderModeDefine,
      undefined,
      ShaderDestination.FRAGMENT
    );
  }

  const uniforms = customShader.uniforms;
  for (const uniformName in uniforms) {
    if (uniforms.hasOwnProperty(uniformName)) {
      const uniform = uniforms[uniformName];
      shaderBuilder.addUniform(uniform.type, uniformName);
    }
  }

  const varyings = customShader.varyings;
  for (const varyingName in varyings) {
    if (varyings.hasOwnProperty(varyingName)) {
      const varyingType = varyings[varyingName];
      shaderBuilder.addVarying(varyingType, varyingName);
    }
  }

  renderResources.uniformMap = combine(
    renderResources.uniformMap,
    customShader.uniformMap
  );
};

/**
 * @private
 * @param {ModelComponents.Attribute[]} attributes
 * @returns {Object<string, ModelComponents.Attribute>}
 */
function getAttributesByName(attributes) {
  const names = {};
  for (let i = 0; i < attributes.length; i++) {
    const attributeInfo = ModelUtility.getAttributeInfo(attributes[i]);
    names[attributeInfo.variableName] = attributeInfo;
  }
  return names;
}

// GLSL types of standard attribute types when uniquely defined
const attributeTypeLUT = {
  position: "vec3",
  normal: "vec3",
  tangent: "vec3",
  bitangent: "vec3",
  texCoord: "vec2",
  color: "vec4",
  joints: "ivec4",
  weights: "vec4",
};

// Corresponding attribute values
const attributeDefaultValueLUT = {
  position: "vec3(0.0)",
  normal: "vec3(0.0, 0.0, 1.0)",
  tangent: "vec3(1.0, 0.0, 0.0)",
  bitangent: "vec3(0.0, 1.0, 0.0)",
  texCoord: "vec2(0.0)",
  color: "vec4(1.0)",
  joints: "ivec4(0)",
  weights: "vec4(0.0)",
};

function inferAttributeDefaults(attributeName) {
  // remove trailing set indices. E.g. "texCoord_0" -> "texCoord"
  let trimmed = attributeName.replace(/_[0-9]+$/, "");
  // also remove the MC/EC since they will have the same default value
  trimmed = trimmed.replace(/(MC|EC)$/, "");

  const glslType = attributeTypeLUT[trimmed];
  const value = attributeDefaultValueLUT[trimmed];

  // - _CUSTOM_ATTRIBUTE has an unknown type.
  if (!defined(glslType)) {
    return undefined;
  }

  return {
    attributeField: [glslType, attributeName],
    value: value,
  };
}

/**
 * @private
 * @param {CustomShader} customShader
 * @param {Object<string, ModelComponents.Attribute>} attributesByName
 * @returns {object}
 */
function generateVertexShaderLines(customShader, attributesByName) {
  if (!defined(customShader.vertexShaderText)) {
    return { enabled: false };
  }

  const primitiveAttributes = customShader.usedVariablesVertex.attributeSet;
  const addToShader = getPrimitiveAttributesUsedInShader(
    attributesByName,
    primitiveAttributes,
    false
  );
  const needsDefault = getAttributesNeedingDefaults(
    attributesByName,
    primitiveAttributes,
    false
  );

  let vertexInitialization;
  const attributeFields = [];
  const initializationLines = [];
  for (const variableName in addToShader) {
    if (!addToShader.hasOwnProperty(variableName)) {
      continue;
    }
    const attributeInfo = addToShader[variableName];
    const attributeField = [attributeInfo.glslType, variableName];
    attributeFields.push(attributeField);

    // Initializing attribute structs are just a matter of copying the
    // attribute or varying: E.g.:
    // "    vsInput.attributes.position = a_position;"
    vertexInitialization = `vsInput.attributes.${variableName} = attributes.${variableName};`;
    initializationLines.push(vertexInitialization);
  }

  for (let i = 0; i < needsDefault.length; i++) {
    const variableName = needsDefault[i];
    const attributeDefaults = inferAttributeDefaults(variableName);
    if (!defined(attributeDefaults)) {
      CustomShaderPipelineStage._oneTimeWarning(
        "CustomShaderPipelineStage.incompatiblePrimitiveVS",
        `Primitive is missing attribute ${variableName}, disabling custom vertex shader`
      );
      // This primitive isn't compatible with the shader. Return early
      // to skip the vertex shader
      return { enabled: false };
    }

    attributeFields.push(attributeDefaults.attributeField);
    vertexInitialization = `vsInput.attributes.${variableName} = ${attributeDefaults.value};`;
    initializationLines.push(vertexInitialization);
  }

  return {
    enabled: true,
    attributeFields: attributeFields,
    initializationLines: initializationLines,
  };
}

function generatePositionBuiltins(customShader) {
  const attributeFields = [];
  const initializationLines = [];
  const usedVariables = customShader.usedVariablesFragment.attributeSet;

  // Model space position is the same position as in the glTF accessor,
  // this is already added to the shader with other attributes.

  // World coordinates in ECEF coordinates. Note that this is
  // low precision (32-bit floats) on the GPU.
  if (usedVariables.hasOwnProperty("positionWC")) {
    attributeFields.push(["vec3", "positionWC"]);
    initializationLines.push(
      "fsInput.attributes.positionWC = attributes.positionWC;"
    );
  }

  // position in eye coordinates
  if (usedVariables.hasOwnProperty("positionEC")) {
    attributeFields.push(["vec3", "positionEC"]);
    initializationLines.push(
      "fsInput.attributes.positionEC = attributes.positionEC;"
    );
  }

  return {
    attributeFields: attributeFields,
    initializationLines: initializationLines,
  };
}

/**
 * @private
 * @param {CustomShader} customShader
 * @param {Object<string, ModelComponents.Attribute>} attributesByName
 * @returns {object}
 */
function generateFragmentShaderLines(customShader, attributesByName) {
  if (!defined(customShader.fragmentShaderText)) {
    return { enabled: false };
  }

  const primitiveAttributes = customShader.usedVariablesFragment.attributeSet;
  const addToShader = getPrimitiveAttributesUsedInShader(
    attributesByName,
    primitiveAttributes,
    true
  );
  const needsDefault = getAttributesNeedingDefaults(
    attributesByName,
    primitiveAttributes,
    true
  );

  let fragmentInitialization;
  const attributeFields = [];
  const initializationLines = [];
  for (const variableName in addToShader) {
    if (!addToShader.hasOwnProperty(variableName)) {
      continue;
    }
    const attributeInfo = addToShader[variableName];

    const attributeField = [attributeInfo.glslType, variableName];
    attributeFields.push(attributeField);

    // Initializing attribute structs are just a matter of copying the
    // value from the processed attributes
    // "    fsInput.attributes.positionMC = attributes.positionMC;"
    fragmentInitialization = `fsInput.attributes.${variableName} = attributes.${variableName};`;
    initializationLines.push(fragmentInitialization);
  }

  for (let i = 0; i < needsDefault.length; i++) {
    const variableName = needsDefault[i];
    const attributeDefaults = inferAttributeDefaults(variableName);
    if (!defined(attributeDefaults)) {
      CustomShaderPipelineStage._oneTimeWarning(
        "CustomShaderPipelineStage.incompatiblePrimitiveFS",
        `Primitive is missing attribute ${variableName}, disabling custom fragment shader.`
      );

      // This primitive isn't compatible with the shader. Return early
      // so the fragment shader is skipped
      return { enabled: false };
    }

    attributeFields.push(attributeDefaults.attributeField);
    fragmentInitialization = `fsInput.attributes.${variableName} = ${attributeDefaults.value};`;
    initializationLines.push(fragmentInitialization);
  }

  // Built-ins for positions in various coordinate systems.
  const positionBuiltins = generatePositionBuiltins(customShader);

  return {
    enabled: true,
    attributeFields: attributeFields.concat(positionBuiltins.attributeFields),
    initializationLines: positionBuiltins.initializationLines.concat(
      initializationLines
    ),
  };
}

// These attributes are derived from positionMC, and are handled separately
// from other attributes
const builtinAttributes = {
  positionWC: true,
  positionEC: true,
};

/**
 * 获取着色器中引用的基元属性
 *
 * @private
 * @param {Object<string, ModelComponents.Attribute>} primitiveAttributes 设置的所有基元的属性
 * @param {Object<string, ModelComponents.Attribute>} shaderAttributeSet 着色器中使用的所有属性的集合
 * @param {boolean} isFragmentShader
 * @returns {Object<string, ModelComponents.Attribute>} 着色器中使用的基元属性的字典
 */
function getPrimitiveAttributesUsedInShader(
  primitiveAttributes,
  shaderAttributeSet,
  isFragmentShader
) {
  const addToShader = {};
  for (const attributeName in primitiveAttributes) {
    if (!primitiveAttributes.hasOwnProperty(attributeName)) {
      continue;
    }
    const attribute = primitiveAttributes[attributeName];

    // normals and tangents are in model coordinates in the attributes but
    // in eye coordinates in the fragment shader.
    let renamed = attributeName;
    if (isFragmentShader && attributeName === "normalMC") {
      renamed = "normalEC";
    } else if (isFragmentShader && attributeName === "tangentMC") {
      renamed = "tangentEC";
      attribute.glslType = "vec3";
    }

    if (shaderAttributeSet.hasOwnProperty(renamed)) {
      addToShader[renamed] = attribute;
    }
  }
  return addToShader;
}

/**
 * 获取需要定义默认值的属性。
 * 着色器中引用但尚未定义的属性
 * 对于基元，并且不是内置的，则需要默认值。
 *
 * @private
 * @param {Object<string, ModelComponents.Attribute>} primitiveAttributes 设置的所有基元的属性
 * @param {Object<string, ModelComponents.Attribute>} shaderAttributeSet 着色器中使用的所有属性的集合
 * @param {boolean} isFragmentShader
 * @returns {string[]} The names of the attributes needing defaults
 */
function getAttributesNeedingDefaults(
  primitiveAttributes,
  shaderAttributeSet,
  isFragmentShader
) {
  const needDefaults = [];
  for (const attributeName in shaderAttributeSet) {
    if (!shaderAttributeSet.hasOwnProperty(attributeName)) {
      continue;
    }
    if (builtinAttributes.hasOwnProperty(attributeName)) {
      // Builtins are handled separately from attributes, so skip them here
      continue;
    }

    // normals and tangents are in model coordinates in the attributes but
    // in eye coordinates in the fragment shader.
    let renamed = attributeName;
    if (isFragmentShader && attributeName === "normalEC") {
      renamed = "normalMC";
    } else if (isFragmentShader && attributeName === "tangentEC") {
      renamed = "tangentMC";
    }

    if (!primitiveAttributes.hasOwnProperty(renamed)) {
      needDefaults.push(attributeName);
    }
  }
  return needDefaults;
}

/**
 * @private
 * @param {CustomShader} customShader
 * @param {ModelComponents.Primitive} primitive
 * @returns {object}
 */
function generateShaderLines(customShader, primitive) {
  // Attempt to generate vertex and fragment shader lines before adding any
  // code to the shader.
  const attributesByName = getAttributesByName(primitive.attributes);
  const vertexLines = generateVertexShaderLines(customShader, attributesByName);
  const fragmentLines = generateFragmentShaderLines(
    customShader,
    attributesByName
  );

  // positionWC must be computed in the vertex shader
  // for use in the fragmentShader. However, this can be skipped if:
  // - positionWC isn't used in the fragment shader
  // - or the fragment shader is disabled
  const attributeSetFS = customShader.usedVariablesFragment.attributeSet;
  const shouldComputePositionWC =
    attributeSetFS.hasOwnProperty("positionWC") && fragmentLines.enabled;

  // Return any generated shader code along with some flags to indicate which
  // defines should be added.
  return {
    vertexLines: vertexLines,
    fragmentLines: fragmentLines,
    customShaderEnabled: vertexLines.enabled || fragmentLines.enabled,
    shouldComputePositionWC: shouldComputePositionWC,
  };
}

function addVertexLinesToShader(shaderBuilder, vertexLines) {
  let structId = CustomShaderPipelineStage.STRUCT_ID_ATTRIBUTES_VS;
  shaderBuilder.addStruct(
    structId,
    CustomShaderPipelineStage.STRUCT_NAME_ATTRIBUTES,
    ShaderDestination.VERTEX
  );

  const { attributeFields, initializationLines } = vertexLines;
  for (let i = 0; i < attributeFields.length; i++) {
    const [glslType, variableName] = attributeFields[i];
    shaderBuilder.addStructField(structId, glslType, variableName);
  }

  // This could be hard-coded, but the symmetry with other structs makes unit
  // tests more convenient
  structId = CustomShaderPipelineStage.STRUCT_ID_VERTEX_INPUT;
  shaderBuilder.addStruct(
    structId,
    CustomShaderPipelineStage.STRUCT_NAME_VERTEX_INPUT,
    ShaderDestination.VERTEX
  );
  shaderBuilder.addStructField(
    structId,
    CustomShaderPipelineStage.STRUCT_NAME_ATTRIBUTES,
    "attributes"
  );
  // Add FeatureIds struct from the Feature ID stage
  shaderBuilder.addStructField(
    structId,
    FeatureIdPipelineStage.STRUCT_NAME_FEATURE_IDS,
    "featureIds"
  );
  // Add Metadata struct from the metadata stage
  shaderBuilder.addStructField(
    structId,
    MetadataPipelineStage.STRUCT_NAME_METADATA,
    "metadata"
  );
  // Add MetadataClass struct from the metadata stage
  shaderBuilder.addStructField(
    structId,
    MetadataPipelineStage.STRUCT_NAME_METADATA_CLASS,
    "metadataClass"
  );
  // Add MetadataStatistics struct from the metadata stage
  shaderBuilder.addStructField(
    structId,
    MetadataPipelineStage.STRUCT_NAME_METADATA_STATISTICS,
    "metadataStatistics"
  );

  const functionId =
    CustomShaderPipelineStage.FUNCTION_ID_INITIALIZE_INPUT_STRUCT_VS;
  shaderBuilder.addFunction(
    functionId,
    CustomShaderPipelineStage.FUNCTION_SIGNATURE_INITIALIZE_INPUT_STRUCT_VS,
    ShaderDestination.VERTEX
  );

  shaderBuilder.addFunctionLines(functionId, initializationLines);
}

function addFragmentLinesToShader(shaderBuilder, fragmentLines) {
  let structId = CustomShaderPipelineStage.STRUCT_ID_ATTRIBUTES_FS;
  shaderBuilder.addStruct(
    structId,
    CustomShaderPipelineStage.STRUCT_NAME_ATTRIBUTES,
    ShaderDestination.FRAGMENT
  );

  const { attributeFields, initializationLines } = fragmentLines;
  for (let i = 0; i < attributeFields.length; i++) {
    const [glslType, variableName] = attributeFields[i];
    shaderBuilder.addStructField(structId, glslType, variableName);
  }

  structId = CustomShaderPipelineStage.STRUCT_ID_FRAGMENT_INPUT;
  shaderBuilder.addStruct(
    structId,
    CustomShaderPipelineStage.STRUCT_NAME_FRAGMENT_INPUT,
    ShaderDestination.FRAGMENT
  );
  shaderBuilder.addStructField(
    structId,
    CustomShaderPipelineStage.STRUCT_NAME_ATTRIBUTES,
    "attributes"
  );
  // Add FeatureIds struct from the Feature ID stage
  shaderBuilder.addStructField(
    structId,
    FeatureIdPipelineStage.STRUCT_NAME_FEATURE_IDS,
    "featureIds"
  );
  // Add Metadata struct from the metadata stage
  shaderBuilder.addStructField(
    structId,
    MetadataPipelineStage.STRUCT_NAME_METADATA,
    "metadata"
  );
  // Add MetadataClass struct from the metadata stage
  shaderBuilder.addStructField(
    structId,
    MetadataPipelineStage.STRUCT_NAME_METADATA_CLASS,
    "metadataClass"
  );
  // Add MetadataStatistics struct from the metadata stage
  shaderBuilder.addStructField(
    structId,
    MetadataPipelineStage.STRUCT_NAME_METADATA_STATISTICS,
    "metadataStatistics"
  );

  const functionId =
    CustomShaderPipelineStage.FUNCTION_ID_INITIALIZE_INPUT_STRUCT_FS;
  shaderBuilder.addFunction(
    functionId,
    CustomShaderPipelineStage.FUNCTION_SIGNATURE_INITIALIZE_INPUT_STRUCT_FS,
    ShaderDestination.FRAGMENT
  );

  shaderBuilder.addFunctionLines(functionId, initializationLines);
}

const scratchShaderLines = [];

function addLinesToShader(shaderBuilder, customShader, generatedCode) {
  const { vertexLines, fragmentLines } = generatedCode;
  const shaderLines = scratchShaderLines;

  if (vertexLines.enabled) {
    addVertexLinesToShader(shaderBuilder, vertexLines);

    shaderLines.length = 0;
    shaderLines.push(
      "#line 0",
      customShader.vertexShaderText,
      CustomShaderStageVS
    );

    shaderBuilder.addVertexLines(shaderLines);
  }

  if (fragmentLines.enabled) {
    addFragmentLinesToShader(shaderBuilder, fragmentLines);

    shaderLines.length = 0;
    shaderLines.push(
      "#line 0",
      customShader.fragmentShaderText,
      CustomShaderStageFS
    );

    shaderBuilder.addFragmentLines(shaderLines);
  }
}

export default CustomShaderPipelineStage;
