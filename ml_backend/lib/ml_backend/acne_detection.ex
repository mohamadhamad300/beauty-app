defmodule MlBackend.AcneDetection do
  @moduledoc """
  Acne type classification from model output logits.

  Maps sigmoid outputs (0..1 per class) to detected acne types
  with confidence scores.
  """

  alias MlBackend.LabelMap

  @type detection :: %{
          required(:type) => atom(),
          required(:label) => String.t(),
          required(:confidence) => float(),
          required(:count) => non_neg_integer()
        }

  @doc """
  Classify acne types from model output logits.

  Returns a list of detections with confidence ≥ 0.3 threshold,
  sorted by confidence descending.
  """
  @spec classify(Nx.Tensor.t()) :: list(detection())
  def classify(acne_logits) do
    acne_logits
    |> Nx.to_flat_list()
    |> Enum.zip(LabelMap.acne_types())
    |> Enum.filter(fn {prob, _type} -> prob >= 0.3 end)
    |> Enum.sort_by(fn {prob, _type} -> prob end, :desc)
    |> Enum.map(fn {prob, type} ->
      %{
        type: type,
        label: format_label(type),
        confidence: Float.round(prob, 4),
        count: estimate_count(type, prob)
      }
    end)
  end

  defp format_label(type) do
    type |> Atom.to_string() |> String.capitalize()
  end

  defp estimate_count(:blackheads, prob), do: ceil(prob * 12)
  defp estimate_count(:whiteheads, prob), do: ceil(prob * 10)
  defp estimate_count(:papules, prob), do: ceil(prob * 6)
  defp estimate_count(:pustules, prob), do: ceil(prob * 5)
  defp estimate_count(_other, prob), do: max(1, ceil(prob * 3))
end
