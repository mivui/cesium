import Check from "../../Core/Check.js";
import DeveloperError from "../../Core/DeveloperError.js";

/**
 * An enum to distinguish the different uses for {@link Model},
 * which include individual glTF models, and various 3D Tiles formats
 * (including glTF via <code>3DTILES_content_gltf</code>).
 *
 * @enum {string}
 * @private
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
const ModelType = {
  /**
   * 单个glTF模型。
   * <p>
   * 不要与用于3D Tiles的{@link ModelType.TILE_GLTF}混淆
   * </p>
   *
   * @type {string}
   * @constant
   */
  GLTF: "GLTF",
  /**
   * 通过<code>3DTILES_content_gltf</code>用作3D Tileset中瓦片内容的glTF模型。
   * <p>
   * 不要与用于单个模型的{@link ModelType.GLTF}混淆
   * </p>
   *
   * @type {string}
   * @constant
   */
  TILE_GLTF: "TILE_GLTF",
  /**
   * 3D Tiles 1.0批量3D模型
   *
   * @type {string}
   * @constant
   */
  TILE_B3DM: "B3DM",
  /**
   * 3D Tiles 1.0实例化3D模型
   *
   * @type {string}
   * @constant
   */
  TILE_I3DM: "I3DM",
  /**
   * 3D Tiles 1.0点云
   *
   * @type {string}
   * @constant
   */
  TILE_PNTS: "PNTS",

  /**
   * 用于<code>MAXAR_content_geojson</code>扩展的GeoJSON内容
   *
   * @type {string}
   * @constant
   */
  TILE_GEOJSON: "TILE_GEOJSON",
};

/**
 * 检查模型是否用于3D Tiles。
 * @param {ModelType} modelType 模型类型
 * @returns {boolean} 如果模型是3D Tiles格式则返回<code>true</code>，否则返回<code>false</code>
 */
ModelType.is3DTiles = function (modelType) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("modelType", modelType);
  //>>includeEnd('debug');

  switch (modelType) {
    case ModelType.TILE_GLTF:
    case ModelType.TILE_B3DM:
    case ModelType.TILE_I3DM:
    case ModelType.TILE_PNTS:
    case ModelType.TILE_GEOJSON:
      return true;
    case ModelType.GLTF:
      return false;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("modelType is not a valid value.");
    //>>includeEnd('debug');
  }
};

Object.freeze(ModelType);

export default ModelType;
