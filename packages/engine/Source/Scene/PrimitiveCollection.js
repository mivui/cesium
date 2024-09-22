import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";

/**
 * 基元的集合。 这最常与 {@link Scene#primitives} 一起使用。
 * 但 <code>PrimitiveCollection</code> 本身也是一个基元，因此集合可以
 * 添加到形成层次结构的集合中。
 *
 * @alias PrimitiveCollection
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.show=true] 确定是否显示集合中的基元。
 * @param {boolean} [options.destroyPrimitives=true] 确定集合中的基元在被删除时是否被销毁。
 *
 * @example
 * const billboards = new Cesium.BillboardCollection();
 * const labels = new Cesium.LabelCollection();
 *
 * const collection = new Cesium.PrimitiveCollection();
 * collection.add(billboards);
 *
 * scene.primitives.add(collection);  // Add collection
 * scene.primitives.add(labels);      // Add regular primitive
 */
function PrimitiveCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._primitives = [];
  this._guid = createGuid();
  this._primitiveAdded = new Event();
  this._primitiveRemoved = new Event();

  // Used by the OrderedGroundPrimitiveCollection
  this._zIndex = undefined;

  /**
   * 确定是否显示此集合中的基元。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 确定集合中的基元在被
   * {@link PrimitiveCollection#destroy} 或 {@link PrimitiveCollection#remove} 或隐式
   * 由 {@link PrimitiveCollection#removeAll} 提供。
   *
   * @type {boolean}
   * @default true
   *
   * @example
   * // Example 1. Primitives are destroyed by default.
   * const primitives = new Cesium.PrimitiveCollection();
   * const labels = primitives.add(new Cesium.LabelCollection());
   * primitives = primitives.destroy();
   * const b = labels.isDestroyed(); // true
   *
   * @example
   * // Example 2. Do not destroy primitives in a collection.
   * const primitives = new Cesium.PrimitiveCollection();
   * primitives.destroyPrimitives = false;
   * const labels = primitives.add(new Cesium.LabelCollection());
   * primitives = primitives.destroy();
   * const b = labels.isDestroyed(); // false
   * labels = labels.destroy();    // explicitly destroy
   */
  this.destroyPrimitives = defaultValue(options.destroyPrimitives, true);
}

Object.defineProperties(PrimitiveCollection.prototype, {
  /**
   * 获取集合中的基元数。
   *
   * @memberof PrimitiveCollection.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._primitives.length;
    },
  },

  /**
   * 将基元添加到集合时引发的事件。
   * 事件处理程序将传递已添加的原语。
   * @memberof PrimitiveCollection.prototype
   * @type {Event}
   * @readonly
   */
  primitiveAdded: {
    get: function () {
      return this._primitiveAdded;
    },
  },

  /**
   * 从集合中删除原语时引发的事件。
   * 事件处理程序将传递已删除的原语。
   * <p>
   * 注意：根据 destroyPrimitives 构造函数选项，基元可能已经被销毁。
   * </p>
   * @memberof PrimitiveCollection.prototype
   * @type {Event}
   * @readonly
   */
  primitiveRemoved: {
    get: function () {
      return this._primitiveRemoved;
    },
  },
});

/**
 * 向集合中添加基元。
 *
 * @param {object} primitive 要添加的基元。
 * @param {number} [index] 要添加层的索引。 如果省略，则基元将添加到所有现有基元的底部。
 * @returns {object} 添加到集合中的基元。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 */
PrimitiveCollection.prototype.add = function (primitive, index) {
  const hasIndex = defined(index);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(primitive)) {
    throw new DeveloperError("primitive is required.");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index must be greater than or equal to zero.");
    } else if (index > this._primitives.length) {
      throw new DeveloperError(
        "index must be less than or equal to the number of primitives."
      );
    }
  }
  //>>includeEnd('debug');

  const external = (primitive._external = primitive._external || {});
  const composites = (external._composites = external._composites || {});
  composites[this._guid] = {
    collection: this,
  };

  if (!hasIndex) {
    this._primitives.push(primitive);
  } else {
    this._primitives.splice(index, 0, primitive);
  }

  this._primitiveAdded.raiseEvent(primitive);

  return primitive;
};

/**
 * 从集合中删除基元。
 *
 * @param {object} [primitive] 要删除的基元。
 * @returns {boolean} <code>true</code>（如果基元已被删除）;<code>如果</code>基元<code>未定义</code>或在集合中找不到，则为 false。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 * scene.primitives.remove(billboards);  // Returns true
 *
 * @see PrimitiveCollection#destroyPrimitives
 */
PrimitiveCollection.prototype.remove = function (primitive) {
  // PERFORMANCE_IDEA:  We can obviously make this a lot faster.
  if (this.contains(primitive)) {
    const index = this._primitives.indexOf(primitive);
    if (index !== -1) {
      this._primitives.splice(index, 1);

      delete primitive._external._composites[this._guid];

      if (this.destroyPrimitives) {
        primitive.destroy();
      }

      this._primitiveRemoved.raiseEvent(primitive);

      return true;
    }
    // else ... this is not possible, I swear.
  }

  return false;
};

/**
 * 删除并销毁基元，而不管 destroyPrimitives 设置如何。
 * @private
 */
PrimitiveCollection.prototype.removeAndDestroy = function (primitive) {
  const removed = this.remove(primitive);
  if (removed && !this.destroyPrimitives) {
    primitive.destroy();
  }
  return removed;
};

/**
 * 删除集合中的所有基元。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PrimitiveCollection#destroyPrimitives
 */
PrimitiveCollection.prototype.removeAll = function () {
  const primitives = this._primitives;
  const length = primitives.length;
  for (let i = 0; i < length; ++i) {
    delete primitives[i]._external._composites[this._guid];

    if (this.destroyPrimitives) {
      primitives[i].destroy();
    }

    this._primitiveRemoved.raiseEvent(primitives[i]);
  }
  this._primitives = [];
};

/**
 * 确定此集合是否包含基元。
 *
 * @param {object} [primitive] 要检查的原语。
 * @returns {boolean} <code>true</code>，如果原语在集合中;<code>如果</code>基元<code>未定义</code>或在集合中找不到，则为 false。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PrimitiveCollection#get
 */
PrimitiveCollection.prototype.contains = function (primitive) {
  return !!(
    defined(primitive) &&
    primitive._external &&
    primitive._external._composites &&
    primitive._external._composites[this._guid]
  );
};

function getPrimitiveIndex(compositePrimitive, primitive) {
  //>>includeStart('debug', pragmas.debug);
  if (!compositePrimitive.contains(primitive)) {
    throw new DeveloperError("primitive is not in this collection.");
  }
  //>>includeEnd('debug');

  return compositePrimitive._primitives.indexOf(primitive);
}

/**
 * 在集合中提升一个原始变量 “up one”。 如果集合中的所有基元都已绘制
 * 在地球表面上，这会在视觉上将基元向上移动 1。
 *
 * @param {object} [primitive] 要引发的原语。
 *
 * @exception {DeveloperError} 原语不在此集合中。
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PrimitiveCollection#raiseToTop
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#lowerToBottom
 */
PrimitiveCollection.prototype.raise = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== primitives.length - 1) {
      const p = primitives[index];
      primitives[index] = primitives[index + 1];
      primitives[index + 1] = p;
    }
  }
};

/**
 * 将原语提升到集合的 “top” 位置。 如果集合中的所有基元都已绘制
 * 在地球曲面上，这会在视觉上将基元移动到顶部。
 *
 * @param {object} [primitive] 用于抬高顶部的基元。
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#lowerToBottom
 */
PrimitiveCollection.prototype.raiseToTop = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== primitives.length - 1) {
      // PERFORMANCE_IDEA:  Could be faster
      primitives.splice(index, 1);
      primitives.push(primitive);
    }
  }
};

/**
 * 降低集合中的基元 “down one”。 如果集合中的所有基元都已绘制
 * 在地球表面上，这会在视觉上将基元向下移动 1。
 *
 * @param {object} [primitive] 要降低的原语。
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PrimitiveCollection#lowerToBottom
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#raiseToTop
 */
PrimitiveCollection.prototype.lower = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== 0) {
      const p = primitives[index];
      primitives[index] = primitives[index - 1];
      primitives[index - 1] = p;
    }
  }
};

/**
 * 将基元降低到集合的 “bottom”。 如果集合中的所有基元都已绘制
 * 在地球表面上，这会在视觉上将基元移动到底部。
 *
 * @param {object} [primitive] 要降低到底部的基元。
 *
 * @exception {DeveloperError} primitive is not in this collection.
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#raiseToTop
 */
PrimitiveCollection.prototype.lowerToBottom = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== 0) {
      // PERFORMANCE_IDEA:  Could be faster
      primitives.splice(index, 1);
      primitives.unshift(primitive);
    }
  }
};

/**
 * 返回集合中指定索引处的基元。
 *
 * @param {number} index 要返回的基元的从零开始的索引。
 * @returns {object} <code>索引</code>处的原语。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * // Toggle the show property of every primitive in the collection.
 * const primitives = scene.primitives;
 * const length = primitives.length;
 * for (let i = 0; i < length; ++i) {
 *   const p = primitives.get(i);
 *   p.show = !p.show;
 * }
 *
 * @see PrimitiveCollection#length
 */
PrimitiveCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._primitives[index];
};

/**
 * @private
 */
PrimitiveCollection.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    primitives[i].update(frameState);
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.prePassesUpdate = function (frameState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.prePassesUpdate)) {
      primitive.prePassesUpdate(frameState);
    }
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.updateForPass = function (frameState, passState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.updateForPass)) {
      primitive.updateForPass(frameState, passState);
    }
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.postPassesUpdate = function (frameState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.postPassesUpdate)) {
      primitive.postPassesUpdate(frameState);
    }
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see PrimitiveCollection#destroy
 */
PrimitiveCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中每个基元所持有的 WebGL 资源。 显式销毁此
 * collection 允许确定性地释放 WebGL 资源，而不是依赖垃圾
 * collector 销毁此集合。
 * <br /><br />
 * 由于销毁集合会销毁所有包含的原语，因此只销毁集合
 * 当您确定没有其他代码仍在使用任何包含的基元时。
 * <br /><br />
 * 此集合一旦销毁，就不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * primitives = primitives && primitives.destroy();
 *
 * @see PrimitiveCollection#isDestroyed
 */
PrimitiveCollection.prototype.destroy = function () {
  this.removeAll();
  return destroyObject(this);
};
export default PrimitiveCollection;
