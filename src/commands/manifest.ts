// tslint:disable no-implicit-dependencies

import {Command} from '@oclif/command'
import * as Config from '@oclif/config'
import * as fs from 'fs-extra'
import * as path from 'path'

export default class Manifest extends Command {
  static description = 'generates plugin manifest json'
  static args = [
    {name: 'path', description: 'path to plugin', default: '.'}
  ]

  async run() {
    try { fs.unlinkSync('oclif.manifest.json') } catch {}
    const {args} = this.parse(Manifest)
    const root = path.resolve(args.path)
    let plugin = new Config.Plugin({root, type: 'core', ignoreManifest: true, errorOnManifestCreate: true})
    if (!plugin) throw new Error('plugin not found')
    await plugin.load()
    if (!plugin.valid) {
      // @ts-ignore
      let p = require.resolve('@oclif/plugin-legacy', {paths: [process.cwd()]})
      const {PluginLegacy} = require(p)
      delete plugin.name
      plugin = new PluginLegacy(this.config, plugin)
      await plugin.load()
    }
    if (process.env.OCLIF_NEXT_VERSION) {
      plugin.manifest.version = process.env.OCLIF_NEXT_VERSION
    }
    const file = path.join(plugin.root, 'oclif.manifest.json')
    fs.writeFileSync(file, JSON.stringify(plugin.manifest))
    if (this.config.pjson.files.includes('.oclif.manifest.json')) {
      const pjson = await fs.readJSON('package.json')
      pjson.files = pjson.files.map((f: string) => f === '.oclif.manifest.json' ? 'oclif.manifest.json' : f)
      await fs.outputJSON('package.json', pjson, {spaces: 2})
    }
    this.log(`wrote manifest to ${file}`)
  }
}
