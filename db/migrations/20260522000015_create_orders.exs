defmodule Glow.Repo.Migrations.CreateOrders do
  use Ecto.Migration

  def change do
    create table(:orders) do
      add :user_id, references(:users, on_delete: :nilify_all), null: false
      add :cart_id, references(:carts, on_delete: :nilify_all)
      add :total, :decimal, precision: 10, scale: 2, null: false
      add :currency, :string, default: "AED"
      add :status, :string, default: "pending"  # pending | confirmed | shipped | delivered | cancelled
      add :shipping_address, :map, default: "{}"
      add :payment_method, :string

      timestamps()
    end

    create index(:orders, [:user_id])
    create index(:orders, [:status])
  end
end
