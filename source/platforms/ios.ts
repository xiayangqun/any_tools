import { IBuildResult } from '@cocos/creator-types/editor/packages/builder/@types/public';
import * as fs from 'fs';
import * as path from 'path';

const PACKAGE_NAME = 'any_tools';

/**
 * 从 project.pbxproj 中读取 INFOPLIST_FILE 路径
 * 与 admob 插件使用相同的逻辑
 */
function findInfoPlistFromPbxproj(result: IBuildResult): string | null {
    const projDir = path.join(result.dest, 'proj');
    if (!fs.existsSync(projDir)) {
        console.warn(`[${PACKAGE_NAME}] findInfoPlistFromPbxproj: proj 目录不存在`);
        return null;
    }

    // 查找 .xcodeproj
    const entries = fs.readdirSync(projDir);
    const xcodeproj = entries.find(e => e.endsWith('.xcodeproj'));
    if (!xcodeproj) {
        console.warn(`[${PACKAGE_NAME}] findInfoPlistFromPbxproj: 未找到 .xcodeproj`);
        return null;
    }

    const pbxprojPath = path.join(projDir, xcodeproj, 'project.pbxproj');
    if (!fs.existsSync(pbxprojPath)) {
        console.warn(`[${PACKAGE_NAME}] findInfoPlistFromPbxproj: project.pbxproj 不存在`);
        return null;
    }

    try {
        const content = fs.readFileSync(pbxprojPath, 'utf8');

        // 匹配 INFOPLIST_FILE = "xxx";
        const match = content.match(/INFOPLIST_FILE\s*=\s*"([^"]+)"/);
        if (match && match[1]) {
            const plistPath = match[1];
            // 如果是绝对路径直接返回
            if (path.isAbsolute(plistPath)) {
                return plistPath;
            }
            // 相对路径相对于 .xcodeproj 所在目录的父目录
            return path.resolve(projDir, plistPath);
        }
    } catch (err) {
        console.error(`[${PACKAGE_NAME}] findInfoPlistFromPbxproj: 读取失败`, err);
    }

    return null;
}

/**
 * 查找 iOS Info.plist 的实际路径
 * 优先级：
 * 1. 从 project.pbxproj 中读取 INFOPLIST_FILE（最准确）
 * 2. native 源目录（构建前修改，CMake 会读取）
 * 3. 构建输出的其他位置（fallback）
 */
function findInfoPlist(result: IBuildResult): string | null {
    const projectPath = (globalThis as any).Editor?.Project?.path || process.cwd();

    console.log(`[${PACKAGE_NAME}] findInfoPlist projectPath=${projectPath}`);
    console.log(`[${PACKAGE_NAME}] findInfoPlist result.dest=${result.dest}`);

    // 优先从 pbxproj 读取
    const pbxprojPlist = findInfoPlistFromPbxproj(result);
    if (pbxprojPlist && fs.existsSync(pbxprojPlist)) {
        console.log(`[${PACKAGE_NAME}] findInfoPlist 命中 (pbxproj): ${pbxprojPlist}`);
        return pbxprojPlist;
    }

    // fallback: 尝试常见路径
    const candidates = [
        path.join(projectPath, 'native', 'engine', 'ios', 'Info.plist'),
        path.join(result.dest, 'proj', 'Info.plist'),
    ];

    for (const candidate of candidates) {
        const exists = fs.existsSync(candidate);
        console.log(`[${PACKAGE_NAME}] findInfoPlist 检查: ${candidate} -> ${exists ? '存在' : '不存在'}`);
        if (exists) {
            console.log(`[${PACKAGE_NAME}] findInfoPlist 命中: ${candidate}`);
            return candidate;
        }
    }
    console.warn(`[${PACKAGE_NAME}] findInfoPlist 未找到任何 Info.plist`);
    return null;
}

export async function modifyGameName(result: IBuildResult, gameName: string) {
    console.log(`[${PACKAGE_NAME}] modifyGameName 开始, gameName=${gameName}`);
    const infoPlistPath = findInfoPlist(result);

    if (!infoPlistPath) {
        console.warn(`[${PACKAGE_NAME}] modifyGameName: 未找到 Info.plist，放弃`);
        return;
    }

    try {
        let content = fs.readFileSync(infoPlistPath, 'utf-8');
        const originalContent = content;

        content = content.replace(
            /<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/,
            `<key>CFBundleDisplayName</key>\n\t<string>${gameName}</string>`
        );

        content = content.replace(
            /<key>CFBundleName<\/key>\s*<string>.*?<\/string>/,
            `<key>CFBundleName</key>\n\t<string>${gameName}</string>`
        );

        if (content !== originalContent) {
            fs.writeFileSync(infoPlistPath, content, 'utf-8');
            console.log(`[${PACKAGE_NAME}] modifyGameName 成功: ${gameName} -> ${infoPlistPath}`);
        } else {
            console.log(`[${PACKAGE_NAME}] modifyGameName 内容未变化，无需写入`);
        }
    } catch (error) {
        console.error(`[${PACKAGE_NAME}] modifyGameName 失败:`, error);
    }
}

export async function copyIcons(result: IBuildResult, iconFolder: string) {
    console.log(`[${PACKAGE_NAME}] copyIcons 开始, iconFolder=${iconFolder}`);
    if (!fs.existsSync(iconFolder)) {
        console.warn(`[${PACKAGE_NAME}] copyIcons: 源文件夹不存在: ${iconFolder}`);
        return;
    }

    const projectPath = (globalThis as any).Editor?.Project?.path || process.cwd();
    const nativeIosPath = path.join(projectPath, 'native', 'engine', 'ios');
    console.log(`[${PACKAGE_NAME}] copyIcons nativeIosPath=${nativeIosPath}`);

    // 1. 覆盖 AppIcon.appiconset 整个文件夹
    const sourceAppIcon = path.join(iconFolder, 'AppIcon.appiconset');
    const targetAppIcon = path.join(nativeIosPath, 'Images.xcassets', 'AppIcon.appiconset');
    console.log(`[${PACKAGE_NAME}] copyIcons sourceAppIcon=${sourceAppIcon} exists=${fs.existsSync(sourceAppIcon)}`);
    console.log(`[${PACKAGE_NAME}] copyIcons targetAppIcon=${targetAppIcon} exists=${fs.existsSync(targetAppIcon)}`);

    if (fs.existsSync(sourceAppIcon)) {
        if (fs.existsSync(targetAppIcon)) {
            fs.rmSync(targetAppIcon, { recursive: true, force: true });
        }
        fs.cpSync(sourceAppIcon, targetAppIcon, { recursive: true });
        console.log(`[${PACKAGE_NAME}] 已覆盖 AppIcon.appiconset -> ${targetAppIcon}`);
    } else {
        console.warn(`[${PACKAGE_NAME}] 源目录中未找到 AppIcon.appiconset`);
    }

    // 2. 覆盖开屏图片（如果存在）
    const launchImages = [
        'LaunchScreenBackground.png',
        'LaunchScreenBackgroundLandscape.png',
        'LaunchScreenBackgroundPortrait.png',
    ];

    for (const img of launchImages) {
        const sourcePath = path.join(iconFolder, img);
        if (fs.existsSync(sourcePath)) {
            const targetPath = path.join(nativeIosPath, img);
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`[${PACKAGE_NAME}] 已覆盖开屏图片: ${img}`);
        }
    }

    // 3. 同步 LaunchScreenBackground.png 到 Asset Catalog imageset
    const sourceLaunchBg = path.join(iconFolder, 'LaunchScreenBackground.png');
    if (fs.existsSync(sourceLaunchBg)) {
        const imagesetDir = path.join(nativeIosPath, 'Images.xcassets', 'LaunchScreenBackground.imageset');
        if (!fs.existsSync(imagesetDir)) {
            fs.mkdirSync(imagesetDir, { recursive: true });
        }
        fs.copyFileSync(sourceLaunchBg, path.join(imagesetDir, 'LaunchScreenBackground.png'));

        const imagesetJson = path.join(imagesetDir, 'Contents.json');
        if (!fs.existsSync(imagesetJson)) {
            fs.writeFileSync(imagesetJson, JSON.stringify({
                images: [
                    { filename: 'LaunchScreenBackground.png', idiom: 'universal', scale: '1x' },
                    { filename: 'LaunchScreenBackground.png', idiom: 'universal', scale: '2x' },
                    { filename: 'LaunchScreenBackground.png', idiom: 'universal', scale: '3x' },
                ],
                info: { author: 'xcode', version: 1 },
            }, null, 2), 'utf-8');
        }
        console.log(`[${PACKAGE_NAME}] 已同步 LaunchScreenBackground 到 Asset Catalog`);
    }

    // 4. 覆盖 LaunchScreen.storyboard（如果存在）
    const sourceStoryboard = path.join(iconFolder, 'LaunchScreen.storyboard');
    if (fs.existsSync(sourceStoryboard)) {
        const targetStoryboard = path.join(nativeIosPath, 'Base.lproj', 'LaunchScreen.storyboard');
        fs.copyFileSync(sourceStoryboard, targetStoryboard);
        console.log(`[${PACKAGE_NAME}] 已覆盖 LaunchScreen.storyboard`);
    } else {
        console.warn(`[${PACKAGE_NAME}] 源目录中未找到 LaunchScreen.storyboard: ${sourceStoryboard}`);
    }
}

/**
 * 设置 Xcode 项目的 Launch Screen File
 * 在 pbxproj 中添加 INFOPLIST_KEY_UILaunchStoryboard_NAME = LaunchScreen
 */
export async function setLaunchScreenStoryboard(result: IBuildResult) {
    console.log(`[${PACKAGE_NAME}] setLaunchScreenStoryboard 开始`);

    const projDir = path.join(result.dest, 'proj');
    if (!fs.existsSync(projDir)) {
        console.warn(`[${PACKAGE_NAME}] setLaunchScreenStoryboard: proj 目录不存在`);
        return;
    }

    // 查找 .xcodeproj
    const entries = fs.readdirSync(projDir);
    const xcodeproj = entries.find(e => e.endsWith('.xcodeproj'));
    if (!xcodeproj) {
        console.warn(`[${PACKAGE_NAME}] setLaunchScreenStoryboard: 未找到 .xcodeproj`);
        return;
    }

    const pbxprojPath = path.join(projDir, xcodeproj, 'project.pbxproj');
    if (!fs.existsSync(pbxprojPath)) {
        console.warn(`[${PACKAGE_NAME}] setLaunchScreenStoryboard: project.pbxproj 不存在`);
        return;
    }

    try {
        let content = fs.readFileSync(pbxprojPath, 'utf8');
        const originalContent = content;

        // 检查是否已经设置了 INFOPLIST_KEY_UILaunchStoryboard_NAME
        const launchStoryboardKey = 'INFOPLIST_KEY_UILaunchStoryboard_NAME';
        if (!content.includes(launchStoryboardKey)) {
            // 在 buildSettings 中添加（在 ASSETCATALOG_COMPILER_LAUNCHSTORYBOARD_NAME 之后）
            const insertAfter = 'ASSETCATALOG_COMPILER_LAUNCHSTORYBOARD_NAME = LaunchScreen;';
            if (content.includes(insertAfter)) {
                content = content.replace(
                    insertAfter,
                    `${insertAfter}\n\t\t\t\t${launchStoryboardKey} = LaunchScreen;`
                );
                console.log(`[${PACKAGE_NAME}] 已添加 ${launchStoryboardKey}`);
            } else {
                // 如果没有 ASSETCATALOG_COMPILER_LAUNCHSTORYBOARD_NAME，在 ASSETCATALOG_COMPILER_APPICON_NAME 之后添加
                const insertAfterAlt = 'ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;';
                if (content.includes(insertAfterAlt)) {
                    content = content.replace(
                        insertAfterAlt,
                        `${insertAfterAlt}\n\t\t\t\t${launchStoryboardKey} = LaunchScreen;`
                    );
                    console.log(`[${PACKAGE_NAME}] 已添加 ${launchStoryboardKey}（备用位置）`);
                }
            }
        } else {
            console.log(`[${PACKAGE_NAME}] ${launchStoryboardKey} 已存在，跳过`);
        }

        if (content !== originalContent) {
            fs.writeFileSync(pbxprojPath, content, 'utf8');
            console.log(`[${PACKAGE_NAME}] setLaunchScreenStoryboard 完成: ${pbxprojPath}`);
        } else {
            console.log(`[${PACKAGE_NAME}] setLaunchScreenStoryboard 无需修改`);
        }
    } catch (error) {
        console.error(`[${PACKAGE_NAME}] setLaunchScreenStoryboard 失败:`, error);
    }
}

export async function modifyVersion(result: IBuildResult, versionCode?: string, versionName?: string) {
    console.log(`[${PACKAGE_NAME}] modifyVersion 开始, versionCode=${versionCode}, versionName=${versionName}`);
    const infoPlistPath = findInfoPlist(result);

    if (!infoPlistPath) {
        console.warn(`[${PACKAGE_NAME}] modifyVersion: 未找到 Info.plist，放弃`);
        return;
    }

    try {
        let content = fs.readFileSync(infoPlistPath, 'utf-8');
        const originalContent = content;
        let modified = false;

        if (versionCode) {
            const newContent = content.replace(
                /<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>/,
                `<key>CFBundleVersion</key>\n\t<string>${versionCode}</string>`
            );
            if (newContent !== content) {
                content = newContent;
                modified = true;
                console.log(`[${PACKAGE_NAME}] 已修改 CFBundleVersion 为: ${versionCode}`);
            }
        }

        if (versionName) {
            const newContent = content.replace(
                /<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/,
                `<key>CFBundleShortVersionString</key>\n\t<string>${versionName}</string>`
            );
            if (newContent !== content) {
                content = newContent;
                modified = true;
                console.log(`[${PACKAGE_NAME}] 已修改 CFBundleShortVersionString 为: ${versionName}`);
            }
        }

        if (modified) {
            fs.writeFileSync(infoPlistPath, content, 'utf-8');
            console.log(`[${PACKAGE_NAME}] 已保存版本号修改到: ${infoPlistPath}`);
        }
    } catch (error) {
        console.error(`[${PACKAGE_NAME}] 修改 iOS 版本号失败:`, error);
    }
}