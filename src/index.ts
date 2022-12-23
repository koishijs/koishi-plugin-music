import { Context, Schema, segment } from 'koishi'
import {list} from "./ui";

export type Platform = 'netease' | 'qq'

export interface Config {
  showWarning?: boolean
  platform?: Platform
  puppeteer?: boolean
}

export const Config: Schema<Config> = Schema.object({
  showWarning: Schema.boolean().default(false).description('点歌失败时是否发送提示。'),
  platform: Schema.union<Platform>(['netease', 'qq']).default('qq').description('默认的点歌平台。'),
  puppeteer: Schema.boolean().default(true).description('启用Puppeteer集成(显示图片和歌曲封面、评论)[此功能需要安装Puppeteer插件,否则无效]'),
})

export interface Result {
  type: string
  id: string
  name: string
  artist: string
  album?: string
  url: string
}

const platforms: Record<Platform, (this: Context, keyword: string) => Promise<Result>> = {
  async netease(keyword) {
    const data = await this.http.get('http://music.163.com/api/cloudsearch/pc', {
      params: { s: keyword, type: 1, offset: 0, limit: 5 },
    })
    if (data.code !== 200 || data.result.songCount === 0) return
    //const song = data.result.songs[0]
    return data.result.songs.slice(0,5).map(song=>({
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
    // const song = data.data.song.itemlist[0]
    return data.data.song.itemlist.slice(0,5).map(song=>({
      type: 'qq',
      id: song.id,
      name: song.name,
      artist: song.singer,
      url: `https://y.qq.com/n/ryqq/songDetail/${song.mid}`,
      album:''
    }))
  },
}

export const name = 'music'

export function apply(ctx: Context, config: Config) {
  const { showWarning, platform } = config

  ctx.command('music <name:text>', '点歌')
    // typescript cannot infer type from string templates
    .option('platform', `-p <platform>  点歌平台，目前支持 qq, netease，默认为 ${platform}`, { type: Object.keys(platforms) })
    .option('force',`-f 强制使用找到的第一首歌曲，而不是向用户提问`)
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
        const result = await search.call(ctx, keyword) as Result
        if (Array.isArray(result) && result.length > 0) {
          let song = null;
          if(result.length > 1 && !options.force){
            return list(result,false);
          }else song = result[0];

          return segment('onebot:music', result, `${result.name}\n${result.artist}\n${result.url}`)
        }
      } catch(e) {
        console.info(e)
      }

      if (showWarning) return '点歌失败，请尝试更换平台。'
    })
}
