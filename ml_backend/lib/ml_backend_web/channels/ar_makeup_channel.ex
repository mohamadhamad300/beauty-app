defmodule MlBackendWeb.ARMakeupChannel do
  use Phoenix.Channel

  @impl true
  def join("ar_makeup:lobby", _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("frame", %{"data" => base64_frame}, socket) do
    frame_bytes = Base.decode64!(base64_frame)
    case MlBackend.ARMakeup.process_frame(frame_bytes) do
      {:ok, processed_bytes} ->
        push(socket, "frame", %{"data" => Base.encode64(processed_bytes)})
      {:error, reason} ->
        push(socket, "error", %{"message" => inspect(reason)})
    end
    {:noreply, socket}
  end

  @impl true
  def handle_in("ping", _payload, socket) do
    push(socket, "pong", %{"status" => "ok"})
    {:noreply, socket}
  end
end
