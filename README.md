# gulpファイルTK自作版

- 2022/5/15 第１版

# 使い方
- scssファイルを増やすごとに、各フォルダのindex.scssに@use "ファイル名";を入力すること
-  直下にフォルダを増やした場合は、直下のstyle.scss内に
@use "フォルダ名";を入力すること
-  各ファイルの頭には必ず@use "global" as *;をつけること。。

# 注意点
- index.htmlはdistの中に作ります。distにしているのは、distのフォルダ内で完結できることが望ましいからです。
- pugのコンパイルに対応しています。
- 

