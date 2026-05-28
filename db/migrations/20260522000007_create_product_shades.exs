defmodule Glow.Repo.Migrations.CreateProductShades do
  use Ecto.Migration

  def change do
    create table(:product_shades) do
      add :product_id, references(:products, on_delete: :delete_all), null: false
      add :shade_name, :string, null: false
      add :hex_color, :string, null: false  # e.g. "#C0392B"
      add :opacity_default, :float, default: 1.0
      add :order_index, :integer, default: 0

      timestamps()
    end

    create index(:product_shades, [:product_id])
    create unique_index(:product_shades, [:product_id, :shade_name])
  end
end
