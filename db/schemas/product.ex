defmodule Glow.Product.Product do
  use Ecto.Schema
  import Ecto.Changeset

  schema "products" do
    field :name, :string
    field :brand, :string
    field :description, :string
    field :price, :decimal
    field :currency, :string, default: "AED"
    field :category, :string
    field :image_uri, :string
    field :is_comedogenic, :boolean, default: false
    field :is_ar_try_on, :boolean, default: false
    field :rating, :float, default: 0.0
    field :external_url, :string

    has_many :ingredients, Glow.Product.ProductIngredient
    has_many :shades, Glow.Product.ProductShade
    has_many :skin_concerns, Glow.Product.ProductSkinConcern

    timestamps()
  end

  @categories ~w(cleanser moisturizer serum sunscreen mask lipstick blush eyeshadow foundation)

  def changeset(product, attrs) do
    product
    |> cast(attrs, [:name, :brand, :description, :price, :currency, :category,
                    :image_uri, :is_comedogenic, :is_ar_try_on, :rating, :external_url])
    |> validate_required([:name, :brand, :price, :category])
    |> validate_inclusion(:category, @categories)
    |> validate_number(:price, greater_than: 0)
  end
end
