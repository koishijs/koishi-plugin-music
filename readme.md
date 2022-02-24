# koishi-plugin-music

[![npm](https://img.shields.io/npm/v/koishi-plugin-music?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-music)

使用 Koishi 分享音乐。目前支持的平台有：qq, netease。

## 配置项

### platform

- 类型: `string`
- 默认值: `'qq'`

默认的点歌平台。

### showWarning

- 类型: `boolean`

点歌失败时是否发送提示。

## 指令：music

- 基本语法：`music <keyword>`
- 选项列表：
  - -p, --platform \<platform> 点歌平台
