import Check from "../Core/Check.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";

/**
 * {@link PostProcessStage} 或其他逻辑上一起执行的后处理复合阶段的集合。
 * <p>
 * 所有阶段都按数组的顺序执行。输入纹理根据 <code>inputPreviousStageTexture</code> 的值而变化。
 * 如果 <code>inputPreviousStageTexture</code> 为 <code>true</code>，则每个阶段的输入是场景或之前执行的阶段渲染的输出纹理。
 * 如果 <code>inputPreviousStageTexture</code> 为 <code>false</code>，则合成中每个阶段的输入纹理都相同。输入纹理是场景渲染到的纹理
 * 或上一阶段的输出纹理。
 * </p>
 *
 * @alias PostProcessStageComposite
 * @constructor
 *
 * @param {object} options  对象，具有以下属性:
 * @param {Array} options.stages 要按顺序执行的 {@link 个 PostProcessStage} 或复合数组。
 * @param {boolean} [options.inputPreviousStageTexture=true] 是否执行每个后处理阶段，其中一个阶段的输入是前一个阶段的输出。否则，每个包含的阶段的输入是在合成之前执行的阶段的输出。
 * @param {string} [options.name=createGuid()] 此后处理阶段的唯一名称，供其他合成引用。如果未提供名称，将生成 GUID。
 * @param {object} [options.uniforms] 后处理阶段的 uniform 的别名。
 *
 * @exception {DeveloperError} options.stages.length must be greater than 0.0.
 *
 * @see PostProcessStage
 *
 * @example
 * // Example 1: separable blur filter
 * // The input to blurXDirection is the texture rendered to by the scene or the output of the previous stage.
 * // The input to blurYDirection is the texture rendered to by blurXDirection.
 * scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
 *     stages : [blurXDirection, blurYDirection]
 * }));
 *
 * @example
 * // Example 2: referencing the output of another post-process stage
 * scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
 *     inputPreviousStageTexture : false,
 *     stages : [
 *         // The same as Example 1.
 *         new Cesium.PostProcessStageComposite({
 *             inputPreviousStageTexture : true
 *             stages : [blurXDirection, blurYDirection],
 *             name : 'blur'
 *         }),
 *         // The input texture for this stage is the same input texture to blurXDirection since inputPreviousStageTexture is false
 *         new Cesium.PostProcessStage({
 *             fragmentShader : compositeShader,
 *             uniforms : {
 *                 blurTexture : 'blur' // The output of the composite with name 'blur' (the texture that blurYDirection rendered to).
 *             }
 *         })
 *     ]
 * });
 *
 * @example
 * // Example 3: create a uniform alias
 * const uniforms = {};
 * Cesium.defineProperties(uniforms, {
 *     filterSize : {
 *         get : function() {
 *             return blurXDirection.uniforms.filterSize;
 *         },
 *         set : function(value) {
 *             blurXDirection.uniforms.filterSize = blurYDirection.uniforms.filterSize = value;
 *         }
 *     }
 * });
 * scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
 *     stages : [blurXDirection, blurYDirection],
 *     uniforms : uniforms
 * }));
 */
function PostProcessStageComposite(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.stages", options.stages);
  Check.typeOf.number.greaterThan(
    "options.stages.length",
    options.stages.length,
    0,
  );
  //>>includeEnd('debug');

  this._stages = options.stages;
  this._inputPreviousStageTexture = defaultValue(
    options.inputPreviousStageTexture,
    true,
  );

  let name = options.name;
  if (!defined(name)) {
    name = createGuid();
  }
  this._name = name;

  this._uniforms = options.uniforms;

  // used by PostProcessStageCollection
  this._textureCache = undefined;
  this._index = undefined;

  this._selected = undefined;
  this._selectedShadow = undefined;
  this._parentSelected = undefined;
  this._parentSelectedShadow = undefined;
  this._combinedSelected = undefined;
  this._combinedSelectedShadow = undefined;
  this._selectedLength = 0;
  this._parentSelectedLength = 0;
  this._selectedDirty = true;
}

Object.defineProperties(PostProcessStageComposite.prototype, {
  /**
   * 确定此后处理阶段是否已准备好执行。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      const stages = this._stages;
      const length = stages.length;
      for (let i = 0; i < length; ++i) {
        if (!stages[i].ready) {
          return false;
        }
      }
      return true;
    },
  },
  /**
   * 此后处理阶段的唯一名称，供 PostProcessStageComposite 中的其他阶段引用。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },
  /**
   * 准备就绪时是否执行此后处理阶段。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {boolean}
   */
  enabled: {
    get: function () {
      return this._stages[0].enabled;
    },
    set: function (value) {
      const stages = this._stages;
      const length = stages.length;
      for (let i = 0; i < length; ++i) {
        stages[i].enabled = value;
      }
    },
  },
  /**
   * 后处理阶段的 uniform 值的别名。可能是<code>未定义的</code>;在这种情况下，请获取每个阶段以设置 uniform 值。
   * @memberof PostProcessStageComposite.prototype
   * @type {object}
   */
  uniforms: {
    get: function () {
      return this._uniforms;
    },
  },
  /**
   * 所有后处理阶段都按数组的顺序执行。输入纹理根据 <code>inputPreviousStageTexture</code> 的值而变化。
   * 如果 <code>inputPreviousStageTexture</code> 为 <code>true</code>，则每个阶段的输入是场景或之前执行的阶段渲染的输出纹理。
   * 如果 <code>inputPreviousStageTexture</code> 为 <code>false</code>，则合成中每个阶段的输入纹理都相同。输入纹理是场景渲染到的纹理
   * 或上一阶段的输出纹理。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {boolean}
   * @readonly
   */
  inputPreviousStageTexture: {
    get: function () {
      return this._inputPreviousStageTexture;
    },
  },
  /**
   * 此合成中的后处理阶段数。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._stages.length;
    },
  },
  /**
   * 为应用后处理而选择的特征。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {Array}
   */
  selected: {
    get: function () {
      return this._selected;
    },
    set: function (value) {
      this._selected = value;
    },
  },
  /**
   * @private
   */
  parentSelected: {
    get: function () {
      return this._parentSelected;
    },
    set: function (value) {
      this._parentSelected = value;
    },
  },
});

/**
 * @private
 */
PostProcessStageComposite.prototype._isSupported = function (context) {
  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    if (!stages[i]._isSupported(context)) {
      return false;
    }
  }
  return true;
};

/**
 * 获取<code>索引</code>处的后处理阶段
 *
 * @param {number} index 后处理阶段或复合的索引。
 * @return {PostProcessStage|PostProcessStageComposite} 索引处的后处理阶段或合成。
 *
 * @exception {DeveloperError} 索引必须大于或等于 0。
 * @exception {DeveloperError} 索引必须小于 {@link PostProcessStageComposite#length}。
 */
PostProcessStageComposite.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThan("index", index, this.length);
  //>>includeEnd('debug');
  return this._stages[index];
};

function isSelectedTextureDirty(stage) {
  let length = defined(stage._selected) ? stage._selected.length : 0;
  const parentLength = defined(stage._parentSelected)
    ? stage._parentSelected
    : 0;
  let dirty =
    stage._selected !== stage._selectedShadow ||
    length !== stage._selectedLength;
  dirty =
    dirty ||
    stage._parentSelected !== stage._parentSelectedShadow ||
    parentLength !== stage._parentSelectedLength;

  if (defined(stage._selected) && defined(stage._parentSelected)) {
    stage._combinedSelected = stage._selected.concat(stage._parentSelected);
  } else if (defined(stage._parentSelected)) {
    stage._combinedSelected = stage._parentSelected;
  } else {
    stage._combinedSelected = stage._selected;
  }

  if (!dirty && defined(stage._combinedSelected)) {
    if (!defined(stage._combinedSelectedShadow)) {
      return true;
    }

    length = stage._combinedSelected.length;
    for (let i = 0; i < length; ++i) {
      if (stage._combinedSelected[i] !== stage._combinedSelectedShadow[i]) {
        return true;
      }
    }
  }
  return dirty;
}

/**
 * 将在执行之前调用的函数。更新合成中的每个后处理阶段。
 * @param {Context} context 上下文。
 * @param {boolean} useLogDepth 场景是否使用对数深度缓冲区。
 * @private
 */
PostProcessStageComposite.prototype.update = function (context, useLogDepth) {
  this._selectedDirty = isSelectedTextureDirty(this);

  this._selectedShadow = this._selected;
  this._parentSelectedShadow = this._parentSelected;
  this._combinedSelectedShadow = this._combinedSelected;
  this._selectedLength = defined(this._selected) ? this._selected.length : 0;
  this._parentSelectedLength = defined(this._parentSelected)
    ? this._parentSelected.length
    : 0;

  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    const stage = stages[i];
    if (this._selectedDirty) {
      stage.parentSelected = this._combinedSelected;
    }
    stage.update(context, useLogDepth);
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <p>
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象被销毁，<code>则为 true</code>;否则为 <code>false</code>。
 *
 * @see PostProcessStageComposite#destroy
 */
PostProcessStageComposite.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <p>
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @see PostProcessStageComposite#isDestroyed
 */
PostProcessStageComposite.prototype.destroy = function () {
  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    stages[i].destroy();
  }
  return destroyObject(this);
};
export default PostProcessStageComposite;
