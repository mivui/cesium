import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import getMagic from "../Core/getMagic.js";
import RuntimeError from "../Core/RuntimeError.js";

/**
 * 表示
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/Composite|Composite}
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles} tileset 中 tile 的内容。
 * <p>
 * 实现 {@link Cesium3DTileContent} 接口。
 * </p>
 *
 * @alias Composite3DTileContent
 * @constructor
 *
 * @private
 */
function Composite3DTileContent(tileset, tile, resource, contents) {
  this._tileset = tileset;
  this._tile = tile;
  this._resource = resource;

  if (!defined(contents)) {
    contents = [];
  }
  this._contents = contents;

  this._metadata = undefined;
  this._group = undefined;
  this._ready = false;
}

Object.defineProperties(Composite3DTileContent.prototype, {
  featurePropertiesDirty: {
    get: function () {
      const contents = this._contents;
      const length = contents.length;
      for (let i = 0; i < length; ++i) {
        if (contents[i].featurePropertiesDirty) {
          return true;
        }
      }

      return false;
    },
    set: function (value) {
      const contents = this._contents;
      const length = contents.length;
      for (let i = 0; i < length; ++i) {
        contents[i].featurePropertiesDirty = value;
      }
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>0</code>。改为对 composite 中的 tile 调用 <code>featuresLength</code>。
   * @memberof Composite3DTileContent.prototype
   */
  featuresLength: {
    get: function () {
      return 0;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>0</code>。改为对 composite 中的 tile 调用 <code>pointsLength</code>。
   * @memberof Composite3DTileContent.prototype
   */
  pointsLength: {
    get: function () {
      return 0;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>0</code>。改为对 composite 中的 tile 调用 <code>trianglesLength</code>。
   * @memberof Composite3DTileContent.prototype
   */
  trianglesLength: {
    get: function () {
      return 0;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>0</code>。改为对 composite 中的 tile 调用 <code>geometryByteLength</code>。
   * @memberof Composite3DTileContent.prototype
   */
  geometryByteLength: {
    get: function () {
      return 0;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>0</code>。改为对 composite 中的 tile 调用 <code>texturesByteLength</code>。
   * @memberof Composite3DTileContent.prototype
   */
  texturesByteLength: {
    get: function () {
      return 0;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>0</code>。改为对 composite 中的 tile 调用 <code>batchTableByteLength</code>。
   * @memberof Composite3DTileContent.prototype
   */
  batchTableByteLength: {
    get: function () {
      return 0;
    },
  },

  innerContents: {
    get: function () {
      return this._contents;
    },
  },

  /**
   * 当 tile 的内容准备好渲染时返回 true；否则返回 false
   *
   * @memberof Composite3DTileContent.prototype
   *
   * @type {boolean}
   * @readonly
   * @private
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  tileset: {
    get: function () {
      return this._tileset;
    },
  },

  tile: {
    get: function () {
      return this._tile;
    },
  },

  url: {
    get: function () {
      return this._resource.getUrlComponent(true);
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 存储内容元数据并将内容元数据传播到其所有子项。
   * @memberof Composite3DTileContent.prototype
   * @private
   * @experimental 此功能使用的 3D Tiles 规范部分尚未最终确定，可能会更改，且不遵循 Cesium 的标准弃用策略。
   */
  metadata: {
    get: function () {
      return this._metadata;
    },
    set: function (value) {
      this._metadata = value;
      const contents = this._contents;
      const length = contents.length;
      for (let i = 0; i < length; ++i) {
        contents[i].metadata = value;
      }
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 始终返回 <code>undefined</code>。改为对 composite 中的 tile 调用 <code>batchTable</code>。
   * @memberof Composite3DTileContent.prototype
   */
  batchTable: {
    get: function () {
      return undefined;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 存储组元数据并将组元数据传播到其所有子项。
   * @memberof Composite3DTileContent.prototype
   * @private
   * @experimental 此功能使用的 3D Tiles 规范部分尚未最终确定，可能会更改，且不遵循 Cesium 的标准弃用策略。
   */
  group: {
    get: function () {
      return this._group;
    },
    set: function (value) {
      this._group = value;
      const contents = this._contents;
      const length = contents.length;
      for (let i = 0; i < length; ++i) {
        contents[i].group = value;
      }
    },
  },
});

const sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;

Composite3DTileContent.fromTileType = async function (
  tileset,
  tile,
  resource,
  arrayBuffer,
  byteOffset,
  factory,
) {
  byteOffset = byteOffset ?? 0;

  const uint8Array = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  byteOffset += sizeOfUint32; // Skip magic

  const version = view.getUint32(byteOffset, true);
  if (version !== 1) {
    throw new RuntimeError(
      `Only Composite Tile version 1 is supported. Version ${version} is not.`,
    );
  }
  byteOffset += sizeOfUint32;

  // Skip byteLength
  byteOffset += sizeOfUint32;

  const tilesLength = view.getUint32(byteOffset, true);
  byteOffset += sizeOfUint32;

  // For caching purposes, models within the composite tile must be
  // distinguished. To do this, add a query parameter ?compositeIndex=i.
  // Since composite tiles may contain other composite tiles, check for an
  // existing prefix and separate them with underscores. e.g.
  // ?compositeIndex=0_1_1
  let prefix = resource.queryParameters.compositeIndex;
  if (defined(prefix)) {
    // We'll be adding another value at the end, so add an underscore.
    prefix = `${prefix}_`;
  } else {
    // no prefix
    prefix = "";
  }

  const promises = [];
  promises.length = tilesLength;
  for (let i = 0; i < tilesLength; ++i) {
    const tileType = getMagic(uint8Array, byteOffset);

    // Tile byte length is stored after magic and version
    const tileByteLength = view.getUint32(byteOffset + sizeOfUint32 * 2, true);

    const contentFactory = factory[tileType];

    // Label which content within the composite this is
    const compositeIndex = `${prefix}${i}`;
    const childResource = resource.getDerivedResource({
      queryParameters: {
        compositeIndex: compositeIndex,
      },
    });

    if (defined(contentFactory)) {
      promises[i] = Promise.resolve(
        contentFactory(tileset, tile, childResource, arrayBuffer, byteOffset),
      );
    } else {
      throw new RuntimeError(
        `Unknown tile content type, ${tileType}, inside Composite tile`,
      );
    }

    byteOffset += tileByteLength;
  }

  const innerContents = await Promise.all(promises);
  const content = new Composite3DTileContent(
    tileset,
    tile,
    resource,
    innerContents,
  );
  return content;
};

/**
 * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
 * 始终返回 <code>false</code>。改为对 composite 中的 tile 调用 <code>hasProperty</code>。
 */
Composite3DTileContent.prototype.hasProperty = function (batchId, name) {
  return false;
};

/**
 * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
 * 始终返回 <code>undefined</code>。改为对 composite 中的 tile 调用 <code>getFeature</code>。
 */
Composite3DTileContent.prototype.getFeature = function (batchId) {
  return undefined;
};

Composite3DTileContent.prototype.applyDebugSettings = function (
  enabled,
  color,
) {
  const contents = this._contents;
  const length = contents.length;
  for (let i = 0; i < length; ++i) {
    contents[i].applyDebugSettings(enabled, color);
  }
};

Composite3DTileContent.prototype.applyStyle = function (style) {
  const contents = this._contents;
  const length = contents.length;
  for (let i = 0; i < length; ++i) {
    contents[i].applyStyle(style);
  }
};

Composite3DTileContent.prototype.update = function (tileset, frameState) {
  const contents = this._contents;
  const length = contents.length;
  let ready = true;
  for (let i = 0; i < length; ++i) {
    contents[i].update(tileset, frameState);
    ready = ready && contents[i].ready;
  }

  if (!this._ready && ready) {
    this._ready = true;
  }
};

/**
 * 查找射线与已渲染的 tile 内容表面之间的交点。射线必须以世界坐标给出。
 *
 * @param {Ray} ray 用于测试交点的射线。
 * @param {FrameState} frameState 帧状态。
 * @param {Cartesian3|undefined} [result] 交点，如果未找到则返回 <code>undefined</code>。
 * @returns {Cartesian3|undefined} 交点，如果未找到则返回 <code>undefined</code>。
 *
 * @private
 */
Composite3DTileContent.prototype.pick = function (ray, frameState, result) {
  if (!this._ready) {
    return undefined;
  }

  let intersection;
  let minDistance = Number.POSITIVE_INFINITY;
  const contents = this._contents;
  const length = contents.length;

  for (let i = 0; i < length; ++i) {
    const candidate = contents[i].pick(ray, frameState, result);

    if (!defined(candidate)) {
      continue;
    }

    const distance = Cartesian3.distance(ray.origin, candidate);
    if (distance < minDistance) {
      intersection = candidate;
      minDistance = distance;
    }
  }

  if (!defined(intersection)) {
    return undefined;
  }

  return result;
};

Composite3DTileContent.prototype.isDestroyed = function () {
  return false;
};

Composite3DTileContent.prototype.destroy = function () {
  const contents = this._contents;
  const length = contents.length;
  for (let i = 0; i < length; ++i) {
    contents[i].destroy();
  }
  return destroyObject(this);
};
export default Composite3DTileContent;
