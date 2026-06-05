defmodule MlBackendWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ml_backend

  socket "/ws", MlBackendWeb.UserSocket,
    websocket: [check_origin: false, max_frame_size: 5_000_000]

  plug Plug.RequestId
  plug Plug.Logger
  plug Plug.Head
  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason
  plug Plug.MethodOverride
  plug Plug.Head

  plug :not_found

  defp not_found(conn, _) do
    conn
    |> Plug.Conn.send_resp(404, "not found")
  end
end
