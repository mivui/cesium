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
 * @implements Cesium3DTileContent
 * @private
 */
class Composite3DTileContent {
  constructor(tileset, tile, resource, contents) {
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

  get featurePropertiesDirty() {
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      if (contents[i].featurePropertiesDirty) {
        return true;
      }
    }

    return false;
  }

  set featurePropertiesDirty(value) {
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      contents[i].featurePropertiesDirty = value;
    }
  }

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code> 总是返回 <code>0</code>。请改为调用复合瓦片中的 <code>featuresLength</code>。
   */
  get featuresLength() {
    return 0;
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>0</code>。请改为调用复合图块中的 <code>pointsLength</code>。
   */
  get pointsLength() {
    return 0;
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>0</code>。请改为调用复合图块中的 <code>trianglesLength</code>。
   */
  get trianglesLength() {
    return 0;
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>0</code>。请改为调用复合图块中的 <code>geometryByteLength</code>。
   */
  get geometryByteLength() {
    return 0;
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>0</code>。请改为调用复合图块中的 <code>texturesByteLength</code>。
   */
  get texturesByteLength() {
    return 0;
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回<code>0</code>。请改为调用复合瓦片中的<code>batchTableByteLength</code>。
   */
  get batchTableByteLength() {
    return 0;
  }

  get innerContents() {
    return this._contents;
  }

  /**
   * 当 tile 的内容准备好渲染时返回 true；否则返回 false
   *
   *
   * @type {boolean}
   * @readonly
   * @private
   */
  get ready() {
    return this._ready;
  }

  get tileset() {
    return this._tileset;
  }

  get tile() {
    return this._tile;
  }

  get url() {
    return this._resource.getUrlComponent(true);
  }

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 既存储内容元数据，又将内容元数据传播给其所有子节点。
   * @private
   * @experimental 此功能使用的 3D Tiles 规范部分尚未最终确定，可能会更改，且不遵循 Cesium 的标准弃用策略。
   */
  get metadata() {
    return this._metadata;
  }

  set metadata(value) {
    this._metadata = value;
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      contents[i].metadata = value;
    }
  }

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>undefined</code>。请改为调用复合图块中的某个瓦片的 <code>batchTable</code>。
   */
  get batchTable() {
    return undefined;
  }

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 既存储组元数据，又将组元数据传播到其所有子项。
   * @private
   * @experimental 此功能使用的 3D Tiles 规范部分尚未最终确定，可能会更改，且不遵循 Cesium 的标准弃用策略。
   */
  get group() {
    return this._group;
  }

  set group(value) {
    this._group = value;
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      contents[i].group = value;
    }
  }

  static async fromTileType(
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
      const tileByteLength = view.getUint32(
        byteOffset + sizeOfUint32 * 2,
        true,
      );

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
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>false</code>。相反，应对组合中的图块调用 <code>hasProperty</code>。
   */
  hasProperty(batchId, name) {
    return false;
  }

  /**
   * 属于 {@link Cesium3DTileContent} 接口的一部分。<code>Composite3DTileContent</code>
   * 总是返回 <code>undefined</code>。请改为调用复合图层中某个瓦片的 <code>getFeature</code>。
   */
  getFeature(batchId) {
    return undefined;
  }

  applyDebugSettings(enabled, color) {
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      contents[i].applyDebugSettings(enabled, color);
    }
  }

  applyStyle(style) {
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      contents[i].applyStyle(style);
    }
  }

  update(tileset, frameState) {
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
  }

  /**
   * 查找射线与已渲染的瓦片内容表面之间的交点。射线必须以世界坐标给出。
   *
   * @param {Ray} ray 要测试交点的射线。
   * @param {FrameState} frameState 帧状态。
   * @param {Cartesian3|undefined} [result] 交点，若未找到则为<code>undefined</code>。
   * @returns {Cartesian3|undefined} 交点，若未找到则为<code>undefined</code>。
   *
   * @private
   */
  pick(ray, frameState, result) {
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
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    const contents = this._contents;
    const length = contents.length;
    for (let i = 0; i < length; ++i) {
      contents[i].destroy();
    }
    return destroyObject(this);
  }
}

const sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;

export default Composite3DTileContent;
