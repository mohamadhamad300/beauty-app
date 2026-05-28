defmodule MlBackend.Severity do
  @moduledoc """
  Severity grading from model output.

  Maps softmax output to Mild / Moderate / Severe,
  and derives a skin health score (0-100).
  """

  alias MlBackend.{LabelMap, AcneDetection}

  @type level :: :mild | :moderate | :severe

  @doc """
  Grade overall severity from severity logits.

  Returns the severity level atom.
  """
  @spec grade(Nx.Tensor.t()) :: level()
  def grade(severity_logits) do
    idx = severity_logits |> Nx.argmax() |> Nx.to_number()
    LabelMap.severity_label(idx)
  end

  @doc """
  Derive a skin health score (0-100) from severity and detections.

  - :severe  → 30-55
  - :moderate → 55-75
  - :mild    → 75-98
  """
  @spec to_health_score(level(), list(AcneDetection.detection())) :: non_neg_integer()
  def to_health_score(severity, detections) do
    base =
      case severity do
        :severe -> 42
        :moderate -> 65
        :mild -> 86
      end

    penalty = length(detections) * 3
    max(20, base - penalty)
  end

  @doc """
  Get display color for severity level.
  """
  @spec color(level()) :: String.t()
  def color(:mild), do: "#7BC4A0"
  def color(:moderate), do: "#F4C77A"
  def color(:severe), do: "#E87A7A"

  @doc """
  Get human-readable label.
  """
  @spec label(level()) :: String.t()
  def label(:mild), do: "Mild"
  def label(:moderate), do: "Moderate"
  def label(:severe), do: "Severe"
end
