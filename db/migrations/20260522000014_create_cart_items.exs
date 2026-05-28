defmodule Glow.Repo.Migrations.CreateCartItems do
  use Ecto.Migration

  def change do
    create table(:cart_items) do
      add :cart_id, references(:carts, on_delete: :delete_all), null: false
      add :product_id, references(:products, on_delete: :delete_all), null: false
      add :shade_id, references(:product_shades, on_delete: :nilify_all)
      add :quantity, :integer, default: 1, null: false

      timestamps()
    end

    create index(:cart_items, [:cart_id])
    create unique_index(:cart_items, [:cart_id, :product_id, :shade_id])
  end
end
