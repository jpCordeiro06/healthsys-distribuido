#!/usr/bin/env bash
set -euo pipefail

service="${1:?Informe o nome do serviço}"
gradle_args=(--no-daemon --console=plain)
export SPRING_DEVTOOLS_RESTART_TRIGGER_FILE=.reloadtrigger
trigger_dir="${HEALTHSYS_BUILD_DIR:?HEALTHSYS_BUILD_DIR deve estar definido}/services/$service/resources/main"

# Polling também detecta alterações em bind mounts do Docker Desktop/WSL.
source_checksum() {
    find "services/$service/src/main" shared -type f \
        \( -name '*.java' -o -path '*/src/main/resources/*' \) \
        -print0 | sort -z | xargs -0 -r sha256sum | sha256sum
}

compile() {
    if ! gradle "${gradle_args[@]}" --project-cache-dir /tmp/gradle-compile-cache ":services:$service:classes"; then
        return 1
    fi
    # O Gradle pode remover classes antes de reescrevê-las. Reinicie só com o build completo.
    mkdir -p "$trigger_dir"
    date +%s%N > "$trigger_dir/.reloadtrigger"
}

previous_checksum="$(source_checksum)"
compile
# bootRun permanece ativo; um cache separado permite compilar sem aguardar seu lock.
gradle "${gradle_args[@]}" --project-cache-dir /tmp/gradle-bootrun-cache ":services:$service:bootRun" &
app_pid=$!
watcher_pid=""

cleanup() {
    trap - EXIT INT TERM
    kill "$app_pid" ${watcher_pid:+"$watcher_pid"} 2>/dev/null || true
    wait "$app_pid" ${watcher_pid:+"$watcher_pid"} 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

(
    while sleep 2; do
        current_checksum="$(source_checksum)"
        if [[ "$current_checksum" != "$previous_checksum" ]]; then
            previous_checksum="$current_checksum"
            # Um erro de compilação não encerra a aplicação; a próxima edição tenta novamente.
            compile || true
        fi
    done
) &
watcher_pid=$!

wait "$app_pid"
