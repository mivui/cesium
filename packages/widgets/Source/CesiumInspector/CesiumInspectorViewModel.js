import {
  Cartesian3,
  defined,
  destroyObject,
  DebugModelMatrixPrimitive,
  DeveloperError,
  PerformanceDisplay,
  Ray,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  TileCoordinatesImageryProvider,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

function frustumStatisticsToString(statistics) {
  let str;
  if (defined(statistics)) {
    str = "Command Statistics";
    const com = statistics.commandsInFrustums;
    for (const n in com) {
      if (com.hasOwnProperty(n)) {
        let num = parseInt(n, 10);
        let s;
        if (num === 7) {
          s = "1, 2 and 3";
        } else {
          const f = [];
          for (let i = 2; i >= 0; i--) {
            const p = Math.pow(2, i);
            if (num >= p) {
              f.push(i + 1);
              num -= p;
            }
          }
          s = f.reverse().join(" and ");
        }
        str += `<br>&nbsp;&nbsp;&nbsp;&nbsp;${com[n]} in frustum ${s}`;
      }
    }
    str += `<br>Total: ${statistics.totalCommands}`;
  }

  return str;
}

function boundDepthFrustum(lower, upper, proposed) {
  let bounded = Math.min(proposed, upper);
  bounded = Math.max(bounded, lower);
  return bounded;
}

const scratchPickRay = new Ray();
const scratchPickCartesian = new Cartesian3();

/**
 * 视图模型 {@link CesiumInspector}.
 * @alias CesiumInspectorViewModel
 * @constructor
 *
 * @param {Scene} scene 要使用的场景实例。
 * @param {Element} performanceContainer 要用于性能容器的实例
 */
function CesiumInspectorViewModel(scene, performanceContainer) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required");
  }

  if (!defined(performanceContainer)) {
    throw new DeveloperError("performanceContainer is required");
  }
  //>>includeEnd('debug');

  const that = this;
  const canvas = scene.canvas;
  const eventHandler = new ScreenSpaceEventHandler(canvas);
  this._eventHandler = eventHandler;
  this._scene = scene;
  this._canvas = canvas;
  this._primitive = undefined;
  this._tile = undefined;
  this._modelMatrixPrimitive = undefined;
  this._performanceDisplay = undefined;
  this._performanceContainer = performanceContainer;

  const globe = this._scene.globe;
  globe.depthTestAgainstTerrain = true;

  /**
   * 获取或设置显示 frustum 状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.frustums = false;

  /**
   * 获取或设置显示 frustum 飞行状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.frustumPlanes = false;

  /**
   * 获取或设置显示性能显示状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.performance = false;

  /**
   * 获取或设置着色器缓存文本.  这个属性是可观察的。
   * @type {string}
   * @default ''
   */
  this.shaderCacheText = "";

  /**
   * 获取或设置显示原始边界球状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.primitiveBoundingSphere = false;

  /**
   * 获取或设置显示原始参考帧状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.primitiveReferenceFrame = false;

  /**
   * 获取或设置滤波原态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.filterPrimitive = false;

  /**
   * 获取或设置显示tile边界球状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.tileBoundingSphere = false;

  /**
   * 获取或设置 tile 状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.filterTile = false;

  /**
   * 获取或设置显示线框状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.wireframe = false;

  /**
   * 获取或设置要显示的深度截锥的索引.  这个属性是可观察的。
   * @type {number}
   * @default 1
   */
  this.depthFrustum = 1;
  this._numberOfFrustums = 1;

  /**
   * 获取或设置挂起更新状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.suspendUpdates = false;

  /**
   * 获取或设置显示tile坐标状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.tileCoordinates = false;

  /**
   * 获取或设置截锥体统计文本.  这个属性是可观察的。
   * @type {string}
   * @default ''
   */
  this.frustumStatisticText = false;

  /**
   * 获取或设置选定的tile信息文本.  这个属性是可观察的。
   * @type {string}
   * @default ''
   */
  this.tileText = "";

  /**
   * 获取是否选中Primitive。  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.hasPickedPrimitive = false;

  /**
   * 获取 tile 已被选中.  这个属性是可观察的
   * @type {boolean}
   * @default false
   */
  this.hasPickedTile = false;

  /**
   * 获取拾取原语命令处于活动状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.pickPrimitiveActive = false;

  /**
   * 获取拾取瓷砖命令处于活动状态.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.pickTileActive = false;

  /**
   * 获取或设置是否可见铯检查器下拉列表.  这个属性是可观察的。
   * @type {boolean}
   * @default true
   */
  this.dropDownVisible = true;

  /**
   * 获取或设置是否一般部分是可见的。  这个属性是可观察的。
   * @type {boolean}
   * @default true
   */
  this.generalVisible = true;

  /**
   * 获取或设置是否 primitive 部分可见.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.primitivesVisible = false;

  /**
   * 获取或设置是否 terrain 部分可见.  这个属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.terrainVisible = false;

  /**
   * 获取或设置深度截锥文本的索引。  这个属性是可观察的。
   * @type {string}
   * @default ''
   */
  this.depthFrustumText = "";

  knockout.track(this, [
    "frustums",
    "frustumPlanes",
    "performance",
    "shaderCacheText",
    "primitiveBoundingSphere",
    "primitiveReferenceFrame",
    "filterPrimitive",
    "tileBoundingSphere",
    "filterTile",
    "wireframe",
    "depthFrustum",
    "suspendUpdates",
    "tileCoordinates",
    "frustumStatisticText",
    "tileText",
    "hasPickedPrimitive",
    "hasPickedTile",
    "pickPrimitiveActive",
    "pickTileActive",
    "dropDownVisible",
    "generalVisible",
    "primitivesVisible",
    "terrainVisible",
    "depthFrustumText",
  ]);

  this._toggleDropDown = createCommand(function () {
    that.dropDownVisible = !that.dropDownVisible;
  });

  this._toggleGeneral = createCommand(function () {
    that.generalVisible = !that.generalVisible;
  });

  this._togglePrimitives = createCommand(function () {
    that.primitivesVisible = !that.primitivesVisible;
  });

  this._toggleTerrain = createCommand(function () {
    that.terrainVisible = !that.terrainVisible;
  });

  this._frustumsSubscription = knockout
    .getObservable(this, "frustums")
    .subscribe(function (val) {
      that._scene.debugShowFrustums = val;
      that._scene.requestRender();
    });

  this._frustumPlanesSubscription = knockout
    .getObservable(this, "frustumPlanes")
    .subscribe(function (val) {
      that._scene.debugShowFrustumPlanes = val;
      that._scene.requestRender();
    });

  this._performanceSubscription = knockout
    .getObservable(this, "performance")
    .subscribe(function (val) {
      if (val) {
        that._performanceDisplay = new PerformanceDisplay({
          container: that._performanceContainer,
        });
      } else {
        that._performanceContainer.innerHTML = "";
      }
    });

  this._showPrimitiveBoundingSphere = createCommand(function () {
    that._primitive.debugShowBoundingVolume = that.primitiveBoundingSphere;
    that._scene.requestRender();
    return true;
  });

  this._primitiveBoundingSphereSubscription = knockout
    .getObservable(this, "primitiveBoundingSphere")
    .subscribe(function () {
      that._showPrimitiveBoundingSphere();
    });

  this._showPrimitiveReferenceFrame = createCommand(function () {
    if (that.primitiveReferenceFrame) {
      const modelMatrix = that._primitive.modelMatrix;
      that._modelMatrixPrimitive = new DebugModelMatrixPrimitive({
        modelMatrix: modelMatrix,
      });
      that._scene.primitives.add(that._modelMatrixPrimitive);
    } else if (defined(that._modelMatrixPrimitive)) {
      that._scene.primitives.remove(that._modelMatrixPrimitive);
      that._modelMatrixPrimitive = undefined;
    }
    that._scene.requestRender();
    return true;
  });

  this._primitiveReferenceFrameSubscription = knockout
    .getObservable(this, "primitiveReferenceFrame")
    .subscribe(function () {
      that._showPrimitiveReferenceFrame();
    });

  this._doFilterPrimitive = createCommand(function () {
    if (that.filterPrimitive) {
      that._scene.debugCommandFilter = function (command) {
        if (
          defined(that._modelMatrixPrimitive) &&
          command.owner === that._modelMatrixPrimitive._primitive
        ) {
          return true;
        } else if (defined(that._primitive)) {
          return (
            command.owner === that._primitive ||
            command.owner === that._primitive._billboardCollection ||
            command.owner.primitive === that._primitive
          );
        }
        return false;
      };
    } else {
      that._scene.debugCommandFilter = undefined;
    }
    return true;
  });

  this._filterPrimitiveSubscription = knockout
    .getObservable(this, "filterPrimitive")
    .subscribe(function () {
      that._doFilterPrimitive();
      that._scene.requestRender();
    });

  this._wireframeSubscription = knockout
    .getObservable(this, "wireframe")
    .subscribe(function (val) {
      globe._surface.tileProvider._debug.wireframe = val;
      that._scene.requestRender();
    });

  this._depthFrustumSubscription = knockout
    .getObservable(this, "depthFrustum")
    .subscribe(function (val) {
      that._scene.debugShowDepthFrustum = val;
      that._scene.requestRender();
    });

  this._incrementDepthFrustum = createCommand(function () {
    const next = that.depthFrustum + 1;
    that.depthFrustum = boundDepthFrustum(1, that._numberOfFrustums, next);
    that._scene.requestRender();
    return true;
  });

  this._decrementDepthFrustum = createCommand(function () {
    const next = that.depthFrustum - 1;
    that.depthFrustum = boundDepthFrustum(1, that._numberOfFrustums, next);
    that._scene.requestRender();
    return true;
  });

  this._suspendUpdatesSubscription = knockout
    .getObservable(this, "suspendUpdates")
    .subscribe(function (val) {
      globe._surface._debug.suspendLodUpdate = val;
      if (!val) {
        that.filterTile = false;
      }
    });

  let tileBoundariesLayer;
  this._showTileCoordinates = createCommand(function () {
    if (that.tileCoordinates && !defined(tileBoundariesLayer)) {
      tileBoundariesLayer = scene.imageryLayers.addImageryProvider(
        new TileCoordinatesImageryProvider({
          tilingScheme: scene.terrainProvider.tilingScheme,
        })
      );
    } else if (!that.tileCoordinates && defined(tileBoundariesLayer)) {
      scene.imageryLayers.remove(tileBoundariesLayer);
      tileBoundariesLayer = undefined;
    }
    return true;
  });

  this._tileCoordinatesSubscription = knockout
    .getObservable(this, "tileCoordinates")
    .subscribe(function () {
      that._showTileCoordinates();
      that._scene.requestRender();
    });

  this._tileBoundingSphereSubscription = knockout
    .getObservable(this, "tileBoundingSphere")
    .subscribe(function () {
      that._showTileBoundingSphere();
      that._scene.requestRender();
    });

  this._showTileBoundingSphere = createCommand(function () {
    if (that.tileBoundingSphere) {
      globe._surface.tileProvider._debug.boundingSphereTile = that._tile;
    } else {
      globe._surface.tileProvider._debug.boundingSphereTile = undefined;
    }
    that._scene.requestRender();
    return true;
  });

  this._doFilterTile = createCommand(function () {
    if (!that.filterTile) {
      that.suspendUpdates = false;
    } else {
      that.suspendUpdates = true;

      globe._surface._tilesToRender = [];

      if (defined(that._tile) && that._tile.renderable) {
        globe._surface._tilesToRender.push(that._tile);
      }
    }
    return true;
  });

  this._filterTileSubscription = knockout
    .getObservable(this, "filterTile")
    .subscribe(function () {
      that.doFilterTile();
      that._scene.requestRender();
    });

  function pickPrimitive(e) {
    const newPick = that._scene.pick({
      x: e.position.x,
      y: e.position.y,
    });
    if (defined(newPick)) {
      that.primitive = defined(newPick.collection)
        ? newPick.collection
        : newPick.primitive;
    }

    that._scene.requestRender();
    that.pickPrimitiveActive = false;
  }

  this._pickPrimitive = createCommand(function () {
    that.pickPrimitiveActive = !that.pickPrimitiveActive;
  });

  this._pickPrimitiveActiveSubscription = knockout
    .getObservable(this, "pickPrimitiveActive")
    .subscribe(function (val) {
      if (val) {
        eventHandler.setInputAction(
          pickPrimitive,
          ScreenSpaceEventType.LEFT_CLICK
        );
      } else {
        eventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      }
    });

  function selectTile(e) {
    let selectedTile;
    const ellipsoid = globe.ellipsoid;

    const ray = that._scene.camera.getPickRay(e.position, scratchPickRay);
    const cartesian = globe.pick(ray, that._scene, scratchPickCartesian);

    if (defined(cartesian)) {
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      const tilesRendered =
        globe._surface.tileProvider._tilesToRenderByTextureCount;
      for (
        let textureCount = 0;
        !selectedTile && textureCount < tilesRendered.length;
        ++textureCount
      ) {
        const tilesRenderedByTextureCount = tilesRendered[textureCount];
        if (!defined(tilesRenderedByTextureCount)) {
          continue;
        }

        for (
          let tileIndex = 0;
          !selectedTile && tileIndex < tilesRenderedByTextureCount.length;
          ++tileIndex
        ) {
          const tile = tilesRenderedByTextureCount[tileIndex];
          if (Rectangle.contains(tile.rectangle, cartographic)) {
            selectedTile = tile;
          }
        }
      }
    }

    that.tile = selectedTile;

    that.pickTileActive = false;
  }

  this._pickTile = createCommand(function () {
    that.pickTileActive = !that.pickTileActive;
  });

  this._pickTileActiveSubscription = knockout
    .getObservable(this, "pickTileActive")
    .subscribe(function (val) {
      if (val) {
        eventHandler.setInputAction(
          selectTile,
          ScreenSpaceEventType.LEFT_CLICK
        );
      } else {
        eventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      }
    });

  this._removePostRenderEvent = scene.postRender.addEventListener(function () {
    that._update();
  });
}

Object.defineProperties(CesiumInspectorViewModel.prototype, {
  /**
   * 得到场景控制.
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取PerformanceDisplay的容器
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Element}
   */
  performanceContainer: {
    get: function () {
      return this._performanceContainer;
    },
  },

  /**
   * 获取切换下拉列表可见性的命令。
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  toggleDropDown: {
    get: function () {
      return this._toggleDropDown;
    },
  },

  /**
   * 获取用于为原语切换BoundingSphere的可见性的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  showPrimitiveBoundingSphere: {
    get: function () {
      return this._showPrimitiveBoundingSphere;
    },
  },

  /**
   * 控件的可见性的命令 {@link DebugModelMatrixPrimitive} 对于原语的模型矩阵
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  showPrimitiveReferenceFrame: {
    get: function () {
      return this._showPrimitiveReferenceFrame;
    },
  },

  /**
   * 获取用于切换仅呈现选定原语的筛选器的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  doFilterPrimitive: {
    get: function () {
      return this._doFilterPrimitive;
    },
  },

  /**
   * 获取用于增加要显示的深度截锥体索引的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  incrementDepthFrustum: {
    get: function () {
      return this._incrementDepthFrustum;
    },
  },

  /**
   * 获取用于减少要显示的深度截锥体索引的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  decrementDepthFrustum: {
    get: function () {
      return this._decrementDepthFrustum;
    },
  },

  /**
   * 获取用于切换 tile 坐标可见性的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  showTileCoordinates: {
    get: function () {
      return this._showTileCoordinates;
    },
  },

  /**
   * 获取用于为选定 tile 切换BoundingSphere的可见性的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  showTileBoundingSphere: {
    get: function () {
      return this._showTileBoundingSphere;
    },
  },

  /**
   * 获取用于切换仅呈现选定磁贴的筛选器的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  doFilterTile: {
    get: function () {
      return this._doFilterTile;
    },
  },

  /**
   * 获取展开和折叠常规部分的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  toggleGeneral: {
    get: function () {
      return this._toggleGeneral;
    },
  },

  /**
   * 获取展开和折叠原语部分的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  togglePrimitives: {
    get: function () {
      return this._togglePrimitives;
    },
  },

  /**
   * 获取展开和折叠地形部分的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  toggleTerrain: {
    get: function () {
      return this._toggleTerrain;
    },
  },

  /**
   * 获取选择原语的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  pickPrimitive: {
    get: function () {
      return this._pickPrimitive;
    },
  },

  /**
   * 获取选择tile的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  pickTile: {
    get: function () {
      return this._pickTile;
    },
  },

  /**
   * 获取选择tile的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  selectParent: {
    get: function () {
      const that = this;
      return createCommand(function () {
        that.tile = that.tile.parent;
      });
    },
  },

  /**
   * 获取选择tile的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  selectNW: {
    get: function () {
      const that = this;
      return createCommand(function () {
        that.tile = that.tile.northwestChild;
      });
    },
  },

  /**
   * 获取选择tile的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  selectNE: {
    get: function () {
      const that = this;
      return createCommand(function () {
        that.tile = that.tile.northeastChild;
      });
    },
  },

  /**
   * 获取选择tile的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  selectSW: {
    get: function () {
      const that = this;
      return createCommand(function () {
        that.tile = that.tile.southwestChild;
      });
    },
  },

  /**
   * 获取选择tile的命令
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  selectSE: {
    get: function () {
      const that = this;
      return createCommand(function () {
        that.tile = that.tile.southeastChild;
      });
    },
  },

  /**
   * 获取或设置当前选中的primitive
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  primitive: {
    get: function () {
      return this._primitive;
    },
    set: function (newPrimitive) {
      const oldPrimitive = this._primitive;
      if (newPrimitive !== oldPrimitive) {
        this.hasPickedPrimitive = true;
        if (defined(oldPrimitive)) {
          oldPrimitive.debugShowBoundingVolume = false;
        }
        this._scene.debugCommandFilter = undefined;
        if (defined(this._modelMatrixPrimitive)) {
          this._scene.primitives.remove(this._modelMatrixPrimitive);
          this._modelMatrixPrimitive = undefined;
        }
        this._primitive = newPrimitive;
        newPrimitive.show = false;
        setTimeout(function () {
          newPrimitive.show = true;
        }, 50);
        this.showPrimitiveBoundingSphere();
        this.showPrimitiveReferenceFrame();
        this.doFilterPrimitive();
      }
    },
  },

  /**
   * 获取或设置当前选中的tile
   * @memberof CesiumInspectorViewModel.prototype
   *
   * @type {Command}
   */
  tile: {
    get: function () {
      return this._tile;
    },
    set: function (newTile) {
      if (defined(newTile)) {
        this.hasPickedTile = true;
        const oldTile = this._tile;
        if (newTile !== oldTile) {
          this.tileText = `L: ${newTile.level} X: ${newTile.x} Y: ${newTile.y}`;
          this.tileText += `<br>SW corner: ${newTile.rectangle.west}, ${newTile.rectangle.south}`;
          this.tileText += `<br>NE corner: ${newTile.rectangle.east}, ${newTile.rectangle.north}`;
          const data = newTile.data;
          if (defined(data) && defined(data.tileBoundingRegion)) {
            this.tileText += `<br>Min: ${data.tileBoundingRegion.minimumHeight} Max: ${data.tileBoundingRegion.maximumHeight}`;
          } else {
            this.tileText += "<br>(Tile is not loaded)";
          }
        }
        this._tile = newTile;
        this.showTileBoundingSphere();
        this.doFilterTile();
      } else {
        this.hasPickedTile = false;
        this._tile = undefined;
      }
    },
  },
});

/**
 * 更新视图模型
 * @private
 */
CesiumInspectorViewModel.prototype._update = function () {
  if (this.frustums) {
    this.frustumStatisticText = frustumStatisticsToString(
      this._scene.debugFrustumStatistics
    );
  }

  // Determine the number of frustums being used.
  const numberOfFrustums = this._scene.numberOfFrustums;
  this._numberOfFrustums = numberOfFrustums;
  // Bound the frustum to be displayed.
  this.depthFrustum = boundDepthFrustum(1, numberOfFrustums, this.depthFrustum);
  // Update the displayed text.
  this.depthFrustumText = `${this.depthFrustum} of ${numberOfFrustums}`;

  if (this.performance) {
    this._performanceDisplay.update();
  }
  if (this.primitiveReferenceFrame) {
    this._modelMatrixPrimitive.modelMatrix = this._primitive.modelMatrix;
  }

  this.shaderCacheText = `Cached shaders: ${this._scene.context.shaderCache.numberOfShaders}`;
};

/**
 * @returns {boolean} 如果对象已被销毁，则为true，否则为false。
 */
CesiumInspectorViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 *  销毁小部件。如果从布局中永久删除小部件，
 *  则应该调用。
 */
CesiumInspectorViewModel.prototype.destroy = function () {
  this._eventHandler.destroy();
  this._removePostRenderEvent();
  this._frustumsSubscription.dispose();
  this._frustumPlanesSubscription.dispose();
  this._performanceSubscription.dispose();
  this._primitiveBoundingSphereSubscription.dispose();
  this._primitiveReferenceFrameSubscription.dispose();
  this._filterPrimitiveSubscription.dispose();
  this._wireframeSubscription.dispose();
  this._depthFrustumSubscription.dispose();
  this._suspendUpdatesSubscription.dispose();
  this._tileCoordinatesSubscription.dispose();
  this._tileBoundingSphereSubscription.dispose();
  this._filterTileSubscription.dispose();
  this._pickPrimitiveActiveSubscription.dispose();
  this._pickTileActiveSubscription.dispose();
  return destroyObject(this);
};
export default CesiumInspectorViewModel;
