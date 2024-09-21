/**
 * {@link GeocoderService} 要执行的地理编码类型。
 * @enum {number}
 * @see Geocoder
 */
const GeocodeType = {
  /**
   * 在输入被视为完成的地方执行搜索。
   *
   * @type {number}
   * @constant
   */
  SEARCH: 0,

  /**
   * 使用部分输入执行自动完成，通常
   * 保留用于在用户键入时提供可能的结果。
   *
   * @type {number}
   * @constant
   */
  AUTOCOMPLETE: 1,
};
export default Object.freeze(GeocodeType);
