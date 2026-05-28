defmodule MlBackend.LabelMap do
  @moduledoc """
  Label mappings for model output classes.

  These must match the order the model was trained on.
  """

  @acne_types ~w(blackheads whiteheads papules pustules nodules cysts)a
  @severity_levels ~w(mild moderate severe)a
  @concern_types ~w(dryness oiliness redness wrinkles dark_spots)a

  @spec acne_types() :: list(atom())
  def acne_types, do: @acne_types

  @spec severity_levels() :: list(atom())
  def severity_levels, do: @severity_levels

  @spec concern_types() :: list(atom())
  def concern_types, do: @concern_types

  @spec input_shape() :: {integer, integer, integer}
  def input_shape, do: {224, 224, 3}

  @spec model_version() :: String.t()
  def model_version, do: "1.0.0"

  @spec acne_label(integer) :: atom()
  def acne_label(idx) when is_integer(idx) do
    Enum.at(@acne_types, idx, :unknown)
  end

  @spec severity_label(integer) :: atom()
  def severity_label(idx) when is_integer(idx) do
    Enum.at(@severity_levels, idx, :unknown)
  end
end
