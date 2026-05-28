defmodule MlBackend.CartItem do
  use Ecto.Schema
  import Ecto.Changeset

  schema "cart_items" do
    belongs_to :cart, MlBackend.Cart
    belongs_to :product, MlBackend.Product.Product
    belongs_to :shade, MlBackend.Product.ProductShade
    field :quantity, :integer, default: 1

    timestamps()
  end

  def changeset(item, attrs) do
    item
    |> cast(attrs, [:cart_id, :product_id, :shade_id, :quantity])
    |> validate_required([:cart_id, :product_id, :quantity])
    |> validate_number(:quantity, greater_than: 0)
    |> unique_constraint([:cart_id, :product_id, :shade_id])
  end
end


