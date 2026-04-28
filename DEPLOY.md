# SpineCare AI 上线指南

这份指南对应当前项目结构：

- 前端：`frontend/`，部署到 Vercel
- 后端：`backend/`，部署到 Render
- 数据库与登录：Supabase

## 1. 上线前先做的安全动作

1. 立即轮换已经在本地调试中暴露过的 `OPENAI_API_KEY`
2. 确认 `frontend/.env.local` 和 `backend/.env` 不会提交到 Git
3. 确认 Supabase RLS 已开启，并只允许用户访问自己的数据

## 2. 准备 GitHub 仓库

在项目根目录执行：

```bash
git init
git add .
git commit -m "Initial SpineCare AI MVP"
```

然后把仓库推到 GitHub。

## 3. 部署后端到 Render

项目已经准备好：

- [render.yaml](/Users/zhuyifei/Documents/New%20project/render.yaml)
- [backend/Dockerfile](/Users/zhuyifei/Documents/New%20project/backend/Dockerfile)

步骤：

1. 登录 Render
2. 选择 `New +` -> `Blueprint`
3. 连接 GitHub 仓库
4. 选择当前仓库，Render 会读取 `render.yaml`
5. 在环境变量里填写：
   - `OPENAI_API_KEY`
   - `OPENAI_REPORT_MODEL`
   - `CORS_ORIGINS`

`CORS_ORIGINS` 在前端域名出来之前，可以先填临时值；前端部署成功后改成：

```bash
https://your-vercel-domain.vercel.app
```

后端部署成功后，你会得到一个公开地址，例如：

```bash
https://spinecare-ai-api.onrender.com
```

## 4. 部署前端到 Vercel

项目已经准备好：

- [vercel.json](/Users/zhuyifei/Documents/New%20project/vercel.json)

步骤：

1. 登录 Vercel
2. `Add New...` -> `Project`
3. 导入同一个 GitHub 仓库
4. `Root Directory` 可以留空，当前仓库已经配置成在根目录执行 `npm install` 和 `npm run build` 也能正确构建前端
5. 配置环境变量：
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

其中：

- `NEXT_PUBLIC_API_BASE_URL` = 你的 Render 后端地址
- `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon key

部署后你会得到前端地址，例如：

```bash
https://spinecare-ai.vercel.app
```

## 5. 回填跨域配置

前端上线后，记得回到 Render，把后端的 `CORS_ORIGINS` 改成真实前端域名，例如：

```bash
https://spinecare-ai.vercel.app
```

如果你还想允许本地调试，可以填成逗号分隔：

```bash
https://spinecare-ai.vercel.app,http://localhost:3000,http://127.0.0.1:3000
```

## 6. 上线后验收

至少做这 6 项：

1. 打开公开网址，首页能正常加载
2. 新用户注册成功
3. 登录成功并能保存患者档案
4. 症状问卷可以提交并保存
5. 上传一份真实测试报告，AI 解析成功返回
6. 手机 Safari 添加到主屏幕后可以正常打开 PWA

## 7. 建议的公开分享文案

你可以配一段非常简洁的介绍：

> SpineCare AI 是一个面向脊椎肿瘤复查阶段的个人健康管理网页工具，支持复查提醒、报告解析、症状记录与风险提示，用于帮助患者在恢复期更稳定地完成随访与自我观察。

## 8. 当前最适合继续补的内容

1. Supabase Storage：保存原始报告文件
2. 历次报告时间线页
3. 邮件提醒
4. 更严格的医疗安全文案和分层提示
