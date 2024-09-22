import DeveloperError from "../Core/DeveloperError.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式的表达式。
 * <p>
 * 此接口的派生类评估
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D 瓦片样式语言}。
 * </p>
 * <p>
 * 此类型描述接口，不打算直接实例化。
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
 * 计算表达式的结果，可选择使用提供的特性的属性。如果
 * 中的
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D 瓦片样式语言}
 * 的类型为 <code>Boolean</code>、<code>Number</code> 或 <code>String</code>，对应的 JavaScript
 * 原始类型。如果结果是 <code>RegExp</code>，则为 Javascript <code>RegExp</code>
 * 对象。如果结果是 <code>Cartesian2</code>、<code>Cartesian3</code> 或 <code>Cartesian4</code>，
 * 将返回 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 对象。如果 <code>result</code> 参数为
 * {@link Color}，则 {@link Cartesian4} 值将转换为 {@link Color}，然后返回。
 *
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中的变量的特征。
 * @param {object} [result] 要在其上存储结果的对象。
 * @returns {boolean|number|string|RegExp|Cartesian2|Cartesian3|Cartesian4|Color} 计算表达式的结果。
 */
StyleExpression.prototype.evaluate = function (feature, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 计算 Color 表达式的结果，可选择使用提供的特性的属性。
 * <p>
 * 这等效于 {@link StyleExpression#evaluate}，但始终返回 {@link Color} 对象。
 * </p>
 *
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中的变量的特征。
 * @param {Color} [result] 要在其中存储结果的对象。
 * @returns {Color} 修改后的结果参数或者新的 Color 实例（如果未提供）。
 */
StyleExpression.prototype.evaluateColor = function (feature, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 获取此表达式的 shader 函数。
 * 如果无法从此表达式生成着色器函数，则返回 undefined。
 *
 * @param {string} functionSignature 生成的函数的签名。
 * @param {object} variableSubstitutionMap 将变量名称映射到着色器变量名称。
 * @param {object} shaderState 存储有关生成的着色器函数的信息，包括它是否为半透明函数。
 * @param {string} returnType 生成的函数的返回类型。
 *
 * @returns {string} 着色器函数。
 *
 * @private
 */
StyleExpression.prototype.getShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
  returnType
) {
  DeveloperError.throwInstantiationError();
};

/**
 * 获取表达式使用的变量。
 *
 * @returns {string[]} 表达式使用的变量。
 *
 * @private
 */
StyleExpression.prototype.getVariables = function () {
  DeveloperError.throwInstantiationError();
};

export default StyleExpression;
