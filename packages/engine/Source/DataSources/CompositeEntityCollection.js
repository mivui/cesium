import createGuid from "../Core/createGuid.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import CesiumMath from "../Core/Math.js";
import Entity from "./Entity.js";
import EntityCollection from "./EntityCollection.js";

const entityOptionsScratch = {
  id: undefined,
};
const entityIdScratch = new Array(2);

function clean(entity) {
  const propertyNames = entity.propertyNames;
  const propertyNamesLength = propertyNames.length;
  for (let i = 0; i < propertyNamesLength; i++) {
    entity[propertyNames[i]] = undefined;
  }
  entity._name = undefined;
  entity._availability = undefined;
}

function subscribeToEntity(that, eventHash, collectionId, entity) {
  entityIdScratch[0] = collectionId;
  entityIdScratch[1] = entity.id;
  eventHash[
    JSON.stringify(entityIdScratch)
  ] = entity.definitionChanged.addEventListener(
    CompositeEntityCollection.prototype._onDefinitionChanged,
    that
  );
}

function unsubscribeFromEntity(that, eventHash, collectionId, entity) {
  entityIdScratch[0] = collectionId;
  entityIdScratch[1] = entity.id;
  const id = JSON.stringify(entityIdScratch);
  eventHash[id]();
  eventHash[id] = undefined;
}

function recomposite(that) {
  that._shouldRecomposite = true;
  if (that._suspendCount !== 0) {
    return;
  }

  const collections = that._collections;
  const collectionsLength = collections.length;

  const collectionsCopy = that._collectionsCopy;
  const collectionsCopyLength = collectionsCopy.length;

  let i;
  let entity;
  let entities;
  let iEntities;
  let collection;
  const composite = that._composite;
  const newEntities = new EntityCollection(that);
  const eventHash = that._eventHash;
  let collectionId;

  for (i = 0; i < collectionsCopyLength; i++) {
    collection = collectionsCopy[i];
    collection.collectionChanged.removeEventListener(
      CompositeEntityCollection.prototype._onCollectionChanged,
      that
    );
    entities = collection.values;
    collectionId = collection.id;
    for (iEntities = entities.length - 1; iEntities > -1; iEntities--) {
      entity = entities[iEntities];
      unsubscribeFromEntity(that, eventHash, collectionId, entity);
    }
  }

  for (i = collectionsLength - 1; i >= 0; i--) {
    collection = collections[i];
    collection.collectionChanged.addEventListener(
      CompositeEntityCollection.prototype._onCollectionChanged,
      that
    );

    //Merge all of the existing entities.
    entities = collection.values;
    collectionId = collection.id;
    for (iEntities = entities.length - 1; iEntities > -1; iEntities--) {
      entity = entities[iEntities];
      subscribeToEntity(that, eventHash, collectionId, entity);

      let compositeEntity = newEntities.getById(entity.id);
      if (!defined(compositeEntity)) {
        compositeEntity = composite.getById(entity.id);
        if (!defined(compositeEntity)) {
          entityOptionsScratch.id = entity.id;
          compositeEntity = new Entity(entityOptionsScratch);
        } else {
          clean(compositeEntity);
        }
        newEntities.add(compositeEntity);
      }
      compositeEntity.merge(entity);
    }
  }
  that._collectionsCopy = collections.slice(0);

  composite.suspendEvents();
  composite.removeAll();
  const newEntitiesArray = newEntities.values;
  for (i = 0; i < newEntitiesArray.length; i++) {
    composite.add(newEntitiesArray[i]);
  }
  composite.resumeEvents();
}

/**
 * 以非破坏性方式将多个 {@link EntityCollection} 实例合成为单个集合。
 * 如果具有相同 ID 的实体存在于多个集合中，则它是非破坏性的
 * 合并到单个新实体实例中。 如果实体在多个
 * collections，列表 it 的最后一个集合中 Entity 的属性
 * 属于 被使用。 CompositeEntityCollection 几乎可以在任何
 * 使用 EntityCollection。
 *
 * @alias CompositeEntityCollection
 * @constructor
 *
 * @param {EntityCollection[]} [collections] 要合并的 EntityCollection 实例的初始列表。
 * @param {DataSource|CompositeEntityCollection} [owner] 创建此集合的数据源（或复合实体集合）。
 */
function CompositeEntityCollection(collections, owner) {
  this._owner = owner;
  this._composite = new EntityCollection(this);
  this._suspendCount = 0;
  this._collections = defined(collections) ? collections.slice() : [];
  this._collectionsCopy = [];
  this._id = createGuid();
  this._eventHash = {};
  recomposite(this);
  this._shouldRecomposite = false;
}

Object.defineProperties(CompositeEntityCollection.prototype, {
  /**
   * 获取在集合中添加或删除实体时触发的事件。
   * 生成的事件是 {@link EntityCollection.collectionChangedEventCallback}。
   * @memberof CompositeEntityCollection.prototype
   * @readonly
   * @type {Event}
   */
  collectionChanged: {
    get: function () {
      return this._composite._collectionChanged;
    },
  },
  /**
   * 获取此集合的全局唯一标识符。
   * @memberof CompositeEntityCollection.prototype
   * @readonly
   * @type {string}
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * 获取集合中的 Entity 实例的数组。
   * 此数组不应直接修改。
   * @memberof CompositeEntityCollection.prototype
   * @readonly
   * @type {Entity[]}
   */
  values: {
    get: function () {
      return this._composite.values;
    },
  },
  /**
   * 获取此复合实体集合的所有者，即。创建它的数据源或复合实体集合。
   * @memberof CompositeEntityCollection.prototype
   * @readonly
   * @type {DataSource|CompositeEntityCollection}
   */
  owner: {
    get: function () {
      return this._owner;
    },
  },
});

/**
 * 将集合添加到复合中。
 *
 * @param {EntityCollection} collection 要添加的集合。
 * @param {number} [index] 要添加集合的索引。 如果省略，则集合将
 * 添加到所有现有集合之上。
 *
 * @exception {DeveloperError} index, if supplied, must be greater than or equal to zero and less than or equal to the number of collections.
 */
CompositeEntityCollection.prototype.addCollection = function (
  collection,
  index
) {
  const hasIndex = defined(index);
  //>>includeStart('debug', pragmas.debug);
  if (!defined(collection)) {
    throw new DeveloperError("collection is required.");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index must be greater than or equal to zero.");
    } else if (index > this._collections.length) {
      throw new DeveloperError(
        "index must be less than or equal to the number of collections."
      );
    }
  }
  //>>includeEnd('debug');

  if (!hasIndex) {
    index = this._collections.length;
    this._collections.push(collection);
  } else {
    this._collections.splice(index, 0, collection);
  }

  recomposite(this);
};

/**
 * 从此组合中删除集合（如果存在）。
 *
 * @param {EntityCollection} collection 要删除的集合。
 * @returns {boolean} true，如果集合位于复合集合中并被删除，
 * 如果集合不在复合组中，则为 false。
 */
CompositeEntityCollection.prototype.removeCollection = function (collection) {
  const index = this._collections.indexOf(collection);
  if (index !== -1) {
    this._collections.splice(index, 1);
    recomposite(this);
    return true;
  }
  return false;
};

/**
 * 从此组合中删除所有集合。
 */
CompositeEntityCollection.prototype.removeAllCollections = function () {
  this._collections.length = 0;
  recomposite(this);
};

/**
 * 检查组合是否包含给定的集合。
 *
 * @param {EntityCollection} collection 中要检查的集合。
 * @returns {boolean} true（如果复合包含集合），否则 false。
 */
CompositeEntityCollection.prototype.containsCollection = function (collection) {
  return this._collections.indexOf(collection) !== -1;
};

/**
 * 如果提供的实体在此集合中，则返回 true，否则返回 false。
 *
 * @param {Entity} entity 实体。
 * @returns {boolean} true（如果提供的实体在此集合中）或 false。
 */
CompositeEntityCollection.prototype.contains = function (entity) {
  return this._composite.contains(entity);
};

/**
 * 确定组合中给定集合的索引。
 *
 * @param {EntityCollection} collection 要查找其索引的集合。
 * @returns {number} 组合中集合的索引，如果组合中不存在该集合，则为 -1。
 */
CompositeEntityCollection.prototype.indexOfCollection = function (collection) {
  return this._collections.indexOf(collection);
};

/**
 * 按索引从 composite 中获取集合。
 *
 * @param {number} index 要检索的索引。
 */
CompositeEntityCollection.prototype.getCollection = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.", "index");
  }
  //>>includeEnd('debug');

  return this._collections[index];
};

/**
 * 获取此组合中的集合数。
 */
CompositeEntityCollection.prototype.getCollectionsLength = function () {
  return this._collections.length;
};

function getCollectionIndex(collections, collection) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(collection)) {
    throw new DeveloperError("collection is required.");
  }
  //>>includeEnd('debug');

  const index = collections.indexOf(collection);

  //>>includeStart('debug', pragmas.debug);
  if (index === -1) {
    throw new DeveloperError("collection is not in this composite.");
  }
  //>>includeEnd('debug');

  return index;
}

function swapCollections(composite, i, j) {
  const arr = composite._collections;
  i = CesiumMath.clamp(i, 0, arr.length - 1);
  j = CesiumMath.clamp(j, 0, arr.length - 1);

  if (i === j) {
    return;
  }

  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;

  recomposite(composite);
}

/**
 * 将集合在合成中提升一个位置。
 *
 * @param {EntityCollection} collection 要移动的集合。
 *
 * @exception {DeveloperError} collection is not in this composite.
 */
CompositeEntityCollection.prototype.raiseCollection = function (collection) {
  const index = getCollectionIndex(this._collections, collection);
  swapCollections(this, index, index + 1);
};

/**
 * 将集合在合成中降低一个位置。
 *
 * @param {EntityCollection} collection 要移动的集合。
 *
 * @exception {DeveloperError} collection is not in this composite.
 */
CompositeEntityCollection.prototype.lowerCollection = function (collection) {
  const index = getCollectionIndex(this._collections, collection);
  swapCollections(this, index, index - 1);
};

/**
 * 将集合提升到复合的顶部。
 *
 * @param {EntityCollection} collection 要移动的集合。
 *
 * @exception {DeveloperError} collection is not in this composite.
 */
CompositeEntityCollection.prototype.raiseCollectionToTop = function (
  collection
) {
  const index = getCollectionIndex(this._collections, collection);
  if (index === this._collections.length - 1) {
    return;
  }
  this._collections.splice(index, 1);
  this._collections.push(collection);

  recomposite(this);
};

/**
 * 将集合降低到复合的底部。
 *
 * @param {EntityCollection} collection 要移动的集合。
 *
 * @exception {DeveloperError} collection is not in this composite.
 */
CompositeEntityCollection.prototype.lowerCollectionToBottom = function (
  collection
) {
  const index = getCollectionIndex(this._collections, collection);
  if (index === 0) {
    return;
  }
  this._collections.splice(index, 1);
  this._collections.splice(0, 0, collection);

  recomposite(this);
};

/**
 * 防止引发 {@link EntityCollection#collectionChanged} 事件
 * 直到对 {@link EntityCollection#resumeEvents} 进行相应的调用，此时
 * 点将引发涵盖所有暂停操作的单个事件。
 * 这允许有效地添加和删除许多项目。
 * 当事件暂停时，集合的重新合成将
 * 也被暂停，因为这可能是一个昂贵的操作。
 * 只要有
 * 是对 {@link EntityCollection#resumeEvents} 的相应调用。
 */
CompositeEntityCollection.prototype.suspendEvents = function () {
  this._suspendCount++;
  this._composite.suspendEvents();
};

/**
 * 立即恢复引发 {@link EntityCollection#collectionChanged} 事件
 * 添加或删除项时。 在活动暂停期间所做的任何修改
 * 将作为单个事件触发。 此功能还确保
 * 如果事件也恢复，则集合将重新合成。
 * 此函数是引用计数的，只要存在
 * 是对 {@link EntityCollection#resumeEvents} 的相应调用。
 *
 * @exception {DeveloperError} resumeEvents can not be called before suspendEvents.
 */
CompositeEntityCollection.prototype.resumeEvents = function () {
  //>>includeStart('debug', pragmas.debug);
  if (this._suspendCount === 0) {
    throw new DeveloperError(
      "resumeEvents can not be called before suspendEvents."
    );
  }
  //>>includeEnd('debug');

  this._suspendCount--;
  // recomposite before triggering events (but only if required for performance) that might depend on a composited collection
  if (this._shouldRecomposite && this._suspendCount === 0) {
    recomposite(this);
    this._shouldRecomposite = false;
  }

  this._composite.resumeEvents();
};

/**
 * 计算集合中实体的最大可用性。
 * 如果集合包含无限可用数据和非无限数据的混合，
 * 它将仅返回与非无限数据相关的间隔。 如果所有
 * data 是无限的，则返回无限间隔。
 *
 * @returns {TimeInterval} 集合中实体的可用性。
 */
CompositeEntityCollection.prototype.computeAvailability = function () {
  return this._composite.computeAvailability();
};

/**
 * 获取具有指定 ID 的实体。
 *
 * @param {string} id 要检索的实体的 ID。
 * @returns {Entity|undefined} 具有提供的 id 的实体，如果集合中不存在 id，则为 undefined。
 */
CompositeEntityCollection.prototype.getById = function (id) {
  return this._composite.getById(id);
};

CompositeEntityCollection.prototype._onCollectionChanged = function (
  collection,
  added,
  removed
) {
  const collections = this._collectionsCopy;
  const collectionsLength = collections.length;
  const composite = this._composite;
  composite.suspendEvents();

  let i;
  let q;
  let entity;
  let compositeEntity;
  const removedLength = removed.length;
  const eventHash = this._eventHash;
  const collectionId = collection.id;
  for (i = 0; i < removedLength; i++) {
    const removedEntity = removed[i];
    unsubscribeFromEntity(this, eventHash, collectionId, removedEntity);

    const removedId = removedEntity.id;
    //Check if the removed entity exists in any of the remaining collections
    //If so, we clean and remerge it.
    for (q = collectionsLength - 1; q >= 0; q--) {
      entity = collections[q].getById(removedId);
      if (defined(entity)) {
        if (!defined(compositeEntity)) {
          compositeEntity = composite.getById(removedId);
          clean(compositeEntity);
        }
        compositeEntity.merge(entity);
      }
    }
    //We never retrieved the compositeEntity, which means it no longer
    //exists in any of the collections, remove it from the composite.
    if (!defined(compositeEntity)) {
      composite.removeById(removedId);
    }
    compositeEntity = undefined;
  }

  const addedLength = added.length;
  for (i = 0; i < addedLength; i++) {
    const addedEntity = added[i];
    subscribeToEntity(this, eventHash, collectionId, addedEntity);

    const addedId = addedEntity.id;
    //We know the added entity exists in at least one collection,
    //but we need to check all collections and re-merge in order
    //to maintain the priority of properties.
    for (q = collectionsLength - 1; q >= 0; q--) {
      entity = collections[q].getById(addedId);
      if (defined(entity)) {
        if (!defined(compositeEntity)) {
          compositeEntity = composite.getById(addedId);
          if (!defined(compositeEntity)) {
            entityOptionsScratch.id = addedId;
            compositeEntity = new Entity(entityOptionsScratch);
            composite.add(compositeEntity);
          } else {
            clean(compositeEntity);
          }
        }
        compositeEntity.merge(entity);
      }
    }
    compositeEntity = undefined;
  }

  composite.resumeEvents();
};

CompositeEntityCollection.prototype._onDefinitionChanged = function (
  entity,
  propertyName,
  newValue,
  oldValue
) {
  const collections = this._collections;
  const composite = this._composite;

  const collectionsLength = collections.length;
  const id = entity.id;
  const compositeEntity = composite.getById(id);
  let compositeProperty = compositeEntity[propertyName];
  const newProperty = !defined(compositeProperty);

  let firstTime = true;
  for (let q = collectionsLength - 1; q >= 0; q--) {
    const innerEntity = collections[q].getById(entity.id);
    if (defined(innerEntity)) {
      const property = innerEntity[propertyName];
      if (defined(property)) {
        if (firstTime) {
          firstTime = false;
          //We only want to clone if the property is also mergeable.
          //This ensures that leaf properties are referenced and not copied,
          //which is the entire point of compositing.
          if (defined(property.merge) && defined(property.clone)) {
            compositeProperty = property.clone(compositeProperty);
          } else {
            compositeProperty = property;
            break;
          }
        }
        compositeProperty.merge(property);
      }
    }
  }

  if (
    newProperty &&
    compositeEntity.propertyNames.indexOf(propertyName) === -1
  ) {
    compositeEntity.addProperty(propertyName);
  }

  compositeEntity[propertyName] = compositeProperty;
};
export default CompositeEntityCollection;
