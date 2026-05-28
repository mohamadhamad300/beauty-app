defmodule MlBackend.Product.ProductSkinConcern do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  schema "product_skin_concerns" do
    belongs_to :product, MlBackend.Product.Product
    field :concern_type, :string
    field :benefit_score, :integer, default: 5
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:product_id, :concern_type, :benefit_score])
    |> validate_required([:product_id, :concern_type])
    |> validate_number(:benefit_score, greater_than_or_equal_to: 1, less_than_or_equal_to: 10)
    |> unique_constraint([:product_id, :concern_type])
  end
end


