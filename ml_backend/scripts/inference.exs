#!/usr/bin/env elixir
"""
Run inference on a single image.

Usage:
    mix run scripts/inference.exs path/to/face_image.jpg
"""

alias MlBackend.{Preprocessing, Inference, AcneDetection, Severity, LabelMap}

[image_path | _] = System.argv()
unless image_path && File.exists?(image_path) do
  IO.puts("Usage: mix run scripts/inference.exs <image_path>")
  System.halt(1)
end

IO.puts("=== Skin Analysis Inference ===")
IO.puts("Image: #{image_path}\n")

tensor = Preprocessing.load_and_preprocess(image_path)
{acne_logits, severity_logits} = Inference.run(tensor)

IO.puts("--- Acne Detections ---")
detections = AcneDetection.classify(acne_logits)

if detections == [] do
  IO.puts("  No acne detected (below confidence threshold)")
else
  for d <- detections do
    bar = String.duplicate("█", ceil(d.confidence * 20))
    IO.puts("  #{String.pad_trailing(d.label, 12)} #{bar} #{Float.round(d.confidence * 100, 1)}%  (count: #{d.count})")
  end
end

severity = Severity.grade(severity_logits)
IO.puts("\n--- Severity ---")
IO.puts("  #{String.upcase(Atom.to_string(severity))}")

health = Severity.to_health_score(severity, detections)
IO.puts("\n  Skin Health Score: #{health}/100")
