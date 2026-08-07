// @ts-check

import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import DeveloperError from "../Core/DeveloperError.js";
import Frozen from "../Core/Frozen.js";
import Matrix4 from "../Core/Matrix4.js";
import assert from "../Core/assert.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import defined from "../Core/defined.js";
import Check from "../Core/Check.js";
import AttributeCompression from "../Core/AttributeCompression.js";
import SceneMode from "./SceneMode.js";
import AttributeType from "./AttributeType.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import BlendOption from "../Scene/BlendOption.js";

/** @import { Destroyable, TypedArray, TypedArrayConstructor } from "../Core/globalTypes.js"; */
/** @import Context from "../Renderer/Context.js"; */
/** @import FrameState from "./FrameState.js"; */
/** @import BufferPrimitive from "./BufferPrimitive.js"; */
/** @import BufferPrimitiveMaterial from "./BufferPrimitiveMaterial.js"; */
/** @import PickId from "../Renderer/PickId.js"; */

/**
 * @typedef {object} BufferPrimitiveOptions
 * @property {Matrix4} [modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标变换到世界坐标。
 * @property {boolean} [show=true]
 * @property {BufferPrimitiveMaterial} [material]
 * @property {number} [featureId]
 * @property {object} [pickObject]
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 */

/**
 * 存储在 ArrayBuffer 中的图元集合,用于性能和内存优化。
 *
 * <p>为了充分利用包含 "N" 个图元的 BufferPrimitiveCollection 的性能,
 * 请注意避免分配 "N" 个任何相关 JavaScript 对象的实例。{@link BufferPrimitive}、
 * {@link Color}、{@link Cartesian3} 等对象在使用大型集合时都可以重用,
 * 使用{@link https://en.wikipedia.org/wiki/Flyweight_pattern|享元模式}。</p>
 *
 * @abstract
 * @template T extends BufferPrimitive
 * @experimental 此功能尚未最终确定,可能会在不遵循 Cesium 标准弃用政策的情况下进行更改。
 *
 * @see BufferPrimitive
 * @see BufferPrimitiveMaterial
 * @see BufferPointCollection
 * @see BufferPolylineCollection
 * @see BufferPolygonCollection
 */
class BufferPrimitiveCollection {
  /** @ignore */
  static Error = {
    ERR_RESIZE: "BufferPrimitive range cannot be resized after initialization.",
    ERR_CAPACITY: "BufferPrimitiveCollection capacity exceeded.",
    ERR_MULTIPLE_OF_FOUR:
      "BufferPrimitive byte length must be a multiple of 4.",
    ERR_OUT_OF_RANGE: "BufferPrimitive buffer access out of range.",
  };

  /**
   * Resources managed by the collection's renderer. Collections may have multiple renderer
   * implementations, so the collection should be ignorant of the renderer's implementation
   * and context data. A collection only has one renderer active at a time.
   *
   * @type {Destroyable|null}
   * @ignore
   */
  _renderContext = null;

  /**
   * @param {object} options
   * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标变换到世界坐标。
   * @param {number} [options.primitiveCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {number} [options.vertexCountMax=BufferPrimitiveCollection.DEFAULT_CAPACITY]
   * @param {boolean} [options.show=true]
   * @param {ComponentDatatype} [options.positionDatatype=ComponentDatatype.DOUBLE]
   * @param {boolean} [options.positionNormalized=false] 当 <code>true</code> 时，整数位置值被视为归一化，其中完整的整数范围映射到 [-1, 1]（有符号）或 [0, 1]（无符号）。仅与整数位置数据类型（BYTE、UNSIGNED_BYTE、SHORT、UNSIGNED_SHORT）相关。
   * @param {boolean} [options.allowPicking=false] When <code>true</code>, primitives are pickable with {@link Scene#pick}. When <code>false</code>, memory and initialization cost are lower.
   * @param {BoundingSphere} [options.boundingVolume] 在世界空间中，该集合的边界体积。当未指定时，边界体积会自动计算，并在原始位置变化时更新。当指定时，用户需要根据需要更新边界体积。手动预先计算边界体积，并仅在需要时更新，将提高较大动态集合的性能。
   * @param {boolean} [options.debugShowBoundingVolume=false]
   * @param {BlendOption} [options.blendOption=BlendOption.TRANSLUCENT]
   */
  constructor(options = Frozen.EMPTY_OBJECT) {
    /**
     * 确定此集合中的图元是否显示。
     * @type {boolean}
     * @default true
     */
    this.show = options.show ?? true;

    /**
     * Collection blend option; must be OPAQUE or TRANSLUCENT.
     * @type {BlendOption}
     * @readonly
     * @ignore
     */
    this._blendOption = options.blendOption ?? BlendOption.TRANSLUCENT;

    /**
     * Transforms geometry from model to world coordinates.
     * @type {Matrix4}
     * @default Matrix4.IDENTITY
     * @readonly
     * @protected
     */
    this._modelMatrix = Matrix4.clone(options.modelMatrix ?? Matrix4.IDENTITY);

    /**
     * @type {BoundingSphere}
     * @readonly
     * @protected
     */
    this._boundingVolume = BoundingSphere.clone(
      options.boundingVolume ?? new BoundingSphere(),
      new BoundingSphere(),
    );

    /**
     * @type {boolean}
     * @readonly
     * @protected
     */
    this._boundingVolumeAutoUpdate = !defined(options.boundingVolume);

    /**
     * 当 <code>true</code> 时,图元可使用 {@link Scene#pick} 进行拾取。
     * 当 <code>false</code> 时,内存和初始化成本更低。
     * @type {boolean}
     * @readonly
     * @ignore
     * @default false
     */
    this._allowPicking = options.allowPicking ?? false;

    /**
     * @type {Map<Context, PickId[]>}
     * @readonly
     * @ignore
     */
    this._pickIds = new Map();

    /**
     * @type {object[]}
     * @readonly
     * @ignore
     */
    this._pickObjects = [];

    /**
     * 此属性仅用于调试;不用于生产环境,也未进行优化。
     * <p>
     * 绘制图元中每个绘制命令的包围球。
     * </p>
     *
     * @type {boolean}
     * @default false
     */
    this.debugShowBoundingVolume = options.debugShowBoundingVolume ?? false;

    /**
     * @type {number}
     * @protected
     * @ignore
     */
    this._primitiveCount = 0;

    /**
     * @type {number}
     * @protected
     * @ignore
     */
    this._primitiveCountMax =
      options.primitiveCountMax ?? BufferPrimitiveCollection.DEFAULT_CAPACITY;

    /**
     * @type {DataView<ArrayBuffer>}
     * @ignore
     */
    this._primitiveView = null;

    /**
     * @type {number}
     * @ignore
     */
    this._positionCount = 0;

    /**
     * @type {number}
     * @ignore
     */
    this._positionCountMax =
      options.vertexCountMax ?? BufferPrimitiveCollection.DEFAULT_CAPACITY;

    /**
     * @type {TypedArray}
     * @ignore
     */
    this._positionView = null;

    /**
     * @type {ComponentDatatype}
     * @ignore
     */
    this._positionDatatype =
      options.positionDatatype ?? ComponentDatatype.DOUBLE;

    /**
     * When <code>true</code>, integer position values represent normalized floats
     * in [-1, 1] (signed) or [0, 1] (unsigned). Only applicable to integer datatypes.
     * @type {boolean}
     * @ignore
     */
    this._positionNormalized = options.positionNormalized ?? false;

    /**
     * @type {DataView<ArrayBuffer>}
     * @ignore
     */
    this._materialView = null;

    // Potentially-dirty primitives are tracked as a contiguous range, with
    // 'clean' primitives potentially within the range. Individual primitive
    // 'dirty' flags are source-of-truth.

    /**
     * @type {number}
     * @ignore
     */
    this._dirtyOffset = 0;

    /**
     * @type {number}
     * @ignore
     */
    this._dirtyCount = 0;

    /**
     * @type {boolean}
     * @ignore
     */
    this._dirtyBoundingVolume = false;

    /**
     * Monotonically increasing counter, bumped each time collection is marked "clean".
     * @type {number}
     * @ignore
     */
    this._version = 0;

    this._allocatePrimitiveBuffer();
    this._allocatePositionBuffer();
    this._allocateMaterialBuffer();
  }

  /**
   * Accessing `this.constructor` can cause JSDoc builds to fail, so use this
   * protected getter function instead.
   * @protected
   * @return {*}
   * @ignore
   */
  _getCollectionClass() {
    DeveloperError.throwInstantiationError();
  }

  /**
   * @protected
   * @return {*}
   * @ignore
   */
  _getPrimitiveClass() {
    DeveloperError.throwInstantiationError();
  }

  /**
   * @return {*}
   * @ignore
   */
  _getMaterialClass() {
    DeveloperError.throwInstantiationError();
  }

  /////////////////////////////////////////////////////////////////////////////
  // COLLECTION LIFECYCLE

  /**
   * @private
   * @ignore
   */
  _allocatePrimitiveBuffer() {
    const layout = this._getPrimitiveClass().Layout;

    //>>includeStart('debug', pragmas.debug);
    const { ERR_MULTIPLE_OF_FOUR } = BufferPrimitiveCollection.Error;
    assert(layout.__BYTE_LENGTH % 4 === 0, ERR_MULTIPLE_OF_FOUR);
    //>>includeEnd('debug');

    this._primitiveView = new DataView(
      new ArrayBuffer(this._primitiveCountMax * layout.__BYTE_LENGTH),
    );
  }

  /**
   * @private
   * @ignore
   */
  _allocatePositionBuffer() {
    // @ts-expect-error https://github.com/CesiumGS/cesium/issues/13420
    this._positionView = ComponentDatatype.createTypedArray(
      this._positionDatatype,
      this._positionCountMax * 3,
    );
  }

  /**
   * @private
   * @ignore
   */
  _allocateMaterialBuffer() {
    const MaterialClass = this._getMaterialClass();
    this._materialView = new DataView(
      new ArrayBuffer(this._primitiveCountMax * MaterialClass.packedLength),
    );
  }

  /**
   * 返回此对象是否已销毁;如果未销毁,则返回 false。
   *
   * @returns {boolean} 如果此对象已销毁,则返回 true;否则返回 false。
   */
  isDestroyed() {
    return false;
  }

  /** 销毁集合及其 GPU 资源。 */
  destroy() {
    this._pickObjects.length = 0;

    for (const contextPickIds of this._pickIds.values()) {
      for (const pickId of contextPickIds) {
        pickId.destroy();
      }
    }

    if (defined(this._renderContext)) {
      this._renderContext.destroy();
      this._renderContext = undefined;
      this._dirtyOffset = 0;
      this._dirtyCount = this.primitiveCount;
    }
  }

  /**
   * 对集合的图元进行排序。
   *
   * 由于排序会更改图元的索引(但不更改特征 ID),
   * 该函数还会返回一个数组,映射从先前索引到新索引。
   * 当重复排序时,可以重用该数组并将其作为 'result' 参数传递给每次调用。
   *
   * @param {Function} sortFn
   * @param {Uint32Array} result
   * @returns {Uint32Array} 从先前索引到新索引的映射。
   */
  sort(sortFn, result = new Uint32Array(this.primitiveCount)) {
    const PrimitiveClass = this._getPrimitiveClass();
    const CollectionClass = this._getCollectionClass();

    const { primitiveCount } = this;

    const a = new PrimitiveClass();
    const b = new PrimitiveClass();

    // Mapping from NEW index to PREVIOUS index.
    const dstSrcMap = new Uint32Array(primitiveCount);
    for (let i = 0; i < primitiveCount; i++) {
      dstSrcMap[i] = i;
    }
    dstSrcMap.sort((indexA, indexB) =>
      sortFn(this.get(indexA, a), this.get(indexB, b)),
    );

    // Mapping from PREVIOUS index to NEW index.
    for (let i = 0; i < primitiveCount; i++) {
      result[dstSrcMap[i]] = i;
    }

    // Copy primitives to temporary collection, in sort order.
    const tmp = CollectionClass._cloneEmpty(this);
    for (let i = 0; i < primitiveCount; i++) {
      const src = this.get(dstSrcMap[i], a);
      const dst = tmp.add({}, b);
      PrimitiveClass.clone(src, dst);
    }

    // Assign buffers from temporary collection onto this one.
    CollectionClass._replaceBuffers(tmp, this);
    this._dirtyOffset = 0;
    this._dirtyCount = primitiveCount;

    return result;
  }

  /**
   * 将此集合的内容复制到结果集合。
   * 结果集合不调整大小,必须包含足够的空间以容纳源集合中的所有图元。
   * 结果集合中的现有图元将被覆盖。
   *
   * <p>在为已达到容量的集合分配更多空间,
   * 并将图元高效转移到新集合时非常有用。</p>
   *
   * @example
   * const result = new BufferPrimitiveCollection({ ... }); // 分配更大的 'result' 集合
   * BufferPrimitiveCollection.clone(collection, result);   // 将 'collection' 中的图元复制到 'result'
   *
   * @param {BufferPrimitiveCollection<T>} collection
   * @param {BufferPrimitiveCollection<T>} result
   * @template T extends BufferPrimitive
   */
  static clone(collection, result) {
    //>>includeStart('debug', pragmas.debug);
    const { ERR_CAPACITY } = BufferPrimitiveCollection.Error;
    assert(collection.primitiveCount <= result.primitiveCountMax, ERR_CAPACITY);
    assert(collection.vertexCount <= result.vertexCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    const layout = collection._getPrimitiveClass().Layout;
    const MaterialClass = collection._getMaterialClass();
    const PrimitiveClass = collection._getPrimitiveClass();

    this._copySubDataView(
      collection._primitiveView,
      result._primitiveView,
      collection.primitiveCount * layout.__BYTE_LENGTH,
    );

    this._copySubArray(
      collection._positionView,
      result._positionView,
      collection.vertexCount * 3,
    );

    this._copySubDataView(
      collection._materialView,
      result._materialView,
      collection.primitiveCount * MaterialClass.packedLength,
    );

    result.show = collection.show;
    result.debugShowBoundingVolume = collection.debugShowBoundingVolume;
    result._primitiveCount = collection._primitiveCount;
    result._positionCount = collection._positionCount;

    // Unset PickIds.
    const primitive = new PrimitiveClass();
    for (let i = 0, il = result.primitiveCount; i < il; i++) {
      result.get(i, primitive)._pickId = 0;
    }

    result._dirtyOffset = 0;
    result._dirtyCount = result.primitiveCount;

    collection.boundingVolume.clone(result.boundingVolume);

    return result;
  }

  /**
   * Returns an empty collection with the same buffer sizes as this collection.
   * Internal utility for operations requiring a working copy of memory.
   *
   * @param {BufferPrimitiveCollection<T>} collection
   * @returns {BufferPrimitiveCollection<T>}
   * @template T extends BufferPrimitive
   * @protected
   * @abstract
   * @ignore
   */
  static _cloneEmpty(collection) {
    DeveloperError.throwInstantiationError();
  }

  /**
   * Assigns buffers from source collection to target collection, without
   * validation or side effects. Callers must handle any validation, dirty
   * flag updates, etc.
   *
   * @param {BufferPrimitiveCollection<T>} src
   * @param {BufferPrimitiveCollection<T>} dst
   * @template T extends BufferPrimitive
   * @protected
   * @ignore
   */
  static _replaceBuffers(src, dst) {
    dst._primitiveView = src._primitiveView;
    dst._positionView = src._positionView;
    dst._materialView = src._materialView;
  }

  /**
   * Rebuilds collection bounding volume.
   * @protected
   * @ignore
   */
  _updateBoundingVolume() {
    // Exclude unused space in the position buffer.
    let vertices = this._positionView.subarray(0, this._positionCount * 3);

    if (this._positionNormalized) {
      vertices = AttributeCompression.dequantize(
        /** @type {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array} */ (
          vertices
        ),
        this._positionDatatype,
        AttributeType.VEC3,
        this._positionCount,
      );
    }

    BoundingSphere.fromVertices(
      vertices,
      Cartesian3.ZERO,
      3,
      this._boundingVolume,
    );
    BoundingSphere.transform(
      this._boundingVolume,
      this._modelMatrix,
      this._boundingVolume,
    );

    this._dirtyBoundingVolume = false;
  }

  /**
   * Updates PickIds for the given context.
   * @param {Context} context
   * @protected
   * @ignore
   */
  _updatePickIds(context) {
    let pickIds = this._pickIds.get(context);
    if (pickIds && pickIds.length === this._primitiveCount) {
      return;
    }

    if (!pickIds) {
      pickIds = [];
      this._pickIds.set(context, pickIds);
    }

    const collection = this;
    const PrimitiveClass = this._getPrimitiveClass();
    const primitive = new PrimitiveClass();

    // Fill in missing PickIDs for recently-added primitives.
    for (let i = pickIds.length, il = this._primitiveCount; i < il; i++) {
      this.get(i, primitive);

      const pickObject = this._pickObjects[i] || {
        collection: this,
        index: i,
        get primitive() {
          // Cannot reuse primitives; scene.drillPick() appends to a list.
          return collection.get(i, new PrimitiveClass());
        },
      };

      const pickId = context.createPickId(pickObject);
      primitive._pickId = pickId.key;
      pickIds.push(pickId);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // PRIMITIVE LIFECYCLE

  /**
   * 将给定的 {@link BufferPrimitive} 作为此集合中指定索引处图元的视图,
   * 用于读/写图元属性。当遍历大型集合时,建议在循环中重用
   * 同一个 BufferPrimitive 实例 — 将现有实例重新绑定到不同的图元很廉价,
   * 并且避免了为每个对象分配内存中的对象。
   *
   * @example
   * const primitive = new BufferPrimitive();
   * for (let i = 0; i < collection.primitiveCount; i++) {
   *   collection.get(i, primitive);
   *   primitive.setColor(Color.RED);
   * }
   *
   * @param {number} index
   * @param {BufferPrimitive} result
   * @returns {BufferPrimitive} 作为 'result' 参数传递的 BufferPrimitive 实例,
   * 现在已绑定到指定的图元索引。
   */
  get(index, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.greaterThanOrEquals("index", index, 0);
    Check.typeOf.number.lessThan("index", index, this._primitiveCount);
    //>>includeEnd('debug');

    result._collection = this;
    result._index = index;
    result._byteOffset = index * this._getPrimitiveClass().Layout.__BYTE_LENGTH;
    return result;
  }

  /**
   * 向集合添加新图元,并指定选项。
   * {@link BufferPrimitive} 实例链接到新图元,使用 'result' 参数(如果提供),
   * 否则使用新实例。对于重复调用,建议重用单个 BufferPrimitive 实例,
   * 而不是在每次调用时分配新实例。
   *
   * @param {BufferPrimitiveOptions} options
   * @param {BufferPrimitive} result
   * @returns {BufferPrimitive}
   */
  add(options = Frozen.EMPTY_OBJECT, result) {
    //>>includeStart('debug', pragmas.debug);
    const { ERR_CAPACITY } = BufferPrimitiveCollection.Error;
    assert(this.primitiveCount < this.primitiveCountMax, ERR_CAPACITY);
    //>>includeEnd('debug');

    const MaterialClass = this._getMaterialClass();
    const index = this._primitiveCount++;

    result = this.get(index, result);
    result.featureId = options.featureId ?? index;
    result.show = options.show ?? true;
    result.setMaterial(options.material ?? MaterialClass.DEFAULT_MATERIAL);
    result._pickId = 0; // unset
    result._dirty = true;

    if (defined(options.pickObject)) {
      this._pickObjects[index] = options.pickObject;
    }

    return result;
  }

  /**
   * Marks primitive at given index as 'dirty', to be updated on next render.
   * @param {number} index
   * @ignore
   */
  _makeDirty(index) {
    if (this._dirtyCount === 0) {
      this._dirtyCount = 1;
      this._dirtyOffset = index;
    } else if (index < this._dirtyOffset) {
      this._dirtyCount += this._dirtyOffset - index;
      this._dirtyOffset = index;
    } else if (index + 1 > this._dirtyOffset + this._dirtyCount) {
      this._dirtyCount = index + 1 - this._dirtyOffset;
    }
  }

  /**
   * Marks all primitives 'clean', and updates version counter.
   * @ignore
   */
  _makeClean() {
    if (this._dirtyCount > 0) {
      this._dirtyCount = 0;
      this._dirtyOffset = 0;
      this._version++;
    }
  }

  /**
   * Marks collection bounding volume as 'dirty', to be updated on next render,
   * if automatic bounding volume updates are enabled.
   * @ignore
   */
  _makeDirtyBoundingVolume() {
    if (this._boundingVolumeAutoUpdate) {
      this._dirtyBoundingVolume = true;
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // RENDER

  /** @param {object} frameState */
  update(frameState) {
    if (/** @type {FrameState} */ (frameState).mode !== SceneMode.SCENE3D) {
      oneTimeWarning(
        "bufferprim-scenemode",
        "BufferPrimitiveCollection requires SceneMode.SCENE3D.",
      );
    }

    if (this._dirtyBoundingVolume) {
      this._updateBoundingVolume();
    }
    if (this._allowPicking && this._dirtyCount > 0) {
      this._updatePickIds(/** @type {FrameState} */ (frameState).context);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // ACCESSORS

  /**
   * 集合中的图元数。必须 <= {@link primitiveCountMax}。
   *
   * @type {number}
   * @readonly
   */
  get primitiveCount() {
    return this._primitiveCount;
  }

  /**
   * 此集合可包含的最大图元数。必须 >=
   * {@link primitiveCount}。
   *
   * @type {number}
   * @readonly
   * @default {@link BufferPrimitiveCollection.DEFAULT_CAPACITY}
   */
  get primitiveCountMax() {
    return this._primitiveCountMax;
  }

  /**
   * 此集合拥有的缓冲区的总字节长度。包括由
   * {@link primitiveCountMax} 分配的任何未使用空间,即使尚未在该空间中添加图元。
   *
   * @type {number}
   * @readonly
   */
  get byteLength() {
    return (
      this._primitiveView.byteLength +
      this._positionView.byteLength +
      this._materialView.byteLength
    );
  }

  /**
   * 集合中的顶点数。必须 <= {@link vertexCountMax}。
   *
   * @type {number}
   * @readonly
   */
  get vertexCount() {
    return this._positionCount;
  }

  /**
   * 此集合可包含的最大顶点数。必须 >=
   * {@link vertexCount}。
   *
   * @type {number}
   * @readonly
   * @default {@link BufferPrimitiveCollection.DEFAULT_CAPACITY}
   */
  get vertexCountMax() {
    return this._positionCountMax;
  }

  /**
   * 将几何体从模型坐标变换到世界坐标。
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   * @readonly
   */
  get modelMatrix() {
    return this._modelMatrix;
  }

  /**
   * 集合中所有原语的世界空间边界体积，包括
   * 显示和隐藏的原语。
   * @type {BoundingSphere}
   * @readonly
   */
  get boundingVolume() {
    if (this._dirtyBoundingVolume) {
      this._updateBoundingVolume();
    }
    return this._boundingVolume;
  }

  /**
   * 用于存储位置值的组件数据类型。
   * @type {ComponentDatatype}
   * @readonly
   */
  get positionDatatype() {
    return this._positionDatatype;
  }

  /**
   * 当 <code>true</code> 时，整数位置值被视为归一化值，其中整个整数范围映射到 [-1, 1]（有符号）或 [0, 1]
   * (无符号).
   * @type {boolean}
   * @readonly
   */
  get positionNormalized() {
    return this._positionNormalized;
  }

  /////////////////////////////////////////////////////////////////////////////
  // UTILS

  /**
   * @param {TypedArray} src
   * @param {TypedArray} dst
   * @param {number} count
   * @protected
   * @ignore
   */
  static _copySubArray(src, dst, count) {
    for (let i = 0; i < count; i++) {
      dst[i] = src[i];
    }
  }

  /**
   * @param {DataView} src
   * @param {DataView} dst
   * @param {number} byteLength
   * @protected
   * @ignore
   */
  static _copySubDataView(src, dst, byteLength) {
    // No need to match the original array type, just copy in 4-byte chunks.
    this._copySubArray(
      new Uint32Array(src.buffer, src.byteOffset, src.byteLength / 4),
      new Uint32Array(dst.buffer, dst.byteOffset, dst.byteLength / 4),
      byteLength / 4,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // DEBUG

  /**
   * 返回表示该集合的可 JSON 序列化的数组。此编码
   * 不具有内存效率,通常应用于调试和测试。
   *
   * @example
   * console.table(collection.toJSON());
   *
   * @returns {Array<Object>} 可 JSON 序列化的对象列表,集合中每个图元一个。
   */
  toJSON() {
    const PrimitiveClass = this._getPrimitiveClass();
    const primitive = new PrimitiveClass();

    const results = [];
    for (let i = 0, il = this.primitiveCount; i < il; i++) {
      results.push(this.get(i, primitive).toJSON());
    }

    return results;
  }
}

/**
 * 新集合上缓冲区的默认容量。元素数量:
 * 顶点缓冲区中的顶点数,图元缓冲区中的图元数等。
 * 此值是任意的,且集合无法调整大小,
 * 因此在可用时应在集合构造函数中提供特定的每缓冲容量。
 *
 * @type {number}
 * @static
 * @constant
 */
BufferPrimitiveCollection.DEFAULT_CAPACITY = 1024;

export default BufferPrimitiveCollection;
