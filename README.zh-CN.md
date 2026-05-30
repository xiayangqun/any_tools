# any_tools

[English](./README.md)

Cocos Creator 构建插件，在构建 Android/iOS 项目时自动修改应用名称、图标和版本号。

## 功能

### Android

| 功能 | 说明 |
|------|------|
| 游戏名称 | 修改 `strings.xml` 中的 `app_name` |
| 应用图标 | 将指定文件夹下的 `mipmap-*` 目录复制到构建产物的 `res` 目录 |
| 版本号 | 修改 `build.gradle` 中的 `versionCode` 和 `versionName` |

### iOS

| 功能 | 说明 |
|------|------|
| 游戏名称 | 修改 `Info.plist` 中的 `CFBundleDisplayName` 和 `CFBundleName` |
| 应用图标 | 覆盖 `AppIcon.appiconset` 目录 |
| 开屏图片 | 替换 `LaunchScreenBackground.png` 等开屏资源，并设置 `LaunchScreen.storyboard` |
| 版本号 | 修改 `Info.plist` 中的 `CFBundleVersion` 和 `CFBundleShortVersionString` |

## 安装

```bash
npm install
npm run build
```

## 使用

### 安装插件

**方式一：直接复制**

将插件放入 Cocos Creator 项目的 `extensions` 目录。

**方式二：开发者导入**

在 Cocos Creator 编辑器中，打开 `扩展管理器`，在 `导入扩展文件(.zip)` 旁的下拉菜单中选择 `开发者导入`，选择本插件项目目录即可。这会在 Cocos 项目的 `extensions` 目录中创建一个软链接，方便开发调试。

### 构建配置

构建时在构建面板中配置以下参数：

| 参数 | 说明 |
|------|------|
| 游戏名称 | 应用显示名称 |
| Icon 文件夹 | 图标资源文件夹路径（支持相对路径或绝对路径） |
| 版本号 | versionCode / CFBundleVersion |
| 版本名称 | versionName / CFBundleShortVersionString |

## 图标文件夹结构

### Android

```
icon_folder/
├── mipmap-hdpi/
├── mipmap-mdpi/
├── mipmap-xhdpi/
├── mipmap-xxhdpi/
└── mipmap-xxxhdpi/
```

### iOS

```
icon_folder/
├── AppIcon.appiconset/
├── LaunchScreenBackground.png
├── LaunchScreenBackgroundLandscape.png
├── LaunchScreenBackgroundPortrait.png
└── LaunchScreen.storyboard
```
