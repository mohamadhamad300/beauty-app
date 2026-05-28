defmodule MlBackend.Cart do
  use Ecto.Schema
  import Ecto.Changeset

  schema "carts" do
    belongs_to :user, MlBackend.Accounts.User
    has_many :cart_items, MlBackend.CartItem

    timestamps()
  end

  def changeset(cart, attrs) do
    cart
    |> cast(attrs, [:user_id])
    |> validate_required([:user_id])
    |> unique_constraint(:user_id)
  end
end


