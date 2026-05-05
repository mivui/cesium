// @ts-check

import assert from "../Core/assert.js";

/** @import BufferPrimitiveCollection from './BufferPrimitiveCollection.js'; */
/** @import BufferPrimitiveMaterial from "./BufferPrimitiveMaterial.js"; */

/**
 * 绑定到 {@link BufferPrimitiveCollection} 底层缓冲数据的视图。抽象类。
 *
 * <p>BufferPrimitive 实例旨在迭代大型集合时重用,
 * 并在对该图元执行读/写操作时临时绑定到图元索引,
 * 然后再重新绑定到下一个图元,使用
 * {@link https://en.wikipedia.org/wiki/Flyweight_pattern|享元模式}。</p>
 *
 * @see BufferPrimitiveCollection
 * @see BufferPrimitiveMaterial
 * @see BufferPoint
 * @see BufferPolyline
 * @see BufferPolygon
 *
 * @abstract
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */
class BufferPrimitive {
  /**
   * Collecton containing the primitive(s) for which this instance currently
   * provides a view.
   *
   * @type {BufferPrimitiveCollection<BufferPrimitive>}
   * @ignore
   */
  _collection = null;

  /**
   * Index of the primitive for which this instance currently provides a view.
   *
   * @type {number}
   * @ignore
   */
  _index = -1;

  /**
   * Byte offset, into the collection's primitive buffer, of the primitive for
   * which this instance currently provides a view.
   *
   * @type {number}
   * @ignore
   */
  _byteOffset = -1;

  /**
   * Binary layout for this primitive type in collection's primitive buffer.
   * Each `Layout.MY_KEY_U32` entry is an offset in bytes, relative to the
   * start offset of the primitive, with the suffix indicating the data type
   * stored at that offset.
   *
   * The final entry, `__BYTE_LENGTH`, is not a pointer into a buffer — its
   * literal value is the total byte length of one primitive in the primitive
   * buffer, exclusive of other buffers.
   *
   * @ignore
   */
  static Layout = {
    /**
     * Feature ID associated with the primitive; not required to be unique.
     * @type {number}
     * @ignore
     */
    FEATURE_ID_U32: 0,

    /**
     * Boolean (0 or 1) flag indicating whether primitive is shown.
     * @type {number}
     * @ignore
     */
    SHOW_U8: 4,

    /**
     * Boolean (0 or 1) flag indicating whether primitive is dirty.
     * @type {number}
     * @ignore
     */
    DIRTY_U8: 5,

    /**
     * Pick ID (uint32) of primitive.
     * @type {number}
     * @ignore
     */
    PICK_ID_U32: 8,

    /**
     * Byte length of one primitive in the primitive buffer, exclusive of
     * other buffers. Literal value, not a pointer.
     * @type {number}
     * @ignore
     */
    __BYTE_LENGTH: 12,
  };

  /////////////////////////////////////////////////////////////////////////////
  // LIFECYCLE

  /**
   * 将源图元的数据复制到结果。如果结果图元不是新的
   * (集合中的最后一个图元),则源图元和结果图元
   * 必须具有相同的顶点数。
   *
   * @param {BufferPrimitive} primitive
   * @param {BufferPrimitive} result
   * @returns {BufferPrimitive}
   */
  static clone(primitive, result) {
    const SrcMaterialClass = primitive._collection._getMaterialClass();

    //>>includeStart('debug', pragmas.debug);
    const DstMaterialClass = result._collection._getMaterialClass();
    assert(SrcMaterialClass === DstMaterialClass, "Incompatible materials");
    //>>includeEnd('debug');

    result.featureId = primitive.featureId;
    result.show = primitive.show;
    result.setMaterial(primitive.getMaterial(new SrcMaterialClass()));
    return result;
  }

  /**
   * Returns true if this primitive's memory footprint is resizable. Only the
   * newest (most recently created) primitive in a collection can be resized,
   * to guarantee fast and stable performance.
   *
   * @returns {boolean}
   * @protected
   * @ignore
   */
  _isResizable() {
    return this._index === this._collection.primitiveCount - 1;
  }

  /////////////////////////////////////////////////////////////////////////////
  // ACCESSORS

  /**
   * 与图元关联的特征 ID;不需要唯一。
   * @type {number}
   */
  get featureId() {
    return this._getUint32(BufferPrimitive.Layout.FEATURE_ID_U32);
  }

  set featureId(featureId) {
    this._setUint32(BufferPrimitive.Layout.FEATURE_ID_U32, featureId);
  }

  /**
   * 图元是否显示。
   * @type {boolean}
   */
  get show() {
    return this._getUint8(BufferPrimitive.Layout.SHOW_U8) === 1;
  }

  set show(show) {
    this._setUint8(BufferPrimitive.Layout.SHOW_U8, show ? 1 : 0);
  }

  /**
   * @param {BufferPrimitiveMaterial} result
   * @returns {BufferPrimitiveMaterial}
   */
  getMaterial(result) {
    const collection = this._collection;
    const MaterialClass = collection._getMaterialClass();

    return MaterialClass.unpack(
      collection._materialView,
      this._index * MaterialClass.packedLength,
      result,
    );
  }

  /**
   * @param {BufferPrimitiveMaterial} material
   */
  setMaterial(material) {
    const collection = this._collection;
    const MaterialClass = collection._getMaterialClass();

    MaterialClass.pack(
      material,
      collection._materialView,
      this._index * MaterialClass.packedLength,
    );

    this._dirty = true;

    return material;
  }

  /**
   * Whether the primitive requires an update on next render. Renderers should
   * _not_ iterate over all primitives each frame, but must instead inspect
   * only the dirty range of the parent collection. This flag is managed
   * automatically, by primitive setters and collection renderers.
   *
   * @type {boolean}
   * @ignore
   *
   * @see BufferPrimitiveCollection#_dirtyOffset
   * @see BufferPrimitiveCollection#_dirtyCount
   */
  get _dirty() {
    return this._getUint8(BufferPrimitive.Layout.DIRTY_U8) === 1;
  }

  set _dirty(dirty) {
    // Avoid `._setUint8()` here, which would infinitely loop `._dirty = true`.
    this._collection._primitiveView.setUint8(
      this._byteOffset + BufferPrimitive.Layout.DIRTY_U8,
      dirty ? 1 : 0,
    );

    // A 'dirty' primitive is responsible for notifying the collection. Applying
    // updates and marking the primitive 'clean' will be handled by the collection,
    // so we don't notify the collection here in that case.
    if (dirty) {
      this._collection._makeDirty(this._index);
    }
  }

  /**
   * Pick ID (uint32) of primitive.
   * @type {number}
   * @ignore
   */
  get _pickId() {
    return this._getUint32(BufferPrimitive.Layout.PICK_ID_U32);
  }

  set _pickId(pickId) {
    this._setUint32(BufferPrimitive.Layout.PICK_ID_U32, pickId);
  }

  /////////////////////////////////////////////////////////////////////////////
  // BUFFER ACCESSORS

  /**
   * @param {number} itemByteOffset
   * @returns {number}
   * @ignore
   */
  _getUint8(itemByteOffset) {
    return this._collection._primitiveView.getUint8(
      this._byteOffset + itemByteOffset,
    );
  }

  /**
   * @param {number} itemByteOffset
   * @param {number} itemValue
   * @ignore
   */
  _setUint8(itemByteOffset, itemValue) {
    this._collection._primitiveView.setUint8(
      this._byteOffset + itemByteOffset,
      itemValue,
    );
    this._dirty = true;
  }

  /**
   * @param {number} itemByteOffset
   * @returns {number}
   * @ignore
   */
  _getUint32(itemByteOffset) {
    return this._collection._primitiveView.getUint32(
      this._byteOffset + itemByteOffset,
      true,
    );
  }

  /**
   * @param {number} itemByteOffset
   * @param {number} itemValue
   * @ignore
   */
  _setUint32(itemByteOffset, itemValue) {
    this._collection._primitiveView.setUint32(
      this._byteOffset + itemByteOffset,
      itemValue,
      true,
    );
    this._dirty = true;
  }

  /**
   * @param {number} itemByteOffset
   * @returns {number}
   * @ignore
   */
  _getFloat32(itemByteOffset) {
    return this._collection._primitiveView.getFloat32(
      this._byteOffset + itemByteOffset,
      true,
    );
  }

  /**
   * @param {number} itemByteOffset
   * @param {number} itemValue
   * @ignore
   */
  _setFloat32(itemByteOffset, itemValue) {
    this._collection._primitiveView.setFloat32(
      this._byteOffset + itemByteOffset,
      itemValue,
      true,
    );
    this._dirty = true;
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEBUG

  /**
   * 返回表示该图元的可 JSON 序列化的对象。此编码
   * 不具有内存效率,通常应用于调试和测试。
   *
   * @returns {Object} 可 JSON 序列化的对象。
   */
  toJSON() {
    const collection = this._collection;
    const MaterialClass = collection._getMaterialClass();

    return {
      featureId: this.featureId,
      show: this.show,
      dirty: this._dirty,
      material: this.getMaterial(new MaterialClass()).toJSON(),
    };
  }
}

export default BufferPrimitive;
