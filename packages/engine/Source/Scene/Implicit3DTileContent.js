import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import combine from "../Core/combine.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import CesiumMath from "../Core/Math.js";
import HilbertOrder from "../Core/HilbertOrder.js";
import Matrix3 from "../Core/Matrix3.js";
import Rectangle from "../Core/Rectangle.js";
import S2Cell from "../Core/S2Cell.js";
import ImplicitSubtree from "./ImplicitSubtree.js";
import hasExtension from "./hasExtension.js";
import MetadataSemantic from "./MetadataSemantic.js";
import BoundingVolumeSemantics from "./BoundingVolumeSemantics.js";

/**
 * 一个专用的 {@link Cesium3DTileContent}，它懒惰地计算隐式的
 * 图块集。它在操作上有点类似于
 * {@link Tileset3DTileContent} 中，一旦构建了内容，它
 * 使用更多图块更新图块集树。但是，与外部图块集不同的是，
 * 子子树表示为附加的占位符节点，其中
 * Implicit3DTileContent 的 Importicit Partial PackageContent 中。
 * <p>
 * 实现 {@link Cesium3DTileContent} 接口。
 * </p>
 * 此对象通常不直接实例化，请使用 {@link Implicit3DTileContent.fromSubtreeJson}。
 *
 * @alias Implicit3DTileContent
 * @constructor
 *
 * @param {Cesium3DTileset} tileset 此内容所属的瓦片集
 * @param {Cesium3DTile} tile 此内容所属的磁贴。
 * @param {Resource} resource 瓦片集的资源
 * @param {object} [json] 包含子树的 JSON 对象。与 arrayBuffer 互斥。
 * @param {ArrayBuffer} [arrayBuffer] 存储内容有效负载的数组缓冲区。与 json 互斥。
 * @param {number} [byteOffset=0] 数组缓冲区的偏移量（如果提供了）
 *
 * @exception {DeveloperError} One of json and arrayBuffer must be defined.
 *
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 */
function Implicit3DTileContent(tileset, tile, resource) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("tile.implicitTileset", tile.implicitTileset);
  Check.defined("tile.implicitCoordinates", tile.implicitCoordinates);
  //>>includeEnd('debug');

  const implicitTileset = tile.implicitTileset;
  const implicitCoordinates = tile.implicitCoordinates;

  this._implicitTileset = implicitTileset;
  this._implicitCoordinates = implicitCoordinates;
  this._implicitSubtree = undefined;
  this._tileset = tileset;
  this._tile = tile;
  this._resource = resource;

  this._metadata = undefined;

  this.featurePropertiesDirty = false;
  this._group = undefined;

  const templateValues = implicitCoordinates.getTemplateValues();
  const subtreeResource = implicitTileset.subtreeUriTemplate.getDerivedResource(
    {
      templateValues: templateValues,
    }
  );
  this._url = subtreeResource.getUrlComponent(true);

  this._ready = false;
}

Object.defineProperties(Implicit3DTileContent.prototype, {
  featuresLength: {
    get: function () {
      return 0;
    },
  },

  pointsLength: {
    get: function () {
      return 0;
    },
  },

  trianglesLength: {
    get: function () {
      return 0;
    },
  },

  geometryByteLength: {
    get: function () {
      return 0;
    },
  },

  texturesByteLength: {
    get: function () {
      return 0;
    },
  },

  batchTableByteLength: {
    get: function () {
      return 0;
    },
  },

  innerContents: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 当磁贴的内容准备好呈现时，返回 true;否则为 false
   *
   * @memberof Implicit3DTileContent.prototype
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
      return this._url;
    },
  },

  /**
   * {@link Cesium3DTileContent} 接口的一部分。<code>Implicit3DTileContent</code>
   * 始终返回 <code>undefined</code>。只有转码后的切片才具有内容元数据。
   * @memberof Implicit3DTileContent.prototype
   * @private
   */
  metadata: {
    get: function () {
      return undefined;
    },
    set: function () {
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError("Implicit3DTileContent cannot have metadata");
      //>>includeEnd('debug');
    },
  },

  batchTable: {
    get: function () {
      return undefined;
    },
  },

  group: {
    get: function () {
      return this._group;
    },
    set: function (value) {
      this._group = value;
    },
  },
});

/**
 * 通过解析 subtree 资源初始化隐式内容，并设置
 * 向上扩展 Promise Chain 以扩展 Immediate 子树。
 *
 * @param {Cesium3DTileset} tileset 此内容所属的瓦片集
 * @param {Cesium3DTile} tile 此内容所属的磁贴。
 * @param {Resource} resource 瓦片集的资源
 * @param {object} [json] 包含子树的 JSON。与 arrayBuffer 互斥。
 * @param {ArrayBuffer} [arrayBuffer] 包含子树二进制文件的 ArrayBuffer。与 json 互斥。
 * @param {number} [byteOffset=0] arrayBuffer 的字节偏移量
 * @return {Promise<Implicit3DTileContent>}
 *
 * @exception {DeveloperError} One of json and arrayBuffer must be defined.
 *
 * @private
 */
Implicit3DTileContent.fromSubtreeJson = async function (
  tileset,
  tile,
  resource,
  json,
  arrayBuffer,
  byteOffset
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("tile.implicitTileset", tile.implicitTileset);
  Check.defined("tile.implicitCoordinates", tile.implicitCoordinates);
  if (defined(json) === defined(arrayBuffer)) {
    throw new DeveloperError("One of json and arrayBuffer must be defined.");
  }
  //>>includeEnd('debug');

  byteOffset = defaultValue(byteOffset, 0);
  let uint8Array;
  if (defined(arrayBuffer)) {
    uint8Array = new Uint8Array(arrayBuffer, byteOffset);
  }

  const implicitTileset = tile.implicitTileset;
  const implicitCoordinates = tile.implicitCoordinates;

  const subtree = await ImplicitSubtree.fromSubtreeJson(
    resource,
    json,
    uint8Array,
    implicitTileset,
    implicitCoordinates
  );

  const content = new Implicit3DTileContent(tileset, tile, resource);

  content._implicitSubtree = subtree;
  expandSubtree(content, subtree);
  content._ready = true;

  return content;
};

/**
 * 展开单个子树占位符磁贴。这会将子树转码为
 * {@link Cesium3DTile} 的树。此树的根存储在
 * 占位符图块的 children 数组。此方法还会创建 placeholder
 * tiles 的子树，以便根据需要延迟扩展。
 *
 * @param {Implicit3DTileContent} content 内容
 * @param {ImplicitSubtree} subtree 已解析的子树
 * @private
 */
function expandSubtree(content, subtree) {
  const placeholderTile = content._tile;

  // Parse the tiles inside this immediate subtree
  const childIndex = content._implicitCoordinates.childIndex;
  const results = transcodeSubtreeTiles(
    content,
    subtree,
    placeholderTile,
    childIndex
  );

  const statistics = content._tileset.statistics;

  // Link the new subtree to the existing placeholder tile.
  placeholderTile.children.push(results.rootTile);
  statistics.numberOfTilesTotal++;

  // for each child subtree, make new placeholder tiles
  const childSubtrees = listChildSubtrees(content, subtree, results.bottomRow);
  for (let i = 0; i < childSubtrees.length; i++) {
    const subtreeLocator = childSubtrees[i];
    const leafTile = subtreeLocator.tile;
    const implicitChildTile = makePlaceholderChildSubtree(
      content,
      leafTile,
      subtreeLocator.childIndex
    );
    leafTile.children.push(implicitChildTile);
    statistics.numberOfTilesTotal++;
  }
}

/**
 * 一对 （tile， childIndex） 用于查找子子树。
 *
 * @typedef {object} ChildSubtreeLocator
 * @property {Cesium3DTile} tile 子树最底部行中的磁贴之一。
 * @property {number} childIndex 子图块相对于其父图块的莫顿索引
 * @private
 */

/**
 * 确定存在哪些子子树并返回信息列表
 *
 * @param {Implicit3DTileContent} content 隐式内容
 * @param {ImplicitSubtree} subtree 用于查找可用性的子树
 * @param {Array<Cesium3DTile|undefined>} bottomRow 转码子树中的底行图块
 * @returns {ChildSubtreeLocator[]} 子子树的标识符列表。
 * @private
 */
function listChildSubtrees(content, subtree, bottomRow) {
  const results = [];
  const branchingFactor = content._implicitTileset.branchingFactor;
  for (let i = 0; i < bottomRow.length; i++) {
    const leafTile = bottomRow[i];
    if (!defined(leafTile)) {
      continue;
    }

    for (let j = 0; j < branchingFactor; j++) {
      const index = i * branchingFactor + j;
      if (subtree.childSubtreeIsAvailableAtIndex(index)) {
        results.push({
          tile: leafTile,
          childIndex: j,
        });
      }
    }
  }
  return results;
}

/**
 * transcodeSubtreeTiles 的结果，包含
 * subtree 和节点的底行进行进一步处理。
 *
 * @typedef {object} TranscodedSubtree
 * @property {Cesium3DTile} rootTile 子树的转码根瓦片
 * @property {Array<Cesium3DTile|undefined>} bottomRow 转码瓦片的底行。这有助于处理子子树
 * @private
 */

/**
 * 对此子树中隐式定义的瓦片进行转码，并生成
 * 显式 {@link Cesium3DTile} 对象。此函数仅对瓦片、
 * 子子树单独处理。
 *
 * @param {Implicit3DTileContent} content 隐式内容
 * @param {ImplicitSubtree} subtree 获取可用性信息的子树
 * @param {Cesium3DTile} placeholderTile 占位符瓦片，用于构建子树根瓦片
 * @param {number} childIndex 根瓦片相对于 parentOfRootTile 的 Morton 索引
 * @returns {TranscodedSubtree} 新创建的瓦片子树
 * @private
 */
function transcodeSubtreeTiles(content, subtree, placeholderTile, childIndex) {
  const rootBitIndex = 0;
  const rootParentIsPlaceholder = true;
  const rootTile = deriveChildTile(
    content,
    subtree,
    placeholderTile,
    childIndex,
    rootBitIndex,
    rootParentIsPlaceholder
  );

  const statistics = content._tileset.statistics;

  // Sliding window over the levels of the tree.
  // Each row is branchingFactor * length of previous row
  // Tiles within a row are ordered by Morton index.
  let parentRow = [rootTile];
  let currentRow = [];

  const implicitTileset = content._implicitTileset;
  for (let level = 1; level < implicitTileset.subtreeLevels; level++) {
    const levelOffset = subtree.getLevelOffset(level);
    const numberOfChildren = implicitTileset.branchingFactor * parentRow.length;
    for (
      let childMortonIndex = 0;
      childMortonIndex < numberOfChildren;
      childMortonIndex++
    ) {
      const childBitIndex = levelOffset + childMortonIndex;

      if (!subtree.tileIsAvailableAtIndex(childBitIndex)) {
        currentRow.push(undefined);
        continue;
      }

      const parentMortonIndex = subtree.getParentMortonIndex(childMortonIndex);
      const parentTile = parentRow[parentMortonIndex];
      const childChildIndex =
        childMortonIndex % implicitTileset.branchingFactor;
      const childTile = deriveChildTile(
        content,
        subtree,
        parentTile,
        childChildIndex,
        childBitIndex
      );
      parentTile.children.push(childTile);
      statistics.numberOfTilesTotal++;
      currentRow.push(childTile);
    }

    parentRow = currentRow;
    currentRow = [];
  }

  return {
    rootTile: rootTile,
    // At the end of the last loop, bottomRow was moved to parentRow
    bottomRow: parentRow,
  };
}

function getGeometricError(tileMetadata, implicitTileset, implicitCoordinates) {
  const semantic = MetadataSemantic.TILE_GEOMETRIC_ERROR;

  if (defined(tileMetadata) && tileMetadata.hasPropertyBySemantic(semantic)) {
    return tileMetadata.getPropertyBySemantic(semantic);
  }

  return (
    implicitTileset.geometricError / Math.pow(2, implicitCoordinates.level)
  );
}

/**
 * 给定父磁贴和有关要创建的子项的信息，派生
 * 子图块的属性。
 * <p>
 * 这将创建一个用于渲染的真实瓦片，而不是像某些
 * ImplicitTileset 的其他方法。
 * </p>
 *
 * @param {Implicit3DTileContent} implicitContent 隐式内容
 * @param {ImplicitSubtree} subtree 子瓦片所属的子树
 * @param {Cesium3DTile} parentTile 新子瓦片的父级
 * @param {number} childIndex 子瓦片相对于其父瓦片的莫顿索引
 * @param {number} childBitIndex 磁贴的可用性信息中子磁贴的索引。
 * @param {boolean} [parentIsPlaceholderTile=false] 如果 parentTile 是占位符磁贴，则为 True。对于每个子树的根，情况都是如此。
 * @returns {Cesium3DTile} 新的子磁贴。
 * @private
 */
function deriveChildTile(
  implicitContent,
  subtree,
  parentTile,
  childIndex,
  childBitIndex,
  parentIsPlaceholderTile
) {
  const implicitTileset = implicitContent._implicitTileset;
  let implicitCoordinates;
  if (defaultValue(parentIsPlaceholderTile, false)) {
    implicitCoordinates = parentTile.implicitCoordinates;
  } else {
    implicitCoordinates = parentTile.implicitCoordinates.getChildCoordinates(
      childIndex
    );
  }

  // Parse metadata and bounding volume semantics at the beginning
  // as the bounding volumes are needed below.
  let tileMetadata;
  let tileBounds;
  let contentBounds;
  if (defined(subtree.tilePropertyTableJson)) {
    tileMetadata = subtree.getTileMetadataView(implicitCoordinates);

    const boundingVolumeSemantics = BoundingVolumeSemantics.parseAllBoundingVolumeSemantics(
      tileMetadata
    );
    tileBounds = boundingVolumeSemantics.tile;
    contentBounds = boundingVolumeSemantics.content;
  }

  // Content is not loaded at this point, so this flag is set for future reference.
  const contentPropertyTableJsons = subtree.contentPropertyTableJsons;
  const length = contentPropertyTableJsons.length;
  let hasImplicitContentMetadata = false;
  for (let i = 0; i < length; i++) {
    if (subtree.contentIsAvailableAtCoordinates(implicitCoordinates, i)) {
      hasImplicitContentMetadata = true;
      break;
    }
  }

  const boundingVolume = getTileBoundingVolume(
    implicitTileset,
    implicitCoordinates,
    childIndex,
    parentIsPlaceholderTile,
    parentTile,
    tileBounds
  );

  const contentJsons = [];
  for (let i = 0; i < implicitTileset.contentCount; i++) {
    if (!subtree.contentIsAvailableAtIndex(childBitIndex, i)) {
      continue;
    }
    const childContentTemplate = implicitTileset.contentUriTemplates[i];
    const childContentUri = childContentTemplate.getDerivedResource({
      templateValues: implicitCoordinates.getTemplateValues(),
    }).url;
    const contentJson = {
      uri: childContentUri,
    };

    const contentBoundingVolume = getContentBoundingVolume(
      boundingVolume,
      contentBounds
    );

    if (defined(contentBoundingVolume)) {
      contentJson.boundingVolume = contentBoundingVolume;
    }

    // combine() is used to pass through any additional properties the
    // user specified such as extras or extensions
    contentJsons.push(combine(contentJson, implicitTileset.contentHeaders[i]));
  }

  const childGeometricError = getGeometricError(
    tileMetadata,
    implicitTileset,
    implicitCoordinates
  );

  const tileJson = {
    boundingVolume: boundingVolume,
    geometricError: childGeometricError,
    refine: implicitTileset.refine,
    contents: contentJsons,
  };

  // combine() is used to pass through any additional properties the
  // user specified such as extras or extensions.
  const deep = true;
  const rootHeader = clone(implicitTileset.tileHeader, deep);
  // The bounding volume was computed above since it may come from metadata
  // in the subtree file.
  delete rootHeader.boundingVolume;
  // Copying the transform to all the transcoded tiles would cause the transform
  // to be applied multiple times. Removing it from the header avoids this issue.
  delete rootHeader.transform;
  // The implicit tiling spec does not specify what should happen if explicit
  // tile metadata is added to the placeholder tile. Since implicit tile
  // metadata comes from the subtree file, ignore the explicit version.
  //
  // Also, when a property with the semantic TILE_BOUNDING_VOLUME is added to
  // the placeholder tile to set a tight bounding volume (See Cesium3DTile.js)
  // propagating it to transcoded tiles causes transcoded tiles to use the
  // wrong bounding volume, this can lead to loading far too many tiles.
  delete rootHeader.metadata;
  const combinedTileJson = combine(tileJson, rootHeader, deep);

  const childTile = makeTile(
    implicitContent,
    implicitTileset.baseResource,
    combinedTileJson,
    parentTile
  );

  childTile.implicitCoordinates = implicitCoordinates;
  childTile.implicitSubtree = subtree;
  childTile.metadata = tileMetadata;
  childTile.hasImplicitContentMetadata = hasImplicitContentMetadata;

  return childTile;
}

/**
 * 检查是否可以更新包围体的高度。
 * 如果 minimumHeight/maximumHeight 参数
 * 且边界体积为区域或 S2 单元。
 *
 * @param {object} [boundingVolume] 边界体积
 * @param {object} [tileBounds] 瓦片边界
 * @param {number} [tileBounds.minimumHeight] 最小高度
 * @param {number} [tileBounds.maximumHeight] 最大高度
 * @returns {boolean} 是否可以更新包围体的高度
 * @private
 */
function canUpdateHeights(boundingVolume, tileBounds) {
  return (
    defined(boundingVolume) &&
    defined(tileBounds) &&
    (defined(tileBounds.minimumHeight) || defined(tileBounds.maximumHeight)) &&
    (hasExtension(boundingVolume, "3DTILES_bounding_volume_S2") ||
      defined(boundingVolume.region))
  );
}

/**
 * 更新边界体积的最小和最大高度。
 * 这通常用于使用
 * <code>TILE_MINIMUM_HEIGHT</code> 和 <code>TILE_MAXIMUM_HEIGHT</code>
 *语义学。高度仅在相应的
 * minimumHeight/maximumHeight 参数，并且
 * bounding volume 是一个区域或 S2 单元格。
 *
 * @param {object} boundingVolume 边界体积
 * @param {object} [tileBounds] 瓦片边界
 * @param {number} [tileBounds.minimumHeight] 新的最小高度
 * @param {number} [tileBounds.maximumHeight] 新的最大高度
 * @private
 */
function updateHeights(boundingVolume, tileBounds) {
  if (!defined(tileBounds)) {
    return;
  }

  if (hasExtension(boundingVolume, "3DTILES_bounding_volume_S2")) {
    updateS2CellHeights(
      boundingVolume.extensions["3DTILES_bounding_volume_S2"],
      tileBounds.minimumHeight,
      tileBounds.maximumHeight
    );
  } else if (defined(boundingVolume.region)) {
    updateRegionHeights(
      boundingVolume.region,
      tileBounds.minimumHeight,
      tileBounds.maximumHeight
    );
  }
}

/**
 * 对于边界区域，请更新最小和最大高度。这
 * 通常用于使用
 * <code>TILE_MINIMUM_HEIGHT</code> 和 <code>TILE_MAXIMUM_HEIGHT</code>
 *语义学。高度仅在相应的
 * minimumHeight/maximumHeight 参数。
 *
 * @param {Array} region 描述边界区域的 6 元素数组
 * @param {number} [minimumHeight] 新的最小高度
 * @param {number} [maximumHeight] 新的最大高度
 * @private
 */
function updateRegionHeights(region, minimumHeight, maximumHeight) {
  if (defined(minimumHeight)) {
    region[4] = minimumHeight;
  }

  if (defined(maximumHeight)) {
    region[5] = maximumHeight;
  }
}

/**
 * 对于有界 S2 单元格，请更新最小和最大高度。这
 * 通常用于使用
 * <code>TILE_MINIMUM_HEIGHT</code> 和 <code>TILE_MAXIMUM_HEIGHT</code>
 * 语义学。高度仅在相应的
 * minimumHeight/maximumHeight 参数。
 *
 * @param {object} s2CellVolume 描述 S2 单元格的对象
 * @param {number} [minimumHeight] 新的最小高度
 * @param {number} [maximumHeight] 新的最大高度
 * @private
 */
function updateS2CellHeights(s2CellVolume, minimumHeight, maximumHeight) {
  if (defined(minimumHeight)) {
    s2CellVolume.minimumHeight = minimumHeight;
  }

  if (defined(maximumHeight)) {
    s2CellVolume.maximumHeight = maximumHeight;
  }
}

/**
 * 获取瓦片的边界体积，可通过
 * 元数据语义，例如 TILE_BOUNDING_BOX 或隐式
 * 派生自隐式根图块的边界体积。
 * <p>
 * 边界卷类型的优先级：
 * <ol>
 * <li>显式最小/最大高度
 * <ol>
 * <li>具有显式区域</li>
 * <li>使用隐式 S2</li>
 * <li>具有隐式区域</li>
 * </ol>
 * </li>
 * <li>显式框</li>
 * <li>显式区域</li>
 * <li>显式球体</li>
 * <li>隐式 S2</li>
 * <li>隐式框</li>
 * <li>隐式区域</li>
 * </ol>
 * </p>
 *
 * @param {ImplicitTileset} implicitTileset 隐式图块集结构体，用于保存根边界体积
 * @param {ImplicitTileCoordinates} implicitCoordinates 子瓦片的坐标
 * @param {number} childIndex 子瓦片相对于其父瓦片的莫顿索引
 * @param {boolean} parentIsPlaceholderTile 如果 parentTile 是占位符磁贴，则为 True。对于每个子树的根，情况都是如此。
 * @param {Cesium3DTile} parentTile 新子瓦片的父级
 * @param {object} [tileBounds] 瓦片边界
 * @returns {object} 包含边界卷的 JSON 的对象
 * @private
 */
function getTileBoundingVolume(
  implicitTileset,
  implicitCoordinates,
  childIndex,
  parentIsPlaceholderTile,
  parentTile,
  tileBounds
) {
  let boundingVolume;

  if (
    !defined(tileBounds) ||
    !defined(tileBounds.boundingVolume) ||
    (!canUpdateHeights(tileBounds.boundingVolume, tileBounds) &&
      canUpdateHeights(implicitTileset.boundingVolume, tileBounds))
  ) {
    boundingVolume = deriveBoundingVolume(
      implicitTileset,
      implicitCoordinates,
      childIndex,
      defaultValue(parentIsPlaceholderTile, false),
      parentTile
    );
  } else {
    boundingVolume = tileBounds.boundingVolume;
  }

  // The TILE_MINIMUM_HEIGHT and TILE_MAXIMUM_HEIGHT metadata semantics
  // can be used to tighten the bounding volume
  updateHeights(boundingVolume, tileBounds);

  return boundingVolume;
}

/**
 * 获取内容边界卷，可通过
 * 元数据语义，例如 CONTENT_BOUNDING_BOX。
 * <p>
 * 边界卷类型的优先级：
 * <ol>
 * <li>显式最小/最大高度
 *   <ol>
 *     <li>具有显式区域</li>
 *     <li>使用平铺边界体积 (S2 or region)</li>
 *   </ol>
 * </li>
 * <li>显式框</li>
 * <li>显式区域</li>
 * <li>显式球体</li>
 * <li>平铺边界体积 (when content.boundingVolume is undefined)</li>
 * </ol>
 * </p>
 *
 * @param {object} tileBoundingVolume 一个包含图块边界体积的 JSON 的对象
 * @param {object} [contentBounds] 内容边界
 * @returns {object|undefined} 包含边界体积的 JSON 的对象，如果没有边界体积，<code>则为 undefined</code>
 * @private
 */
function getContentBoundingVolume(tileBoundingVolume, contentBounds) {
  // content bounding volumes can only be specified via
  // metadata semantics such as CONTENT_BOUNDING_BOX
  let contentBoundingVolume;
  if (defined(contentBounds)) {
    contentBoundingVolume = contentBounds.boundingVolume;
  }

  // The CONTENT_MINIMUM_HEIGHT and CONTENT_MAXIMUM_HEIGHT metadata semantics
  // can be used to tighten the bounding volume
  if (canUpdateHeights(contentBoundingVolume, contentBounds)) {
    updateHeights(contentBoundingVolume, contentBounds);
  } else if (canUpdateHeights(tileBoundingVolume, contentBounds)) {
    contentBoundingVolume = clone(tileBoundingVolume, true);
    updateHeights(contentBoundingVolume, contentBounds);
  }

  return contentBoundingVolume;
}

/**
 * 给定平铺的坐标，从根派生其边界体积。
 *
 * @param {ImplicitTileset} implicitTileset 隐式图块集结构体，用于保存根边界体积
 * @param {ImplicitTileCoordinates} implicitCoordinates 子瓦片的坐标
 * @param {number} childIndex 子瓦片相对于其父瓦片的莫顿索引
 * @param {boolean} parentIsPlaceholderTile 如果 parentTile 是占位符磁贴，则为 True。对于每个子树的根，情况都是如此。
 * @param {Cesium3DTile} parentTile 新子瓦片的父级
 * @returns {object} 包含边界卷的 JSON 的对象
 * @private
 */
function deriveBoundingVolume(
  implicitTileset,
  implicitCoordinates,
  childIndex,
  parentIsPlaceholderTile,
  parentTile
) {
  const rootBoundingVolume = implicitTileset.boundingVolume;

  if (hasExtension(rootBoundingVolume, "3DTILES_bounding_volume_S2")) {
    return deriveBoundingVolumeS2(
      parentIsPlaceholderTile,
      parentTile,
      childIndex,
      implicitCoordinates.level,
      implicitCoordinates.x,
      implicitCoordinates.y,
      implicitCoordinates.z
    );
  }

  if (defined(rootBoundingVolume.region)) {
    const childRegion = deriveBoundingRegion(
      rootBoundingVolume.region,
      implicitCoordinates.level,
      implicitCoordinates.x,
      implicitCoordinates.y,
      implicitCoordinates.z
    );

    return {
      region: childRegion,
    };
  }

  const childBox = deriveBoundingBox(
    rootBoundingVolume.box,
    implicitCoordinates.level,
    implicitCoordinates.x,
    implicitCoordinates.y,
    implicitCoordinates.z
  );

  return {
    box: childBox,
  };
}

/**
 * 派生后代平铺（子、孙等）的边界体积，
 * 假设使用 QuadTree 或 Octree 隐式切片方案。的 （level， x， y， [z]）
 * 给出坐标以选择后代瓦片并计算其位置
 * 和 dimensions.
 * <p>
 * 如果存在 z，则使用 octree 细分。否则，quadtree 细分
 * 被使用。四叉树总是在水平线的中点处划分
 * 维度，即 （x， y），保持 z 轴不变。
 * </p>
 *
 * @param {boolean} parentIsPlaceholderTile 如果 parentTile 是占位符磁贴，则为 True。对于每个子树的根，情况都是如此。
 * @param {Cesium3DTile} parentTile 新子瓦片的父级
 * @param {number} childIndex 子瓦片相对于其父瓦片的莫顿索引
 * @param {number} level 后代瓦片相对于根隐式瓦片的级别
 * @param {number} x x坐标 descendant tile
 * @param {number} y y坐标 descendant tile
 * @param {number} [z] 后代瓦片的 z 坐标（仅限八叉树）
 * @returns {object} 具有 3DTILES_bounding_volume_S2 扩展的对象。
 * @private
 */
function deriveBoundingVolumeS2(
  parentIsPlaceholderTile,
  parentTile,
  childIndex,
  level,
  x,
  y,
  z
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.bool("parentIsPlaceholderTile", parentIsPlaceholderTile);
  Check.typeOf.object("parentTile", parentTile);
  Check.typeOf.number("childIndex", childIndex);
  Check.typeOf.number("level", level);
  Check.typeOf.number("x", x);
  Check.typeOf.number("y", y);
  if (defined(z)) {
    Check.typeOf.number("z", z);
  }
  //>>includeEnd('debug');

  const boundingVolumeS2 = parentTile._boundingVolume;

  // Handle the placeholder tile case, where we just duplicate the placeholder's bounding volume.
  if (parentIsPlaceholderTile) {
    return {
      extensions: {
        "3DTILES_bounding_volume_S2": {
          token: S2Cell.getTokenFromId(boundingVolumeS2.s2Cell._cellId),
          minimumHeight: boundingVolumeS2.minimumHeight,
          maximumHeight: boundingVolumeS2.maximumHeight,
        },
      },
    };
  }

  // Extract the first 3 face bits from the 64-bit S2 cell ID.
  // eslint-disable-next-line no-undef
  const face = Number(parentTile._boundingVolume.s2Cell._cellId >> BigInt(61));
  // The Hilbert curve is rotated for the "odd" faces on the S2 Earthcube.
  // See http://s2geometry.io/devguide/img/s2cell_global.jpg
  const position =
    face % 2 === 0
      ? HilbertOrder.encode2D(level, x, y)
      : HilbertOrder.encode2D(level, y, x);
  // eslint-disable-next-line no-undef
  const cell = S2Cell.fromFacePositionLevel(face, BigInt(position), level);

  let minHeight, maxHeight;
  if (defined(z)) {
    const midpointHeight =
      (boundingVolumeS2.maximumHeight + boundingVolumeS2.minimumHeight) / 2;
    minHeight =
      childIndex < 4 ? boundingVolumeS2.minimumHeight : midpointHeight;
    maxHeight =
      childIndex < 4 ? midpointHeight : boundingVolumeS2.maximumHeight;
  } else {
    minHeight = boundingVolumeS2.minimumHeight;
    maxHeight = boundingVolumeS2.maximumHeight;
  }

  return {
    extensions: {
      "3DTILES_bounding_volume_S2": {
        token: S2Cell.getTokenFromId(cell._cellId),
        minimumHeight: minHeight,
        maximumHeight: maxHeight,
      },
    },
  };
}

const scratchScaleFactors = new Cartesian3();
const scratchRootCenter = new Cartesian3();
const scratchCenter = new Cartesian3();
const scratchHalfAxes = new Matrix3();
/**
 * 派生后代平铺（子、孙等）的边界体积，
 * 假设使用 QuadTree 或 Octree 隐式切片方案。的 （level， x， y， [z]）
 * 给出坐标以选择后代瓦片并计算其位置
 * 和 dimensions.
 * <p>
 * 如果存在 z，则使用 octree 细分。否则，quadtree 细分
 * 被使用。四叉树总是在水平线的中点处划分
 * 维度，即 （x， y），保持 z 轴不变。
 * </p>
 * <p>
 * 这将直接从根边界卷计算子卷，而不是
 * 而不是递归细分以最小化浮点误差。
 * </p>
 *
 * @param {number[]} rootBox 一个由 12 个数字组成的数组，代表根图块的边界框
 * @param {number} level 后代瓦片相对于根隐式瓦片的级别
 * @param {number} x x坐标 descendant tile
 * @param {number} y y坐标 descendant tile
 * @param {number} [z] 后代瓦片的 z 坐标（仅限八叉树）
 * @returns {number[]} 一个由 12 个数字组成的数组，表示后代图块的边界框。
 * @private
 */
function deriveBoundingBox(rootBox, level, x, y, z) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rootBox", rootBox);
  Check.typeOf.number("level", level);
  Check.typeOf.number("x", x);
  Check.typeOf.number("y", y);
  if (defined(z)) {
    Check.typeOf.number("z", z);
  }
  //>>includeEnd('debug');

  if (level === 0) {
    return rootBox;
  }

  const rootCenter = Cartesian3.unpack(rootBox, 0, scratchRootCenter);
  const rootHalfAxes = Matrix3.unpack(rootBox, 3, scratchHalfAxes);

  const tileScale = Math.pow(2, -level);
  const modelSpaceX = -1 + (2 * x + 1) * tileScale;
  const modelSpaceY = -1 + (2 * y + 1) * tileScale;

  let modelSpaceZ = 0;
  const scaleFactors = Cartesian3.fromElements(
    tileScale,
    tileScale,
    1,
    scratchScaleFactors
  );

  if (defined(z)) {
    modelSpaceZ = -1 + (2 * z + 1) * tileScale;
    scaleFactors.z = tileScale;
  }

  let center = Cartesian3.fromElements(
    modelSpaceX,
    modelSpaceY,
    modelSpaceZ,
    scratchCenter
  );
  center = Matrix3.multiplyByVector(rootHalfAxes, center, scratchCenter);
  center = Cartesian3.add(center, rootCenter, scratchCenter);

  let halfAxes = Matrix3.clone(rootHalfAxes);
  halfAxes = Matrix3.multiplyByScale(halfAxes, scaleFactors, halfAxes);

  const childBox = new Array(12);
  Cartesian3.pack(center, childBox);
  Matrix3.pack(halfAxes, childBox, 3);
  return childBox;
}

const scratchRectangle = new Rectangle();
/**
 * 派生后代平铺（子、孙等）的边界体积，
 * 假设使用 QuadTree 或 Octree 隐式切片方案。的 （level， x， y， [z]）
 * 给出坐标以选择后代瓦片并计算其位置
 * 和 dimensions.
 * <p>
 * 如果存在 z，则使用 octree 细分。否则，quadtree 细分
 * 被使用。四叉树总是在水平线的中点处划分
 * dimensions，即 （mid_longitude， mid_latitude），保留 height 值
 *变。
 * </p>
 * <p>
 * 这将直接从根边界卷计算子卷，而不是
 * 而不是递归细分以最小化浮点误差。
 * </p>
 * @param {number[]} rootRegion 一个由 6 个数字组成的数组，表示根隐式瓦片
 * @param {number} level 后代瓦片相对于根隐式瓦片的级别
 * @param {number} x x坐标 descendant tile
 * @param {number} y x坐标 descendant tile
 * @param {number} [z] 后代瓦片的 z 坐标（仅限八叉树）
 * @returns {number[]} 一个由 6 个数字组成的数组，表示后代瓦片的边界区域
 * @private
 */
function deriveBoundingRegion(rootRegion, level, x, y, z) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rootRegion", rootRegion);
  Check.typeOf.number("level", level);
  Check.typeOf.number("x", x);
  Check.typeOf.number("y", y);
  if (defined(z)) {
    Check.typeOf.number("z", z);
  }
  //>>includeEnd('debug');

  if (level === 0) {
    return rootRegion.slice();
  }

  const rectangle = Rectangle.unpack(rootRegion, 0, scratchRectangle);
  const rootMinimumHeight = rootRegion[4];
  const rootMaximumHeight = rootRegion[5];
  const tileScale = Math.pow(2, -level);

  const childWidth = tileScale * rectangle.width;
  const west = CesiumMath.negativePiToPi(rectangle.west + x * childWidth);
  const east = CesiumMath.negativePiToPi(west + childWidth);

  const childHeight = tileScale * rectangle.height;
  const south = CesiumMath.negativePiToPi(rectangle.south + y * childHeight);
  const north = CesiumMath.negativePiToPi(south + childHeight);

  // Height is only subdivided for octrees; It remains constant for quadtrees.
  let minimumHeight = rootMinimumHeight;
  let maximumHeight = rootMaximumHeight;
  if (defined(z)) {
    const childThickness = tileScale * (rootMaximumHeight - rootMinimumHeight);
    minimumHeight += z * childThickness;
    maximumHeight = minimumHeight + childThickness;
  }

  return [west, south, east, north, minimumHeight, maximumHeight];
}

/**
 * 创建一个占位符 3D 瓦片，其内容将为 Implicit3DTileContent
 * 用于子子树的惰性计算。
 *
 * @param {Implicit3DTileContent} content 内容对象。
 * @param {Cesium3DTile} parentTile 新子树的父级。
 * @param {number} childIndex 子瓦片相对于其父瓦片的莫顿索引
 * @returns {Cesium3DTile} 新的占位符图块
 * @private
 */
function makePlaceholderChildSubtree(content, parentTile, childIndex) {
  const implicitTileset = content._implicitTileset;
  const implicitCoordinates = parentTile.implicitCoordinates.getChildCoordinates(
    childIndex
  );

  const childBoundingVolume = deriveBoundingVolume(
    implicitTileset,
    implicitCoordinates,
    childIndex,
    false,
    parentTile
  );

  // Ignore tile metadata when computing geometric error for the placeholder tile
  // since the child subtree's metadata hasn't been loaded yet.
  // The actual geometric error will be computed in deriveChildTile.
  const childGeometricError = getGeometricError(
    undefined,
    implicitTileset,
    implicitCoordinates
  );

  const childContentUri = implicitTileset.subtreeUriTemplate.getDerivedResource(
    {
      templateValues: implicitCoordinates.getTemplateValues(),
    }
  ).url;
  const tileJson = {
    boundingVolume: childBoundingVolume,
    geometricError: childGeometricError,
    refine: implicitTileset.refine,
    contents: [
      {
        uri: childContentUri,
      },
    ],
  };

  const tile = makeTile(
    content,
    implicitTileset.baseResource,
    tileJson,
    parentTile
  );
  tile.implicitTileset = implicitTileset;
  tile.implicitCoordinates = implicitCoordinates;
  return tile;
}

/**
 * 制作一个 {@link Cesium3DTile}。这将改用内容的图块的构造函数
 * 导入 Cesium3DTile。这是为了避免
 * 此文件和Cesium3DTile.js
 * @param {Implicit3DTileContent} content 隐式内容
 * @param {Resource} baseResource 瓦片集的基础资源
 * @param {object} tileJson 瓦片的 JSON 标头
 * @param {Cesium3DTile} parentTile 新瓦片的父级
 * @returns {Cesium3DTile} 新创建的瓦片。
 * @private
 */
function makeTile(content, baseResource, tileJson, parentTile) {
  const Cesium3DTile = content._tile.constructor;
  return new Cesium3DTile(content._tileset, baseResource, tileJson, parentTile);
}

/**
 * {@link Cesium3DTileContent} 接口的一部分。 <code>Implicit3DTileContent</code>
 * 始终返回 <code>false</code>，因为此类型的瓦片没有任何特征。
 * @private
 */
Implicit3DTileContent.prototype.hasProperty = function (batchId, name) {
  return false;
};

/**
 * {@link Cesium3DTileContent} 接口的一部分。 <code>Implicit3DTileContent</code>
 * 始终返回 <code>undefined</code>，因为此类型的瓦片没有任何特征。
 * @private
 */
Implicit3DTileContent.prototype.getFeature = function (batchId) {
  return undefined;
};

Implicit3DTileContent.prototype.applyDebugSettings = function (
  enabled,
  color
) {};

Implicit3DTileContent.prototype.applyStyle = function (style) {};

Implicit3DTileContent.prototype.update = function (tileset, frameState) {};

Implicit3DTileContent.prototype.pick = function (ray, frameState, result) {
  return undefined;
};

Implicit3DTileContent.prototype.isDestroyed = function () {
  return false;
};

Implicit3DTileContent.prototype.destroy = function () {
  this._implicitSubtree =
    this._implicitSubtree && this._implicitSubtree.destroy();
  return destroyObject(this);
};

// Exposed for testing
Implicit3DTileContent._deriveBoundingBox = deriveBoundingBox;
Implicit3DTileContent._deriveBoundingRegion = deriveBoundingRegion;
Implicit3DTileContent._deriveBoundingVolumeS2 = deriveBoundingVolumeS2;

export default Implicit3DTileContent;
