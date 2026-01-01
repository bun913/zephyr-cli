class Zephyr < Formula
  desc "CLI tool for Zephyr Scale API"
  homepage "https://github.com/bun913/zephyr-cli"
  version "0.2.6"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/bun913/zephyr-cli/releases/download/v#{version}/zephyr-macos-arm64"
      sha256 "bde271141cb02149f3ef944a4d9531039d12da383bd890270ff0c9f263b6ef28"
    end
    on_intel do
      url "https://github.com/bun913/zephyr-cli/releases/download/v#{version}/zephyr-macos-x64"
      sha256 "6ac99845c6f589b9fc9194ab33999983fff72503ca89b0ab11a9cfd1e8885217"
    end
  end

  on_linux do
    url "https://github.com/bun913/zephyr-cli/releases/download/v#{version}/zephyr-linux-x64"
    sha256 "54865a7ae71c829a69a18a86efd322501ccf7ef62b51d8829f8d09843e5b9a30"
  end

  def install
    bin.install Dir["*"].first => "zephyr"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/zephyr --version")
  end
end
