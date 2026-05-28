defmodule Glow.Repo.Migrations.CreateScanResults do
  use Ecto.Migration

  def change do
    create table(:scan_results) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :skin_health_score, :integer, null: false
      add :severity, :string, null: false  # mild | moderate | severe
      add :acne_count, :integer, default: 0
      add :concerns_summary, :map, default: "{}"  # JSON: {"dryness":"high","redness":"low"}
      add :recommendations, {:array, :string}, default: []
      add :photo_before_uri, :string
      add :photo_after_uri, :string
      add :lighting_condition, :string  # daylight | office | evening | unknown
      add :device_info, :map, default: "{}"  # JSON: model, OS version

      timestamps()
    end

    create index(:scan_results, [:user_id])
    create index(:scan_results, [:user_id, :inserted_at])
  end
end
