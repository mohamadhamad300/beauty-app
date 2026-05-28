import Config

if database_url = System.get_env("DATABASE_URL") do
  config :ml_backend, MlBackend.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "5"),
    ssl: true,
    ssl_opts: [verify: :verify_none]
end
