import { Check } from "@cesium/engine";
import VoxelInspector from "../VoxelInspector/VoxelInspector.js";

/**
 * 将 {@link VoxelInspector} 部件添加到 {@link Viewer} 部件的mixin。
 * 不是直接调用，这个函数通常作为
 * {@link Viewer#extend}的参数，如下例所示。
 * @function
 *
 * @param {Viewer} viewer 查看器实例。
 *
 * @example
 * var viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerVoxelInspectorMixin);
 */
function viewerVoxelInspectorMixin(viewer) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("viewer", viewer);
  //>>includeEnd('debug');

  const container = document.createElement("div");
  container.className = "cesium-viewer-voxelInspectorContainer";
  viewer.container.appendChild(container);
  const voxelInspector = new VoxelInspector(container, viewer.scene);

  Object.defineProperties(viewer, {
    voxelInspector: {
      get: function () {
        return voxelInspector;
      },
    },
  });
}
export default viewerVoxelInspectorMixin;
