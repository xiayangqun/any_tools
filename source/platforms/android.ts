import { IBuildResult } from '@cocos/creator-types/editor/packages/builder/@types/public';
import * as fs from 'fs';
import * as path from 'path';

const PACKAGE_NAME = 'any_tools';

export async function modifyGameName(result: IBuildResult, gameName: string) {
    const stringsXmlPath = path.join(result.dest, 'proj', 'res', 'values', 'strings.xml');

    if (!fs.existsSync(stringsXmlPath)) {
        console.warn(`[${PACKAGE_NAME}] 未找到 strings.xml: ${stringsXmlPath}`);
        return;
    }

    try {
        let content = fs.readFileSync(stringsXmlPath, 'utf-8');
        const originalContent = content;

        content = content.replace(
            /<string name="app_name"[^>]*>.*?<\/string>/,
            `<string name="app_name" translatable="false">${gameName}</string>`
        );

        if (content !== originalContent) {
            fs.writeFileSync(stringsXmlPath, content, 'utf-8');
            console.log(`[${PACKAGE_NAME}] 已修改 Android 游戏名称为: ${gameName}`);
        } else {
            console.log(`[${PACKAGE_NAME}] Android 游戏名称无需修改`);
        }
    } catch (error) {
        console.error(`[${PACKAGE_NAME}] 修改 Android 游戏名称失败:`, error);
    }
}

export async function copyIcons(result: IBuildResult, iconFolder: string) {
    // 验证源文件夹是否存在
    if (!fs.existsSync(iconFolder)) {
        console.warn(`[${PACKAGE_NAME}] Icon 源文件夹不存在: ${iconFolder}`);
        return;
    }

    // 从 gradle.properties 读取 NATIVE_DIR
    const gradlePropertiesPath = path.join(result.dest, 'proj', 'gradle.properties');
    let targetResPath: string;
    
    if (fs.existsSync(gradlePropertiesPath)) {
        const gradleContent = fs.readFileSync(gradlePropertiesPath, 'utf-8');
        const nativeDirMatch = gradleContent.match(/NATIVE_DIR=(.+)/);
        if (nativeDirMatch) {
            targetResPath = path.join(nativeDirMatch[1].trim(), 'res');
            console.log(`[${PACKAGE_NAME}] 从 gradle.properties 读取到 NATIVE_DIR: ${nativeDirMatch[1].trim()}`);
        } else {
            console.warn(`[${PACKAGE_NAME}] 未在 gradle.properties 中找到 NATIVE_DIR，使用默认路径`);
            targetResPath = path.join(result.dest, 'proj', 'res');
        }
    } else {
        console.warn(`[${PACKAGE_NAME}] 未找到 gradle.properties，使用默认路径`);
        targetResPath = path.join(result.dest, 'proj', 'res');
    }
    
    if (!fs.existsSync(targetResPath)) {
        console.warn(`[${PACKAGE_NAME}] 目标 res 文件夹不存在: ${targetResPath}`);
        return;
    }

    try {
        // 读取源文件夹下的所有子文件夹
        const items = fs.readdirSync(iconFolder);
        let copyCount = 0;

        for (const item of items) {
            const sourcePath = path.join(iconFolder, item);
            const targetPath = path.join(targetResPath, item);

            // 只处理文件夹
            if (!fs.statSync(sourcePath).isDirectory()) {
                continue;
            }

            // 删除目标文件夹（如果存在）
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            }

            // 复制文件夹
            fs.cpSync(sourcePath, targetPath, { recursive: true });
            copyCount++;
            console.log(`[${PACKAGE_NAME}] 已复制: ${item}`);
        }

        if (copyCount > 0) {
            console.log(`[${PACKAGE_NAME}] 成功复制 ${copyCount} 个图标文件夹到 ${targetResPath}`);
        } else {
            console.log(`[${PACKAGE_NAME}] 源文件夹中没有找到可复制的文件夹`);
        }
    } catch (error) {
        console.error(`[${PACKAGE_NAME}] 复制图标失败:`, error);
    }
}

export async function modifyVersion(result: IBuildResult, versionCode?: number, versionName?: string) {
    // 从 gradle.properties 读取 NATIVE_DIR
    const gradlePropertiesPath = path.join(result.dest, 'proj', 'gradle.properties');
    let buildGradlePath: string;
    
    if (fs.existsSync(gradlePropertiesPath)) {
        const gradleContent = fs.readFileSync(gradlePropertiesPath, 'utf-8');
        const nativeDirMatch = gradleContent.match(/NATIVE_DIR=(.+)/);
        if (nativeDirMatch) {
            buildGradlePath = path.join(nativeDirMatch[1].trim(), 'app', 'build.gradle');
            console.log(`[${PACKAGE_NAME}] 从 gradle.properties 读取到 NATIVE_DIR: ${nativeDirMatch[1].trim()}`);
        } else {
            console.warn(`[${PACKAGE_NAME}] 未在 gradle.properties 中找到 NATIVE_DIR，使用默认路径`);
            buildGradlePath = path.join(result.dest, 'proj', 'app', 'build.gradle');
        }
    } else {
        console.warn(`[${PACKAGE_NAME}] 未找到 gradle.properties，使用默认路径`);
        buildGradlePath = path.join(result.dest, 'proj', 'app', 'build.gradle');
    }
    
    if (!fs.existsSync(buildGradlePath)) {
        console.warn(`[${PACKAGE_NAME}] 目标 build.gradle 不存在: ${buildGradlePath}`);
        return;
    }

    try {
        let content = fs.readFileSync(buildGradlePath, 'utf-8');
        const originalContent = content;
        let modified = false;

        // 替换 versionCode
        if (versionCode !== undefined && versionCode !== null) {
            const newContent = content.replace(
                /versionCode\s+\d+/,
                `versionCode ${versionCode}`
            );
            if (newContent !== content) {
                content = newContent;
                modified = true;
                console.log(`[${PACKAGE_NAME}] 已修改 versionCode 为: ${versionCode}`);
            } else {
                console.log(`[${PACKAGE_NAME}] versionCode 无需修改`);
            }
        }

        // 替换 versionName
        if (versionName) {
            const newContent = content.replace(
                /versionName\s+"[^"]*"/,
                `versionName "${versionName}"`
            );
            if (newContent !== content) {
                content = newContent;
                modified = true;
                console.log(`[${PACKAGE_NAME}] 已修改 versionName 为: ${versionName}`);
            } else {
                console.log(`[${PACKAGE_NAME}] versionName 无需修改`);
            }
        }

        if (modified) {
            fs.writeFileSync(buildGradlePath, content, 'utf-8');
            console.log(`[${PACKAGE_NAME}] 已保存版本号修改到: ${buildGradlePath}`);
        }
    } catch (error) {
        console.error(`[${PACKAGE_NAME}] 修改版本号失败:`, error);
    }
}