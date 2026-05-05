/**
 * Local Generic Point-cloud Model information about a glTF primitive.
 *
 * @param {PpeTexture[]} ppeTextures The Per-Point Error textures
 *
 * @constructor
 * @private
 */
function MeshPrimitiveGpmLocal(ppeTextures) {
  this._ppeTextures = ppeTextures;
}

Object.defineProperties(MeshPrimitiveGpmLocal.prototype, {
  /**
   * PPE 纹理数组。
   *
   * @memberof MeshPrimitiveGpmLocal.prototype
   * @type {PpeTexture[]|undefined}
   * @readonly
   */
  ppeTextures: {
    get: function () {
      return this._ppeTextures;
    },
  },
});

export default MeshPrimitiveGpmLocal;
