import { defined, DeveloperError } from "@cesium/engine";
import CesiumInspector from "../CesiumInspector/CesiumInspector.js";

/**
 * 添加 CesiumInspector 控件到 Viewer 控件的 mixin。
 * 此函数通常不直接调用，而是作为参数传递给 {@link Viewer#extend}，如下面的示例所示。
 * @function
 *
 * @param {Viewer} viewer Viewer 实例。
 *
 * @exception {DeveloperError} viewer 是必需的。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?id=cesium-inspector|Cesium Sandcastle Cesium Inspector Demo}
 *
 * @example
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerCesiumInspectorMixin);
 */
function viewerCesiumInspectorMixin(viewer) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(viewer)) {
    throw new DeveloperError("viewer is required.");
  }
  //>>includeEnd('debug');

  const cesiumInspectorContainer = document.createElement("div");
  cesiumInspectorContainer.className = "cesium-viewer-cesiumInspectorContainer";
  viewer.container.appendChild(cesiumInspectorContainer);
  const cesiumInspector = new CesiumInspector(
    cesiumInspectorContainer,
    viewer.scene,
  );

  Object.defineProperties(viewer, {
    cesiumInspector: {
      get: function () {
        return cesiumInspector;
      },
    },
  });
}
export default viewerCesiumInspectorMixin;
