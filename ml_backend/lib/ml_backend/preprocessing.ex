defmodule MlBackend.Preprocessing do
  @moduledoc """
  Image preprocessing pipeline for skin analysis.

  Steps:
    1. Load image from path
    2. Convert to RGB tensor
    3. Resize to 224x224
    4. Normalize pixel values to [-1, 1]
  """

  alias MlBackend.LabelMap

  @doc """
  Load an image file and return a preprocessed Nx tensor.

  Returns `{height, width, channels}` float32 tensor normalized to [-1, 1].
  """
  @spec load_and_preprocess(String.t()) :: Nx.Tensor.t()
  def load_and_preprocess(image_path) when is_binary(image_path) do
    image_path
    |> StbImage.read_file!()
    |> to_tensor()
    |> resize()
    |> normalize()
  end

  @doc """
  Convert StbImage struct to Nx tensor.
  """
  def to_tensor(%StbImage{data: data, shape: {h, w, c}}) do
    data
    |> Nx.from_binary(:u8)
    |> Nx.reshape({h, w, c})
    |> Nx.as_type(:f32)
  end

  @doc """
  Resize tensor to the model's expected input shape (224x224).
  """
  def resize(tensor) do
    {h, w, c} = Nx.shape(tensor)
    {th, tw, _ch} = LabelMap.input_shape()

    if h == th and w == tw do
      tensor
    else
      simple_resize(tensor, h, w, th, tw, c)
    end
  end

  defp simple_resize(tensor, h, w, th, tw, _c) do
    # Nearest-neighbour resize using Nx slicing
    row_indices = Nx.multiply(Nx.linspace(0, h - 1, n: th), (h - 1) / (th - 1)) |> Nx.round() |> Nx.as_type(:s64)
    col_indices = Nx.multiply(Nx.linspace(0, w - 1, n: tw), (w - 1) / (tw - 1)) |> Nx.round() |> Nx.as_type(:s64)

    rows = Nx.take(tensor, row_indices, axis: 0)
    Nx.take(rows, col_indices, axis: 1)
  end

  @doc """
  Normalize pixel values from [0, 255] to [-1, 1].
  """
  def normalize(tensor) do
    tensor
    |> Nx.divide(127.5)
    |> Nx.subtract(1.0)
  end

  @doc """
  Add batch dimension for model input: {1, 224, 224, 3}.
  """
  @spec add_batch(Nx.Tensor.t()) :: Nx.Tensor.t()
  def add_batch(tensor) do
    Nx.new_axis(tensor, 0)
  end
end
