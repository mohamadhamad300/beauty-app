defmodule Glow.Skin.ProgressEntry do
  use Ecto.Schema
  import Ecto.Changeset

  schema "progress_entries" do
    belongs_to :user, Glow.Accounts.User
    belongs_to :scan_result, Glow.Skin.ScanResult
    field :week_number, :integer
    field :improvement_pct, :float
    field :notes, :string

    timestamps()
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:user_id, :scan_result_id, :week_number, :improvement_pct, :notes])
    |> validate_required([:user_id, :week_number])
    |> validate_number(:week_number, greater_than: 0)
    |> unique_constraint([:user_id, :week_number])
  end
end
