/**
 * 描述由关节阶段定义的运动类型的枚举
 * 在agi_artications扩展。
 *
 * @alias {ArticulationStageType}
 * @enum {string}
 *
 * @private
 */
const ArticulationStageType = {
  XTRANSLATE: "xTranslate",
  YTRANSLATE: "yTranslate",
  ZTRANSLATE: "zTranslate",
  XROTATE: "xRotate",
  YROTATE: "yRotate",
  ZROTATE: "zRotate",
  XSCALE: "xScale",
  YSCALE: "yScale",
  ZSCALE: "zScale",
  UNIFORMSCALE: "uniformScale",
};

export default Object.freeze(ArticulationStageType);
