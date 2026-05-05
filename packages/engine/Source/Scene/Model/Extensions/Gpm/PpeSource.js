// @ts-check

/**
 * An enum of per-point error sources.
 *
 * This reflects the `ppeMetadata.source` definition of the
 * {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF extension.
 *
 * @enum {string}
 * @private
 */
const PpeSource = {
  /**
   * MCS x 维度的 PPE 误差标准差 (sigma x)。该值将被平方并用于填充 PPE 协方差矩阵的 (1,1) 元素。
   *
   * @type {string}
   * @constant
   */
  SIGX: "SIGX",

  /**
   * MCS y 维度的 PPE 误差标准差 (sigma y)。该值将被平方并用于填充 PPE 协方差矩阵的 (2,2) 元素。
   *
   * @type {string}
   * @constant
   */
  SIGY: "SIGY",

  /**
   * MCS z 维度的 PPE 误差标准差 (sigma z)。该值将被平方并用于填充 PPE 协方差矩阵的 (3,3) 元素。
   *
   * @type {string}
   * @constant
   */
  SIGZ: "SIGZ",

  /**
   * MCS x 维度的 PPE 误差方差 (sigma x2)。该值将用于填充 PPE 协方差矩阵的 (1,1) 元素。
   *
   * @type {string}
   * @constant
   */
  VARX: "VARX",

  /**
   * MCS y 维度的 PPE 误差方差 (sigma y2)。该值将用于填充 PPE 协方差矩阵的 (2,2) 元素。
   *
   * @type {string}
   * @constant
   */
  VARY: "VARY",

  /**
   * MCS z 维度的 PPE 误差方差 (sigma z2)。该值将用于填充 PPE 协方差矩阵的 (3,3) 元素。
   *
   * @type {string}
   * @constant
   */
  VARZ: "VARZ",

  /**
   * MCS 水平维度 (x-y) 的 PPE 径向误差 (sigma radial)。该值将被平方并用于填充 PPE 协方差矩阵的 (1,1) 和 (2,2) 元素。
   *
   * @type {string}
   * @constant
   */
  SIGR: "VARZ",
};

Object.freeze(PpeSource);

export default PpeSource;
