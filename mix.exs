defmodule DataProcessingPipeline.MixProject do
  use Mix.Project

  def project do
    [
      app: :data_processing_pipeline,
      version: "0.1.0",
      elixir: "~> 1.12",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:broadway, "~> 1.0"},
      {:jason, "~> 1.2"}
    ]
  end
end
