defmodule MlBackendTest do
  use ExUnit.Case
  doctest MlBackend

  test "greets the world" do
    assert MlBackend.hello() == :world
  end
end
