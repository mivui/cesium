import { defined, DeveloperError } from "@cesium/engine";
import CesiumInspector from "../CesiumInspector/CesiumInspector.js";

/**
 * 将CesiumInspector小部件添加到Viewer小部件的mixin。
 * 不是直接调用，这个函数通常作为
 * {@link Viewer#extend}的参数，如下例所示。
 * @function
 *
 * @param {Viewer} viewer 查看器实例。
 *
 * @exception {DeveloperError} viewer is required.
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Cesium%20Inspector.html|Cesium Sandcastle Cesium Inspector Demo}
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
    viewer.scene
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
