import Config

config :ml_backend, MlBackend.Repo,
  database: "neondb",
  username: "neondb_owner",
  password: "npg_yQg7Z2ISAovj",
  hostname: "ep-soft-bar-aprddfes-pooler.c-7.us-east-1.aws.neon.tech",
  port: 5432,
  ssl: true,
  ssl_opts: [verify: :verify_none],
  pool_size: 5,
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

config :ml_backend, ecto_repos: [MlBackend.Repo]

config :ml_backend, MlBackendWeb.Endpoint,
  url: [host: "0.0.0.0"],
  http: [port: 4001],
  server: true,
  debug_errors: true,
  secret_key_base: "kQ8YzN2dXm6pVL5sT9vB3wJrF7cG4hAe1iU0oPnMbCqWlujRyExDgSaHtOfzIk"
