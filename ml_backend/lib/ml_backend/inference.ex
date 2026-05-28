defmodule MlBackend.Inference do
  @moduledoc """
  Run model inference on preprocessed image tensors.

  Supports:
    - Axon model (Nx backend)
    - TFLite model (via external NIF — placeholder)
  """

  alias MlBackend.{Model, Preprocessing}

  @doc """
  Run inference using the Axon model.

  Returns `{acne_logits, severity_logits}` tuples of Nx tensors.
  """
  @spec run(Nx.Tensor.t()) :: {Nx.Tensor.t(), Nx.Tensor.t()}
  def run(preprocessed_tensor) do
    model = Model.build()
    input = Preprocessing.add_batch(preprocessed_tensor)

    outputs = Axon.predict(model, nil, %{"input" => input})

    {outputs[:acne], outputs[:severity]}
  end

  @doc """
  Run inference via TFLite interpreter.

  Placeholder — requires a NIF binding to the TFLite C++ runtime.
  """
  @spec run_tflite(Nx.Tensor.t(), String.t()) :: {Nx.Tensor.t(), Nx.Tensor.t()}
  def run_tflite(_preprocessed_tensor, _model_path \\ "models/skin_analysis.tflite") do
    # TODO: implement TFLite binding
    # See: https://github.com/elixir-nx/nx
    {Nx.tensor([[0.0, 0.0, 0.0, 0.0, 0.0, 0.0]]),
     Nx.tensor([[1.0, 0.0, 0.0]])}
  end
end
