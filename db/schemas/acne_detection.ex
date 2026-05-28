defmodule Glow.Skin.AcneDetection do
  use Ecto.Schema
  import Ecto.Changeset

  schema "acne_detections" do
    belongs_to :scan_result, Glow.Skin.ScanResult
    field :acne_type, :string
    field :confidence, :float
    field :count, :integer
    field :location_x, :float
    field :location_y, :float

    timestamps()
  end

  def changeset(detection, attrs) do
    detection
    |> cast(attrs, [:scan_result_id, :acne_type, :confidence, :count, :location_x, :location_y])
    |> validate_required([:scan_result_id, :acne_type, :confidence, :count])
    |> validate_inclusion(:acne_type, ~w(blackheads whiteheads papules pustules nodules cysts))
    |> validate_number(:confidence, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0)
  end
end
