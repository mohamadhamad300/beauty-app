defmodule MlBackend.Skin.SkinConcern do
  use Ecto.Schema
  import Ecto.Changeset

  schema "skin_concerns" do
    belongs_to :scan_result, MlBackend.Skin.ScanResult
    field :concern_type, :string
    field :severity, :string  # low | medium | high
    field :area, :string

    timestamps()
  end

  def changeset(concern, attrs) do
    concern
    |> cast(attrs, [:scan_result_id, :concern_type, :severity, :area])
    |> validate_required([:scan_result_id, :concern_type, :severity])
    |> validate_inclusion(:concern_type, ~w(dryness oiliness redness wrinkles dark_spots))
    |> validate_inclusion(:severity, ~w(low medium high))
  end
end


