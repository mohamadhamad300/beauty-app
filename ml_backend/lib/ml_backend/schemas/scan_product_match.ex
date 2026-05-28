defmodule MlBackend.Product.ScanProductMatch do
  use Ecto.Schema
  import Ecto.Changeset

  schema "scan_product_matches" do
    belongs_to :scan_result, MlBackend.Skin.ScanResult
    belongs_to :product, MlBackend.Product.Product
    field :match_reason, :string
    field :match_score, :float, default: 0.0
    field :is_saved, :boolean, default: false

    timestamps()
  end

  def changeset(match, attrs) do
    match
    |> cast(attrs, [:scan_result_id, :product_id, :match_reason, :match_score, :is_saved])
    |> validate_required([:scan_result_id, :product_id])
    |> validate_number(:match_score, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0)
    |> unique_constraint([:scan_result_id, :product_id])
  end
end


