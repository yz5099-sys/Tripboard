# SpineCare AI｜脊椎肿瘤复查助手

这是基于你的 PRD 落地的一版可运行医疗 Web App MVP，当前已经接入：

- Supabase 真实登录与数据持久化
- OpenAI 多模态报告解析
- PDF / 图片 / DOCX / TXT 报告上传
- 症状问诊保存
- AI 复查周期建议
- PWA 安装支持

## 当前架构

### 前端

- `frontend/`
- Next.js 14
- 浏览器端直接调用 Supabase Auth / PostgREST REST API
- 登录方式：邮箱 + 密码

### 后端

- `backend/`
- FastAPI
- 调用 OpenAI Responses API
- 本地预处理：
  - PDF：`pypdf`
  - DOCX：`python-docx`
  - 图片：交给 OpenAI 视觉能力做 OCR + 理解

## 已实现的数据持久化

Supabase 中会保存：

- 患者基础档案 `patient_profiles`
- 症状记录 `symptom_entries`
- 报告 AI 解析结果 `report_analyses`

SQL 已准备在：

- [schema.sql](/Users/zhuyifei/Documents/New%20project/supabase/schema.sql)

## 环境变量

### 前端

参考：

- [frontend/.env.example](/Users/zhuyifei/Documents/New%20project/frontend/.env.example)

需要配置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 后端

参考：

- [backend/.env.example](/Users/zhuyifei/Documents/New%20project/backend/.env.example)

需要配置：

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_REPORT_MODEL=gpt-5.4-mini
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

## 启动步骤

### 1. 初始化 Supabase

1. 在 Supabase 创建项目
2. 打开 SQL Editor
3. 执行 [schema.sql](/Users/zhuyifei/Documents/New%20project/supabase/schema.sql)
4. 在 Authentication 中启用 Email 登录
5. 如果你想让“注册后立刻登录”更顺畅，可以先关闭强制邮箱确认；如果保持开启，前端也会提示用户先验证邮箱

### 2. 启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. 启动前端

如果本机有 `npm`：

```bash
cd frontend
npm install
npm run dev
```

如果当前终端没有全局 `npm`，仍可用工作区自带 Node 启动：

```bash
cd frontend
/Users/zhuyifei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next dev
```

## OpenAI 解析方式

当前后端使用 OpenAI Responses API：

- 图片：作为 `input_image` 发送，做 OCR + 医学理解
- PDF / 文档：作为 `input_file` 发送，并附带本地抽取文本辅助理解

我参考了官方文档关于：

- Responses API 支持文本、图片和文件输入
- 文件输入支持 Base64 方式传入
- 图片支持 Base64 data URL 作为输入

来源：

- [Responses API](https://platform.openai.com/docs/api-reference/responses/list?lang=python)
- [File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
- [Images and vision](https://developers.openai.com/api/docs/guides/images-vision)

## 已完成验证

前端构建通过：

```bash
/Users/zhuyifei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/next/dist/bin/next build
```

后端语法检查通过：

```bash
/Users/zhuyifei/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m compileall backend/app
```

## 线上部署

已经补好最小部署文件：

- [DEPLOY.md](/Users/zhuyifei/Documents/New%20project/DEPLOY.md)
- [render.yaml](/Users/zhuyifei/Documents/New%20project/render.yaml)
- [backend/Dockerfile](/Users/zhuyifei/Documents/New%20project/backend/Dockerfile)
- [vercel.json](/Users/zhuyifei/Documents/New%20project/vercel.json)

推荐部署组合：

- 前端：Vercel
- 后端：Render
- 数据库与认证：Supabase

## 下一步最值得继续做的事

1. 把 Supabase Storage 也接上，保存原始报告文件
2. 增加报告时间线和历次影像对比页
3. 增加邮件提醒和真正的复查任务调度
4. 把症状趋势图改成读取真实数据库记录
5. 增加医生审核版提示词和更严格的医疗安全分层
