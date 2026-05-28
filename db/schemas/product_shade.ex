defmodule Glow.Product.ProductShade do
  use Ecto.Schema
  import Ecto.Changeset

  schema "product_shades" do
    belongs_to :product, Glow.Product.Product
    field :shade_name, :string
    field :hex_color, :string
    field :opacity_default, :float, default: 1.0
    field :order_index, :integer, default: 0

    timestamps()
  end

  def changeset(shade, attrs) do
    shade
    |> cast(attrs, [:product_id, :shade_name, :hex_color, :opacity_default, :order_index])
    |> validate_required([:product_id, :shade_name, :hex_color])
    |> validate_format(:hex_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_number(:opacity_default, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0)
    |> unique_constraint([:product_id, :shade_name])
  end
end
