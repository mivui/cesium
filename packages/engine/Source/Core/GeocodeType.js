// @ts-check

/**
 * {@link GeocoderService}执行的地理编码类型。
 * @enum {number}
 * @see Geocoder
 */
const GeocodeType = {
  /**
   * 执行搜索，将输入视为完整输入。
   *
   * @type {number}
   * @constant
   */
  SEARCH: 0,

  /**
   * 使用部分输入执行自动完成，通常
   * 用于在用户输入时提供可能的结果。
   *
   * @type {number}
   * @constant
   */
  AUTOCOMPLETE: 1,
};

Object.freeze(GeocodeType);

export default GeocodeType;
