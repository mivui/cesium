import combine from "../../Core/combine.js";
import defaultValue from "../../Core/defaultValue.js";

/**
 * batch texture 阶段负责设置基元的 batch texture。
 *
 * @namespace BatchTexturePipelineStage
 * @private
 */
const BatchTexturePipelineStage = {
  name: "BatchTexturePipelineStage", // Helps with debugging
};

/**
 * 处理一个原语。这将修改渲染资源的以下部分：
 * <ul>
 * <li>为 Batch 纹理添加 uniform</li>
 * <li>为多行批处理纹理添加定义</li>
 * </ul>
 *
 * @param {PrimitiveRenderResources} renderResources 此基元的渲染资源。
 * @param {ModelComponents.Primitive} primitive 基元。
 * @param {FrameState} frameState 帧状态。
 */
BatchTexturePipelineStage.process = function (
  renderResources,
  primitive,
  frameState,
) {
  const shaderBuilder = renderResources.shaderBuilder;
  const batchTextureUniforms = {};

  const model = renderResources.model;

  const featureTable = model.featureTables[model.featureTableId];

  // Number of features in the feature table.
  const featuresLength = featureTable.featuresLength;
  shaderBuilder.addUniform("int", "model_featuresLength");
  batchTextureUniforms.model_featuresLength = function () {
    return featuresLength;
  };

  // Batch texture
  const batchTexture = featureTable.batchTexture;
  shaderBuilder.addUniform("sampler2D", "model_batchTexture");
  batchTextureUniforms.model_batchTexture = function () {
    return defaultValue(batchTexture.batchTexture, batchTexture.defaultTexture);
  };

  // Batch texture step size
  shaderBuilder.addUniform("vec4", "model_textureStep");
  batchTextureUniforms.model_textureStep = function () {
    return batchTexture.textureStep;
  };

  // Batch texture dimensions
  if (batchTexture.textureDimensions.y > 1) {
    shaderBuilder.addDefine("MULTILINE_BATCH_TEXTURE");
    shaderBuilder.addUniform("vec2", "model_textureDimensions");
    batchTextureUniforms.model_textureDimensions = function () {
      return batchTexture.textureDimensions;
    };
  }

  renderResources.uniformMap = combine(
    batchTextureUniforms,
    renderResources.uniformMap,
  );
};

export default BatchTexturePipelineStage;
