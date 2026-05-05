import DeveloperError from "../Core/DeveloperError.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式表达式。
 * <p>
 * 此接口的派生类用于评估
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles 样式语言} 中的表达式。
 * </p>
 * <p>
 * 此类型描述了一个接口，不应直接实例化。
 * </p>
 *
 * @alias StyleExpression
 * @constructor
 *
 * @see Expression
 * @see ConditionsExpression
 */
function StyleExpression() {}

/**
 * 评估表达式的结果，可选择使用提供的要素属性。如果
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles 样式语言}
 * 中表达式的结果为 <code>Boolean</code>、<code>Number</code> 或 <code>String</code> 类型，
 * 将返回对应的 JavaScript 基本类型。如果结果为 <code>RegExp</code>，将返回 JavaScript <code>RegExp</code>
 * 对象。如果结果为 <code>Cartesian2</code>、<code>Cartesian3</code> 或 <code>Cartesian4</code>，
 * 将返回 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 对象。如果 <code>result</code> 参数
 * 为 {@link Color}，则将 {@link Cartesian4} 值转换为 {@link Color} 后返回。
 *
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中变量的要素。
 * @param {object} [result] 用于存储结果的对象。
 * @returns {boolean|number|string|RegExp|Cartesian2|Cartesian3|Cartesian4|Color} 评估表达式的结果。
 */
StyleExpression.prototype.evaluate = function (feature, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 评估颜色表达式的结果，可选择使用提供的要素属性。
 * <p>
 * 这等同于 {@link StyleExpression#evaluate}，但始终返回 {@link Color} 对象。
 * </p>
 *
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中变量的要素。
 * @param {Color} [result] 用于存储结果的对象。
 * @returns {Color} 修改后的结果参数，或如果未提供则返回新的 Color 实例。
 */
StyleExpression.prototype.evaluateColor = function (feature, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * Gets the shader function for this expression.
 * Returns undefined if the shader function can't be generated from this expression.
 *
 * @param {string} functionSignature Signature of the generated function.
 * @param {object} variableSubstitutionMap Maps variable names to shader variable names.
 * @param {object} shaderState Stores information about the generated shader function, including whether it is translucent.
 * @param {string} returnType The return type of the generated function.
 *
 * @returns {string} The shader function.
 *
 * @private
 */
StyleExpression.prototype.getShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
  returnType,
) {
  DeveloperError.throwInstantiationError();
};

/**
 * Gets the variables used by the expression.
 *
 * @returns {string[]} The variables used by the expression.
 *
 * @private
 */
StyleExpression.prototype.getVariables = function () {
  DeveloperError.throwInstantiationError();
};

export default StyleExpression;
