defmodule MlBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :name, :string
    field :email, :string
    field :password_hash, :string
    field :timezone, :string, default: "UTC"
    field :locale, :string, default: "en"
    field :skin_type, :string
    field :onboarding_completed, :boolean, default: false

    has_many :scan_results, MlBackend.Skin.ScanResult
    has_many :progress_entries, MlBackend.Skin.ProgressEntry
    has_many :bookings, MlBackend.Booking
    has_one :cart, MlBackend.Cart
    has_many :orders, MlBackend.Order

    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :timezone, :locale, :skin_type, :onboarding_completed])
    |> validate_required([:name, :email])
    |> validate_inclusion(:locale, ["en", "ar"])
    |> validate_inclusion(:skin_type, ["dry", "oily", "combination", "normal", "sensitive"])
    |> unique_constraint(:email)
  end
end


