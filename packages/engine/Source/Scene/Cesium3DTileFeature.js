import Color from "../Core/Color.js";
import defined from "../Core/defined.js";

/** @import Cesium3DTileBatchTable from "./Cesium3DTileBatchTable.js"; */
/** @import Cesium3DTileContent from "./Cesium3DTileContent.js"; */
/** @import Cesium3DTileset from "./Cesium3DTileset.js"; */

/**
 * {@link Cesium3DTileset} 的一个要素。
 * <p>
 * 提供对存储在瓦片批处理表中的要素属性的访问，以及
 * 通过 {@link Cesium3DTileFeature#show} 和 {@link Cesium3DTileFeature#color} 显示/隐藏要素和更改其高亮颜色的能力。
 * </p>
 * <p>
 * 对 <code>Cesium3DTileFeature</code> 对象的修改具有瓦片内容生命周期。
 * 如果瓦片内容被卸载（例如，由于超出视野并需要为可见瓦片释放缓存空间），
 * 请监听 {@link Cesium3DTileset#tileUnload} 事件以保存任何修改。
 * 同时监听 {@link Cesium3DTileset#tileVisible} 事件以重新应用任何修改。
 * </p>
 * <p>
 * 不要直接构造此对象。通过 {@link Cesium3DTileContent#getFeature}
 * 或使用 {@link Scene#pick} 拾取来访问它。
 * </p>
 *
 * @example
 * // 鼠标悬停时，在控制台日志中显示要素的所有属性。
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTileFeature) {
 *         const propertyIds = feature.getPropertyIds();
 *         const length = propertyIds.length;
 *         for (let i = 0; i < length; ++i) {
 *             const propertyId = propertyIds[i];
 *             console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 *         }
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
class Cesium3DTileFeature {
  /**
   * @param {Cesium3DTileContent} content
   * @param {number} batchId
   */
  constructor(content, batchId) {
    this._content = content;
    this._batchId = batchId;
    this._color = undefined; // for calling getColor
  }

  /**
   * 获取或设置是否显示要素。当评估样式的 show 时，会为所有要素设置此值。
   *
   * @type {boolean}
   *
   * @default true
   */
  get show() {
    return this._content.batchTable.getShow(this._batchId);
  }

  set show(value) {
    this._content.batchTable.setShow(this._batchId, value);
  }

  /**
   * 获取或设置与要素颜色相乘的高亮颜色。当
   * 此值为白色时，要素的颜色不会更改。当评估样式的 color 时，会为所有要素设置此值。
   *
   * @type {Color}
   *
   * @default {@link Color.WHITE}
   */
  get color() {
    if (!defined(this._color)) {
      this._color = new Color();
    }
    return this._content.batchTable.getColor(this._batchId, this._color);
  }

  set color(value) {
    this._content.batchTable.setColor(this._batchId, value);
  }

  /**
   * 获取包含折线的 ECEF 位置的类型化数组。
   * 如果 {@link Cesium3DTileset#vectorKeepDecodedPositions} 为 false
   * 或要素不是矢量瓦片中的折线，则返回 undefined。
   *
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   *
   * @type {Float64Array}
   */
  get polylinePositions() {
    if (!defined(this._content.getPolylinePositions)) {
      return undefined;
    }

    return this._content.getPolylinePositions(this._batchId);
  }

  /**
   * Gets the content of the tile containing the feature.
   *
   * @type {Cesium3DTileContent}
   *
   * @readonly
   * @private
   */
  get content() {
    return this._content;
  }

  /**
   * 获取包含要素的瓦片集。
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */
  get tileset() {
    return this._content.tileset;
  }

  /**
   * 由 {@link Scene#pick} 返回的所有对象都有一个 <code>primitive</code> 属性。此属性返回
   * 包含要素的瓦片集。
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */
  get primitive() {
    return this._content.tileset;
  }

  /**
   * 获取与此要素关联的要素 ID。对于 3D Tiles 1.0，返回
   * 批处理 ID。对于 EXT_mesh_features，这是来自所选要素 ID 集的要素 ID。
   *
   * @type {number}
   *
   * @readonly
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   */
  get featureId() {
    return this._batchId;
  }

  /**
   * @private
   */
  get pickId() {
    return this._content.batchTable.getPickColor(this._batchId);
  }

  /**
   * 返回要素是否包含此属性。这包括来自此要素的
   * 类以及使用批处理表层次结构时的继承类的属性。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
   *
   * @param {string} name 属性的区分大小写名称。
   * @returns {boolean} 要素是否包含此属性。
   */
  hasProperty(name) {
    return this._content.batchTable.hasProperty(this._batchId, name);
  }

  /**
   * 返回要素的属性 ID 数组。这包括来自此要素的
   * 类以及使用批处理表层次结构时的继承类的属性。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
   *
   * @param {string[]} [results] 用于存储结果的数组。
   * @returns {string[]} 要素属性的 ID。
   */
  getPropertyIds(results) {
    return this._content.batchTable.getPropertyIds(this._batchId, results);
  }

  /**
   * 返回具有给定名称的要素属性值的副本。这包括来自此要素的
   * 类以及使用批处理表层次结构时的继承类的属性。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
   *
   * @param {string} name 属性的区分大小写名称。
   * @returns {*} 属性的值，如果要素没有此属性，则为 <code>undefined</code>。
   *
   * @example
   * // 在控制台日志中显示要素的所有属性。
   * const propertyIds = feature.getPropertyIds();
   * const length = propertyIds.length;
   * for (let i = 0; i < length; ++i) {
   *     const propertyId = propertyIds[i];
   *     console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
   * }
   */
  getProperty(name) {
    return this._content.batchTable.getProperty(this._batchId, name);
  }

  /**
   * 返回具有给定名称的要素属性值的副本。
   * 如果要素位于具有元数据（3D Tiles 1.1）
   * 或使用 <code>3DTILES_metadata</code> 扩展的瓦片集中，则会继承瓦片集、组和瓦片元数据。
   * <p>
   * 为了解决名称冲突，此方法按元数据粒度从最具体到
   * 最不具体解析名称，顺序为：要素、瓦片、组、
   * 瓦片集。在每个粒度内，先解析语义，然后解析其他
   * 属性。
   * </p>
   * <ol>
   *   <li>按语义的批处理表（结构化元数据）属性</li>
   *   <li>按属性 ID 的批处理表（结构化元数据）属性</li>
   *   <li>按语义的内容元数据属性</li>
   *   <li>按属性 ID 的内容元数据属性</li>
   *   <li>按语义的瓦片元数据属性</li>
   *   <li>按属性 ID 的瓦片元数据属性</li>
   *   <li>按语义的子树元数据属性</li>
   *   <li>按属性 ID 的子树元数据属性</li>
   *   <li>按语义的组元数据属性</li>
   *   <li>按属性 ID 的组元数据属性</li>
   *   <li>按语义的瓦片集元数据属性</li>
   *   <li>按属性 ID 的瓦片集元数据属性</li>
   *   <li>否则，返回 undefined</li>
   * </ol>
   * <p>
   * 有关 3D Tiles Next 的详细信息，请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_metadata|3DTILES_metadata Extension}
   * 了解 3D Tiles，以及 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata Extension}
   * 了解 glTF。对于传统 glTF 扩展，请参阅 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata|EXT_feature_metadata Extension}
   * </p>
   *
   * @param {Cesium3DTileContent} content 用于访问元数据的内容
   * @param {number} batchId 要获取属性的要素的批处理 ID（或要素 ID）
   * @param {string} name 要素的语义或属性 ID。在每个元数据粒度中，先检查语义，然后检查属性 ID。
   * @privateParam {Cesium3DTileBatchTable} [batchTable] 用于查找要素属性的批处理表。如果未指定，则使用 `content.batchTable`。
   * @return {*} 属性的值，如果要素没有此属性，则为 <code>undefined</code>。
   *
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   */
  static getPropertyInherited(
    content,
    batchId,
    name,
    batchTable = content.batchTable,
  ) {
    if (defined(batchTable)) {
      if (batchTable.hasPropertyBySemantic(batchId, name)) {
        return batchTable.getPropertyBySemantic(batchId, name);
      }

      if (batchTable.hasProperty(batchId, name)) {
        return batchTable.getProperty(batchId, name);
      }
    }

    const contentMetadata = content.metadata;
    if (defined(contentMetadata)) {
      if (contentMetadata.hasPropertyBySemantic(name)) {
        return contentMetadata.getPropertyBySemantic(name);
      }

      if (contentMetadata.hasProperty(name)) {
        return contentMetadata.getProperty(name);
      }
    }

    const tile = content.tile;
    const tileMetadata = tile.metadata;
    if (defined(tileMetadata)) {
      if (tileMetadata.hasPropertyBySemantic(name)) {
        return tileMetadata.getPropertyBySemantic(name);
      }

      if (tileMetadata.hasProperty(name)) {
        return tileMetadata.getProperty(name);
      }
    }

    let subtreeMetadata;
    if (defined(tile.implicitSubtree)) {
      subtreeMetadata = tile.implicitSubtree.metadata;
    }

    if (defined(subtreeMetadata)) {
      if (subtreeMetadata.hasPropertyBySemantic(name)) {
        return subtreeMetadata.getPropertyBySemantic(name);
      }

      if (subtreeMetadata.hasProperty(name)) {
        return subtreeMetadata.getProperty(name);
      }
    }

    const groupMetadata = defined(content.group)
      ? content.group.metadata
      : undefined;
    if (defined(groupMetadata)) {
      if (groupMetadata.hasPropertyBySemantic(name)) {
        return groupMetadata.getPropertyBySemantic(name);
      }

      if (groupMetadata.hasProperty(name)) {
        return groupMetadata.getProperty(name);
      }
    }

    const tilesetMetadata = content.tileset.metadata;
    if (defined(tilesetMetadata)) {
      if (tilesetMetadata.hasPropertyBySemantic(name)) {
        return tilesetMetadata.getPropertyBySemantic(name);
      }

      if (tilesetMetadata.hasProperty(name)) {
        return tilesetMetadata.getProperty(name);
      }
    }

    return undefined;
  }

  /**
   * Returns a copy of the value of the feature's property with the given name.
   * If the feature is contained within a tileset that has metadata (3D Tiles 1.1)
   * or uses the <code>3DTILES_metadata</code> extension, tileset, group and tile
   * metadata is inherited.
   * <p>
   * To resolve name conflicts, this method resolves names from most specific to
   * least specific by metadata granularity in the order: feature, tile, group,
   * tileset. Within each granularity, semantics are resolved first, then other
   * properties.
   * </p>
   * @param {string} name The case-sensitive name of the property.
   * @returns {*} The value of the property or <code>undefined</code> if the feature does not have this property.
   * @private
   */
  getPropertyInherited(name) {
    return Cesium3DTileFeature.getPropertyInherited(
      this._content,
      this._batchId,
      name,
    );
  }

  /**
   * 设置具有给定名称的要素属性的值。
   * <p>
   * 如果不存在具有给定名称的属性，则会创建该属性。
   * </p>
   *
   * @param {string} name 属性的区分大小写名称。
   * @param {*} value 将被复制的属性值。
   *
   * @exception {DeveloperError} 继承的批处理表层次结构属性为只读。
   *
   * @example
   * const height = feature.getProperty('Height'); // 例如，建筑物的高度
   *
   * @example
   * const name = 'clicked';
   * if (feature.getProperty(name)) {
   *     console.log('already clicked');
   * } else {
   *     feature.setProperty(name, true);
   *     console.log('first click');
   * }
   */
  setProperty(name, value) {
    this._content.batchTable.setProperty(this._batchId, name, value);

    // PERFORMANCE_IDEA: Probably overkill, but maybe only mark the tile dirty if the
    // property is in one of the style's expressions or - if it can be done quickly -
    // if the new property value changed the result of an expression.
    this._content.featurePropertiesDirty = true;
  }

  /**
   * Returns whether the feature's class name equals <code>className</code>. Unlike {@link Cesium3DTileFeature#isClass}
   * this function only checks the feature's exact class and not inherited classes.
   * <p>
   * This function returns <code>false</code> if no batch table hierarchy is present.
   * </p>
   *
   * @param {string} className The name to check against.
   * @returns {boolean} Whether the feature's class name equals <code>className</code>
   *
   * @private
   */
  isExactClass(className) {
    return this._content.batchTable.isExactClass(this._batchId, className);
  }

  /**
   * Returns whether the feature's class or any inherited classes are named <code>className</code>.
   * <p>
   * This function returns <code>false</code> if no batch table hierarchy is present.
   * </p>
   *
   * @param {string} className The name to check against.
   * @returns {boolean} Whether the feature's class or inherited classes are named <code>className</code>
   *
   * @private
   */
  isClass(className) {
    return this._content.batchTable.isClass(this._batchId, className);
  }

  /**
   * Returns the feature's class name.
   * <p>
   * This function returns <code>undefined</code> if no batch table hierarchy is present.
   * </p>
   *
   * @returns {string} The feature's class name.
   *
   * @private
   */
  getExactClassName() {
    return this._content.batchTable.getExactClassName(this._batchId);
  }
}

export default Cesium3DTileFeature;
