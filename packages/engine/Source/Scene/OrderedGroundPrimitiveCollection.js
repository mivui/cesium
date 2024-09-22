import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import PrimitiveCollection from "./PrimitiveCollection.js";

/**
 * 一个基元集合，用于帮助维护基于 z 索引的 order 或 ground 基元
 *
 * @private
 */
function OrderedGroundPrimitiveCollection() {
  this._length = 0;
  this._collections = {};
  this._collectionsArray = [];

  this.show = true;
}

Object.defineProperties(OrderedGroundPrimitiveCollection.prototype, {
  /**
   * 获取集合中的基元数。
   *
   * @memberof OrderedGroundPrimitiveCollection.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._length;
    },
  },
});

/**
 * 向集合中添加基元。
 *
 * @param {GroundPrimitive} primitive 要添加的基元。
 * @param {number} [zIndex = 0] 原语的索引
 * @returns {GroundPrimitive} 添加到集合中的基元。
 */
OrderedGroundPrimitiveCollection.prototype.add = function (primitive, zIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("primitive", primitive);
  if (defined(zIndex)) {
    Check.typeOf.number("zIndex", zIndex);
  }
  //>>includeEnd('debug');

  zIndex = defaultValue(zIndex, 0);
  let collection = this._collections[zIndex];
  if (!defined(collection)) {
    collection = new PrimitiveCollection({ destroyPrimitives: false });
    collection._zIndex = zIndex;
    this._collections[zIndex] = collection;
    const array = this._collectionsArray;
    let i = 0;
    while (i < array.length && array[i]._zIndex < zIndex) {
      i++;
    }
    array.splice(i, 0, collection);
  }

  collection.add(primitive);
  this._length++;
  primitive._zIndex = zIndex;

  return primitive;
};

/**
 * 调整 z 索引
 * @param {GroundPrimitive} primitive
 * @param {number} zIndex
 */
OrderedGroundPrimitiveCollection.prototype.set = function (primitive, zIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("primitive", primitive);
  Check.typeOf.number("zIndex", zIndex);
  //>>includeEnd('debug');

  if (zIndex === primitive._zIndex) {
    return primitive;
  }

  this.remove(primitive, true);
  this.add(primitive, zIndex);

  return primitive;
};

/**
 * 从集合中删除基元。
 *
 * @param {object} primitive 要删除的基元。
 * @param {boolean} [doNotDestroy = false]
 * @returns {boolean} <code>true</code>（如果基元已被删除）;<code>如果</code>基元<code>未定义</code>或在集合中找不到，则为 false。
 */
OrderedGroundPrimitiveCollection.prototype.remove = function (
  primitive,
  doNotDestroy
) {
  if (this.contains(primitive)) {
    const index = primitive._zIndex;
    const collection = this._collections[index];
    let result;
    if (doNotDestroy) {
      result = collection.remove(primitive);
    } else {
      result = collection.removeAndDestroy(primitive);
    }

    if (result) {
      this._length--;
    }

    if (collection.length === 0) {
      this._collectionsArray.splice(
        this._collectionsArray.indexOf(collection),
        1
      );
      this._collections[index] = undefined;
      collection.destroy();
    }

    return result;
  }

  return false;
};

/**
 * 删除集合中的所有基元。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see OrderedGroundPrimitiveCollection#destroyPrimitives
 */
OrderedGroundPrimitiveCollection.prototype.removeAll = function () {
  const collections = this._collectionsArray;
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    collection.destroyPrimitives = true;
    collection.destroy();
  }

  this._collections = {};
  this._collectionsArray = [];
  this._length = 0;
};

/**
 * 确定此集合是否包含基元。
 *
 * @param {object} primitive 要检查的基元。
 * @returns {boolean} <code>true</code>，如果原语在集合中;<code>如果</code>基元<code>未定义</code>或在集合中找不到，则为 false。
 */
OrderedGroundPrimitiveCollection.prototype.contains = function (primitive) {
  if (!defined(primitive)) {
    return false;
  }
  const collection = this._collections[primitive._zIndex];
  return defined(collection) && collection.contains(primitive);
};

/**
 * @private
 */
OrderedGroundPrimitiveCollection.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const collections = this._collectionsArray;
  for (let i = 0; i < collections.length; i++) {
    collections[i].update(frameState);
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see OrderedGroundPrimitiveCollection#destroy
 */
OrderedGroundPrimitiveCollection.prototype.isDestroyed = function () {
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
 * @see OrderedGroundPrimitiveCollection#isDestroyed
 */
OrderedGroundPrimitiveCollection.prototype.destroy = function () {
  this.removeAll();
  return destroyObject(this);
};
export default OrderedGroundPrimitiveCollection;
