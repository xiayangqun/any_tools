import { IBuildTaskOption, IBuildResult } from '@cocos/creator-types/editor/packages/builder/@types/public';
import { BuildHook } from '@cocos/creator-types/editor/packages/builder/@types/public/build-plugin';
import * as path from 'path';
import * as fs from 'fs';

const PACKAGE_NAME = 'any_tools';

function resolvePath(inputPath: string): string {
    if (!inputPath) {
        return inputPath;
    }
    const projectPath = (globalThis as any).Editor?.Project?.path || process.cwd();

    // 如果是绝对路径且文件存在，直接返回
    if (path.isAbsolute(inputPath) && fs.existsSync(inputPath)) {
        return inputPath;
    }

    // 去掉前导 /，作为相对路径处理
    const cleanPath = inputPath.startsWith('/') ? inputPath.slice(1) : inputPath;
    return path.resolve(projectPath, cleanPath);
}

export const throwError: BuildHook.throwError = false;

export const load: BuildHook.load = async function() {
    console.log(`[${PACKAGE_NAME}] Load builder plugin.`);
};

export const unload: BuildHook.unload = async function() {
    console.log(`[${PACKAGE_NAME}] Unload builder plugin.`);
};

export const onBeforeCompressSettings: BuildHook.onBeforeCompressSettings = async function(options: IBuildTaskOption, result: IBuildResult) {
    console.log(`[${PACKAGE_NAME}] onBeforeCompressSettings platform=${options.platform}`);
    // iOS 的 Info.plist 修改已移到 onAfterBuild 阶段（在 CMake 生成之后）
    // 这里只保留 Android 的处理（如果需要）
};

export const onAfterBuild: BuildHook.onAfterBuild = async function(options: IBuildTaskOption, result: IBuildResult) {
    console.log(`[${PACKAGE_NAME}] onAfterBuild platform=${options.platform}, dest=${result.dest}`);
    if (options.platform !== 'android' && options.platform !== 'ios') {
        return;
    }

    const packageConfig = options.packages?.[PACKAGE_NAME];
    const gameName = packageConfig?.gameName;
    const iconFolder = packageConfig?.iconFolder;
    const versionCode = packageConfig?.versionCode;
    const versionName = packageConfig?.versionName;

    console.log(`[${PACKAGE_NAME}] onAfterBuild config: gameName=${gameName}, iconFolder=${iconFolder}, versionCode=${versionCode}, versionName=${versionName}`);

    if (options.platform === 'android') {
        if (!gameName && !iconFolder && !versionCode && !versionName) {
            return;
        }
        try {
            const platformModule = await import('./platforms/android');
            if (gameName) await platformModule.modifyGameName(result, gameName);
            if (iconFolder) await platformModule.copyIcons(result, resolvePath(iconFolder));
            if (versionCode || versionName) await platformModule.modifyVersion(result, versionCode, versionName);
        } catch (error) {
            console.error(`[${PACKAGE_NAME}] Android onAfterBuild 失败:`, error);
        }
    }

    if (options.platform === 'ios') {
        if (!gameName && !iconFolder && !versionCode && !versionName) {
            console.log(`[${PACKAGE_NAME}] onAfterBuild iOS 无配置，跳过`);
            return;
        }
        try {
            const platformModule = await import('./platforms/ios');

            // 设置 Launch Screen File（必须在修改 Info.plist 之前）
            console.log(`[${PACKAGE_NAME}] onAfterBuild iOS 设置 LaunchScreen...`);
            await platformModule.setLaunchScreenStoryboard(result);

            // 修改 Info.plist（在 admob 之后，所以会覆盖 admob 的修改）
            if (gameName) {
                console.log(`[${PACKAGE_NAME}] onAfterBuild iOS 调用 modifyGameName...`);
                await platformModule.modifyGameName(result, gameName);
            }
            if (versionCode || versionName) {
                console.log(`[${PACKAGE_NAME}] onAfterBuild iOS 调用 modifyVersion...`);
                await platformModule.modifyVersion(result, versionCode, versionName);
            }

            // 复制图标
            if (iconFolder) {
                const resolved = resolvePath(iconFolder);
                console.log(`[${PACKAGE_NAME}] onAfterBuild iOS iconFolder 解析: ${iconFolder} -> ${resolved}`);
                await platformModule.copyIcons(result, resolved);
            }
        } catch (error) {
            console.error(`[${PACKAGE_NAME}] iOS onAfterBuild 失败:`, error);
        }
    }
};
