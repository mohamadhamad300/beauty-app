defmodule MlBackend.Training do
  @moduledoc """
  Model training pipeline.

  Provides:
    - Data loading and batching
    - Training loop with loss tracking
    - Model checkpoint saving
  """

  alias MlBackend.Model

  @doc """
  Train the skin analysis model.

  ## Options
    - `:epochs` — number of training epochs (default: 50)
    - `:batch_size` — batch size (default: 32)
    - `:learning_rate` — initial learning rate (default: 0.0001)
    - `:data_dir` — path to dataset (default: "data")
  """
  @spec train(keyword()) :: :ok
  def train(opts \\ []) do
    epochs = Keyword.get(opts, :epochs, 50)
    batch_size = Keyword.get(opts, :batch_size, 32)
    learning_rate = Keyword.get(opts, :learning_rate, 0.0001)

    model = Model.build()

    # Binary cross-entropy for acne head, categorical for severity
    loss = %{
      acne: &Axon.Losses.binary_cross_entropy/3,
      severity: &Axon.Losses.categorical_cross_entropy/3
    }

    # Placeholder: replace with real dataset
    train_data = generate_dummy_data(batch_size)
    val_data = generate_dummy_data(batch_size)

    IO.puts("Starting training for #{epochs} epochs...")

    result =
      model
      |> Axon.Loop.trainer(loss, :adam, learning_rate)
      |> Axon.Loop.metric(:accuracy, "acne_accuracy")
      |> Axon.Loop.metric(:accuracy, "severity_accuracy")
      |> Axon.Loop.run(train_data, val_data, epochs: epochs, compiler: EXLA)

    IO.puts("Training complete: #{inspect(result.metrics)}")
    Model.save(model, "models/skin_analysis.axon")
    :ok
  end

  defp generate_dummy_data(batch_size) do
    Stream.repeatedly(fn ->
      key = Nx.Random.key(42)
      {inputs, _} = Nx.Random.uniform(key, -1.0, 1.0, shape: {batch_size, 224, 224, 3}, type: :f32)
      {acne_target, _} = Nx.Random.uniform(key, 0.0, 1.0, shape: {batch_size, 6}, type: :f32)
      severity_target = Nx.eye(batch_size, 3) |> Nx.slice(0..2//1, 0..2//1) |> Nx.reshape({batch_size, 3})
      {inputs, %{acne: acne_target, severity: severity_target}}
    end)
  end
end
