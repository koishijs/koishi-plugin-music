import { Context, Schema, segment, version } from 'koishi'
import {} from 'koishi-plugin-puppeteer'

const { version: pVersion } = require('../package.json')

export type Platform = 'netease' | 'qq'

export interface Config {
  platform?: Platform
  imageMode?: boolean
  showWarning?: boolean
}

export const Config: Schema<Config> = Schema.object({
  platform: Schema.union<Platform>(['netease', 'qq']).default('qq').description('默认的点歌平台。'),
  imageMode: Schema.boolean().default(true).description('是否使用图片模式 (需要 puppeteer 服务)。'),
  showWarning: Schema.boolean().default(false).description('点歌失败时是否发送提示。'),
})

interface Result {
  type: string
  id: string
  name: string
  artist: string
  url: string
  album: string
}

const platforms: Record<Platform, (this: Context, keyword: string) => Promise<Result[]>> = {
  async netease(keyword) {
    const data = await this.http.get('http://music.163.com/api/cloudsearch/pc', {
      params: { s: keyword, type: 1, offset: 0, limit: 5 },
    })
    if (data.code !== 200 || data.result.songCount === 0) return
    return data.result.songs.map((song) => ({
      type: '163',
      id: song.id,
      name: song.name,
      artist: song.ar.map(artist => artist.name).join('/'),
      url: `https://music.163.com/#/song?id=${song.id}`,
      album: song.al.name,
    }))
  },
  async qq(keyword) {
    const data = await this.http.get('https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg', {
      params: { key: keyword, format: 'json' },
    })
    if (data.code || data.data.song.count === 0) return
    return data.data.song.itemlist.map((song) => ({
      type: 'qq',
      id: song.id,
      name: song.name,
      artist: song.singer,
      url: `https://y.qq.com/n/ryqq/songDetail/${song.mid}`,
      album: '',
    }))
  },
}

export const name = 'music'

export function apply(ctx: Context, config: Config) {
  const { showWarning, platform, imageMode } = config

  function list(results: Result[]) {
    if (imageMode && ctx.puppeteer) {
      return <html style={{
        color: '#ffffff',
        background: '#333333',
        padding: '1rem',
      }}>
        <style>{`
          th, td {
            padding: 0.25rem 0.5rem;
          }
          .index, .title {
            text-align: center;
          }
        `}</style>
        <p>我们找到了多个可能符合条件的歌曲，请输入序号进行选择：</p>
        <table>
          <tr>
            <th class="index">编号</th>
            <th class="title">名称</th>
            <th>歌手</th>
          </tr>
          {results.map((t, i) => <tr>
            <td>{i + 1}</td>
            <td>{t.name}</td>
            <td>{t.artist}</td>
          </tr>)}
        </table>
        <p>Generated by Koishi v{version} / koishi-plugin-music v{pVersion}</p>
      </html>
    } else {
      return <>
        <p>我们找到了多个可能符合条件的歌曲，请输入序号进行选择：</p>
        {results.map((t, i) => <>
          <p>{i + 1}. {t.name} {t.artist} {t.album}</p>
        </>)}
      </>
    }
  }

  ctx.command('music <name:text>', '点歌')
    // typescript cannot infer type from string templates
    .option('platform', `-p <platform>  点歌平台，目前支持 qq, netease，默认为 ${platform}`, { type: Object.keys(platforms) })
    .alias('点歌')
    .shortcut('来一首', { fuzzy: true })
    .shortcut('点一首', { fuzzy: true })
    .shortcut('整一首', { fuzzy: true })
    .action(async ({ session, options }, keyword) => {
      if (!options.platform) options.platform = platform
      const search = platforms[options.platform]
      if (!search) {
        return `目前不支持平台 ${options.platform}。`
      }

      if (!keyword) return '请输入歌曲相关信息。'

      try {
        const result = await search.call(ctx, keyword) as Result[]
        if (Array.isArray(result) && result.length > 0) {
          if (result.length > 1) {
            await session.send(list(result))
            const input = await session.prompt()
            if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
            const index = +input - 1
            if (!result[index]) return '请输入正确的序号。'
            return segment('onebot:music', result[index], `${result[index].name}\n${result[index].artist}\n${result[index].url}`)
          }
          const { name, artist, url } = result[0]
          return segment('onebot:music', result[0], `${name}\n${artist}\n${url}`)
        }
      } catch (e) {
        console.warn(e)
      }

      if (showWarning) return '点歌失败，请尝试更换平台。'
    })
}
