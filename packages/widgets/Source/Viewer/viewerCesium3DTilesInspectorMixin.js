import { Check } from "@cesium/engine";
import Cesium3DTilesInspector from "../Cesium3DTilesInspector/Cesium3DTilesInspector.js";

/**
 * 将{@link Cesium3DTilesInspector}部件添加到{@link Viewer}部件的mixin。
 * 不是直接调用，这个函数通常作为
 * {@link Viewer#extend}的参数，如下例所示。
 * @function
 *
 * @param {Viewer} viewer 查看器实例。
 *
 * @example
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
 */
function viewerCesium3DTilesInspectorMixin(viewer) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("viewer", viewer);
  //>>includeEnd('debug');

  const container = document.createElement("div");
  container.className = "cesium-viewer-cesium3DTilesInspectorContainer";
  viewer.container.appendChild(container);
  const cesium3DTilesInspector = new Cesium3DTilesInspector(
    container,
    viewer.scene
  );

  Object.defineProperties(viewer, {
    cesium3DTilesInspector: {
      get: function () {
        return cesium3DTilesInspector;
      },
    },
  });
}
export default viewerCesium3DTilesInspectorMixin;
