defmodule MlBackend.Repo.Migrations.CreateDermatologists do
  use Ecto.Migration

  def change do
    create table(:dermatologists) do
      add :name, :string, null: false
      add :clinic_name, :string, null: false
      add :email, :string
      add :phone, :string
      add :location, :string
      add :city, :string, null: false
      add :country, :string, null: false, default: "UAE"
      add :specialization, :string  # e.g. "Medical Dermatology", "Cosmetic Dermatology"
      add :bio, :text
      add :rating, :float, default: 0.0
      add :is_partnered, :boolean, default: true
      add :image_uri, :string

      timestamps()
    end

    create index(:dermatologists, [:city])
    create index(:dermatologists, [:is_partnered])
  end
end

