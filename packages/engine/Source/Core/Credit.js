// @ts-check

import DOMPurify from "dompurify";
import Check from "./Check.js";
import defined from "./defined.js";

let nextCreditId = 0;
/**
 * @private
 * @type {Record<string, number>}
 */
const creditToId = {};

/**
 * 包含有关如何在屏幕上显示特定内容的归属/署名的数据。
 *
 * @example
 * // 创建带有工具提示、图像和链接的署名
 * const credit = new Cesium.Credit('<a href="https://cesium.com/" target="_blank"><img src="/images/cesium_logo.png"  style="vertical-align: -7px" title="Cesium"/></a>');
 */
class Credit {
  /**
   * @param {string} html 表示HTML代码片段的字符串
   * @param {boolean} [showOnScreen=false] 如果为true，署名将在主署名容器中可见。否则，它将出现在弹出框中。所有署名都以内联方式显示，如果有图像，建议正确调整其大小以匹配文本或使用css进行`vertical-align`。
   *
   * @exception {DeveloperError} html是必需的。
   */
  constructor(html, showOnScreen) {
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

    showOnScreen = showOnScreen ?? false;

    // Credits are immutable so generate an id to use to optimize equal()
    this._id = id;
    this._html = html;
    this._showOnScreen = showOnScreen;
    this._element = undefined;
  }

  /**
   * 署名内容
   * @type {string}
   * @readonly
   */
  get html() {
    return this._html;
  }

  /**
   * @type {number}
   * @readonly
   *
   * @private
   */
  get id() {
    return this._id;
  }

  /**
   * 署名应该显示在屏幕上还是灯箱中
   * @type {boolean}
   */
  get showOnScreen() {
    return this._showOnScreen;
  }

  set showOnScreen(value) {
    this._showOnScreen = value;
  }

  /**
   * 获取署名元素
   * @type {HTMLElement}
   * @readonly
   */
  get element() {
    if (!defined(this._element)) {
      const html = DOMPurify.sanitize(this._html);

      const div = document.createElement("div");
      div.className = "cesium-credit-wrapper";
      // @ts-expect-error Consider using a data-id attribute, instead.
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
  }

  /**
   * 如果署名相等则返回true
   *
   * @param {Credit} [left] 第一个署名
   * @param {Credit} [right] 第二个署名
   * @returns {boolean} 如果left和right相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  static equals(left, right) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left._id === right._id &&
        left._showOnScreen === right._showOnScreen)
    );
  }

  /**
   * 如果署名相等则返回true
   *
   * @param {Credit} [credit] 要比较的署名。
   * @returns {boolean} 如果相等则返回<code>true</code>，否则返回<code>false</code>。
   */
  equals(credit) {
    return Credit.equals(this, credit);
  }

  /**
   * @private
   */
  isIon() {
    return this.html.indexOf("ion-credit.png") !== -1;
  }

  /**
   * @private
   * @param attribution
   * @return {Credit}
   */
  // @ts-expect-error Define type for GeocoderService.attributions
  static getIonCredit(attribution) {
    const showOnScreen =
      defined(attribution.collapsible) && !attribution.collapsible;
    const credit = new Credit(attribution.html, showOnScreen);

    return credit;
  }

  /**
   * 复制Credit实例。
   *
   * @param {Credit} [credit] 要复制的Credit。
   * @returns {Credit} 与提供实例相同的新Credit实例。（如果credit未定义则返回undefined）
   */
  static clone(credit) {
    if (defined(credit)) {
      return new Credit(credit.html, credit.showOnScreen);
    }
  }
}

export default Credit;
