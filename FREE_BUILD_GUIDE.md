# 免费构建 iOS App 完整指南（Windows + 免费 Apple ID）

## 原理

```
你的 Windows 电脑
    ↓ (推送代码)
GitHub Actions (免费 macOS 服务器)
    ↓ (编译)
未签名 .ipa 文件
    ↓ (下载到你的电脑)
Sideloadly (Windows 签名工具)
    ↓ (用免费 Apple ID 签名 + 安装)
你的 iPhone
```

全程免费，不需要 $99 开发者账号，不需要 Mac。

---

## 第一步：注册 GitHub 账号（已有就跳过）

1. 打开 https://github.com/signup
2. 注册一个免费账号

## 第二步：登录 GitHub CLI

在你的终端（命令行）里运行：

```bash
gh auth login
```

按提示选择：
- **What account?** → `GitHub.com`
- **Protocol?** → `HTTPS`
- **Authenticate Git?** → `Yes`
- **How?** → `Login with a web browser`
- 终端会显示一个 **8 位代码**（如 `ABCD-1234`）
- 浏览器自动打开 GitHub，粘贴代码，点 Authorize

## 第三步：创建仓库并推送代码

```bash
cd C:\Users\yeting\WorkBuddy\20260726141535\expo-poc

# 创建 GitHub 仓库（公开仓库，macOS 构建免费无限时长）
gh repo create abc-scheme-hijack-poc --public --source=. --push

# 等待推送完成
```

## 第四步：触发构建

```bash
# 手动触发 GitHub Actions 工作流
gh workflow run build-ios.yml

# 查看构建状态
gh run list
```

或者直接去 GitHub 网页：
1. 打开你的仓库 `https://github.com/你的用户名/abc-scheme-hijack-poc`
2. 点 **Actions** 标签
3. 左边选 **Build iOS IPA**
4. 点右边 **Run workflow** → 绿色按钮
5. 等待 ~15-20 分钟（黄色转圈 → 绿色勾）

## 第五步：下载 .ipa 文件

```bash
# 构建完成后，下载产物
gh run download <run-id> -n ABC-Hijack-PoC-IPA
```

或者去网页下载：
1. 点进完成的那个 Run
2. 拉到最下面 **Artifacts** 区域
3. 点 **ABC-Hijack-PoC-IPA** 下载
4. 解压得到 `App-unsigned.ipa`

## 第六步：用 Sideloadly 签名并安装到 iPhone

1. **下载 Sideloadly**：https://sideloadly.io/#download
   - 选 Windows 版，安装
   - 安装时需要 iTunes（如果没装，Sideloadly 安装包会带）

2. **连接 iPhone**：用数据线把 iPhone 连到电脑

3. **打开 Sideloadly**：
   - 左上角设备选择 → 选你的 iPhone
   - 中间拖入 `App-unsigned.ipa`
   - **Apple ID** → 输入你的 Apple ID 邮箱
   - **Password** → 输入 Apple ID 密码
   - 点 **Start**

4. **iPhone 上信任证书**：
   - 设置 → 通用 → VPN与设备管理
   - 找到你的 Apple ID → 点 **信任**

5. 桌面出现 PoC App 图标，完成！

## 第七步：测试 URL Scheme 劫持

1. 打开 **Safari**
2. 地址栏输入：
   ```
   bankabc://login/auth?appId=30428099&redirect=https://www.abchina.com&token=eyJhbGciOiJIUzI1NiJ9.test
   ```
3. iOS 弹出选择框：**中国农业银行** vs **ABC Scheme Hijack PoC**
4. 选 PoC App → 截获完整 URL + 弹伪造登录页
5. 截图 → 这就是复测报告的实锤证据

---

## 常见问题

**Q: gh auth login 报错**
A: 确保浏览器能打开，手动复制终端显示的代码到 https://github.com/login/device

**Q: GitHub Actions 构建失败**
A: 去 Actions 页面点进失败的 Run，看红色错误日志。常见原因是 Expo 版本兼容问题。

**Q: Sideloadly 报错 "Anisette server"**
A: Sideloadly 设置里换一个 Anisette server，或用iCloud for Windows 登录 Apple ID 后再试。

**Q: 安装后 App 闪退**
A: iPhone → 设置 → 通用 → VPN与设备管理 → 信任你的 Apple ID 证书。

**Q: 7 天后 App 打不开了**
A: 免费 Apple ID 签名 7 天过期。重新用 Sideloadly 签一次就行（不用重新编译）。
