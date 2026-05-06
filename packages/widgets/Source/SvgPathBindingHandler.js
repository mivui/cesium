const svgNS = "http://www.w3.org/2000/svg";
const svgClassName = "cesium-svgPath-svg";

/**
 * 创建用于单个 SVG 路径 DOM 元素的 Knockout 绑定处理器。
 * 此绑定处理器将注册为 cesiumSvgPath。
 *
 * <p>
 * 此绑定的参数是一个具有以下属性的对象：
 * </p>
 *
 * <ul>
 * <li>path: SVG 路径字符串。</li>
 * <li>width: 未应用变换时 SVG 路径的宽度。</li>
 * <li>height: 未应用变换时 SVG 路径的高度。</li>
 * <li>css: 可选。包含要应用于 SVG 的额外 CSS 类的字符串。始终会应用 'cesium-svgPath-svg'。</li>
 * </ul>
 *
 * @namespace SvgPathBindingHandler
 *
 * @example
 * // 在 div 内创建 SVG
 * <div data-bind="cesiumSvgPath: { path: 'M 100 100 L 300 100 L 200 300 z', width: 28, height: 28 }"></div>
 *
 * // 参数可以来自视图模型的 observable
 * <div data-bind="cesiumSvgPath: { path: currentPath, width: currentWidth, height: currentHeight }"></div>
 *
 * // 或整个对象可以来自视图模型的 observable
 * <div data-bind="cesiumSvgPath: svgPathOptions"></div>
 */
const SvgPathBindingHandler = {
  /**
   * @function
   */
  register: function (knockout) {
    knockout.bindingHandlers.cesiumSvgPath = {
      init: function (element, valueAccessor) {
        const svg = document.createElementNS(svgNS, "svg:svg");
        svg.setAttribute("class", svgClassName);

        const pathElement = document.createElementNS(svgNS, "path");
        svg.appendChild(pathElement);

        knockout.virtualElements.setDomNodeChildren(element, [svg]);

        knockout.computed({
          read: function () {
            const value = knockout.unwrap(valueAccessor());

            pathElement.setAttribute("d", knockout.unwrap(value.path));

            const pathWidth = knockout.unwrap(value.width);
            const pathHeight = knockout.unwrap(value.height);

            svg.setAttribute("width", pathWidth);
            svg.setAttribute("height", pathHeight);
            svg.setAttribute("viewBox", `0 0 ${pathWidth} ${pathHeight}`);

            if (value.css) {
              svg.setAttribute(
                "class",
                `${svgClassName} ${knockout.unwrap(value.css)}`,
              );
            }
          },
          disposeWhenNodeIsRemoved: element,
        });

        return {
          controlsDescendantBindings: true,
        };
      },
    };

    knockout.virtualElements.allowedBindings.cesiumSvgPath = true;
  },
};
export default SvgPathBindingHandler;
