defmodule MlBackend.MixProject do
  use Mix.Project

  def project do
    [
      app: :ml_backend,
      version: "0.1.0",
      elixir: "~> 1.19",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger, :runtime_tools],
      mod: {MlBackend.Application, []}
    ]
  end

  defp deps do
    [
      {:nx, "~> 0.9"},
      {:axon, "~> 0.7"},
      # {:exla, "~> 0.9"}, # Windows unsupported: compile with XLA_BUILD=true
      {:stb_image, "~> 0.6"},
      {:scholar, "~> 0.4"},
      {:plug_cowboy, "~> 2.7"},
      {:jason, "~> 1.4"},
      {:ecto_sql, "~> 3.12"},
      {:postgrex, "~> 0.19"},
      {:kino, "~> 0.14", only: [:dev]}
    ]
  end
end
