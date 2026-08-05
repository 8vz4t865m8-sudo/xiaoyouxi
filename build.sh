#!/bin/bash
# 手工构建 BubbleTeaTycoon.app
# 不使用 xcodebuild，直接用 swiftc 编译链接，避免 xcodebuild 的
# Asset Catalog 编译 / CopySwiftLibs 等环节引入未签名 dylib 或
# 结构异常，从根源保证产物干净、结构简单、可被重签名工具正确处理。
set -euxo pipefail

APP_NAME="BubbleTeaTycoon"
BUNDLE_ID="com.bubbleteatycoon.app"
SDK_PATH=$(xcrun --sdk iphoneos --show-sdk-path)
BUILD_DIR="build"
APP_DIR="$BUILD_DIR/$APP_NAME.app"

rm -rf "$BUILD_DIR"
mkdir -p "$APP_DIR"

echo "--- 1. 编译 Swift 源码为可执行文件 ---"
swiftc \
    -target arm64-apple-ios12.0 \
    -sdk "$SDK_PATH" \
    -O \
    -o "$APP_DIR/$APP_NAME" \
    "$APP_NAME/AppDelegate.swift" \
    "$APP_NAME/ViewController.swift"

echo "--- 2. 拷贝 Info.plist ---"
cp "$APP_NAME/Info.plist" "$APP_DIR/Info.plist"

echo "--- 3. 拷贝图标 PNG（非 Asset Catalog，直接引用） ---"
cp "$APP_NAME/Icons/Icon-60@2x.png" "$APP_DIR/Icon-60@2x.png"
cp "$APP_NAME/Icons/Icon-60@3x.png" "$APP_DIR/Icon-60@3x.png"
cp "$APP_NAME/Icons/Icon-76.png" "$APP_DIR/Icon-76.png"
cp "$APP_NAME/Icons/Icon-76@2x.png" "$APP_DIR/Icon-76@2x.png"
cp "$APP_NAME/Icons/Icon-83.5@2x.png" "$APP_DIR/Icon-83.5@2x.png"
cp "$APP_NAME/Icons/Icon-1024.png" "$APP_DIR/Icon-1024.png"

echo "--- 4. 拷贝 H5 游戏资源到 Resources ---"
cp -R "$APP_NAME/Resources/." "$APP_DIR/"

echo "--- 5. 写 PkgInfo ---"
printf "APPL????" > "$APP_DIR/PkgInfo"

echo "--- 6. 清理扩展属性，不做任何 codesign（交给重签名工具从零签名）---"
xattr -cr "$APP_DIR" || true

echo "--- 7. 打包 IPA ---"
mkdir -p "$BUILD_DIR/Payload"
cp -R "$APP_DIR" "$BUILD_DIR/Payload/"
( cd "$BUILD_DIR" && zip -rXq "$APP_NAME.ipa" "Payload" )

echo "--- 构建完成 ---"
ls -la "$BUILD_DIR/$APP_NAME.ipa"
echo "--- App 内容 ---"
find "$APP_DIR" -maxdepth 1
