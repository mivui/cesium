import DOMPurify from "dompurify";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

let nextCreditId = 0;
const creditToId = {};

/**
 * 积分包含有关如何在屏幕上显示某些内容的署名/学分的数据。
 * @param {string} html 表示 html 代码片段的字符串
 * @param {boolean} [showOnScreen=false] 如果为 true，则信用额度将显示在主信用额度容器中。 否则，它将出现在弹出窗口中。所有制作人员名单都以“内联”方式显示，如果您有图像，我们建议您正确调整其大小以匹配文本或使用 css 对其进行“垂直对齐”。
 *
 * @alias Credit
 * @constructor
 *
 * @exception {DeveloperError} html is required.
 *
 * @example
 * // Create a credit with a tooltip, image and link
 * const credit = new Cesium.Credit('<a href="https://cesium.com/" target="_blank"><img src="/images/cesium_logo.png"  style="vertical-align: -7px" title="Cesium"/></a>');
 */
function Credit(html, showOnScreen) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("html", html);
  //>>includeEnd('debug');
  let id;
  const key = html;

  if (defined(creditToId[key])) {
    id = creditToId[key];
  } else {
    id = nextCreditId++;
    creditToId[key] = id;
  }

  showOnScreen = defaultValue(showOnScreen, false);

  // Credits are immutable so generate an id to use to optimize equal()
  this._id = id;
  this._html = html;
  this._showOnScreen = showOnScreen;
  this._element = undefined;
}

Object.defineProperties(Credit.prototype, {
  /**
   * 制作人员名单内容
   * @memberof Credit.prototype
   * @type {string}
   * @readonly
   */
  html: {
    get: function () {
      return this._html;
    },
  },

  /**
   * @memberof Credit.prototype
   * @type {number}
   * @readonly
   *
   * @private
   */
  id: {
    get: function () {
      return this._id;
    },
  },

  /**
   * 积分应显示在屏幕上还是灯箱中
   * @memberof Credit.prototype
   * @type {boolean}
   */
  showOnScreen: {
    get: function () {
      return this._showOnScreen;
    },
    set: function (value) {
      this._showOnScreen = value;
    },
  },

  /**
   * 获取 credit 元素
   * @memberof Credit.prototype
   * @type {HTMLElement}
   * @readonly
   */
  element: {
    get: function () {
      if (!defined(this._element)) {
        const html = DOMPurify.sanitize(this._html);

        const div = document.createElement("div");
        div.className = "cesium-credit-wrapper";
        div._creditId = this._id;
        div.style.display = "inline";
        div.innerHTML = html;

        const links = div.querySelectorAll("a");
        for (let i = 0; i < links.length; i++) {
          links[i].setAttribute("target", "_blank");
        }

        this._element = div;
      }
      return this._element;
    },
  },
});

/**
 * 如果积分相等，则返回 true
 *
 * @param {Credit} left 第一个 credit
 * @param {Credit} right 第二个 credit
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Credit.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left._id === right._id &&
      left._showOnScreen === right._showOnScreen)
  );
};

/**
 * 如果credit相等，则返回 true
 *
 * @param {Credit} credit 要比较的credit。
 * @returns {boolean} <code>true</code>如果左和右相等，否则<code>false</code>。
 */
Credit.prototype.equals = function (credit) {
  return Credit.equals(this, credit);
};

/**
 * @private
 */
Credit.prototype.isIon = function () {
  return this.html.indexOf("ion-credit.png") !== -1;
};

/**
 * @private
 * @param attribution
 * @return {Credit}
 */
Credit.getIonCredit = function (attribution) {
  const showOnScreen =
    defined(attribution.collapsible) && !attribution.collapsible;
  const credit = new Credit(attribution.html, showOnScreen);

  return credit;
};

/**
 * 复制Credit instance.
 *
 * @param {Credit} [credit] 要复制的 Credit。
 * @returns {Credit} 一个新的 Credit 实例，该实例与提供的实例重复。（如果信用额度未定义，则返回 undefined）
 */
Credit.clone = function (credit) {
  if (defined(credit)) {
    return new Credit(credit.html, credit.showOnScreen);
  }
};
export default Credit;
