import addAllToArray from "../Core/addAllToArray.js";
import clone from "../Core/clone.js";
import defined from "../Core/defined.js";
import Expression from "./Expression.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式表达式。
 * <p>
 * 使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles 样式语言} 定义的条件表达式进行求值。
 * </p>
 * <p>
 * 实现 {@link StyleExpression} 接口。
 * </p>
 *
 * @alias ConditionsExpression
 * @constructor
 *
 * @param {object} [conditionsExpression] 使用 3D Tiles 样式语言定义的条件表达式。
 * @param {object} [defines] 样式中的 define。
 *
 * @example
 * const expression = new Cesium.ConditionsExpression({
 *     conditions : [
 *         ['${Area} > 10, 'color("#FF0000")'],
 *         ['${id} !== "1"', 'color("#00FF00")'],
 *         ['true', 'color("#FFFFFF")']
 *     ]
 * });
 * expression.evaluateColor(feature, result); // 返回 Cesium.Color 对象
 */
function ConditionsExpression(conditionsExpression, defines) {
  this._conditionsExpression = clone(conditionsExpression, true);
  this._conditions = conditionsExpression.conditions;
  this._runtimeConditions = undefined;

  setRuntime(this, defines);
}

Object.defineProperties(ConditionsExpression.prototype, {
  /**
   * 获取 3D Tiles 样式语言中定义的条件表达式。
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
 * 对表达式的结果进行求值，可选地使用提供的 feature 的属性。如果
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles 样式语言} 中
 * 表达式的结果为 <code>Boolean</code>、<code>Number</code> 或 <code>String</code> 类型，
 * 将返回相应的 JavaScript 原始类型。如果结果为 <code>RegExp</code>，将返回 Javascript <code>RegExp</code>
 * 对象。如果结果为 <code>Cartesian2</code>、<code>Cartesian3</code> 或 <code>Cartesian4</code>，
 * 将返回 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 对象。如果 <code>result</code> 参数是
 * {@link Color}，则 {@link Cartesian4} 值将转换为 {@link Color} 后返回。
 *
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中的变量的 feature。
 * @param {object} [result] 用于存储结果的对象。
 * @returns {boolean|number|string|RegExp|Cartesian2|Cartesian3|Cartesian4|Color} 表达式求值的结果。
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
 * 对 Color 表达式的结果进行求值，使用 feature 定义的值。
 * <p>
 * 这等效于 {@link ConditionsExpression#evaluate}，但始终返回 {@link Color} 对象。
 * </p>
 * @param {Cesium3DTileFeature} feature 其属性可用作表达式中的变量的 feature。
 * @param {Color} [result] 用于存储结果的对象
 * @returns {Color} 修改后的 result 参数，或新的 Color 实例（如果未提供）。
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
 * Gets the variables used by the expression.
 *
 * @returns {string[]} The variables used by the expression.
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
    addAllToArray(variables, statement.condition.getVariables());
    addAllToArray(variables, statement.expression.getVariables());
  }

  // Remove duplicates
  variables = variables.filter(function (variable, index, variables) {
    return variables.indexOf(variable) === index;
  });

  return variables;
};

export default ConditionsExpression;
