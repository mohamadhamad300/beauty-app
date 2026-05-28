defmodule Glow.Repo.Migrations.CreateBookings do
  use Ecto.Migration

  def change do
    create table(:bookings) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :dermatologist_id, references(:dermatologists, on_delete: :delete_all), null: false
      add :scan_result_id, references(:scan_results, on_delete: :nilify_all)
      add :status, :string, null: false, default: "pending"
      add :booking_date, :naive_datetime, null: false
      add :notes, :text
      add :cancellation_reason, :string

      timestamps()
    end

    create index(:bookings, [:user_id])
    create index(:bookings, [:dermatologist_id])
    create index(:bookings, [:dermatologist_id, :status])
  end
end
