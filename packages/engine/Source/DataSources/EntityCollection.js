import AssociativeArray from "../Core/AssociativeArray.js";
import createGuid from "../Core/createGuid.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Iso8601 from "../Core/Iso8601.js";
import JulianDate from "../Core/JulianDate.js";
import TimeInterval from "../Core/TimeInterval.js";
import Entity from "./Entity.js";

const entityOptionsScratch = {
  id: undefined,
};

function fireChangedEvent(collection) {
  if (collection._firing) {
    collection._refire = true;
    return;
  }

  if (collection._suspendCount === 0) {
    const added = collection._addedEntities;
    const removed = collection._removedEntities;
    const changed = collection._changedEntities;
    if (changed.length !== 0 || added.length !== 0 || removed.length !== 0) {
      collection._firing = true;
      do {
        collection._refire = false;
        const addedArray = added.values.slice(0);
        const removedArray = removed.values.slice(0);
        const changedArray = changed.values.slice(0);

        added.removeAll();
        removed.removeAll();
        changed.removeAll();
        collection._collectionChanged.raiseEvent(
          collection,
          addedArray,
          removedArray,
          changedArray,
        );
      } while (collection._refire);
      collection._firing = false;
    }
  }
}

/**
 * 一个可观察的 {@link Entity} 实例集合，其中每个实体都有唯一的 id。
 * @alias EntityCollection
 * @constructor
 *
 * @param {DataSource|CompositeEntityCollection} [owner] 创建此集合的数据源（或复合实体集合）。
 */
function EntityCollection(owner) {
  this._owner = owner;
  this._entities = new AssociativeArray();
  this._addedEntities = new AssociativeArray();
  this._removedEntities = new AssociativeArray();
  this._changedEntities = new AssociativeArray();
  this._suspendCount = 0;
  this._collectionChanged = new Event();
  this._id = createGuid();
  this._show = true;
  this._firing = false;
  this._refire = false;
}

/**
 * 阻止引发 {@link EntityCollection#collectionChanged} 事件，
 * 直到对 {@link EntityCollection#resumeEvents} 进行相应调用为止，此时
 * 将引发一个涵盖所有挂起操作的事件。
 * 这允许高效地添加和移除许多项目。
 * 只要存在对 {@link EntityCollection#resumeEvents} 的相应调用，
 * 就可以安全地多次调用此函数。
 */
EntityCollection.prototype.suspendEvents = function () {
  this._suspendCount++;
};

/**
 * 当添加或移除项目时，立即恢复引发 {@link EntityCollection#collectionChanged} 事件。
 * 在事件挂起期间所做的任何修改将在调用此函数时作为单个事件触发。
 * 此函数是引用计数的，只要存在对 {@link EntityCollection#resumeEvents} 的相应调用，
 * 就可以安全地多次调用。
 *
 * @exception {DeveloperError} 不能在 suspendEvents 之前调用 resumeEvents。
 */
EntityCollection.prototype.resumeEvents = function () {
  //>>includeStart('debug', pragmas.debug);
  if (this._suspendCount === 0) {
    throw new DeveloperError(
      "resumeEvents can not be called before suspendEvents.",
    );
  }
  //>>includeEnd('debug');

  this._suspendCount--;
  fireChangedEvent(this);
};

/**
 * {@link EntityCollection#collectionChanged} 生成的事件的签名。
 * @callback EntityCollection.CollectionChangedEventCallback
 *
 * @param {EntityCollection} collection 触发事件的对象集合。
 * @param {Entity[]} added 已添加到集合中的 {@link Entity} 实例数组。
 * @param {Entity[]} removed 已从集合中移除的 {@link Entity} 实例数组。
 * @param {Entity[]} changed 已修改的 {@link Entity} 实例数组。
 */

Object.defineProperties(EntityCollection.prototype, {
  /**
   * 获取当实体从集合中添加或移除时触发的事件。
   * 生成的事件是 {@link EntityCollection.CollectionChangedEventCallback}。
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {Event<EntityCollection.CollectionChangedEventCallback>}
   */
  collectionChanged: {
    get: function () {
      return this._collectionChanged;
    },
  },
  /**
   * 获取此集合的全局唯一标识符。
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {string}
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * 获取集合中的 Entity 实例数组。
   * 不应直接修改此数组。
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {Entity[]}
   */
  values: {
    get: function () {
      return this._entities.values;
    },
  },
  /**
   * 获取此实体集合是否应被显示。
   * 当为 true 时，每个实体仅在自身的 show 属性也为 true 时才显示。
   * @memberof EntityCollection.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (value === this._show) {
        return;
      }

      //Since entity.isShowing includes the EntityCollection.show state
      //in its calculation, we need to loop over the entities array
      //twice, once to get the old showing value and a second time
      //to raise the changed event.
      this.suspendEvents();

      let i;
      const oldShows = [];
      const entities = this._entities.values;
      const entitiesLength = entities.length;

      for (i = 0; i < entitiesLength; i++) {
        oldShows.push(entities[i].isShowing);
      }

      this._show = value;

      for (i = 0; i < entitiesLength; i++) {
        const oldShow = oldShows[i];
        const entity = entities[i];
        if (oldShow !== entity.isShowing) {
          entity.definitionChanged.raiseEvent(
            entity,
            "isShowing",
            entity.isShowing,
            oldShow,
          );
        }
      }

      this.resumeEvents();
    },
  },
  /**
   * 获取此实体集合的所有者，即创建它的数据源或复合实体集合。
   * @memberof EntityCollection.prototype
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
 * 计算集合中实体的最大可用性。
 * 如果集合包含无限可用数据和非无限数据的混合，
 * 它将仅返回与非无限数据相关的间隔。如果所有
 * 数据都是无限的，则将返回无限间隔。
 *
 * @returns {TimeInterval} 集合中实体的可用性。
 */
EntityCollection.prototype.computeAvailability = function () {
  let startTime = Iso8601.MAXIMUM_VALUE;
  let stopTime = Iso8601.MINIMUM_VALUE;
  const entities = this._entities.values;
  for (let i = 0, len = entities.length; i < len; i++) {
    const entity = entities[i];
    const availability = entity.availability;
    if (defined(availability)) {
      const start = availability.start;
      const stop = availability.stop;
      if (
        JulianDate.lessThan(start, startTime) &&
        !start.equals(Iso8601.MINIMUM_VALUE)
      ) {
        startTime = start;
      }
      if (
        JulianDate.greaterThan(stop, stopTime) &&
        !stop.equals(Iso8601.MAXIMUM_VALUE)
      ) {
        stopTime = stop;
      }
    }
  }

  if (Iso8601.MAXIMUM_VALUE.equals(startTime)) {
    startTime = Iso8601.MINIMUM_VALUE;
  }
  if (Iso8601.MINIMUM_VALUE.equals(stopTime)) {
    stopTime = Iso8601.MAXIMUM_VALUE;
  }
  return new TimeInterval({
    start: startTime,
    stop: stopTime,
  });
};

/**
 * 向集合中添加实体。
 *
 * @param {Entity | Entity.ConstructorOptions} entity 要添加的实体。
 * @returns {Entity} 被添加的实体。
 * @exception {DeveloperError} 具有 <entity.id> 的实体已存在于此集合中。
 */
EntityCollection.prototype.add = function (entity) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required.");
  }
  //>>includeEnd('debug');

  if (!(entity instanceof Entity)) {
    entity = new Entity(entity);
  }

  const id = entity.id;
  const entities = this._entities;
  if (entities.contains(id)) {
    throw new DeveloperError(
      `An entity with id ${id} already exists in this collection.`,
    );
  }

  entity.entityCollection = this;
  entities.set(id, entity);

  if (!this._removedEntities.remove(id)) {
    this._addedEntities.set(id, entity);
  }
  entity.definitionChanged.addEventListener(
    EntityCollection.prototype._onEntityDefinitionChanged,
    this,
  );

  fireChangedEvent(this);
  return entity;
};

/**
 * 从集合中移除实体。
 *
 * @param {Entity} entity 要移除的实体。
 * @returns {boolean} 如果项目被移除则返回 true，如果不存在于集合中则返回 false。
 */
EntityCollection.prototype.remove = function (entity) {
  if (!defined(entity)) {
    return false;
  }
  return this.removeById(entity.id);
};

/**
 * 如果提供的实体存在于此集合中则返回 true，否则返回 false。
 *
 * @param {Entity} entity 实体。
 * @returns {boolean} 如果提供的实体存在于此集合中则返回 true，否则返回 false。
 */
EntityCollection.prototype.contains = function (entity) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required");
  }
  //>>includeEnd('debug');
  return this._entities.get(entity.id) === entity;
};

/**
 * 从集合中移除具有提供的 id 的实体。
 *
 * @param {string} id 要移除的实体的 id。
 * @returns {boolean} 如果项目被移除则返回 true，如果集合中不存在具有提供的 id 的项目则返回 false。
 */
EntityCollection.prototype.removeById = function (id) {
  if (!defined(id)) {
    return false;
  }

  const entities = this._entities;
  const entity = entities.get(id);
  if (!this._entities.remove(id)) {
    return false;
  }

  if (!this._addedEntities.remove(id)) {
    this._removedEntities.set(id, entity);
    this._changedEntities.remove(id);
  }
  this._entities.remove(id);
  entity.definitionChanged.removeEventListener(
    EntityCollection.prototype._onEntityDefinitionChanged,
    this,
  );
  fireChangedEvent(this);

  return true;
};

/**
 * 从集合中移除所有实体。
 */
EntityCollection.prototype.removeAll = function () {
  //The event should only contain items added before events were suspended
  //and the contents of the collection.
  const entities = this._entities;
  const entitiesLength = entities.length;
  const array = entities.values;

  const addedEntities = this._addedEntities;
  const removed = this._removedEntities;

  for (let i = 0; i < entitiesLength; i++) {
    const existingItem = array[i];
    const existingItemId = existingItem.id;
    const addedItem = addedEntities.get(existingItemId);
    if (!defined(addedItem)) {
      existingItem.definitionChanged.removeEventListener(
        EntityCollection.prototype._onEntityDefinitionChanged,
        this,
      );
      removed.set(existingItemId, existingItem);
    }
  }

  entities.removeAll();
  addedEntities.removeAll();
  this._changedEntities.removeAll();
  fireChangedEvent(this);
};

/**
 * Gets an entity with the specified id.
 *
 * @param {string} id The id of the entity to retrieve.
 * @returns {Entity|undefined} The entity with the provided id or undefined if the id did not exist in the collection.
 */
EntityCollection.prototype.getById = function (id) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  //>>includeEnd('debug');

  return this._entities.get(id);
};

/**
 * Gets an entity with the specified id or creates it and adds it to the collection if it does not exist.
 *
 * @param {string} id The id of the entity to retrieve or create.
 * @returns {Entity} The new or existing object.
 */
EntityCollection.prototype.getOrCreateEntity = function (id) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  //>>includeEnd('debug');

  let entity = this._entities.get(id);
  if (!defined(entity)) {
    entityOptionsScratch.id = id;
    entity = new Entity(entityOptionsScratch);
    this.add(entity);
  }
  return entity;
};

EntityCollection.prototype._onEntityDefinitionChanged = function (entity) {
  const id = entity.id;
  if (!this._addedEntities.contains(id)) {
    this._changedEntities.set(id, entity);
  }
  fireChangedEvent(this);
};
export default EntityCollection;
