# Resume Studio

A personal job workspace adapted from [Samecho/job-board](https://github.com/Samecho/job-board). The original resume generation, browser LaTeX/PDF rendering, profile editor and version history are retained. This copy starts with **zero companies** and has no preset catalog, rankings or internship restrictions.

## 使用方法

1. 打开 **Resume**，填写你的 Resume profile（教育、工作、项目、技能等真实经历）。资料自动保存在当前浏览器。
2. 在 AI settings 选择服务商和模型，填写你自己的 API key，点击 Save。生成会调用所选服务商并可能产生费用。
3. 打开 **Overview → Add company & JD**，输入任意公司名称，可同时填写岗位、完整 JD、链接、地点和备注。
4. 点击 **Save & open Resume**，保存或编辑岗位。每家公司可以添加多个岗位及各自的 JD。
5. 选择岗位，点击 **Generate for selected**。生成的简历保留版本历史，可以预览和下载 PDF / TeX，也可以手动修改或 AI refine。
6. 公司卡片的 Edit 或表格中的备注可编辑公司；Delete company 会删除这家公司的岗位和简历，操作前会确认。

## Data and backups

Companies, JDs, profile, API settings and generated files live in IndexedDB on the current browser/device. GitHub hosts application code only. There is no account login or automatic cross-device sync. Clearing site data removes local records. The app uses its own `personal-resume-studio` database and does not change the upstream app's data.

Use **Resume → Export Everything** regularly. A ZIP contains your custom companies, applications, profile, resume versions, PDFs and TeX. API keys are excluded. **Import Backup** replaces local data after confirmation and accepts backups from this personal version. You must configure an API key separately on a new browser. Resume data and target JDs are sent to your chosen AI provider when generating/refining.

## Develop and check

Requires Node.js 22 or newer.

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL shown by Vite. For validation:

```powershell
npm test
npm run build
```

## GitHub Pages

`.github/workflows/pages.yml` tests and builds the frontend, then deploys `frontend/dist` to GitHub Pages after pushes to `main`. In repository Settings → Pages, select **GitHub Actions** as the source. Vite uses relative asset paths, including the local WebAssembly LaTeX compiler, so it supports repository subpaths.

The published code and page contain no personal resume or API key. User-entered records remain in each visitor's browser. This project preserves upstream Git history and attribution; its legacy backend, bundled company catalog and old catalog-specific scripts have been removed.

## DeepSeek

New workspaces default to **DeepSeek 4.1 Flash 1017**. The official API model ID is `deepseek-flash`, currently serving DeepSeek-V4.1-Flash-1017, as documented in [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/) (checked 2026-10-25). This alias follows future provider updates; it does not pin a dated checkpoint.

Generation, AI refinement and Test Connection use `https://api.deepseek.com/chat/completions`, Bearer authentication and JSON output. Test Connection makes a small generation request and may incur usage. Empty, truncated or rejected responses are reported without automatic paid retries. DeepSeek cost estimates are not currently calculated. Existing saved provider selections are preserved. Switching providers clears the unsaved API key field; enter the selected provider's key and Save.

## Resume layout and complete credentials

The exported section order is Experience → optional Projects → Certifications → Technical Skills → Education. Experience is sorted locally by end date descending (Present first), then start date descending; missing dates remain stable at the end. This applies to generated, refined and locally updated versions without changing the profile's entered dates or entry order.

Generation retains every named certification from the profile, even if AI omits it. Fitting can shorten descriptions but never removes certificate names or links. AI refinement preserves the original credential list. Source status/renewal caveats remain in the profile; missing AI descriptions stay empty rather than copying private source notes.

Existing PDFs remain immutable. Use **Update layout & certifications** in Resume → Generated resumes or a company's saved versions to create a new version without an AI call. This restores missing current-profile credentials, retains historical credentials and all existing bullets, and updates only the selected application's assignment. It may span multiple pages to preserve content; original PDFs and other assignments remain available.
