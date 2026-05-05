// @ts-check

/**
 * 描述 <code>Primitive</code> 生命周期的状态，
 * 由 <code>primitive._state</code> 表示。
 *
 * 状态转换由 <code>update</code> 函数调用触发，
 * 但如果图元的 <code>asynchronous</code> 标志设置为 <code>true</code>，
 * 则实际的状态变化可能异步发生。
 *
 * @enum {number}
 * @private
 */
const PrimitiveState = {
  /**
   * 图元的初始状态。
   *
   * 注意，这并不表示图元"准备好"了（由 <code>_ready</code> 属性指示）。
   * 它意味着相反的情况：完全没有对图元进行任何操作。
   *
   * 对于使用 <code>asynchronous:true</code> 设置创建且处于此状态的图元，
   * <code>update</code> 调用将使用 web workers 开始创建几何体，
   * 图元将进入 <code>CREATING</code> 状态。
   *
   * 对于同步创建的图元，此状态永远无关紧要。它们将直接进入
   * COMBINED（或 FAILED）状态，前提是它们尚未处于 FAILED、COMBINED 或 COMPLETE 状态。
   */
  READY: 0,

  /**
   * 正在创建图元几何体的过程。
   *
   * 图元只有在使用 <code>asynchronous:true</code> 设置创建时才可能处于此状态。
   *
   * 这意味着 web workers 正在创建图元的几何体。
   *
   * 当几何体创建成功时，图元将进入 CREATED 状态。否则，它将进入 FAILED 状态。
   * 这两种情况都将异步发生。
   *
   * 必须定期调用 <code>update</code> 函数，直到达到其中一种状态。
   */
  CREATING: 1,

  /**
   * 图元的几何体已创建。
   *
   * 图元只有在使用 <code>asynchronous:true</code> 设置创建时才可能处于此状态。
   *
   * 这意味着 web workers 已（异步）完成了几何体的创建，但还需要进一步的（异步）处理：
   * 如果在调用 <code>update</code> 期间确定图元处于此状态，
   * 将触发一个异步进程来"组合"几何体，意味着图元将进入 COMBINING 状态。
   */
  CREATED: 2,

  /**
   * 异步几何体创建已完成，但几何体组合的异步过程尚未完成。
   *
   * 图元只有在使用 <code>asynchronous:true</code> 设置创建时才可能处于此状态。
   *
   * 这意味着使用 <code>PrimitivePipeline.packCombineGeometryParameters</code> 完成的操作
   * 尚未完成。当组合几何体成功时，图元将进入 COMBINED 状态。否则，它将进入 FAILED 状态。
   */
  COMBINING: 3,

  /**
   * 几何体数据处于可以上传到 GPU 的形式。
   *
   * 对于 <i>同步</i> 图元，这意味着由于首次调用 <code>update</code> 函数而（同步）创建了几何体。
   *
   * 对于 <i>异步</i> 图元，这意味着异步几何体创建和异步几何体组合都已完成。
   *
   * 必须定期调用 <code>update</code> 函数，直到达到此状态。
   * 达到此状态时，<code>update</code> 调用将导致过渡到 COMPLETE 状态。
   */
  COMBINED: 4,

  /**
   * 几何体已创建并上传到 GPU。
   *
   * 达到此状态时，最终会导致图元的 <code>_ready</code> 标志变为 <code>true</code>。
   *
   * 注意：设置 <code>ready</code> 标志不会发生在 <code>update</code> 调用中：
   * 它只发生在渲染下一帧之后！
   *
   * 注意：此状态并不意味着不再需要完成任何工作（因此工作并非"完成"）。
   * 当图元处于此状态时，仍然必须定期调用 <code>update</code> 函数。
   */
  COMPLETE: 5,

  /**
   * 图元创建失败。
   *
   * 达到此状态时，最终会导致图元的 <code>_ready</code> 标志变为 <code>true</code>。
   *
   * 注意：设置 <code>ready</code> 标志不会发生在 <code>update</code> 调用中：
   * 它只发生在渲染下一帧之后！
   *
   * 当（同步或异步）几何体创建或（异步）几何体组合导致任何形式的错误时，
   * 可以达到此状态。
   *
   * 它可能存在或不存在 <code>_error</code> 属性。
   * 当 FAILED 图元上存在 <code>_error</code> 属性时，此错误将在 <code>update</code> 调用中抛出。
   * 当 FAILED 图元不存在此属性时，<code>update</code> 调用将不执行任何操作。
   */
  FAILED: 6,
};

Object.freeze(PrimitiveState);

export default PrimitiveState;
