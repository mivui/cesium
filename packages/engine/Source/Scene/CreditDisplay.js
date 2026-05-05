import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";

/**
 * 显示 credits 信息并处理 {@link CreditDisplay#addCredit} 和 {@link CreditDisplay#addDefaultCredit} 添加的 credits。
 *
 * @alias CreditDisplay
 * @constructor
 *
 * @param {Element|Document} [container] 包含 credits 元素的 DOM 元素。如果未指定，则创建一个新的元素。
 * @param {string} [delimeter] credits 之间的分隔符。默认为 '<br/>'。
 *
 * @example
 * // 创建一个独立的 credits display
 * const creditDisplay = new Cesium.CreditDisplay();
 *
 * @example
 * // 将 credits 添加到特定元素
 * const creditDisplay = new Cesium.CreditDisplay(document.getElementById('creditContainer'));
 */
function CreditDisplay(container, delimeter) {
  this._container = container ?? document.createElement("div");
  this._delimeter = delimeter ?? "<br/>";
  this._credits = [];
  this._defaultCredits = [];
  this._showCreditsOnScreen = true;
}

/**
 * 将 credit 添加到 credit display 的末尾。
 *
 * @param {Credit} credit 要添加的 credit。
 */
CreditDisplay.prototype.addCredit = function (credit) {
  this._credits.push(credit);
};

/**
 * 添加一个 default credit，它将在每次更新时都显示。
 *
 * @param {Credit} credit 要添加的 credit。
 */
CreditDisplay.prototype.addDefaultCredit = function (credit) {
  this._defaultCredits.push(credit);
};

/**
 * 更新 credit display。
 *
 * @private
 */
CreditDisplay.prototype.update = function () {};

CreditDisplay.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象。
 */
CreditDisplay.prototype.destroy = function () {
  return undefined;
};

export default CreditDisplay;
