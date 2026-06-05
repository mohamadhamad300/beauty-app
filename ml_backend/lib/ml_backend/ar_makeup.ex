defmodule MlBackend.ARMakeup do
  use GenServer

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  def process_frame(jpeg_bytes) when is_binary(jpeg_bytes) do
    GenServer.call(__MODULE__, {:process_frame, jpeg_bytes}, :infinity)
  end

  @impl true
  def init(_) do
    script_path = Application.app_dir(:ml_backend, "priv/scripts/ar_makeup.py")
    port = Port.open(
      {:spawn, "python #{script_path}"},
      [:binary, :stream, :use_stdio, :exit_status, packet: 4]
    )
    {:ok, %{port: port, caller: nil}}
  end

  @impl true
  def handle_call({:process_frame, jpeg_bytes}, from, %{port: port} = state) do
    Port.command(port, jpeg_bytes)
    {:noreply, %{state | caller: from}}
  end

  @impl true
  def handle_info({port, {:data, data}}, %{port: port, caller: caller} = state) when is_pid(caller) do
    GenServer.reply(caller, {:ok, data})
    {:noreply, %{state | caller: nil}}
  end

  @impl true
  def handle_info({:EXIT, port, reason}, %{port: port} = state) do
    {:stop, {:port_died, reason}, state}
  end

  @impl true
  def terminate(_reason, %{port: port}) do
    Port.close(port)
  end
end
