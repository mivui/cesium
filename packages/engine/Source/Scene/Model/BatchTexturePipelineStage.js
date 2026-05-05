import combine from "../../Core/combine.js";

/**
 * The batch texture stage is responsible for setting up the batch texture for the primitive.
 *
 * @namespace BatchTexturePipelineStage
 * @private
 */
const BatchTexturePipelineStage = {
  name: "BatchTexturePipelineStage", // Helps with debugging
};

/**
 * 处理图元。这会修改渲染资源的以下部分：
 * <ul>
 *  <li>为批量纹理添加统一变量</li>
 *  <li>为多行批量纹理添加定义</li>
 * </ul>
 *
 * @param {PrimitiveRenderResources} renderResources 此图元的渲染资源。
 * @param {ModelComponents.Primitive} primitive 图元。
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
    return batchTexture.batchTexture ?? batchTexture.defaultTexture;
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
