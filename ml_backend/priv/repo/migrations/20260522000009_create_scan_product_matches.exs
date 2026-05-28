defmodule MlBackend.Repo.Migrations.CreateScanProductMatches do
  use Ecto.Migration

  def change do
    create table(:scan_product_matches) do
      add :scan_result_id, references(:scan_results, on_delete: :delete_all), null: false
      add :product_id, references(:products, on_delete: :delete_all), null: false
      add :match_reason, :string  # e.g. "targets acne", "non-comedogenic"
      add :match_score, :float, default: 0.0  # 0.0 - 1.0 relevance
      add :is_saved, :boolean, default: false  # user saved this match

      timestamps()
    end

    create index(:scan_product_matches, [:scan_result_id])
    create index(:scan_product_matches, [:product_id])
    create unique_index(:scan_product_matches, [:scan_result_id, :product_id])
  end
end

