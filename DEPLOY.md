# SpineCare AI 上线指南

这份指南对应当前项目结构：

- 前端：`frontend/`
- 后端：`api/index.py` -> 导入 `backend/app/main.py`
- 部署：同一个 Vercel 项目同时承载前端和 FastAPI API
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

## 3. 部署到 Vercel

项目已经准备好：

- [vercel.json](/Users/zhuyifei/Documents/New%20project/vercel.json)
- [api/index.py](/Users/zhuyifei/Documents/New%20project/api/index.py)
- [requirements.txt](/Users/zhuyifei/Documents/New%20project/requirements.txt)

步骤：

1. 登录 Vercel
2. `Add New...` -> `Project`
3. 导入同一个 GitHub 仓库
4. `Root Directory` 留空
5. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_REPORT_MODEL`
   - `CORS_ORIGINS`

其中：

- `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon key
- `OPENAI_API_KEY` = 你的 OpenAI key
- `OPENAI_REPORT_MODEL` = 例如 `gpt-5.4-mini`
- `CORS_ORIGINS` = 你的 Vercel 域名，例如 `https://spinecare-ai.vercel.app`

注意：

- 如果前后端都在同一个 Vercel 项目里，`NEXT_PUBLIC_API_BASE_URL` 可以不填
- 前端会默认请求同域名下的 `/api/reports/analyze`

部署后你会得到地址，例如：

```bash
https://spinecare-ai.vercel.app
```

## 4. 上线后验收

至少做这 6 项：

1. 打开公开网址，首页能正常加载
2. 新用户注册成功
3. 登录成功并能保存患者档案
4. 症状问卷可以提交并保存
5. 上传一份真实测试报告，AI 解析成功返回
6. 手机 Safari 添加到主屏幕后可以正常打开 PWA

## 5. 建议的公开分享文案

你可以配一段非常简洁的介绍：

> SpineCare AI 是一个面向脊椎肿瘤复查阶段的个人健康管理网页工具，支持复查提醒、报告解析、症状记录与风险提示，用于帮助患者在恢复期更稳定地完成随访与自我观察。

## 6. 当前最适合继续补的内容

1. Supabase Storage：保存原始报告文件
2. 历次报告时间线页
3. 邮件提醒
4. 更严格的医疗安全文案和分层提示
