# CSV差分チェック

CSVファイルの追加・変更・削除をブラウザで比較するデモです。ファイルは端末内で処理され、外部へ送信されません。

## 使い方

1. リポジトリを clone し、[index.html](index.html) をブラウザで開きます。インストールやサーバー起動は不要です。
2. 「更新前」に [sample/before.csv](sample/before.csv)、「更新後」に [sample/after.csv](sample/after.csv) を指定します。
3. 照合する列を `ID` にして「差分を確認」を押します。追加 1 件、変更 1 件、削除 1 件が表示されます。
4. 「結果をCSVで保存」で差分の一覧を保存できます。変更件数は行単位、結果一覧は変更した列単位です。

CSVはUTF-8、先頭行は列名、照合列の値は一意・空欄なし、各行の列数は同一としてください。5 MBまで読み込めます。実際の業務データは公開リポジトリに置かず、手元のファイル選択から読み込んでください。

## 自動テスト

[.github/workflows/csv-check.yml](.github/workflows/csv-check.yml) は GitHub 上の変更と Pull Request で Node.js の標準テストランナーを実行します。リポジトリの Actions が有効なら、GitHub の Actions タブで結果を確認できます。ローカルに Node.js があれば `node --test test/*.test.js` でも確認できます。

CSV解析には同梱の PapaParse 5.5.3 を利用しています。ライセンスは [PAPAPARSE-LICENSE.txt](PAPAPARSE-LICENSE.txt) を参照してください。
