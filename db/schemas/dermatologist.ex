defmodule Glow.Dermatologist do
  use Ecto.Schema
  import Ecto.Changeset

  schema "dermatologists" do
    field :name, :string
    field :clinic_name, :string
    field :email, :string
    field :phone, :string
    field :location, :string
    field :city, :string
    field :country, :string, default: "UAE"
    field :specialization, :string
    field :bio, :string
    field :rating, :float, default: 0.0
    field :is_partnered, :boolean, default: true
    field :image_uri, :string

    has_many :bookings, Glow.Booking

    timestamps()
  end

  def changeset(doc, attrs) do
    doc
    |> cast(attrs, [:name, :clinic_name, :email, :phone, :location, :city,
                    :country, :specialization, :bio, :rating, :is_partnered, :image_uri])
    |> validate_required([:name, :clinic_name, :city, :country])
    |> validate_number(:rating, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 5.0)
  end
end
