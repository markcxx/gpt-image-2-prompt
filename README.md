# GPT-Image-2 Prompt 参考站

一个基于 Next.js + Prisma + PostgreSQL + Cloudflare R2 的 Prompt 图片参考站。

## 功能说明

- 前台首页：瀑布流查看图片，支持按「实用功能」和「绘图风格」筛选。
- 首页筛选规则：`实用功能` 与 `绘图风格` 为互斥筛选（二选一，不做交集）。
- Prompt 复制：卡片支持一键复制中英文 Prompt。
- 管理员后台：仅管理员登录后可访问上传页面。
- 上传流程：图片上传到 Cloudflare R2，图片元数据写入 PostgreSQL。

## 默认分类

- 实用功能（当前 4 项）：科研绘图、PPT设计、海报设计、UI设计。
- 绘图风格（当前 50 项）：像素艺术、8位风、动漫风、水彩、油画、蓝图、等距视角、低多边形、霓虹光效、写实摄影、电影感、抽象艺术、墨线画、蚀刻版画、炭笔画、粉彩/色粉、合成波、蒸汽朋克、赛博朋克、浮世绘、极简线条、金箔、全息、技术剖面图、吉卜力风、波普艺术、印象派、超现实主义、装饰艺术、新艺术运动、蒸汽波、故障艺术、涂鸦/街画、3D 渲染、黏土/定格、剪纸风、拼贴画、铅笔素描、美漫风、赛璐璐上色、体素风、水粉画、孔版印刷、中国水墨、彩色玻璃、木刻版画、黑色电影、双重曝光、扁平设计、乐高风。

## 环境准备

1. 安装 Node.js 20+。
2. 在项目根目录复制环境变量文件：

```bash
cp .env.example .env
```

3. 填写 `.env`：

- `DATABASE_URL`：PostgreSQL 连接串（你当前使用 Neon）。
- `AUTH_SECRET`：任意长随机字符串。
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`：后台管理员账号。
- `R2_ENDPOINT`：`https://<account_id>.r2.cloudflarestorage.com`
- `R2_BUCKET_NAME`：例如 `gpt-image-2`
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`：R2 S3 凭据。
- `R2_PUBLIC_BASE_URL`：可选，自定义公开访问域名时填写。

## 本地初始化

```bash
npm install
npm run db:push
npm run db:seed
```

## 本地开发

```bash
npm run dev
```

默认访问 [http://localhost:3000](http://localhost:3000)。

## 生产构建

```bash
npm run build
npm run start
```

## 常用脚本

- `npm run db:generate`：重新生成 Prisma Client。
- `npm run db:migrate`：创建并执行 Prisma migration（开发模式）。
- `npm run db:push`：直接同步 schema 到数据库。
- `npm run db:seed`：写入分类/风格/示例数据与管理员账号。
