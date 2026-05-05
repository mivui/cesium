// @ts-check

import DeveloperError from "../Core/DeveloperError.js";
import BufferPoint from "./BufferPoint.js";
import BufferPointCollection from "./BufferPointCollection.js";
import BufferPointMaterial from "./BufferPointMaterial.js";
import BufferPolygon from "./BufferPolygon.js";
import BufferPolygonCollection from "./BufferPolygonCollection.js";
import BufferPolygonMaterial from "./BufferPolygonMaterial.js";
import BufferPolyline from "./BufferPolyline.js";
import BufferPolylineCollection from "./BufferPolylineCollection.js";
import BufferPolylineMaterial from "./BufferPolylineMaterial.js";
import Cesium3DTileFeature from "./Cesium3DTileFeature.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";

/** @import BufferPrimitive from "./BufferPrimitive.js"; */
/** @import BufferPrimitiveMaterial from "./BufferPrimitiveMaterial.js"; */
/** @import Cesium3DTileBatchTable from "./Cesium3DTileBatchTable.js"; */
/** @import Cesium3DTileContent from "./Cesium3DTileContent.js"; */
/** @import Cesium3DTileset from "./Cesium3DTileset.js"; */
/** @import VectorGltf3DTileContent from "./VectorGltf3DTileContent.js"; */

const point = new BufferPoint();
const polyline = new BufferPolyline();
const polygon = new BufferPolygon();

const pointMaterial = new BufferPointMaterial();
const polylineMaterial = new BufferPolylineMaterial();
const polygonMaterial = new BufferPolygonMaterial();

/**
 * {@link Cesium3DTileset} 的矢量要素。
 * <p>
 * 提供对存储在瓦片批处理表中的要素属性的访问，以及
 * 显示/隐藏和样式化要素的能力
 * </p>
 * <p>
 * 对 <code>Cesium3DTileVectorFeature</code> 对象的修改具有瓦片内容生命周期。
 * 如果瓦片内容被卸载（例如，由于超出视野并需要为可见瓦片释放缓存空间），
 * 请监听 {@link Cesium3DTileset#tileUnload} 事件以保存任何修改。
 * 同时监听 {@link Cesium3DTileset#tileVisible} 事件以重新应用任何修改。
 * </p>
 * <p>
 * 不要直接构造此对象。通过 {@link Cesium3DTileContent#getFeature}
 * 或使用 {@link Scene#pick} 和 {@link Scene#pickPosition} 拾取来访问它。
 * </p>
 *
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 *
 * @example
 * // 鼠标悬停时，在控制台日志中显示要素的所有属性。
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTileVectorFeature) {
 *         const propertyIds = feature.getPropertyIds();
 *         const length = propertyIds.length;
 *         for (let i = 0; i < length; ++i) {
 *             const propertyId = propertyIds[i];
 *             console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 *         }
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 *
 * @ignore
 */
class Cesium3DTileVectorFeature {
  /** @private  */
  _color = new Color();

  /** @private  */
  _outlineColor = new Color();

  /**
   * @param {VectorGltf3DTileContent} content
   * @param {number} batchId
   * @param {number} [batchTableId=0]
   */
  constructor(content, batchId, batchTableId = 0) {
    this._content = content;
    this._batchId = batchId;
    this._batchTableId = batchTableId;

    /**
     * For each collection index N, this map returns the indices of all
     * primitive in the collection associated with this feature.
     * @type {Map<number, number[]>}
     * @private
     */
    this._primitivesByCollection = new Map();
  }

  /**
   * @param {number} collectionIndex
   * @param {number} primitiveIndex
   */
  addPrimitiveByCollection(collectionIndex, primitiveIndex) {
    let primitiveIndices = this._primitivesByCollection.get(collectionIndex);
    if (!primitiveIndices) {
      primitiveIndices = [];
      this._primitivesByCollection.set(collectionIndex, primitiveIndices);
    }
    primitiveIndices.push(primitiveIndex);
  }

  /**
   * @type {boolean}
   * @default true
   */
  get show() {
    for (const prim of this._iteratePrimitives()) {
      if (prim.show) {
        return true;
      }
    }
    return false;
  }

  set show(value) {
    for (const prim of this._iteratePrimitives()) {
      prim.show = value;
    }
  }

  /**
   * @type {Color}
   * @default Color.WHITE
   */
  get color() {
    for (const material of this._iterateMaterials()) {
      return Color.clone(material.color, this._color);
    }
    return Color.clone(Color.WHITE, this._color);
  }

  set color(value) {
    for (const material of this._iterateMaterials()) {
      Color.clone(value, material.color);
    }
  }

  /**
   * @type {number}
   * @default 1
   */
  get pointSize() {
    for (const material of this._iteratePointMaterials()) {
      return material.size;
    }
    return 1;
  }

  set pointSize(value) {
    for (const material of this._iteratePointMaterials()) {
      material.size = value;
    }
  }

  /**
   * @type {Color}
   * @default Color.WHITE
   */
  get pointOutlineColor() {
    for (const material of this._iteratePointMaterials()) {
      return Color.clone(material.outlineColor, this._outlineColor);
    }
    return Color.clone(Color.WHITE, this._outlineColor);
  }

  set pointOutlineColor(value) {
    for (const material of this._iteratePointMaterials()) {
      Color.clone(value, material.outlineColor);
    }
  }

  /**
   * @type {number}
   * @default 0
   */
  get pointOutlineWidth() {
    for (const material of this._iteratePointMaterials()) {
      return material.outlineWidth;
    }
    return 0;
  }

  set pointOutlineWidth(value) {
    for (const material of this._iteratePointMaterials()) {
      material.outlineWidth = value;
    }
  }

  /**
   * @type {number}
   * @default 1
   */
  get lineWidth() {
    for (const material of this._iteratePolylineMaterials()) {
      return material.width;
    }
    return 1;
  }

  set lineWidth(value) {
    for (const material of this._iteratePolylineMaterials()) {
      material.width = value;
    }
  }

  /**
   * @type {Color}
   * @default Color.WHITE
   */
  get lineOutlineColor() {
    for (const material of this._iteratePolylineMaterials()) {
      return Color.clone(material.outlineColor, this._outlineColor);
    }
    return Color.clone(Color.WHITE, this._outlineColor);
  }

  set lineOutlineColor(value) {
    for (const material of this._iteratePolylineMaterials()) {
      Color.clone(value, material.outlineColor);
    }
  }

  /**
   * @type {number}
   * @default 0
   */
  get lineOutlineWidth() {
    for (const material of this._iteratePolylineMaterials()) {
      return material.outlineWidth;
    }
    return 0;
  }

  set lineOutlineWidth(value) {
    for (const material of this._iteratePolylineMaterials()) {
      material.outlineWidth = value;
    }
  }

  /**
   * @type {Color}
   * @default Color.WHITE
   */
  get polygonOutlineColor() {
    for (const material of this._iteratePolygonMaterials()) {
      return Color.clone(material.outlineColor, this._outlineColor);
    }
    return Color.clone(Color.WHITE, this._outlineColor);
  }

  set polygonOutlineColor(value) {
    for (const material of this._iteratePolygonMaterials()) {
      Color.clone(value, material.outlineColor);
    }
  }

  /**
   * @type {number}
   * @default 0
   */
  get polygonOutlineWidth() {
    for (const material of this._iteratePolygonMaterials()) {
      return material.outlineWidth;
    }
    return 0;
  }

  set polygonOutlineWidth(value) {
    for (const material of this._iteratePolygonMaterials()) {
      material.outlineWidth = value;
    }
  }

  /**
   * Gets the content of the tile containing the feature.
   *
   * @type {VectorGltf3DTileContent}
   *
   * @ignore
   */
  get content() {
    return this._content;
  }

  /**
   * 获取包含要素的瓦片集。
   *
   * @type {Cesium3DTileset}
   */
  get tileset() {
    return this._content.tileset;
  }

  /**
   * 由 {@link Scene#pick} 返回的所有对象都有一个 <code>primitive</code> 属性。此属性返回
   * 包含要素的瓦片集。
   *
   * @type {Cesium3DTileset}
   */
  get primitive() {
    return this._content.tileset;
  }

  /**
   * 获取与此要素关联的要素 ID。使用 EXT_mesh_features，
   * 这是来自所选要素 ID 集的要素 ID。
   *
   * @type {number}
   *
   * @readonly
   */
  get featureId() {
    return this._batchId;
  }

  /**
   * @type {Cesium3DTileBatchTable|undefined}
   * @private
   */
  get _batchTable() {
    return this._content.batchTables[this._batchTableId];
  }

  /**
   * @type {number[]}
   * @ignore
   */
  get pickIds() {
    const pickIds = [];
    for (const prim of this._iteratePrimitives()) {
      pickIds.push(prim._pickId);
    }
    return pickIds;
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
    if (!defined(this._batchTable)) {
      return false;
    }
    return this._batchTable.hasProperty(this._batchId, name);
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
    if (!defined(this._batchTable)) {
      return [];
    }
    return this._batchTable.getPropertyIds(this._batchId, results);
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
   *     console.log(`{propertyId} : ${feature.getProperty(propertyId)}`);
   * }
   */
  getProperty(name) {
    if (!defined(this._batchTable)) {
      return undefined;
    }
    return this._batchTable.getProperty(this._batchId, name);
  }

  /**
   * Returns a copy of the value of the feature's property with the given name.
   * If the feature is contained within a tileset that has metadata (3D Tiles 1.1)
   * or uses the <code>3DTILES_metadata</code> extension, tileset, group and tile metadata is
   * inherited.
   * <p>
   * To resolve name conflicts, this method resolves names from most specific to
   * least specific by metadata granularity in the order: feature, tile, group,
   * tileset. Within each granularity, semantics are resolved first, then other
   * properties.
   * </p>
   * @param {string} name The case-sensitive name of the property.
   * @returns {*} The value of the property or <code>undefined</code> if the feature does not have this property.
   * @private
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   */
  getPropertyInherited(name) {
    return Cesium3DTileFeature.getPropertyInherited(
      // @ts-expect-error Requires type checking in Cesium3DTileContent.
      this._content,
      this._batchId,
      name,
      this._batchTable,
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
    throw new DeveloperError("Not implemented");
  }

  /**
   * Returns whether the feature's class name equals <code>className</code>. Unlike {@link Cesium3DTileVectorFeature#isClass}
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
    if (!defined(this._batchTable)) {
      return false;
    }
    return this._batchTable.isExactClass(this._batchId, className);
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
    if (!defined(this._batchTable)) {
      return false;
    }
    return this._batchTable.isClass(this._batchId, className);
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
    if (!defined(this._batchTable)) {
      return undefined;
    }
    return this._batchTable.getExactClassName(this._batchId);
  }

  /////////////////////////////////////////////////////////////////////////////
  // INTERNAL ITERATORS

  /**
   * @returns {Iterable<BufferPrimitive>}
   */
  *_iteratePrimitives() {
    yield* this._iteratePrimitivesWith(BufferPointCollection, point);
    yield* this._iteratePrimitivesWith(BufferPolylineCollection, polyline);
    yield* this._iteratePrimitivesWith(BufferPolygonCollection, polygon);
  }

  /**
   * @param {*} CollectionType
   * @param {BufferPrimitive} result
   * @returns {Iterable<BufferPrimitive>}
   */
  *_iteratePrimitivesWith(CollectionType, result) {
    const collections = this._content._collections;
    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];
      const primitiveIndices = this._primitivesByCollection.get(i);
      if (primitiveIndices && collection instanceof CollectionType) {
        for (const primitiveIndex of primitiveIndices) {
          collection.get(primitiveIndex, result);
          yield result;
        }
      }
    }
  }

  /** @returns {Iterable<BufferPrimitiveMaterial>} */
  *_iterateMaterials() {
    yield* this._iteratePointMaterials();
    yield* this._iteratePolylineMaterials();
    yield* this._iteratePolygonMaterials();
  }

  /** @returns {Iterable<BufferPointMaterial>} */
  *_iteratePointMaterials() {
    yield* /** @type {Iterable<BufferPointMaterial>} */ (
      this._iterateMaterialsWith(BufferPointCollection, point, pointMaterial)
    );
  }

  /** @returns {Iterable<BufferPolylineMaterial>} */
  *_iteratePolylineMaterials() {
    yield* /** @type {Iterable<BufferPolylineMaterial>} */ (
      this._iterateMaterialsWith(
        BufferPolylineCollection,
        polyline,
        polylineMaterial,
      )
    );
  }

  /** @returns {Iterable<BufferPolygonMaterial>} */
  *_iteratePolygonMaterials() {
    yield* /** @type {Iterable<BufferPolygonMaterial>} */ (
      this._iterateMaterialsWith(
        BufferPolygonCollection,
        polygon,
        polygonMaterial,
      )
    );
  }

  /**
   * @param {*} CollectionType
   * @param {BufferPrimitive} primitive
   * @param {BufferPrimitiveMaterial} result
   * @returns {Iterable<BufferPrimitiveMaterial>}
   */
  *_iterateMaterialsWith(CollectionType, primitive, result) {
    for (const prim of this._iteratePrimitivesWith(CollectionType, primitive)) {
      prim.getMaterial(result);
      yield result;
      prim.setMaterial(result);
    }
  }
}

export default Cesium3DTileVectorFeature;
