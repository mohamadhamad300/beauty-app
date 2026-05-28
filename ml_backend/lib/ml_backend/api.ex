defmodule MlBackend.Api do
  use Plug.Router

  plug Plug.Parsers, parsers: [:json], json_decoder: Jason
  plug :match
  plug :dispatch

  post "/api/analyze" do
    %{"image" => image_base64} = conn.body_params

    task = Task.async(fn ->
      MlBackend.analyze(image_base64)
    end)

    result = Task.await(task, :timer.seconds(30))

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(result))
  end

  get "/api/health" do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(%{status: "ok", backend: "elixir_nx"}))
  end

  match _ do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(404, Jason.encode!(%{error: "not_found"}))
  end
end
