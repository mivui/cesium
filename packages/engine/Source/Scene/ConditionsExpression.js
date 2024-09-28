import clone from "../Core/clone.js";
import defined from "../Core/defined.js";
import Expression from "./Expression.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式的表达式。
 * <p>
 * 计算使用
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D 瓦片样式语言}。
 * </p>
 * <p>
 * 实现 {@link StyleExpression} 接口。
 * </p>
 *
 * @alias ConditionsExpression
 * @constructor
 *
 * @param {object} [conditionsExpression] 使用 3D 图块样式语言定义的条件表达式。
 * @param {object} [defines] 在样式中定义。
 *
 * @example
 * const expression = new Cesium.ConditionsExpression({
 *     conditions : [
 *         ['${Area} > 10, 'color("#FF0000")'],
 *         ['${id} !== "1"', 'color("#00FF00")'],
 *         ['true', 'color("#FFFFFF")']
 *     ]
 * });
 * expression.evaluateColor(feature, result); // returns a Cesium.Color object
 */
function ConditionsExpression(conditionsExpression, defines) {
  this._conditionsExpression = clone(conditionsExpression, true);
  this._conditions = conditionsExpression.conditions;
  this._runtimeConditions = undefined;

  setRuntime(this, defines);
}

Object.defineProperties(ConditionsExpression.prototype, {
  /**
   * 获取在 3D Tiles Styling 语言中定义的条件表达式。
   *
   * @memberof ConditionsExpression.prototype
   *
   * @type {object}
   * @readonly
   *
   * @default undefined
   */
  conditionsExpression: {
    get: function () {
      return this._conditionsExpression;
    },
  },
});

function Statement(condition, expression) {
  this.condition = condition;
  this.expression = expression;
}

function setRuntime(expression, defines) {
  const runtimeConditions = [];
  const conditions = expression._conditions;
  if (!defined(conditions)) {
    return;
  }
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    const cond = String(statement[0]);
    const condExpression = String(statement[1]);
    runtimeConditions.push(
      new Statement(
        new Expression(cond, defines),
        new Expression(condExpression, defines),
      ),
    );
  }
  expression._runtimeConditions = runtimeConditions;
}

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
ConditionsExpression.prototype.evaluate = function (feature, result) {
  const conditions = this._runtimeConditions;
  if (!defined(conditions)) {
    return undefined;
  }
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    if (statement.condition.evaluate(feature)) {
      return statement.expression.evaluate(feature, result);
    }
  }
};

/**
 * 使用特征定义的值计算 Color 表达式的结果。
 * <p>
 * 这等效于 {@link ConditionsExpression#evaluate}，但始终返回 {@link Color} 对象。
 * </p>
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中的变量的特征。
 * @param {Color} [result] 存储结果的对象
 * @returns {Color} 修改后的结果参数或新的 Color 实例（如果未提供）。
 */
ConditionsExpression.prototype.evaluateColor = function (feature, result) {
  const conditions = this._runtimeConditions;
  if (!defined(conditions)) {
    return undefined;
  }
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    if (statement.condition.evaluate(feature)) {
      return statement.expression.evaluateColor(feature, result);
    }
  }
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
ConditionsExpression.prototype.getShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
  returnType,
) {
  const conditions = this._runtimeConditions;
  if (!defined(conditions) || conditions.length === 0) {
    return undefined;
  }

  let shaderFunction = "";
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];

    const condition = statement.condition.getShaderExpression(
      variableSubstitutionMap,
      shaderState,
    );
    const expression = statement.expression.getShaderExpression(
      variableSubstitutionMap,
      shaderState,
    );

    // Build the if/else chain from the list of conditions
    shaderFunction +=
      `    ${i === 0 ? "if" : "else if"} (${condition})\n` +
      `    {\n` +
      `        return ${expression};\n` +
      `    }\n`;
  }

  shaderFunction =
    `${returnType} ${functionSignature}\n` +
    `{\n${shaderFunction}    return ${returnType}(1.0);\n` + // Return a default value if no conditions are met
    `}\n`;

  return shaderFunction;
};

/**
 * 获取表达式使用的变量。
 *
 * @returns {string[]} 表达式使用的变量。
 *
 * @private
 */
ConditionsExpression.prototype.getVariables = function () {
  let variables = [];

  const conditions = this._runtimeConditions;
  if (!defined(conditions) || conditions.length === 0) {
    return variables;
  }

  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    variables.push.apply(variables, statement.condition.getVariables());
    variables.push.apply(variables, statement.expression.getVariables());
  }

  // Remove duplicates
  variables = variables.filter(function (variable, index, variables) {
    return variables.indexOf(variable) === index;
  });

  return variables;
};

export default ConditionsExpression;
