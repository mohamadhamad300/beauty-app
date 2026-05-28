defmodule Glow.Skin.ScanResult do
  use Ecto.Schema
  import Ecto.Changeset

  schema "scan_results" do
    belongs_to :user, Glow.Accounts.User
    field :skin_health_score, :integer
    field :severity, :string  # mild | moderate | severe
    field :acne_count, :integer, default: 0
    field :concerns_summary, :map, default: %{}
    field :recommendations, {:array, :string}, default: []
    field :photo_before_uri, :string
    field :photo_after_uri, :string
    field :lighting_condition, :string
    field :device_info, :map, default: %{}

    has_many :acne_detections, Glow.Skin.AcneDetection
    has_many :skin_concerns, Glow.Skin.SkinConcern
    has_many :product_matches, Glow.Product.ScanProductMatch

    timestamps()
  end

  def changeset(scan, attrs) do
    scan
    |> cast(attrs, [:user_id, :skin_health_score, :severity, :acne_count,
                    :concerns_summary, :recommendations, :photo_before_uri,
                    :photo_after_uri, :lighting_condition, :device_info])
    |> validate_required([:user_id, :skin_health_score, :severity])
    |> validate_inclusion(:severity, ["mild", "moderate", "severe"])
    |> validate_number(:skin_health_score, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
  end
end
