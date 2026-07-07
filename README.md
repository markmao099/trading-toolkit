# 投資資金管理工具箱 Trading Toolkit

三合一的台股資金管理計算器，純前端、無後端、開檔即用。

## 功能

| 分頁 | 用途 |
|---|---|
| ① 單筆倉位 | 風險預算制拆分單筆部位（股數 = 資金×R% ÷ 停損距離），凱莉公式當期望值檢查員 |
| ② 組合熱度 | 多檔分散管理：總熱度H × 每筆R 兩層預算、現金上限自動縮減、相關性群組警示 |
| ③ 固定槓桿 | 股票期貨固定槓桿再平衡：買賣口數指令、保證金體檢、追繳/斷頭價試算 |

## 使用方式

**線上使用**：開啟 GitHub Pages 網址即可（見下方部署說明）。

**本機使用**：直接用瀏覽器開啟 `index.html`。

## 部署到 GitHub Pages

1. 建立新 repository（例如 `trading-toolkit`）
2. 上傳本資料夾所有檔案到 repo 根目錄
3. Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main`、資料夾選 `/ (root)`，儲存
4. 約1分鐘後網址生效：`https://<你的帳號>.github.io/trading-toolkit/`

## 開發

原始碼在 `src/trading-toolkit.jsx`（React 元件）。修改後重新打包：

```bash
npm install
npx esbuild src/entry.jsx --bundle --minify --jsx=automatic --outfile=bundle.js
# 再將 bundle.js 內嵌進 index.html，或改用 <script src="bundle.js">
```

## 免責聲明

本工具僅供試算參考，不構成投資建議。保證金比例、砍倉標準以台灣期交所與你的期貨商公告為準。
