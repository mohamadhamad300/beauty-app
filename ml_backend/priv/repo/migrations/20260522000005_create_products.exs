defmodule MlBackend.Repo.Migrations.CreateProducts do
  use Ecto.Migration

  def change do
    create table(:products) do
      add :name, :string, null: false
      add :brand, :string, null: false
      add :description, :text
      add :price, :decimal, precision: 10, scale: 2, null: false
      add :currency, :string, default: "AED"
      add :category, :string, null: false  # cleanser | moisturizer | serum | sunscreen | mask | lipstick | blush | eyeshadow | foundation
      add :image_uri, :string
      add :is_comedogenic, :boolean, default: false
      add :is_ar_try_on, :boolean, default: false
      add :rating, :float, default: 0.0
      add :external_url, :string  # link to retailer

      timestamps()
    end

    create index(:products, [:category])
    create index(:products, [:is_comedogenic])
    create index(:products, [:brand])
  end
end

