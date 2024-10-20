import defined from "../Core/defined.js";
import FeatureDetection from "../Core/FeatureDetection.js";
import RuntimeError from "../Core/RuntimeError.js";
import TaskProcessor from "../Core/TaskProcessor.js";

/**
 * @private
 */
function DracoLoader() {}

// Maximum concurrency to use when decoding draco models
DracoLoader._maxDecodingConcurrency = Math.max(
  FeatureDetection.hardwareConcurrency - 1,
  1,
);

// Exposed for testing purposes
DracoLoader._decoderTaskProcessor = undefined;
DracoLoader._taskProcessorReady = false;
DracoLoader._error = undefined;
DracoLoader._getDecoderTaskProcessor = function () {
  if (!defined(DracoLoader._decoderTaskProcessor)) {
    const processor = new TaskProcessor(
      "decodeDraco",
      DracoLoader._maxDecodingConcurrency,
    );
    processor
      .initWebAssemblyModule({
        wasmBinaryFile: "ThirdParty/draco_decoder.wasm",
      })
      .then(function (result) {
        if (result) {
          DracoLoader._taskProcessorReady = true;
        } else {
          DracoLoader._error = new RuntimeError(
            "Draco decoder could not be initialized.",
          );
        }
      })
      .catch((error) => {
        DracoLoader._error = error;
      });
    DracoLoader._decoderTaskProcessor = processor;
  }

  return DracoLoader._decoderTaskProcessor;
};

/**
 * Decodes a compressed point cloud. Returns undefined if the task cannot be scheduled.
 * @private
 *
 * @exception {RuntimeError} Draco decoder could not be initialized.
 */
DracoLoader.decodePointCloud = function (parameters) {
  const decoderTaskProcessor = DracoLoader._getDecoderTaskProcessor();
  if (defined(DracoLoader._error)) {
    throw DracoLoader._error;
  }

  if (!DracoLoader._taskProcessorReady) {
    // The task processor is not ready to schedule tasks
    return;
  }
  return decoderTaskProcessor.scheduleTask(parameters, [
    parameters.buffer.buffer,
  ]);
};

/**
 * Decodes a buffer view. Returns undefined if the task cannot be scheduled.
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Uint8Array} options.array The typed array containing the buffer view data.
 * @param {object} options.bufferView The glTF buffer view object.
 * @param {Object<string, number>} options.compressedAttributes The compressed attributes.
 * @param {boolean} options.dequantizeInShader Whether POSITION and NORMAL attributes should be dequantized on the GPU.
 *
 * @returns {Promise} A promise that resolves to the decoded indices and attributes.
 * @private
 *
 * @exception {RuntimeError} Draco decoder could not be initialized.
 */
DracoLoader.decodeBufferView = function (options) {
  const decoderTaskProcessor = DracoLoader._getDecoderTaskProcessor();

  if (defined(DracoLoader._error)) {
    throw DracoLoader._error;
  }

  if (!DracoLoader._taskProcessorReady) {
    // The task processor is not ready to schedule tasks
    return;
  }

  return decoderTaskProcessor.scheduleTask(options, [options.array.buffer]);
};

export default DracoLoader;
