import { BuildPlugin } from '@cocos/creator-types/editor/packages/builder/@types/public';

export const PACKAGE_NAME = 'any_tools';

export const configs: BuildPlugin.Configs = {
    'android': {
        hooks: './hooks',
        options: {
            gameName: {
                label: '游戏名称',
                description: '设置 Android 应用的显示名称（修改 strings.xml 中的 app_name）',
                default: 'Kitty_Obstacle_Run',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '请输入游戏名称',
                    },
                },
            },
            iconFolder: {
                label: 'Icon 文件夹',
                description: '选择包含 Android 图标文件的文件夹（mipmap-hdpi, mipmap-mdpi 等）。支持相对路径（相对于项目根目录）或绝对路径',
                default: '',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: templates/android/icon 或 /absolute/path/to/icon',
                    },
                },
            },
            versionCode: {
                label: '版本号 (versionCode)',
                description: 'Android 应用版本号（整数，用于 Google Play 内部版本管理）',
                default: 1,
                render: {
                    ui: 'ui-num-input',
                    attributes: {
                        step: 1,
                        min: 1,
                    },
                },
            },
            versionName: {
                label: '版本名称 (versionName)',
                description: 'Android 应用版本名称（显示给用户看的版本号，如 1.0.0）',
                default: '1.0',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: 1.0.0',
                    },
                },
            },
        },
    },
    'ios': {
        hooks: './hooks',
        options: {
            gameName: {
                label: '游戏名称',
                description: '设置 iOS 应用的显示名称（修改 Info.plist 中的 CFBundleDisplayName）',
                default: 'Kitty_Obstacle_Run',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '请输入游戏名称',
                    },
                },
            },
            iconFolder: {
                label: '资源文件夹',
                description: '选择包含 AppIcon.appiconset 和开屏图片的文件夹（如 templates/ios/Assets.xcassets）。会整体覆盖 AppIcon.appiconset 并替换开屏图片',
                default: '',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: templates/ios/Assets.xcassets',
                    },
                },
            },
            versionCode: {
                label: '构建版本号 (CFBundleVersion)',
                description: 'iOS 应用构建版本号（用于 App Store Connect 内部版本管理）',
                default: '1',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: 1',
                    },
                },
            },
            versionName: {
                label: '版本名称 (CFBundleShortVersionString)',
                description: 'iOS 应用版本名称（显示给用户看的版本号，如 1.0.0）',
                default: '1.0.0',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '例如: 1.0.0',
                    },
                },
            },
        },
    },
};
