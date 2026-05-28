defmodule MlBackend.Order do
  use Ecto.Schema
  import Ecto.Changeset

  schema "orders" do
    belongs_to :user, MlBackend.Accounts.User
    belongs_to :cart, MlBackend.Cart
    field :total, :decimal
    field :currency, :string, default: "AED"
    field :status, :string, default: "pending"
    field :shipping_address, :map, default: %{}
    field :payment_method, :string

    timestamps()
  end

  @statuses ~w(pending confirmed shipped delivered cancelled)

  def changeset(order, attrs) do
    order
    |> cast(attrs, [:user_id, :cart_id, :total, :currency, :status, :shipping_address, :payment_method])
    |> validate_required([:user_id, :total])
    |> validate_inclusion(:status, @statuses)
    |> validate_number(:total, greater_than: 0)
  end
end


