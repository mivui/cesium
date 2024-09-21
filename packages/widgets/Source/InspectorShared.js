import { Check, defaultValue, defined } from "@cesium/engine";

/**
 * CesiumInspector, Cesium3DTilesInspector和VoxelInspector使用的一个静态类的辅助函数
 * @private
 */
const InspectorShared = {};

/**
 * 创建一个复选框组件
 * @param {string} labelText 要在复选框标签中显示的文本
 * @param {string} checkedBinding 用于已检查绑定的变量的名称
 * @param {string} [enableBinding] 用于启用绑定的变量的名称
 * @return {Element}
 */
InspectorShared.createCheckbox = function (
  labelText,
  checkedBinding,
  enableBinding
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("labelText", labelText);
  Check.typeOf.string("checkedBinding", checkedBinding);
  //>>includeEnd('debug');
  const checkboxContainer = document.createElement("div");
  const checkboxLabel = document.createElement("label");
  const checkboxInput = document.createElement("input");
  checkboxInput.type = "checkbox";

  let binding = `checked: ${checkedBinding}`;
  if (defined(enableBinding)) {
    binding += `, enable: ${enableBinding}`;
  }
  checkboxInput.setAttribute("data-bind", binding);
  checkboxLabel.appendChild(checkboxInput);
  checkboxLabel.appendChild(document.createTextNode(labelText));
  checkboxContainer.appendChild(checkboxLabel);
  return checkboxContainer;
};

/**
 * 创建section元素
 * @param {Element} panel 父元素
 * @param {string} headerText 要显示在部分顶部的文本
 * @param {string} sectionVisibleBinding 用于可见绑定的变量名
 * @param {string} toggleSectionVisibilityBinding 用于切换可见性的函数的名称
 * @return {Element}
 */
InspectorShared.createSection = function (
  panel,
  headerText,
  sectionVisibleBinding,
  toggleSectionVisibilityBinding
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("panel", panel);
  Check.typeOf.string("headerText", headerText);
  Check.typeOf.string("sectionVisibleBinding", sectionVisibleBinding);
  Check.typeOf.string(
    "toggleSectionVisibilityBinding",
    toggleSectionVisibilityBinding
  );
  //>>includeEnd('debug');
  const section = document.createElement("div");
  section.className = "cesium-cesiumInspector-section";
  section.setAttribute(
    "data-bind",
    `css: { "cesium-cesiumInspector-section-collapsed": !${sectionVisibleBinding} }`
  );
  panel.appendChild(section);

  const sectionHeader = document.createElement("h3");
  sectionHeader.className = "cesium-cesiumInspector-sectionHeader";
  sectionHeader.appendChild(document.createTextNode(headerText));
  sectionHeader.setAttribute(
    "data-bind",
    `click: ${toggleSectionVisibilityBinding}`
  );
  section.appendChild(sectionHeader);

  const sectionContent = document.createElement("div");
  sectionContent.className = "cesium-cesiumInspector-sectionContent";
  section.appendChild(sectionContent);
  return sectionContent;
};

/**
 * 创建范围输入
 * @param {string} rangeText 要显示的文本
 * @param {string} sliderValueBinding 用于滑块值绑定的变量名
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @param {number} [step] 步长。默认为“any”。
 * @param {string} [inputValueBinding] 用于输入值绑定的变量名
 * @return {Element}
 */
InspectorShared.createRangeInput = function (
  rangeText,
  sliderValueBinding,
  min,
  max,
  step,
  inputValueBinding
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("rangeText", rangeText);
  Check.typeOf.string("sliderValueBinding", sliderValueBinding);
  Check.typeOf.number("min", min);
  Check.typeOf.number("max", max);
  //>>includeEnd('debug');

  inputValueBinding = defaultValue(inputValueBinding, sliderValueBinding);
  const input = document.createElement("input");
  input.setAttribute("data-bind", `value: ${inputValueBinding}`);
  input.type = "number";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = min;
  slider.max = max;
  slider.step = defaultValue(step, "any");
  slider.setAttribute(
    "data-bind",
    `valueUpdate: "input", value: ${sliderValueBinding}`
  );

  const wrapper = document.createElement("div");
  wrapper.appendChild(slider);

  const container = document.createElement("div");
  container.className = "cesium-cesiumInspector-slider";
  container.appendChild(document.createTextNode(rangeText));
  container.appendChild(input);
  container.appendChild(wrapper);

  return container;
};

/**
 * 创建按钮组件
 * @param {string} buttonText 按钮文本
 * @param {string} clickedBinding 用于单击绑定的变量的名称
 * @param {string} [activeBinding] 用于活动绑定的变量的名称
 * @return {Element}
 */
InspectorShared.createButton = function (
  buttonText,
  clickedBinding,
  activeBinding
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("buttonText", buttonText);
  Check.typeOf.string("clickedBinding", clickedBinding);
  //>>includeEnd('debug');

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = buttonText;
  button.className = "cesium-cesiumInspector-pickButton";
  let binding = `click: ${clickedBinding}`;
  if (defined(activeBinding)) {
    binding += `, css: {"cesium-cesiumInspector-pickButtonHighlight" : ${activeBinding}}`;
  }
  button.setAttribute("data-bind", binding);

  return button;
};

export default InspectorShared;
