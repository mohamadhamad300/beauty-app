defmodule MlBackend.Repo.Migrations.CreateSkinConcerns do
  use Ecto.Migration

  def change do
    create table(:skin_concerns) do
      add :scan_result_id, references(:scan_results, on_delete: :delete_all), null: false
      add :concern_type, :string, null: false  # dryness | oiliness | redness | wrinkles | dark_spots
      add :severity, :string, null: false  # low | medium | high
      add :area, :string  # e.g. "T-zone", "Cheeks", "Chin"

      timestamps()
    end

    create index(:skin_concerns, [:scan_result_id])
  end
end

