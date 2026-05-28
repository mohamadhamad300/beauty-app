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
