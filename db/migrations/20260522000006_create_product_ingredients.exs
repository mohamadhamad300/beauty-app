defmodule Glow.Repo.Migrations.CreateProductIngredients do
  use Ecto.Migration

  def change do
    create table(:product_ingredients) do
      add :product_id, references(:products, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :is_comedogenic, :boolean, default: false
      add :function, :string  # e.g. "moisturizer", "preservative", "fragrance"

      timestamps()
    end

    create index(:product_ingredients, [:product_id])
    create index(:product_ingredients, [:name])
  end
end
