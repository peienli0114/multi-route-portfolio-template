# 📁 Portfolio Template — 多路由求職作品集框架

<p align="center">
  <strong>一套可針對不同職缺客製化呈現的 SPA 作品集模板</strong><br/>
  基於 React + TypeScript，支援多路由版本、中英雙語、後台管理、Vercel / GitHub Pages 部署
</p>

---

## ✨ 特色功能

| 功能 | 說明 |
| :--- | :--- |
| 🎯 **多路由版本** | 透過 URL 路由參數（如 `/#/pm/`、`/#/ux_researcher/`）呈現不同版本的作品集，客製化首頁、CV、作品分類與排序 |
| 🫧 **可自訂首頁氣泡** | 首頁右側的技能氣泡完全由資料驅動，透過 Admin GUI 可即時拖拽調整位置、大小、顏色與文字。每個路由版本可配置獨立的氣泡 |
| 🌐 **中英雙語** | 每一筆作品與路由皆可同時設定中文與英文內容，透過路由的 `lang` 參數快速切換 |
| 📊 **求職分類策略** | 同一組作品可依據不同職缺重新分類與排序，一套作品打造專屬的求職敘事 |
| 🖥️ **後台管理 (Admin GUI)** | 內建 Express 後端 + 瀏覽器管理介面，可直接編輯路由配置、經歷、發表與技能資料 |
| 📈 **流量追蹤整合** | 支援 Google Analytics (GA4) + Vercel Analytics，含 Hash 路由追蹤 |
| 📱 **響應式設計** | 針對桌面與手機提供最佳化排版、側邊導覽列自動收合 |
| 🔗 **作品深連結** | 每件作品都有獨特的 URL（如 `/#/pm/sample1`），可直接分享至履歷或社群 |
| 🎨 **進階視覺體驗** | Sticky/Floating Banner、呼吸燈頁尾動效、滾動導覽指示 |

---

## 📐 系統架構

```
┌──────────────────────────────────────────────────────────┐
│                    使用者 (Browser)                        │
│  URL:  /#/{routeKey}/{workCode}                          │
└──────────┬───────────────────────────────────┬────────────┘
           │                                   │
    ┌──────▼──────┐                    ┌───────▼───────┐
    │ React SPA   │                    │ Admin GUI     │
    │ (Port 3000) │                    │ (/admin)      │
    └──────┬──────┘                    └───────┬───────┘
           │                                   │
    ┌──────▼──────────────────────┐    ┌───────▼───────┐
    │ Custom Hooks               │    │ Express API   │
    │ useRouteKey                │    │ (Port 3001)   │
    │ usePortfolioData           │    │ 讀寫 JSON     │
    │ useExperienceData          │    └───────────────┘
    │ useSkillData / usePublish  │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ JSON Data Files            │
    │ src/work_list/             │
    │   portfolioRoutes.json     │  ← 路由配置 (手動/Admin)
    │   allWorkData.json         │  ← 作品詳情 (Excel 生成)
    │   portfolioMap.json        │  ← 作品代碼對照 (Excel 生成)
    │   experienceData.json      │  ← 經歷 (CSV 生成)
    │   publishData.json         │  ← 發表 (CSV 生成)
    │   skillsData.json          │  ← 技能 (手動/Admin)
    └─────────────────────────────┘
```

### 資料流概要

```
1. 使用者開啟 URL  →  useRouteKey 解析 routeKey 與 workCode
2. usePortfolioData 根據 routeKey 讀取 portfolioRoutes.json 中對應的配置
3. 合併 allWorkData.json 中的作品內容，按分類與順序組裝頁面資料
4. React 元件渲染 Home / CV / Portfolio 區塊
5. 若有 workCode，自動滾動至指定作品
```

---

## 🚀 快速開始

### 前置需求

- **Node.js** >= 16
- **Yarn** (建議) 或 npm
- **Python 3** (僅在使用 Excel → JSON 同步功能時需要)

### 安裝與啟動

```bash
# 1. Clone 此專案
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

# 2. 安裝依賴
yarn install

# 3. 開發模式啟動（前端 + 後端 + 自動同步資料）
yarn dev

# 或僅啟動前端
yarn start
```

開啟瀏覽器前往 `http://localhost:3000` 即可預覽。

---

## 📝 如何客製化你的作品集

### Step 1：修改個人資料

所有資料都集中在 `src/work_list/` 目錄中：

| 檔案 | 說明 | 編輯方式 |
| :--- | :--- | :--- |
| `portfolioRoutes.json` | **路由配置**：定義每個路由的首頁文案、CV 設定、作品分類與排序 | 手動編輯或 Admin GUI |
| `skillsData.json` | **技能列表**：CV 區塊中的技能分類 | 手動編輯或 Admin GUI |
| `allWorkData.json` | **作品詳情**：每件作品的標題、介紹、標籤、連結、合作者 | Excel 生成或 Admin GUI |
| `portfolioMap.json` | **作品代碼對照**：code → title 對應表 | Excel 生成 |
| `experienceData.json` | **經歷資料**：教育/工作/專案經歷 | CSV 生成或 Admin GUI |
| `publishData.json` | **發表/獎項**：論文、獎項、展覽等 | CSV 生成或 Admin GUI |

### Step 2：新增作品

1. **建立作品代碼**：例如 `project1`
2. **在 `allWorkData.json` 新增作品資料**（或透過 Excel/CSV 同步）
3. **放置圖片**：`src/asset/work/project1/`
   - 主圖命名需以 `mainpic` 或 `headpic` 開頭
   - 其他圖片會自動加入 gallery (會依圖片序號排列，若無序號則依檔名排序)
4. **在 `portfolioRoutes.json` 中將 code 加入分類**

### Step 3：建立新路由版本

在 `portfolioRoutes.json` 中新增一個頂層 key，例如：

```json
{
  "default": { ... },
  "company_a_ux": {
    "siteTitle": "My Portfolio for Company A",
    "sidebarTitle": "YOUR NAME",
    "home": {
      "badge": "Application for Company A",
      "title": "UX Research × Data × Prototyping",
      "intro": ["Dear hiring team, ..."]
    },
    "categories": {
      "Core UX Research": ["project1", "project2"],
      "Technical Projects": ["project3"]
    }
  }
}
```

存取方式：`http://localhost:3000/#/company_a_ux/`

### 路由配置欄位說明

```typescript
{
  siteTitle?: string;        // 瀏覽器標題
  sidebarTitle?: string;     // 側邊列顯示名稱
  siteTitleEn?: string;      // 英文瀏覽器標題
  sidebarTitleEn?: string;   // 英文側邊列名稱
  lang?: 'zh' | 'en';       // 語言設定（影響介面語言）
  cv?: {
    link?: string;           // CV 下載連結
    showGroups?: string[];   // 顯示哪些經歷分組
  };
  home?: {
    badge?: string;          // 首頁標語 badge
    title?: string;          // 首頁主標題
    intro?: string[];        // 首頁段落（陣列，每項一段）
    blobs?: BlobConfig[];    // 首頁技能氣泡（優先級最高）
  };
  blobs?: BlobConfig[];      // 路由氣泡配置（備選）
  footer?: {
    title?: string;          // 頁尾標題
    message?: string;        // 頁尾訊息
    email?: string;          // 聯絡 Email
  };
  cvSummary?: (string | string[])[];  // CV 摘要（支援巢狀）
  skills?: SkillGroupData[];           // 技能（覆蓋 skillsData.json）
  categories?: {
    [categoryName: string]: string[];  // 分類名 → 作品 code 陣列
  };
}
```

### 氣泡 (Blobs) 配置說明

首頁右側的技能氣泡完全由資料驅動。每個氣泡的結構如下：

```typescript
{
  id: string;           // 唯一 ID
  label: string;        // 顯示文字（用 \n 換行）
  size: 'large' | 'small';  // 大氣泡有漸層背景，小氣泡是半透明白色
  x: string;            // 水平位置（CSS 百分比，如 "25%"）
  y: string;            // 垂直位置（CSS 百分比，如 "10%"）
  width?: string;       // 寬度（預設大氣泡 40%，小氣泡 12%）
  color?: string;       // 漸層顏色（僅限大氣泡，如 "#fd9225"）
  animDuration?: number; // 浮動動畫時長（秒）
  animDelay?: number;   // 動畫延遲（秒）
}
```

**優先級**：`home.blobs` > 路由 `blobs` > `default` 路由 `blobs` > 內建預設值

### 作品資料欄位說明

```typescript
{
  fullName?: string;      // 完整名稱
  h2Name?: string;        // 副標題
  tableName?: string;     // 列表中的短名稱
  yearBegin?: string;     // 開始年份
  yearEnd?: string;       // 結束年份
  intro?: string;         // 介紹文字
  introList?: string[];   // 條列式重點
  headPic?: string;       // 主圖檔名（通常自動偵測）
  tags?: string[];        // 標籤
  links?: { name, link }[];      // 外部連結
  coWorkers?: { name, work }[];  // 合作者
  content?: string;       // Markdown 內文
  // 英文欄位（以 En 結尾）
  fullNameEn?: string;
  h2NameEn?: string;
  introEn?: string;
  introListEn?: string[];
  tagsEn?: string[];
}
```

---

## 🔧 資料同步工具

### Excel/CSV → JSON 自動同步

系統提供 Python 腳本將 Excel 和 CSV 轉換為 JSON：

```bash
# 同步所有資料（作品 + 經歷 + 發表）
yarn sync-portfolio

# 僅同步作品資料
yarn sync-works-only
```

**資料來源對應**：

| 來源檔案 | 產生的 JSON | 說明 |
| :--- | :--- | :--- |
| `porfolio_list.xlsx` | `allWorkData.json` + `portfolioMap.json` | 作品詳情與代碼對照 |
| `experience.csv` | `experienceData.json` | 經歷資料 |
| `publish.csv` | `publishData.json` | 發表與獎項 |

> ⚠️ **注意**：若你使用 Excel/CSV 管理資料，在 Admin GUI 中編輯的自動生成 JSON 在下次 `sync-portfolio` 時**會被覆蓋**。

### 不使用 Excel/CSV

如果你不需要 Excel/CSV 流程，可以直接手動編輯 JSON 檔案，或使用 Admin GUI。

---

## 🖥️ 後台管理 (Admin GUI)

```bash
# 啟動含後端的開發模式
yarn dev

# 開啟後台
# http://localhost:3000/admin
```

Admin GUI 提供：
- **portfolioRoutes.json 編輯**：新增/編輯路由版本
- **首頁氣泡編輯器 🫧**：在路由編輯器內，可拖拽調整氣泡位置、修改文字/大小/顏色/動畫
- **experienceData.json 編輯**：管理經歷資料
- **publishData.json 編輯**：管理發表與獎項
- **skillsData.json 編輯**：管理技能列表

---

## 📊 追蹤與分析設定

### Google Analytics (GA4)

1. 前往 [Google Analytics](https://analytics.google.com/) 建立一個新的資源 (Property)
2. 取得你的 **Measurement ID**（格式如 `G-XXXXXXXXXX`）
3. 編輯 `public/index.html`，取消註解 GA 區塊並替換 ID：

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YOUR_ID');
</script>
```

4. 進階路由追蹤已內建於 `src/hooks/useGaPageView.ts`，會自動發送 Hash 路由變更事件到 GA

### Vercel Analytics

專案已內建 `@vercel/analytics`，部署到 Vercel 後會自動啟用。

若不需要 Vercel Analytics，可在 `src/index.tsx` 中移除：
```tsx
// 移除這兩行
import { Analytics } from '@vercel/analytics/react';
// ...
<HashAnalytics />
```

---

## 🌐 部署指南

### 方式一：Vercel（推薦）

1. 將專案推送到 GitHub
2. 前往 [Vercel](https://vercel.com/) 並 Import 你的 GitHub repo
3. Framework Preset 選擇 **Create React App**
4. 點擊 Deploy — 完成！

`vercel.json` 已配置好 SPA 路由重寫：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### 方式二：GitHub Pages

1. 修改 `scripts/build-gh.js` 中的 `REPO_NAME` 為你的 GitHub repo 名稱：

```javascript
const REPO_NAME = 'my-portfolio';  // ← 改成你的 repo 名
```

2. 執行部署：

```bash
yarn deploy
```

這會自動建置並推送到 `gh-pages` 分支。

### 方式三：其他靜態主機

```bash
yarn build
```

將 `build/` 目錄的內容上傳至任何靜態主機（Netlify、Cloudflare Pages 等）。
注意 SPA 路由需要配置 fallback 到 `index.html`。

---

## 📂 專案結構

```
.
├── public/                    # 靜態資源
│   ├── index.html             # HTML 模板（GA 追蹤碼在此設定）
│   ├── manifest.json          # PWA 設定
│   └── assets/                # 公開靜態檔案
│
├── src/
│   ├── App.tsx                # 路由定義（主頁 + Admin）
│   ├── index.tsx              # 進入點（含 Vercel Analytics 設定）
│   ├── main.css               # 全站主要樣式表
│   │
│   ├── components/            # UI 元件
│   │   ├── Home/              # 首頁區塊元件
│   │   ├── Portfolio/         # 作品集區塊元件
│   │   ├── CvViewer/          # CV 區塊元件
│   │   ├── Sidebar/           # 側邊導覽列
│   │   ├── Footer/            # 頁尾元件
│   │   ├── Layout/            # 整體佈局元件
│   │   └── Admin/             # 後台管理元件
│   │
│   ├── hooks/                 # 自定義 Hooks
│   │   ├── useRouteKey.ts     # 解析 URL 中的 routeKey 與 workCode
│   │   ├── usePortfolioData.ts # 組裝完整頁面資料
│   │   ├── useExperienceData.ts # 經歷資料處理
│   │   ├── useSkillData.ts    # 技能資料處理
│   │   ├── usePublishData.ts  # 發表資料處理
│   │   └── useGaPageView.ts   # GA 頁面瀏覽追蹤
│   │
│   ├── types/                 # TypeScript 型別定義
│   │   └── portfolio.ts       # 所有資料型別
│   │
│   ├── work_list/             # ⭐ 資料核心
│   │   ├── portfolioRoutes.json   # 路由配置
│   │   ├── allWorkData.json       # 作品詳情
│   │   ├── portfolioMap.json      # 作品代碼對照
│   │   ├── experienceData.json    # 經歷
│   │   ├── publishData.json       # 發表/獎項
│   │   ├── skillsData.json        # 技能
│   │   ├── experience.csv         # 經歷原始檔
│   │   └── publish.csv            # 發表原始檔
│   │
│   ├── asset/                 # 圖片與媒體資源
│   │   ├── work/              # 各作品圖片 (按 code 分資料夾)
│   │   ├── homePage/          # 首頁圖片
│   │   ├── certificates/      # 證照圖片
│   │   └── cv/                # CV 相關資源
│   │
│   └── pages/                 # 頁面元件
│       ├── MainPage.tsx       # 主要作品集頁面
│       └── AdminPage.tsx      # 後台管理頁面
│
├── server/                    # 開發用後端 (Admin API)
│   ├── server.ts              # Express Server
│   └── tsconfig.json          # 後端 TS 設定
│
├── scripts/                   # 自動化腳本
│   ├── generate_portfolio_map.py  # Excel/CSV → JSON 同步
│   ├── build-gh.js            # GitHub Pages 建置
│   └── resize-homepage-images.js  # 首頁圖片批次處理
│
├── package.json               # 專案依賴與腳本指令
├── tsconfig.json              # TypeScript 設定
└── vercel.json                # Vercel 部署設定
```

---

## 📋 常用指令

| 指令 | 說明 |
| :--- | :--- |
| `yarn dev` | **推薦開發指令**—啟動前端 (3000) + 後端 (3001) |
| `yarn start` | 僅啟動前端 |
| `yarn start:backend` | 僅啟動後端 API |
| `yarn build` | 建置生產版本 |
| `yarn sync-portfolio` | 從 Excel/CSV 重新生成 JSON 資料 |
| `yarn deploy` | 部署至 GitHub Pages |
| `yarn resize:homepage` | 批次調整首頁圖片大小至 450px 高 |

---

## 🎯 使用範例：建立求職版本

假設你要應徵 **A 公司 UX Researcher** 職位：

1. 在 `portfolioRoutes.json` 新增路由 `"company_a_ux"`
2. 設定首頁文案針對該職缺撰寫
3. 自訂首頁氣泡，突顯 UX 相關技能（如 User Research、Usability Testing）
4. 將作品重新分類，突顯 UX 相關專案
5. 產生專屬連結：`https://your-site.vercel.app/#/company_a_ux/`
6. 將此連結放在履歷上

多個路由可同時存在，互不干擾。你可以為不同職缺建立不同的呈現版本與氣泡。

## 🎯 使用範例：提供特定作品連結

假設你要提供特定作品連結，例如：  
`https://your-site.vercel.app/#/預設或特定路徑/作品編號/`



---

## 🛠️ 技術棧

- **Frontend**: React 19 + TypeScript + React Router v7
- **Styling**: Vanilla CSS (main.css)
- **Backend**: Express 5 (開發用 Admin API)
- **Build Tool**: Create React App (react-scripts 5)
- **Data Sync**: Python 3 (openpyxl)
- **Analytics**: Google Analytics 4 + Vercel Analytics
- **Deployment**: Vercel / GitHub Pages

---

## �‍💻 作者 Author

**李佩恩 Pei-En Li**

工業設計背景出身，擁有 3 年半設計實務經驗，研究所期間轉向使用者研究與數據 / AI 應用。擅長結合設計研究、資料洞察與技術評估，以跨領域視角發掘問題並提出解方。

🔗 **作品集網站**：[peien-portfolio.vercel.app](https://peien-portfolio.vercel.app/)

---

## 🤖 AI 共創 Co-created with AI

本專案由作者與多款 AI 工具協作開發，包括：

| AI 工具 | 用途 |
| :--- | :--- |
| **OpenAI Codex** | 程式碼生成與邏輯協助 |
| **Google Gemini CLI** | 架構規劃與文件撰寫 |
| **Antigravity** | 進階程式碼開發與除錯 |

> 本專案展示了人類設計思維與 AI 輔助開發的協作成果。所有設計決策、產品需求與使用者體驗均由作者主導，AI 工具作為高效的開發夥伴加速實現。

---

## �📄 授權 License

MIT License with Attribution — 歡迎自由使用與修改，但請標註來源。

使用本模板時，請在你的專案中保留以下來源標註（擇一即可）：

**方式一：在 README 或頁尾加入文字**

```
Built with Multi-Route Portfolio Template by Pei-En Li
https://github.com/你的來源repo連結
```

**方式二：在 HTML 中加入註解**

```html
<!-- Built with Multi-Route Portfolio Template by Pei-En Li -->
<!-- https://github.com/你的來源repo連結 -->
```

> 你不需要在頁面顯眼處放置標註，只要在原始碼或文件中保留即可。感謝你的尊重與支持！🙏

---

<p align="center">
  Built with ❤️ and 🤖 as a portfolio template for job seekers.<br/>
  由佩恩與 AI 共同打造，獻給每一位正在求職的你。<br/><br/>
  如果覺得有幫助，歡迎 ⭐ Star 支持！
</p>
