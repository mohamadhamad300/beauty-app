defmodule MlBackend.Convert do
  @moduledoc """
  Model format conversion.

  Supports:
    - Axon → ONNX
    - ONNX → TFLite (via external tool)
    - Axon → saved snapshot
  """

  @doc """
  Export Axon model to ONNX format.

  ONNX can then be converted to TFLite using:
      onnx2tf -i model.onnx -o model.tflite
  """
  @spec to_onnx(Axon.t(), String.t()) :: :ok
  def to_onnx(_model, _output_path \\ "models/skin_analysis.onnx") do
    # Requires `axon_onnx` dependency (not yet released)
    # See: https://github.com/elixir-nx/axon
    IO.puts("ONNX export not yet implemented.")
    IO.puts("Install onnx2tf to convert ONNX → TFLite:")
    IO.puts("  pip install onnx2tf")
    :ok
  end

  @doc """
  Export Axon model as a serialized snapshot.
  """
  @spec to_snapshot(Axon.t(), String.t()) :: :ok
  def to_snapshot(_model, _path \\ "models/skin_analysis.axon") do
    # TODO: implement Axon serialization
    :ok
  end
end
