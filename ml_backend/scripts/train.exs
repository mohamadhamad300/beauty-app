#!/usr/bin/env elixir
"""
Training script for the skin analysis model.

Usage:
    mix run scripts/train.exs [--epochs 50] [--batch-size 32]
"""

alias MlBackend.Training

{opts, _} =
  OptionParser.parse(System.argv(),
    strict: [epochs: :integer, batch_size: :integer, learning_rate: :float],
    aliases: [e: :epochs, b: :batch_size, l: :learning_rate]
  )

IO.puts("=== Skin Analysis Model Training ===")
IO.puts("Epochs:       #{opts[:epochs] || 50}")
IO.puts("Batch size:   #{opts[:batch_size] || 32}")
IO.puts("Learning rate:#{opts[:learning_rate] || 0.0001}")
IO.puts("")

Training.train(opts)
