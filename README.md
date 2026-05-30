# any_tools

[中文文档](./README.zh-CN.md)

Cocos Creator build plugin that automatically modifies app name, icons, and version numbers when building Android/iOS projects.

## Features

### Android

| Feature | Description |
|---------|-------------|
| Game Name | Modify `app_name` in `strings.xml` |
| App Icons | Copy `mipmap-*` directories from the specified folder to the build output's `res` directory |
| Version | Modify `versionCode` and `versionName` in `build.gradle` |

### iOS

| Feature | Description |
|---------|-------------|
| Game Name | Modify `CFBundleDisplayName` and `CFBundleName` in `Info.plist` |
| App Icons | Override `AppIcon.appiconset` directory |
| Launch Screen | Replace `LaunchScreenBackground.png` and other launch resources, set `LaunchScreen.storyboard` |
| Version | Modify `CFBundleVersion` and `CFBundleShortVersionString` in `Info.plist` |

## Installation

```bash
npm install
npm run build
```

## Usage

### Install Plugin

**Method 1: Direct Copy**

Copy the plugin into the `extensions` directory of your Cocos Creator project.

**Method 2: Developer Import**

In Cocos Creator Editor, open `Extension Manager`, click the dropdown menu next to `Import Extension File (.zip)`, select `Developer Import`, and choose this plugin project directory. This will create a symlink in the Cocos project's `extensions` directory for development and debugging.

### Build Configuration

Configure the following parameters in the build panel:

| Parameter | Description |
|-----------|-------------|
| Game Name | App display name |
| Icon Folder | Path to icon resource folder (supports relative or absolute paths) |
| Version Code | versionCode / CFBundleVersion |
| Version Name | versionName / CFBundleShortVersionString |

## Icon Folder Structure

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
