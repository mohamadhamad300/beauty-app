defmodule MlBackend.Repo do
  use Ecto.Repo,
    otp_app: :ml_backend,
    adapter: Ecto.Adapters.Postgres
end
