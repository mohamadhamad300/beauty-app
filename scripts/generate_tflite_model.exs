"""
MobileNetV2 Skin Model — TFLite Export (Elixir)

Usage:
  cd ml_backend && mix run ../scripts/generate_tflite_model.exs

Requires:
  - EXLA (for GPU/CPU backend) — `mix deps.get` already includes nx + axon

Notes:
  - On Windows, EXLA is unavailable (no precompiled binary).
    The pre-generated model at assets/models/mobilenetv2.tflite works as-is.
  - On Linux/macOS, this script exports the Nx/Axon model → ONNX → TFLite.
"""

alias MlBackend.{Model, Convert, LabelMap}

IO.puts("=== Skin Model Export (Elixir) ===\n")

model = Model.build()
IO.puts("Architecture: MobileNetV2-like (Nx/Axon)")
IO.puts("Input:  224x224x3")
IO.puts("Output: #{length(LabelMap.acne_types())} classes (sigmoid)")
IO.puts("        #{length(LabelMap.severity_levels())} severity levels (softmax)")

IO.puts("\nExporting to ONNX...")
output_path = Path.join(File.cwd!(), "../assets/models/skin_analysis.onnx")
Convert.to_onnx(model, output_path)
IO.puts("Saved: #{output_path}")

IO.puts("\nTo convert ONNX → TFLite:")
IO.puts("  pip install onnx2tf")
IO.puts("  onnx2tf -i assets/models/skin_analysis.onnx -o assets/models/")
IO.puts("\nOr use the pre-generated file: assets/models/mobilenetv2.tflite")
