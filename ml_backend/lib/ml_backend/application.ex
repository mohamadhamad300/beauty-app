defmodule MlBackend.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MlBackend.Repo,
      {Plug.Cowboy, scheme: :http, plug: MlBackend.Api, options: [port: 4000]}
    ]

    opts = [strategy: :one_for_one, name: MlBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
