# ML Backend — AI Skin Diagnosis (Elixir/Nx)

## Stack

| Component | Library |
|---|---|
| Tensors | [Nx](https://github.com/elixir-nx/nx) |
| Neural Networks | [Axon](https://github.com/elixir-nx/axon) |
| GPU/TPU backend | [EXLA](https://github.com/elixir-nx/exla) |
| Image loading | [StbImage](https://github.com/elixir-nx/stb_image) |
| Classical ML | [Scholar](https://github.com/elixir-nx/scholar) |

## Pipeline

```
captured photo (mobile)
       │
       ▼
  Preprocessing.load_and_preprocess/1
    └─ StbImage.read → resize 224×224 → normalize [-1, 1]
       │
       ▼
  Inference.run/1
    └─ Axon.predict (multi-output: acne + severity)
       │
       ▼
  Postprocess (MlBackend.analyze/1)
    ├─ AcneDetection.classify  → 6 types with confidence
    ├─ Severity.grade          → mild / moderate / severe
    └─ health score + recommendations
```

## Project Structure

```
ml_backend/
├── lib/
│   ├── ml_backend.ex           # Main pipeline: analyze/1
│   └── ml_backend/
│       ├── label_map.ex        # Model output class mappings
│       ├── preprocessing.ex    # Image loading & normalization
│       ├── model.ex            # Axon model definition (MobileNetV2-like)
│       ├── inference.ex        # Inference runner (Axon + TFLite stub)
│       ├── acne_detection.ex   # Acne type classification logic
│       ├── severity.ex         # Severity grading & health score
│       ├── training.ex         # Training loop
│       └── convert.ex          # Model export (ONNX/TFLite stubs)
├── models/                     # Trained .axon or .tflite files
├── data/                       # Dataset (train/val splits)
├── scripts/
│   ├── train.exs               # Run: mix run scripts/train.exs
│   └── inference.exs           # Run: mix run scripts/inference.exs <image>
├── mix.exs
└── README.md
```

## Setup

```bash
cd ml_backend
mix deps.get
```

## Run Inference on an Image

```bash
mix run scripts/inference.exs path/to/face.jpg
```

## Train a New Model

```bash
mix run scripts/train.exs --epochs 50 --batch-size 32
```

## Export to TFLite

The Axon model can be exported to ONNX, then converted to TFLite:

```bash
# Export Axon → ONNX (requires axon_onnx)
# Then convert ONNX → TFLite
pip install onnx2tf
onnx2tf -i models/skin_analysis.onnx -o models/skin_analysis.tflite
```

## Target Accuracy

- ≥ 85% classification accuracy in controlled lighting (per spec)
- 30+ FPS inference on mobile (TFLite quantized)
