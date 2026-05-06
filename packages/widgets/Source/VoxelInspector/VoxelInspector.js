import {
  Math as CesiumMath,
  Check,
  destroyObject,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import InspectorShared from "../InspectorShared.js";
import VoxelInspectorViewModel from "./VoxelInspectorViewModel.js";

/**
 * 用于辅助调试体素的 Inspector 控件。
 *
 * @alias VoxelInspector
 * @constructor
 *
 * @param {Element|string} container 包含此控件的 DOM 元素或 id。
 * @param {Scene} scene 要使用的 Scene 实例。
 */
function VoxelInspector(container, scene) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("container", container);
  Check.typeOf.object("scene", scene);
  //>>includeEnd('debug');

  container = getElement(container);
  const element = document.createElement("div");
  const viewModel = new VoxelInspectorViewModel(scene);

  this._viewModel = viewModel;
  this._container = container;
  this._element = element;

  const text = document.createElement("div");
  text.textContent = "Voxel Inspector";
  text.className = "cesium-cesiumInspector-button";
  text.setAttribute("data-bind", "click: toggleInspector");
  element.appendChild(text);
  element.className = "cesium-cesiumInspector cesium-VoxelInspector";
  element.setAttribute(
    "data-bind",
    'css: { "cesium-cesiumInspector-visible" : inspectorVisible, "cesium-cesiumInspector-hidden" : !inspectorVisible}',
  );
  container.appendChild(element);

  const panel = document.createElement("div");
  panel.className = "cesium-cesiumInspector-dropDown";
  element.appendChild(panel);

  const { createSection, createCheckbox, createRangeInput, createButton } =
    InspectorShared;

  const displayPanelContents = createSection(
    panel,
    "Display",
    "displayVisible",
    "toggleDisplay",
  );

  const transformPanelContents = createSection(
    panel,
    "Transform",
    "transformVisible",
    "toggleTransform",
  );

  const clippingPanelContents = createSection(
    panel,
    "Clipping",
    "clippingVisible",
    "toggleClipping",
  );

  const shaderPanelContents = createSection(
    panel,
    "Shader",
    "shaderVisible",
    "toggleShader",
  );

  // Display
  displayPanelContents.appendChild(createCheckbox("Depth Test", "depthTest"));
  displayPanelContents.appendChild(createCheckbox("Show", "show"));
  displayPanelContents.appendChild(
    createCheckbox("Disable Update", "disableUpdate"),
  );
  displayPanelContents.appendChild(createCheckbox("Debug Draw", "debugDraw"));
  displayPanelContents.appendChild(createCheckbox("Jitter", "jitter"));
  displayPanelContents.appendChild(
    createCheckbox("Nearest Sampling", "nearestSampling"),
  );

  displayPanelContents.appendChild(
    createRangeInput("Screen Space Error", "screenSpaceError", 0, 128),
  );

  displayPanelContents.appendChild(
    createRangeInput("Step Size", "stepSize", 0.0, 2.0),
  );

  // Transform
  const maxTrans = 10.0;
  const maxScale = 10.0;
  const maxAngle = CesiumMath.PI;

  transformPanelContents.appendChild(
    createRangeInput("Translation X", "translationX", -maxTrans, +maxTrans),
  );
  transformPanelContents.appendChild(
    createRangeInput("Translation Y", "translationY", -maxTrans, +maxTrans),
  );
  transformPanelContents.appendChild(
    createRangeInput("Translation Z", "translationZ", -maxTrans, +maxTrans),
  );
  transformPanelContents.appendChild(
    createRangeInput("Scale X", "scaleX", 0, +maxScale),
  );
  transformPanelContents.appendChild(
    createRangeInput("Scale Y", "scaleY", 0, +maxScale),
  );
  transformPanelContents.appendChild(
    createRangeInput("Scale Z", "scaleZ", 0, +maxScale),
  );
  transformPanelContents.appendChild(
    createRangeInput("Heading", "angleX", -maxAngle, +maxAngle),
  );
  transformPanelContents.appendChild(
    createRangeInput("Pitch", "angleY", -maxAngle, +maxAngle),
  );
  transformPanelContents.appendChild(
    createRangeInput("Roll", "angleZ", -maxAngle, +maxAngle),
  );

  // Clipping
  makeCoordinateRangeWithDynamicMinMax(
    "Max X",
    "Min X",
    "Max Y",
    "Min Y",
    "Max Z",
    "Min Z",
    "clippingBoxMaxX",
    "clippingBoxMinX",
    "clippingBoxMaxY",
    "clippingBoxMinY",
    "clippingBoxMaxZ",
    "clippingBoxMinZ",
    "shapeIsBox",
    clippingPanelContents,
  );

  makeCoordinateRangeWithDynamicMinMax(
    "Max Longitude",
    "Min Longitude",
    "Max Latitude",
    "Min Latitude",
    "Max Height",
    "Min Height",
    "clippingEllipsoidMaxLongitude",
    "clippingEllipsoidMinLongitude",
    "clippingEllipsoidMaxLatitude",
    "clippingEllipsoidMinLatitude",
    "clippingEllipsoidMaxHeight",
    "clippingEllipsoidMinHeight",
    "shapeIsEllipsoid",
    clippingPanelContents,
  );

  makeCoordinateRangeWithDynamicMinMax(
    "Max Radius",
    "Min Radius",
    "Max Angle",
    "Min Angle",
    "Max Height",
    "Min Height",
    "clippingCylinderMaxRadius",
    "clippingCylinderMinRadius",
    "clippingCylinderMaxAngle",
    "clippingCylinderMinAngle",
    "clippingCylinderMaxHeight",
    "clippingCylinderMinHeight",
    "shapeIsCylinder",
    clippingPanelContents,
  );

  // Shader
  const shaderPanelEditor = document.createElement("div");
  shaderPanelContents.appendChild(shaderPanelEditor);

  const shaderEditor = document.createElement("textarea");
  shaderEditor.setAttribute(
    "data-bind",
    "textInput: shaderString, event: { keydown: shaderEditorKeyPress }",
  );
  shaderPanelEditor.className = "cesium-cesiumInspector-styleEditor";
  shaderPanelEditor.appendChild(shaderEditor);
  const compileShaderButton = createButton(
    "Compile (Ctrl+Enter)",
    "compileShader",
  );
  shaderPanelEditor.appendChild(compileShaderButton);

  const compilationText = document.createElement("label");
  compilationText.style.display = "block";
  compilationText.setAttribute(
    "data-bind",
    "text: shaderCompilationMessage, style: {color: shaderCompilationSuccess ? 'green' : 'red'}",
  );
  shaderPanelEditor.appendChild(compilationText);

  knockout.applyBindings(viewModel, element);
}

Object.defineProperties(VoxelInspector.prototype, {
  /**
   * 获取父容器。
   * @memberof VoxelInspector.prototype
   *
   * @type {Element}
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 获取视图模型。
   * @memberof VoxelInspector.prototype
   *
   * @type {VoxelInspectorViewModel}
   */
  viewModel: {
    get: function () {
      return this._viewModel;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false。
 */
VoxelInspector.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁控件。如果从布局中永久移除控件，应调用此方法。
 */
VoxelInspector.prototype.destroy = function () {
  knockout.cleanNode(this._element);
  this._container.removeChild(this._element);
  this.viewModel.destroy();

  return destroyObject(this);
};

function makeCoordinateRangeWithDynamicMinMax(
  maxXTitle,
  minXTitle,
  maxYTitle,
  minYTitle,
  maxZTitle,
  minZTitle,
  maxXVar,
  minXVar,
  maxYVar,
  minYVar,
  maxZVar,
  minZVar,
  allowedShape,
  parentContainer,
) {
  const createRangeInput = InspectorShared.createRangeInputWithDynamicMinMax;

  const boundsElement = parentContainer.appendChild(
    document.createElement("div"),
  );
  boundsElement.setAttribute("data-bind", `if: ${allowedShape}`);
  boundsElement.appendChild(createRangeInput(maxXTitle, maxXVar));
  boundsElement.appendChild(createRangeInput(minXTitle, minXVar));
  boundsElement.appendChild(createRangeInput(maxYTitle, maxYVar));
  boundsElement.appendChild(createRangeInput(minYTitle, minYVar));
  boundsElement.appendChild(createRangeInput(maxZTitle, maxZVar));
  boundsElement.appendChild(createRangeInput(minZTitle, minZVar));
}

export default VoxelInspector;
