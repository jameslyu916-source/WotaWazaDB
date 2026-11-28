# WazaDB

公開技總數 · 公開技数 · Total waza **<!-- public-count -->848<!-- /public-count -->**

技庫最後更新 · 技アーカイブ最終更新 · Archive last updated **2026-11-27**

**中文**　面向各地打师的 WOTA 艺技档案。可以按技名或作成者检索，点开条目查看演示和署名出处。页面右上角可以切换语言。

**日本語**　ヲタ芸の技を、技名・別名・読み・作者から探せるアーカイブです。各項目に参考動画と作者表記の出典を掲載しています。右上で表示言語を切り替えられます。

**English**　A Wotagei waza archive for performers worldwide. Search by waza name, alias, reading or creator, then open an entry for demonstrations and attribution sources. Use the language selector at the top right. Waza names and performer credits retain their original spelling.

WOTA 艺技档案。打开 `review.html` 可按技名、读音、别名或作成者搜索待审条目，展开一行即可查看署名来源和视频定位。`index.html` 只展示通过审核的条目，可单独部署。

## 维护

每个技在 `entries/` 有一个固定编号。文件采用兼容 YAML 1.2 的 JSON 写法，使用 Node.js 24 即可构建，无需安装依赖。新条目设为 pending。已有条目的更新建议在独立分支编辑，经维护者审阅后合并。GitHub 的纠错 Issue 模板位于 `.github/ISSUE_TEMPLATE/`。

```sh
node tools/build.mjs
# 维护者确认某一条后，在本地批准并重新生成两个页面
node tools/build.mjs approve w0001
```

视频对象的可选 published 指视频投稿日期。条目的 updated 指本档案最近一次编辑或通过审核的日期，手动修订时一并更新。作成日期仅在来源明确说明时填写 creation，包含 date、source 和 evidence（日期、已列出的来源网址、支持这项判断的说明）。本家待考可在 note 中写明。未知读音或译名留空。

## 旧库核对

本次读取 [Wotagei-bot 的 SQLite 快照](https://github.com/jameslyu916-source/Wotagei-bot/blob/main/wotagei.db)，Git blob 为 `1e74f70e5630b8838f4de66eb7f5fd51453a0709`。可在项目根目录运行 `node tools/audit.mjs <旧库路径>` 重新生成 legacy-audit.json。脚本只读数据库，按标题或灰机模板的原名提供跨来源候选。名称的大小写与全半角统一仅用于检索。报告中的署名保留旧库写法，模板名、复合字段以及同名记录均需复核。

灰机的「作成者」与タイムズ的 creator 对应档案的 creators。「本家」单独保留，有些填的是打师模板或“同上”。灰机「时间」、辞典 pub_date / upd_date 和抓取脚本 updated_at 均不自动填入档案日期。
