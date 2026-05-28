defmodule Glow.Repo.Migrations.CreateProgressEntries do
  use Ecto.Migration

  def change do
    create table(:progress_entries) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :scan_result_id, references(:scan_results, on_delete: :nilify_all)
      add :week_number, :integer, null: false
      add :improvement_pct, :float  # overall improvement vs baseline
      add :notes, :text

      timestamps()
    end

    create index(:progress_entries, [:user_id])
    create index(:progress_entries, [:user_id, :week_number])
    create unique_index(:progress_entries, [:user_id, :week_number])
  end
end
