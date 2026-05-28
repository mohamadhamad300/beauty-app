defmodule MlBackend.Repo.Migrations.CreateProductSkinConcerns do
  use Ecto.Migration

  def change do
    create table(:product_skin_concerns, primary_key: false) do
      add :product_id, references(:products, on_delete: :delete_all), null: false
      add :concern_type, :string, null: false  # acne | dryness | oiliness | redness | wrinkles | dark_spots
      add :benefit_score, :integer, default: 5  # 1-10 how effective for this concern
    end

    create index(:product_skin_concerns, [:product_id])
    create index(:product_skin_concerns, [:concern_type])
    create unique_index(:product_skin_concerns, [:product_id, :concern_type])
  end
end

