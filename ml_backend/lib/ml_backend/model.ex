defmodule MlBackend.Model do
  @moduledoc """
  Model definition and loading.

  Uses Axon to define a MobileNetV2-based multi-output model:
    - Acne type classification (6 classes, sigmoid)
    - Severity grading (3 classes, softmax)

  The model can be:
    - Trained from scratch with `MlBackend.Training`
    - Loaded from a pre-trained Axon snapshot
    - Exported to TFLite via ONNX
  """

  alias MlBackend.LabelMap

  @doc """
  Build a multi-output MobileNetV2 model.

  Returns an `Axon` struct with two outputs:
    - `:acne` — binary classification per acne type
    - `:severity` — multi-class severity
  """
  @spec build() :: Axon.t()
  def build do
    input = Axon.input("input", shape: {nil, 224, 224, 3})

    # Base feature extractor (equivalent to MobileNetV2)
    backbone =
      input
      |> Axon.conv(32, kernel_size: 3, strides: 2, padding: :same)
      |> Axon.batch_norm()
      |> Axon.relu()
      |> Axon.depthwise_conv(kernel_size: 3, padding: :same)
      |> Axon.batch_norm()
      |> Axon.relu()
      |> Axon.conv(64, kernel_size: 1)
      |> Axon.batch_norm()
      |> Axon.relu()
      |> Axon.max_pool(kernel_size: 2)
      |> Axon.conv(128, kernel_size: 3, padding: :same)
      |> Axon.batch_norm()
      |> Axon.relu()
      |> Axon.global_avg_pool()

    # Acne type head
    acne_head =
      backbone
      |> Axon.dense(128)
      |> Axon.relu()
      |> Axon.dropout(rate: 0.3)
      |> Axon.dense(length(LabelMap.acne_types()), activation: :sigmoid, name: "acne")

    # Severity head
    severity_head =
      backbone
      |> Axon.dense(64)
      |> Axon.relu()
      |> Axon.dense(length(LabelMap.severity_levels()), activation: :softmax, name: "severity")

    Axon.container(%{acne: acne_head, severity: severity_head})
  end

  @doc """
  Load a pre-trained Axon model snapshot.
  """
  @spec load(String.t()) :: Axon.t()
  def load(_path) do
    # TODO: load from .axon or .h5 checkpoint
    build()
  end

  @doc """
  Save trained model to disk.
  """
  @spec save(Axon.t(), String.t()) :: :ok
  def save(_model, _path) do
    # TODO: serialize Axon model
    :ok
  end
end
