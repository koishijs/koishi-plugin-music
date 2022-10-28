import { Context, Schema, segment } from 'koishi'

export type Platform = 'netease' | 'qq'

export interface Config {
  showWarning?: boolean
  platform?: Platform
}

export const Config: Schema<Config> = Schema.object({
  showWarning: Schema.boolean().default(false).description('点歌失败时是否发送提示。'),
  platform: Schema.union<Platform>(['netease', 'qq']).default('qq').description('默认的点歌平台。'),
})

interface Result {
  type: string
  id: string
}

const platforms: Record<Platform, (this: Context, keyword: string) => Promise<Result>> = {
  async netease(keyword) {
    const data = await this.http.get('http://music.163.com/api/cloudsearch/pc', {
      params: { s: keyword, type: 1, offset: 0, limit: 5 },
    })
    if (data.code !== 200) return
    return {
      type: '163',
      id: data.result.songs[0].id,
    }
  },
  async qq(keyword) {
    const data = await this.http.get('https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg', {
      params: { key: keyword, format: 'json' },
    })
    if (data.code) return
    return {
      type: 'qq',
      id: data.data.song.itemlist[0].id,
    }
  },
}

export const name = 'music'

export function apply(ctx: Context, config: Config) {
  const { showWarning, platform } = config

  ctx.command('music <name:text>', '点歌')
    // typescript cannot infer type from string templates
    .option('platform', `-p <platform>  点歌平台，目前支持 qq, netease，默认为 ${platform}`, { type: Object.keys(platforms) })
    .alias('点歌')
    .shortcut('来一首', { fuzzy: true })
    .shortcut('点一首', { fuzzy: true })
    .shortcut('整一首', { fuzzy: true })
    .action(async ({ options }, keyword) => {
      if (!options.platform) options.platform = platform
      const search = platforms[options.platform]
      if (!search) {
        return `目前不支持平台 ${options.platform}。`
      }

      if (!keyword) return '请输入歌曲相关信息。'

      try {
        const result = await search.call(ctx, keyword)
        if (typeof result === 'object') {
          return segment('onebot:music', result)
        }
      } catch {}

      if (showWarning) return '点歌失败，请尝试更换平台。'
    })
}
