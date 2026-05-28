defmodule MlBackend.Repo.Migrations.CreateAcneDetections do
  use Ecto.Migration

  def change do
    create table(:acne_detections) do
      add :scan_result_id, references(:scan_results, on_delete: :delete_all), null: false
      add :acne_type, :string, null: false  # blackheads | whiteheads | papules | pustules | nodules | cysts
      add :confidence, :float, null: false
      add :count, :integer, null: false
      add :location_x, :float
      add :location_y, :float

      timestamps()
    end

    create index(:acne_detections, [:scan_result_id])
  end
end

