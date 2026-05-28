defmodule MlBackend.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string, null: false
      add :email, :string, null: false
      add :password_hash, :string, null: false
      add :timezone, :string, default: "UTC"
      add :locale, :string, default: "en"  # en | ar
      add :skin_type, :string  # dry | oily | combination | normal | sensitive
      add :onboarding_completed, :boolean, default: false

      timestamps()
    end

    create unique_index(:users, [:email])
  end
end

