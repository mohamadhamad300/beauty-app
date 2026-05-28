defmodule Glow.Product.ProductIngredient do
  use Ecto.Schema
  import Ecto.Changeset

  schema "product_ingredients" do
    belongs_to :product, Glow.Product.Product
    field :name, :string
    field :is_comedogenic, :boolean, default: false
    field :function, :string

    timestamps()
  end

  def changeset(ingredient, attrs) do
    ingredient
    |> cast(attrs, [:product_id, :name, :is_comedogenic, :function])
    |> validate_required([:product_id, :name])
  end
end
