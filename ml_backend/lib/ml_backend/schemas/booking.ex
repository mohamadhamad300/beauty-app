defmodule MlBackend.Booking do
  use Ecto.Schema
  import Ecto.Changeset

  schema "bookings" do
    belongs_to :user, MlBackend.Accounts.User
    belongs_to :dermatologist, MlBackend.Dermatologist
    belongs_to :scan_result, MlBackend.Skin.ScanResult
    field :status, :string, default: "pending"
    field :booking_date, :naive_datetime
    field :notes, :string
    field :cancellation_reason, :string

    timestamps()
  end

  def changeset(booking, attrs) do
    booking
    |> cast(attrs, [:user_id, :dermatologist_id, :scan_result_id, :status,
                    :booking_date, :notes, :cancellation_reason])
    |> validate_required([:user_id, :dermatologist_id, :booking_date])
    |> validate_inclusion(:status, ~w(pending confirmed completed cancelled))
  end
end


