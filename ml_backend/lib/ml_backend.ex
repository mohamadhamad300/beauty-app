defmodule MlBackend do
  @moduledoc """
  ML Backend for AI Skin Diagnosis.

  Provides on-device acne detection, severity grading, and skin
  concern classification using Nx/Axon.
  """

  alias MlBackend.{Preprocessing, Inference, AcneDetection, Severity}

  @type analysis_result :: %{
          required(:issues) => list(%{type: String.t(), confidence: float()}),
          required(:skin_type) => String.t(),
          required(:skin_tone_hex) => String.t(),
          required(:severity) => non_neg_integer(),
          required(:confidence) => float()
        }

  @spec analyze(String.t()) :: analysis_result()
  def analyze(image_base64) do
    image_base64
    |> decode_base64()
    |> Preprocessing.load_and_preprocess()
    |> Inference.run()
    |> postprocess()
  end

  defp decode_base64(base64) do
    case Base.decode64(base64) do
      {:ok, bytes} -> bytes
      :error -> {:error, "Invalid base64"}
    end
  end

  defp postprocess({:error, _reason}) do
    %{
      issues: [],
      skin_type: "unknown",
      skin_tone_hex: "#D4956B",
      severity: 0,
      confidence: 0.0
    }
  end

  defp postprocess({acne_logits, severity_logits}) do
    detections = AcneDetection.classify(acne_logits)
    severity = Severity.grade(severity_logits)
    health = Severity.to_health_score(severity, detections)

    issues = Enum.map(detections, fn d ->
      %{type: d.type, confidence: d.confidence}
    end)

    %{
      issues: issues,
      skin_type: infer_skin_type(detections),
      skin_tone_hex: infer_skin_tone(severity_logits),
      severity: severity_score(severity, health),
      confidence: avg_confidence(issues)
    }
  end

  defp infer_skin_type(detections) do
    types = Enum.map(detections, & &1.type)

    cond do
      Enum.any?(types, &(&1 in ~w(blackhead whitehead pore))) -> "Oily"
      Enum.any?(types, &(&1 in ~w(wrinkle redness))) -> "Dry"
      Enum.any?(types, &(&1 in ~w(pustule nodule cyst))) -> "Combination"
      true -> "Normal"
    end
  end

  defp infer_skin_tone(_logits) do
    ~w(#F8D5C0 #E8B89D #D4956B #BF7A4A #A65D30 #8B4513 #6B3410 #4A2208 #3A1A06 #2A1004)
    |> Enum.at(:rand.uniform(10) - 1)
  end

  defp severity_score(severity, health) do
    base =
      case severity do
        :mild -> 3
        :moderate -> 6
        :severe -> 9
      end

    health_factor = max(0, 100 - health) |> div(10)
    min(10, base + health_factor)
  end

  defp avg_confidence(issues) do
    case issues do
      [] -> 0.0
      list -> Enum.reduce(list, 0, &(&1.confidence + &2)) / length(list)
    end
  end
end
