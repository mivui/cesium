import ColorBlendMode from "./ColorBlendMode.js";

/**
 * 应用于 {@link Cesium3DTileset#colorBlendMode} 的颜色混合模式。
 * 这些值映射到 {@link ColorBlendMode} 枚举。
 *
 * @enum {number}
 */
const Cesium3DTileColorBlendMode = {
  HIGHLIGHT: ColorBlendMode.HIGHLIGHT,
  REPLACE: ColorBlendMode.REPLACE,
  MIX: ColorBlendMode.MIX,
};

Object.freeze(Cesium3DTileColorBlendMode);

export default Cesium3DTileColorBlendMode;
