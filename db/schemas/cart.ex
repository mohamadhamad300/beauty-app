defmodule Glow.Cart do
  use Ecto.Schema
  import Ecto.Changeset

  schema "carts" do
    belongs_to :user, Glow.Accounts.User
    has_many :cart_items, Glow.CartItem

    timestamps()
  end

  def changeset(cart, attrs) do
    cart
    |> cast(attrs, [:user_id])
    |> validate_required([:user_id])
    |> unique_constraint(:user_id)
  end
end
