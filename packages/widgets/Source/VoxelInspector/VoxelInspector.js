import {
  Cartesian3,
  Math as CesiumMath,
  Check,
  destroyObject,
  Ellipsoid,
  getElement,
  VoxelShapeType,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import InspectorShared from "../InspectorShared.js";
import VoxelInspectorViewModel from "./VoxelInspectorViewModel.js";

/**
 * 检查器小部件，以帮助调试 voxels
 *
 * @alias VoxelInspector
 * @constructor
 *
 * @param {Element|string} container 将包含小部件的DOM元素或ID。
 * @param {Scene} scene 要使用的场景实例。
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
    'css: { "cesium-cesiumInspector-visible" : inspectorVisible, "cesium-cesiumInspector-hidden" : !inspectorVisible}'
  );
  container.appendChild(element);

  const panel = document.createElement("div");
  panel.className = "cesium-cesiumInspector-dropDown";
  element.appendChild(panel);

  const createSection = InspectorShared.createSection;
  const createCheckbox = InspectorShared.createCheckbox;
  const createRangeInput = InspectorShared.createRangeInput;
  const createButton = InspectorShared.createButton;

  const displayPanelContents = createSection(
    panel,
    "Display",
    "displayVisible",
    "toggleDisplay"
  );

  const transformPanelContents = createSection(
    panel,
    "Transform",
    "transformVisible",
    "toggleTransform"
  );

  const boundsPanelContents = createSection(
    panel,
    "Bounds",
    "boundsVisible",
    "toggleBounds"
  );

  const clippingPanelContents = createSection(
    panel,
    "Clipping",
    "clippingVisible",
    "toggleClipping"
  );

  const shaderPanelContents = createSection(
    panel,
    "Shader",
    "shaderVisible",
    "toggleShader"
  );

  // Display
  displayPanelContents.appendChild(createCheckbox("Depth Test", "depthTest"));
  displayPanelContents.appendChild(createCheckbox("Show", "show"));
  displayPanelContents.appendChild(
    createCheckbox("Disable Update", "disableUpdate")
  );
  displayPanelContents.appendChild(createCheckbox("Debug Draw", "debugDraw"));
  displayPanelContents.appendChild(createCheckbox("Jitter", "jitter"));
  displayPanelContents.appendChild(
    createCheckbox("Nearest Sampling", "nearestSampling")
  );

  displayPanelContents.appendChild(
    createRangeInput("Screen Space Error", "screenSpaceError", 0, 128)
  );

  displayPanelContents.appendChild(
    createRangeInput("Step Size", "stepSize", 0.0, 2.0)
  );

  // Transform
  const maxTrans = 10.0;
  const maxScale = 10.0;
  const maxAngle = CesiumMath.PI;

  transformPanelContents.appendChild(
    createRangeInput("Translation X", "translationX", -maxTrans, +maxTrans)
  );
  transformPanelContents.appendChild(
    createRangeInput("Translation Y", "translationY", -maxTrans, +maxTrans)
  );
  transformPanelContents.appendChild(
    createRangeInput("Translation Z", "translationZ", -maxTrans, +maxTrans)
  );
  transformPanelContents.appendChild(
    createRangeInput("Scale X", "scaleX", 0, +maxScale)
  );
  transformPanelContents.appendChild(
    createRangeInput("Scale Y", "scaleY", 0, +maxScale)
  );
  transformPanelContents.appendChild(
    createRangeInput("Scale Z", "scaleZ", 0, +maxScale)
  );
  transformPanelContents.appendChild(
    createRangeInput("Heading", "angleX", -maxAngle, +maxAngle)
  );
  transformPanelContents.appendChild(
    createRangeInput("Pitch", "angleY", -maxAngle, +maxAngle)
  );
  transformPanelContents.appendChild(
    createRangeInput("Roll", "angleZ", -maxAngle, +maxAngle)
  );

  // Bounds
  const boxMinBounds = VoxelShapeType.getMinBounds(VoxelShapeType.BOX);
  const boxMaxBounds = VoxelShapeType.getMaxBounds(VoxelShapeType.BOX);

  const ellipsoidMinBounds = Cartesian3.fromElements(
    VoxelShapeType.getMinBounds(VoxelShapeType.ELLIPSOID).x,
    VoxelShapeType.getMinBounds(VoxelShapeType.ELLIPSOID).y,
    -Ellipsoid.WGS84.maximumRadius,
    new Cartesian3()
  );
  const ellipsoidMaxBounds = Cartesian3.fromElements(
    VoxelShapeType.getMaxBounds(VoxelShapeType.ELLIPSOID).x,
    VoxelShapeType.getMaxBounds(VoxelShapeType.ELLIPSOID).y,
    +10000000.0,
    new Cartesian3()
  );

  const cylinderMinBounds = VoxelShapeType.getMinBounds(
    VoxelShapeType.CYLINDER
  );
  const cylinderMaxBounds = VoxelShapeType.getMaxBounds(
    VoxelShapeType.CYLINDER
  );

  makeCoordinateRange(
    "Max X",
    "Min X",
    "Max Y",
    "Min Y",
    "Max Z",
    "Min Z",
    "boundsBoxMaxX",
    "boundsBoxMinX",
    "boundsBoxMaxY",
    "boundsBoxMinY",
    "boundsBoxMaxZ",
    "boundsBoxMinZ",
    boxMinBounds,
    boxMaxBounds,
    "shapeIsBox",
    boundsPanelContents
  );

  makeCoordinateRange(
    "Max Longitude",
    "Min Longitude",
    "Max Latitude",
    "Min Latitude",
    "Max Height",
    "Min Height",
    "boundsEllipsoidMaxLongitude",
    "boundsEllipsoidMinLongitude",
    "boundsEllipsoidMaxLatitude",
    "boundsEllipsoidMinLatitude",
    "boundsEllipsoidMaxHeight",
    "boundsEllipsoidMinHeight",
    ellipsoidMinBounds,
    ellipsoidMaxBounds,
    "shapeIsEllipsoid",
    boundsPanelContents
  );

  makeCoordinateRange(
    "Max Radius",
    "Min Radius",
    "Max Height",
    "Min Height",
    "Max Angle",
    "Min Angle",
    "boundsCylinderMaxRadius",
    "boundsCylinderMinRadius",
    "boundsCylinderMaxHeight",
    "boundsCylinderMinHeight",
    "boundsCylinderMaxAngle",
    "boundsCylinderMinAngle",
    cylinderMinBounds,
    cylinderMaxBounds,
    "shapeIsCylinder",
    boundsPanelContents
  );

  // Clipping
  makeCoordinateRange(
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
    boxMinBounds,
    boxMaxBounds,
    "shapeIsBox",
    clippingPanelContents
  );

  makeCoordinateRange(
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
    ellipsoidMinBounds,
    ellipsoidMaxBounds,
    "shapeIsEllipsoid",
    clippingPanelContents
  );

  makeCoordinateRange(
    "Max Radius",
    "Min Radius",
    "Max Height",
    "Min Height",
    "Max Angle",
    "Min Angle",
    "clippingCylinderMaxRadius",
    "clippingCylinderMinRadius",
    "clippingCylinderMaxHeight",
    "clippingCylinderMinHeight",
    "clippingCylinderMaxAngle",
    "clippingCylinderMinAngle",
    cylinderMinBounds,
    cylinderMaxBounds,
    "shapeIsCylinder",
    clippingPanelContents
  );

  // Shader
  const shaderPanelEditor = document.createElement("div");
  shaderPanelContents.appendChild(shaderPanelEditor);

  const shaderEditor = document.createElement("textarea");
  shaderEditor.setAttribute(
    "data-bind",
    "textInput: shaderString, event: { keydown: shaderEditorKeyPress }"
  );
  shaderPanelEditor.className = "cesium-cesiumInspector-styleEditor";
  shaderPanelEditor.appendChild(shaderEditor);
  const compileShaderButton = createButton(
    "Compile (Ctrl+Enter)",
    "compileShader"
  );
  shaderPanelEditor.appendChild(compileShaderButton);

  const compilationText = document.createElement("label");
  compilationText.style.display = "block";
  compilationText.setAttribute(
    "data-bind",
    "text: shaderCompilationMessage, style: {color: shaderCompilationSuccess ? 'green' : 'red'}"
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
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
VoxelInspector.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。应该叫它永久的吗
 * 从布局中删除小部件。
 */
VoxelInspector.prototype.destroy = function () {
  knockout.cleanNode(this._element);
  this._container.removeChild(this._element);
  this.viewModel.destroy();

  return destroyObject(this);
};

function makeCoordinateRange(
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
  defaultMinBounds,
  defaultMaxBounds,
  allowedShape,
  parentContainer
) {
  const createRangeInput = InspectorShared.createRangeInput;

  const min = defaultMinBounds;
  const max = defaultMaxBounds;
  const boundsElement = parentContainer.appendChild(
    document.createElement("div")
  );
  boundsElement.setAttribute("data-bind", `if: ${allowedShape}`);
  boundsElement.appendChild(createRangeInput(maxXTitle, maxXVar, min.x, max.x));
  boundsElement.appendChild(createRangeInput(minXTitle, minXVar, min.x, max.x));
  boundsElement.appendChild(createRangeInput(maxYTitle, maxYVar, min.y, max.y));
  boundsElement.appendChild(createRangeInput(minYTitle, minYVar, min.y, max.y));
  boundsElement.appendChild(createRangeInput(maxZTitle, maxZVar, min.z, max.z));
  boundsElement.appendChild(createRangeInput(minZTitle, minZVar, min.z, max.z));
}

export default VoxelInspector;
