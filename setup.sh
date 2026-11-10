#!/usr/bin/env bash
# ==============================================================================
# DSH SOLO Plugin Setup & Environment Initializer
# 用于在另一台新机器上一键部署 OpenVSCode Server 二进制依赖与初始化配置
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HOME}/.dsh/cache/openvscode-server-v1.109.5"
VERSION="1.109.5"

echo "=== [DSH SOLO] 正在检查环境与核心依赖 ==="

# 1. 检查 openvscode-server 是否已存在
if [ -f "${TARGET_DIR}/out/server-main.js" ] && [ -f "${TARGET_DIR}/node" ]; then
  echo "✓ 检测到 OpenVSCode Server v${VERSION} 已完整安装于:"
  echo "  ${TARGET_DIR}"
else
  echo "[-] 未检测到 OpenVSCode Server 核心文件，准备安装..."

  mkdir -p "${HOME}/.dsh/cache"

  # 支持用户手动传入已下载好的 tar.gz 压缩包路径
  TARBALL_ARG="${1:-}"
  TEMP_TARBALL=""

  if [ -n "${TARBALL_ARG}" ] && [ -f "${TARBALL_ARG}" ]; then
    echo "✓ 使用本地传入的压缩包: ${TARBALL_ARG}"
    TEMP_TARBALL="${TARBALL_ARG}"
  else
    # 自动识别系统架构
    ARCH_RAW="$(uname -m)"
    case "${ARCH_RAW}" in
      x86_64|amd64)
        ARCH_NAME="linux-x64"
        ;;
      aarch64|arm64)
        ARCH_NAME="linux-arm64"
        ;;
      *)
        echo "❌ 暂不支持的架构: ${ARCH_RAW}"
        exit 1
        ;;
    esac

    DOWNLOAD_URL="https://github.com/gitpod-io/openvscode-server/releases/download/openvscode-server-v${VERSION}/openvscode-server-v${VERSION}-${ARCH_NAME}.tar.gz"
    TEMP_TARBALL="/tmp/openvscode-server-v${VERSION}-${ARCH_NAME}.tar.gz"

    echo "正在从官方 Release 下载 OpenVSCode Server (${ARCH_NAME})..."
    echo "下载地址: ${DOWNLOAD_URL}"
    echo "提示: 如遇网络连接缓慢，你也可以在主机器打包 ~/.dsh/cache/openvscode-server-v1.109.5，或手动下载后执行: ./setup.sh <tar.gz路径>"

    if command -v curl >/dev/null 2>&1; then
      curl -fSL "${DOWNLOAD_URL}" -o "${TEMP_TARBALL}" --progress-bar
    elif command -v wget >/dev/null 2>&1; then
      wget --show-progress -O "${TEMP_TARBALL}" "${DOWNLOAD_URL}"
    else
      echo "❌ 系统未找到 curl 或 wget，请先安装或手动拷贝压缩包！"
      exit 1
    fi
  fi

  echo "正在解压到 ~/.dsh/cache/openvscode-server-v${VERSION}..."
  mkdir -p "/tmp/dsh-openvscode-extract"
  tar -xzf "${TEMP_TARBALL}" -C "/tmp/dsh-openvscode-extract"

  # 寻找解压后的子目录并移动到目标路径
  EXTRACTED_SUBDIR="$(find /tmp/dsh-openvscode-extract -maxdepth 1 -mindepth 1 -type d | head -n 1)"
  if [ -n "${EXTRACTED_SUBDIR}" ] && [ -d "${EXTRACTED_SUBDIR}" ]; then
    rm -rf "${TARGET_DIR}"
    mv "${EXTRACTED_SUBDIR}" "${TARGET_DIR}"
  fi
  rm -rf "/tmp/dsh-openvscode-extract"

  if [ -n "${TARBALL_ARG}" ]; then
    : # 保留用户指定的文件
  elif [ -f "${TEMP_TARBALL}" ]; then
    rm -f "${TEMP_TARBALL}"
  fi
  echo "✓ OpenVSCode Server 安装完成！"
fi

# 2. 部署中文语言包支持 (nls.messages.zh-cn.js)
mkdir -p "${TARGET_DIR}/out"
if [ -f "${SCRIPT_DIR}/resources/nls.messages.zh-cn.js" ]; then
  cp -f "${SCRIPT_DIR}/resources/nls.messages.zh-cn.js" "${TARGET_DIR}/out/nls.messages.zh-cn.js"
  echo "✓ 简体中文语言包资源已注入到 openvscode-server/out"
fi

# 3. 检查 DSH 安装状态与提示
echo ""
echo "=== [DSH SOLO] 依赖部署就绪！==="
echo "后续同步与使用说明:"
echo "1. 在本机器上将此插件安装/链接到 DSH 中:"
echo "   dsh plugin install \"${SCRIPT_DIR}\""
echo "2. 后续更新插件代码只需在目录内执行:"
echo "   git pull"
echo "3. 启动/打开 DSH 即可直接体验 DSH SOLO (编辑器 + 预览浏览器 + 终端)！"
