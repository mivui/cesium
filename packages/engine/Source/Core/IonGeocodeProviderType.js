// @ts-check

/**
 * 可通过Cesium ion使用的底层地理编码服务。
 *
 * @enum {string}
 */
const IonGeocodeProviderType = {
  /**
   * Google地理编码器，用于Google数据。
   *
   * @type {string}
   * @constant
   */
  GOOGLE: "GOOGLE",

  /**
   * Bing地理编码器，用于Bing数据。
   *
   * @type {string}
   * @constant
   */
  BING: "BING",

  /**
   * 使用服务器上设置的默认地理编码器。当既不使用Bing也不使用Google数据时使用。
   *
   * @type {string}
   * @constant
   */
  DEFAULT: "DEFAULT",
};

Object.freeze(IonGeocodeProviderType);

export default IonGeocodeProviderType;
