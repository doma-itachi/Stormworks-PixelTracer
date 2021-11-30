# Stormworks PixelTracer
ドット画像から文字などを自動で抽出し、ゲーム「Stormworks: Build and Rescue」内のモニター用のluaコードを生成するツールです。(ブラウザで動作)  
ドット画像(32x32の倍数サイズ)から文字などを**自動**でトレースし、luaコードを生成します。(手動でトレースもできます)  
A tool can generate luaCode from an image for display on the monitor in "Stormworks Build And Rescue".

## 使い方 - How to use
1. 任意の画像エディタでモニターに表示させたい画像を作成(サイズはゲーム内モニターの解像度、32x32の倍数)
2. PixelTracerでファイルを読み込んでから、"自動で選択する"から対象の色を指定[^freehand] [^minify]
3. クリップボードにコピーしてゲーム内のluaエディタに貼り付け

[^freehand]: 手動で選択することもできます
[^minify]: 右上のメニュー、設定からコードを短縮(大体1/2ほど)できます

## リンク - Links
[Stormworks PixelTracer](https://doma-itachi.github.io/Stormworks-PixelTracer/ "Stormworks PixelTracer")

## アップデート内容 - Updates
### v1.1
- 自動トレース機能追加
- コード最適化(最小化)機能追加
- 軽微なUIの変更

## おすすめフォント
- [KHドットフォントシリーズ](http://jikasei.me/font/kh-dotfont/ "KHdotFont")  
- [M+ビットマップフォント](https://mplus-fonts.osdn.jp/mplus-bitmap-fonts/ "MplusBitmap")

## デモ - Demo
https://user-images.githubusercontent.com/94786908/143872064-ca8b158d-3097-4e79-8b8d-2e7779d5fc03.mp4

## 既知のバグ
- 左クリックから左上に範囲選択すると挙動がおかしくなる
