#!/usr/bin/env bash
# Development only. Run as the ordinary user with configured HTTPS trust/proxy.
set -euo pipefail
task_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install_sdk() {
  local task_name="$1" task_url="$2" task_digest="$3" task_root="$4" task_marker="$5" task_version="$6"
  if [[ -f "$task_root/$task_marker" ]]; then
    if ! python3 -c 'import pathlib,sys; sys.exit(pathlib.Path(sys.argv[1]).read_text().strip().split("-")[0] != sys.argv[2])' "$task_root/$task_marker" "$task_version"; then
      echo "Existing $task_name runtime has a different version; refusing to overwrite it." >&2; exit 1
    fi
    return
  fi
  local task_archive="/tmp/echolens-wave4-${task_name}-setup.zip"
  curl --fail --location --max-time 300 "$task_url" --output "$task_archive"
  echo "$task_digest  $task_archive" | sha256sum --check -
  python3 - "$task_archive" "$task_root" <<'PY'
import sys,pathlib,zipfile
archive,root=sys.argv[1],pathlib.Path(sys.argv[2]);root.mkdir(exist_ok=True)
with zipfile.ZipFile(archive) as z:
 for item in z.infolist():
  dest=root/item.filename
  if not dest.resolve().is_relative_to(root.resolve()):raise ValueError('SDK archive path escapes its development directory')
  z.extract(item,root)
  if item.external_attr>>16:dest.chmod((item.external_attr>>16)&0o777)
PY
}
install_sdk dart https://storage.googleapis.com/dart-archive/channels/stable/release/3.13.7/sdk/dartsdk-linux-x64-release.zip eb99aed266efbcb615c6ae21c12f52cfe935b9f208bccc5fea7f64c21e867229 /tmp/echolens-wave4-dart dart-sdk/version 3.13.7
install_sdk kotlin https://github.com/JetBrains/kotlin/releases/download/v2.2.21/kotlin-compiler-2.2.21.zip a623871f1cd9c938946948b70ef9170879f0758043885bbd30c32f024e511714 /tmp/echolens-wave4-kotlin kotlinc/build.txt 2.2.21
if [[ ! -f /tmp/echolens-wave4-torch/torch-2.15.0+cpu.dist-info/METADATA ]]; then
  python3 -m pip install --target /tmp/echolens-wave4-torch --index-url https://download.pytorch.org/whl/cpu -r "$task_script_dir/fixtures/curriculum-native-runtime/torch-requirements.txt"
fi
if [[ ! -x /usr/lib/jvm/java-21-openjdk-amd64/bin/java ]]; then
  echo 'OpenJDK21 with the jdk.compiler module is required; no unsandboxed fallback is supported.' >&2; exit 1
fi
echo 'Pinned native development runtimes are available. Run test/curriculum-native.test.js to verify actual isolated execution.'
