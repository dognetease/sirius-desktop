import { apiHolder, SystemApi } from 'api';
import { from, defer, concat } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

const systemApi = apiHolder.api.getSystemApi();
const fileApi = apiHolder.api.getFileApi();
const inElectron = systemApi.isElectron();
// total
export const emojiList = new Map([
  ['[OK]', 'emoji_png_123.png'],
  ['[赞]', 'emoji_png_65.png'],
  ['[握手]', 'emoji_png_66.png'],
  ['[666]', 'emoji_png_5.png'],
  ['[送花花]', 'emoji_png_145.png'],
  ['[抱拳]', 'emoji_png_121.png'],
  ['[强壮]', 'emoji_png_122.png'],
  ['[+1]', 'emoji_png_3.png'],
  ['[yes]', 'emoji_png_150.png'],
  ['[no]', 'emoji_png_151.png'],
  ['[ok]', 'emoji_png_152.png'],
  ['[get]', 'emoji_png_153.png'],
  ['[踩]', 'emoji_png_64.png'],
  ['[微笑]', 'emoji_png_1.png'],
  ['[大笑]', 'emoji_png_2.png'],
  ['[呲牙]', 'emoji_png_14.png'],
  ['[done]', 'emoji_png_11.png'],
  ['[破涕为笑]', 'emoji_png_125.png'],
  ['[捂脸哭]', 'emoji_png_129.png'],
  ['[玫瑰]', 'emoji_png_60.png'],
  ['[爱心]', 'emoji_png_61.png'],
  ['[心碎]', 'emoji_png_62.png'],
  ['[机智]', 'emoji_png_131.png'],
  ['[好的]', 'emoji_png_137.png'],
  ['[社会社会]', 'emoji_png_135.png'],
  ['[思考]', 'emoji_png_144.png'],
  ['[哭泣]', 'emoji_png_43.png'],
  ['[大哭]', 'emoji_png_102.png'],
  ['[鼓掌]', 'emoji_png_37.png'],
  ['[耶]', 'emoji_png_29.png'],
  ['[可爱]', 'emoji_png_28.png'],
  ['[再见]', 'emoji_png_48.png'],
  ['[害羞]', 'emoji_png_38.png'],
  ['[灵感]', 'emoji_png_72.png'],
  ['[脸红]', 'emoji_png_126.png'],
  ['[惊讶]', 'emoji_png_4.png'],
  ['[得意]', 'emoji_png_6.png'],
  ['[生气]', 'emoji_png_7.png'],
  ['[抠鼻]', 'emoji_png_35.png'],
  ['[尴尬]', 'emoji_png_9.png'],
  ['[难过]', 'emoji_png_10.png'],
  ['[失望]', 'emoji_png_12.png'],
  ['[怕怕]', 'emoji_png_8.png'],
  ['[流汗]', 'emoji_png_17.png'],
  ['[痴笑]', 'emoji_png_18.png'],
  ['[困]', 'emoji_png_19.png'],
  ['[吐]', 'emoji_png_20.png'],
  ['[疑问]', 'emoji_png_21.png'],
  ['[嘘]', 'emoji_png_22.png'],
  ['[敲打]', 'emoji_png_23.png'],
  ['[闭嘴]', 'emoji_png_24.png'],
  ['[色眯眯]', 'emoji_png_26.png'],
  ['[鄙视]', 'emoji_png_31.png'],
  ['[晕]', 'emoji_png_34.png'],
  ['[撒娇]', 'emoji_png_36.png'],
  ['[抽烟]', 'emoji_png_39.png'],
  ['[欠揍]', 'emoji_png_40.png'],
  ['[飞吻]', 'emoji_png_41.png'],
  ['[工作忙]', 'emoji_png_42.png'],
  ['[色]', 'emoji_png_16.png'],
  ['[偷笑]', 'emoji_png_44.png'],
  ['[送花]', 'emoji_png_45.png'],
  ['[亲一个]', 'emoji_png_46.png'],
  ['[飘飘]', 'emoji_png_49.png'],
  ['[秀一下]', 'emoji_png_50.png'],
  ['[囧]', 'emoji_png_52.png'],
  ['[抓狂]', 'emoji_png_53.png'],
  ['[发怒]', 'emoji_png_56.png'],
  ['[傲慢]', 'emoji_png_57.png'],
  ['[嘴唇]', 'emoji_png_63.png'],
  ['[蛋糕]', 'emoji_png_119.png'],
  ['[叹气]', 'emoji_png_94.png'],
  ['[亲亲]', 'emoji_png_95.png'],
  ['[耍酷]', 'emoji_png_96.png'],
  ['[摸摸]', 'emoji_png_97.png'],
  ['[睫毛弯弯]', 'emoji_png_98.png'],
  ['[发呆]', 'emoji_png_100.png'],
  ['[睡]', 'emoji_png_101.png'],
  ['[奋斗]', 'emoji_png_105.png'],
  ['[幽灵]', 'emoji_png_140.png'],
  ['[刀]', 'emoji_png_70.png'],
  ['[炸弹]', 'emoji_png_71.png'],
  ['[旺柴]', 'emoji_png_136.png'],
  ['[猪头]', 'emoji_png_120.png'],
  ['[吐舌]', 'emoji_png_103.png'],
  ['[白眼]', 'emoji_png_104.png'],
  ['[咒骂]', 'emoji_png_106.png'],
  ['[衰]', 'emoji_png_107.png'],
  ['[骷髅]', 'emoji_png_108.png'],
  ['[擦汗]', 'emoji_png_109.png'],
  ['[坏笑]', 'emoji_png_110.png'],
  ['[左哼哼]', 'emoji_png_111.png'],
  ['[右哼哼]', 'emoji_png_112.png'],
  ['[哈欠]', 'emoji_png_113.png'],
  ['[委屈]', 'emoji_png_114.png'],
  ['[快哭了]', 'emoji_png_115.png'],
  ['[阴险]', 'emoji_png_116.png'],
  ['[可怜]', 'emoji_png_117.png'],
  ['[拥抱]', 'emoji_png_118.png'],
  ['[生病]', 'emoji_png_124.png'],
  ['[恐惧]', 'emoji_png_127.png'],
  ['[嘿哈]', 'emoji_png_128.png'],
  ['[奸笑]', 'emoji_png_130.png'],
  ['[皱眉]', 'emoji_png_132.png'],
  ['[吃瓜]', 'emoji_png_133.png'],
  ['[天啊]', 'emoji_png_134.png'],
  ['[打脸]', 'emoji_png_138.png'],
  ['[惊喜]', 'emoji_png_139.png'],
  ['[合十]', 'emoji_png_141.png'],
  ['[钱]', 'emoji_png_142.png'],
  ['[戳脸]', 'emoji_png_143.png'],
]);

export const emojiSourceMap = {
  'emoji_png_123.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/1fcf18aa186a4f1c833c1cff620439b8.png',
  'emoji_png_132.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/b405a4a10f334ed0aac01824751eb14c.png',
  'emoji_png_143.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/144121e47b1147608c253e7a3a321b70.png',
  'emoji_png_120.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/f8a5f3ea84eb47ea9eb3550d78c82bb2.png',
  'emoji_png_108.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/c52b9a26acb94274844d3c369f6593d0.png',
  'emoji_png_95.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/81da263ad4a94c898af38c803b438835.png',
  'emoji_png_116.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/cb8bdbb866444360876099a5bc1b76ea.png',
  'emoji_png_104.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/124c635243244c389be8f601d4c2e727.png',
  'emoji_png_50.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/ac2d5a23962347de930a97ae2b938672.png',
  'emoji_png_42.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/082a60bf010b495da852a223f8756388.png',
  'emoji_png_1.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/7b6e29fc4feb46c3a693774b80b1a103.png',
  'emoji_png_21.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/bb7a8733626848fe9e008dd88d4970bd.png',
  'emoji_png_17.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/c56006a3016946498c7def7f815458b4.png',
  'emoji_png_66.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/67127e74fb42493d92ab9368647703bd.png',
  'emoji_png_23.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/3dac70d0055744bda7cac8f8fa8544da.png',
  'emoji_png_40.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/13cfb08aacb84626b2f6b4ee3c6f962d.png',
  'emoji_png_3.png': require('./emojisource/1.png'),
  'emoji_png_31.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/286a1ca640cd4f399f7fd71f61a31341.png',
  'emoji_png_52.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/c5160bec67984b58b6b3284f4117bf25.png',
  'emoji_png_19.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/4a193daf1b7444d7865c11b712299011.png',
  'emoji_png_64.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/25e855dd057a40f1a9260928b7a1cd86.png',
  'emoji_png_122.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/2b6ef9e98ef44b97ac5342777fae8049.png',
  'emoji_png_141.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/e10efc0d30784c4b82f35c5b9913b000.png',
  'emoji_png_130.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/2d26b04742ba4f9da2748101968e27bf.png',
  'emoji_png_106.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/37ea953cee6c470b80720a28a7e03268.png',
  'emoji_png_118.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/9b55ee1253414be19707f366cba4819c.png',
  'emoji_png_97.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/f711234ade6943ffbda5dbe68bf14fce.png',
  'emoji_png_114.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/efe1a50ca4ef46d3937779396482255a.png',
  'emoji_png_11.png': require('./emojisource/done.png'),
  'emoji_png_72.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/296afa329b7649418df9c0b692deec0c.png',
  'emoji_png_60.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/9381cf12fbaf4ef79508307783a0f380.png',
  'emoji_png_48.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/71b6ee5aea414faebbb39fef791875bd.png',
  'emoji_png_35.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/661c68e44371488a86fc55aedfd6c4a5.png',
  'emoji_png_56.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/a079539af80949f18a5f688eeda1b028.png',
  'emoji_png_44.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/93b2d45468f7487e9467ab3c6e1eaabb.png',
  'emoji_png_7.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/4be1dedf87614a679ad6c601260a42d6.png',
  'emoji_png_39.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/1edae9164ce9481c9c797b145daa1921.png',
  'emoji_png_110.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/5a53adcb95ca43978888818835f78d89.png',
  'emoji_png_102.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/47d776cb7f5645f5829dfe6c6682496f.png',
  'emoji_png_134.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/29948571a9b94a92a09f0861b7f3366d.png',
  'emoji_png_126.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/1a1443c7b8a44e9188729e6054465bc1.png',
  'emoji_png_138.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/dea0df1f74c045e4b46eadd7bc40df34.png',
  'emoji_png_145.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/61a52d9746114ec8926e9f1d66310e14.png',
  'emoji_png_100.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/3a21773bd0c24ff49ac0ac65db20820e.png',
  'emoji_png_112.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/18c8eb6826c5433dac906869f274d9be.png',
  'emoji_png_124.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/173e391134bf4d8fa9d4b830ac502f9d.png',
  'emoji_png_128.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/0f2a22dc01204e639b76d536f9bc4544.png',
  'emoji_png_136.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/5ac11c7648984e059390058afde17b78.png',
  'emoji_png_62.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/06/04/ea6233c6d51a4b6d9ceadd9f117c3500.png',
  'emoji_png_70.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/e83942993e814e5b902c3f39c499325a.png',
  'emoji_png_46.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/741fa40dfd494b448ac2f1a99900ab23.png',
  'emoji_png_5.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/85ba0da04fb74a328450be8cfc1754cf.png',
  'emoji_png_29.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/4dd27621b6a44e7cb0b048b2d424a187.png',
  'emoji_png_9.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/46118a171baa4dd6923e9b823a977990.png',
  'emoji_png_37.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/69497bbc95124e948b4572b1eb8a1500.png',
  'emoji_png_16.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/99cdff26347642008b286c3e3a3d56ba.png',
  'emoji_png_20.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/be10ad40da054fa2931d9399965f8066.png',
  'emoji_png_43.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/21813c4b6b494e57a2d338e4d8bfc835.png',
  'emoji_png_117.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/376e18f219df48c194cff2f52277fbb8.png',
  'emoji_png_94.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/49b4ec313b044fef9d1f0a0ebe8188f4.png',
  'emoji_png_109.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/45c8dd37d48a4bd3bb4c5045a5d36c9f.png',
  'emoji_png_105.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/29a279c276184188acaa42c3b0bca976.png',
  'emoji_png_98.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/e2b05cb6b1444b26a94d46056f30f5bf.png',
  'emoji_png_133.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/70284015e3ef4715ad1153477ba4af13.png',
  'emoji_png_121.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/89eff5bc541d420d8ea3c90fd033524d.png',
  'emoji_png_142.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/5f02aea1bf0e4aed8243afaa60c32156.png',
  'emoji_png_119.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/146ddf34398b4e89810e37abf334b9c3.png',
  'emoji_png_107.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/92368c955bf148c29ab1c70d24ef8524.png',
  'emoji_png_115.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/df0b2e165eb342ae91fc8f501758835f.png',
  'emoji_png_96.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/76bfe822dcbb4c2aa2a24fb909a77ec1.png',
  'emoji_png_140.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/2627c8f743f343948a83d9a59faea188.png',
  'emoji_png_123.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/1fcf18aa186a4f1c833c1cff620439b8.png',
  'emoji_png_131.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/d949802a7d1b47ef8b3ff34abe588618.png',
  'emoji_png_65.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/f8cbf650e4294857b4bfe1e5aeab7b4d.png',
  'emoji_png_18.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/3ffe2bcd14a048818ed8b2872ec47379.png',
  'emoji_png_14.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/6248e0c5d4c4478cb96865536e296196.png',
  'emoji_png_2.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/d98385bcce6f4bb4a1581816477c4432.png',
  'emoji_png_41.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/b052f289d0a749d692c7990143addb4f.png',
  'emoji_png_22.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/1a0db1a548db40d2a3b7e25cb0227dc6.png',
  'emoji_png_53.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/6ee86fa6fa544ee49d809aab1dcce68a.png',
  'emoji_del_pressed@2x.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/e80cf610cf034698a7cb34d46c34414f.png',
  'emoji_png_135.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/886d12343a654c0e805fc65f3c9b780b.png',
  'emoji_png_144.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/22807a6407a7494eb626a2815739c0e0.png',
  'emoji_png_139.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/6b0b3815d6cb404d8955f055808f964a.png',
  'emoji_png_127.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/89ae6fd862c1403c91a6a5edec2bf734.png',
  'emoji_png_111.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/cf4b35c377f24430a568c86f07cab11d.png',
  'emoji_png_103.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/782dd35bd8bd4e6c9c414128f10efa21.png',
  'emoji_png_57.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/8236f9b2f8964a98aa4414afe08736fe.png',
  'emoji_png_34.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/b8faf2f5f1714a07a77e820428733e85.png',
  'emoji_png_49.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/798e546815e041d79cc879498f5c5813.png',
  'emoji_png_38.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/096128527b0749258613f51669fd27bd.png',
  'emoji_png_6.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/59233370e3ec4e609264f2dbdff08246.png',
  'emoji_png_45.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/53538eb4ec964365b3ffc818e5b57eb0.png',
  'emoji_png_26.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/85ef1ebfa3d94d4387974f1231b2be74.png',
  'emoji_png_10.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/8c72f09c6e4647aa8ccbebdacf5b4158.png',
  'emoji_png_61.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/af3e4330e12840378a1bf74b90058a34.png',
  'emoji_png_24.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/260b23327cf74930837e7a4df60c0998.png',
  'emoji_png_4.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/e75844ba4f054868b77d905c780284c5.png',
  'emoji_png_36.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/6205015beb194e53b62c05d1494b23ed.png',
  'emoji_png_8.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/155c011d5558432ba90845d188fe88e3.png',
  'emoji_png_28.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/6c849814e6f343acabd288017fdfac8d.png',
  'emoji_del_normal@2x.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/612c79a71ed540059486fed2c201756d.png',
  'emoji_png_63.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/5aafee60421446c9a6b300d1cc7d1afa.png',
  'emoji_png_12.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/84bddf26a2f241aa9a3901995e2641b5.png',
  'emoji_png_71.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/b313e742e72d46ff8e74e7476ab68458.png',
  'emoji_png_125.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/fdb85356f8474d41b69f2b584ff76c53.png',
  'emoji_png_137.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/cc32ad830637438985804a85c3b9d0c9.png',
  'emoji_png_129.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/1ddcf8b4c275483eae42944cde4e03c0.png',
  'emoji_png_101.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/2f3a304619014fb59cb845cf40455df8.png',
  'emoji_png_113.png': 'https://cowork-storage-public-cdn.lx.netease.com/lxbg/2021/04/25/de3d027be37948038fa6e849ca117772.png',
  'emoji_png_150.png': require('./emojisource/yes.png'),
  'emoji_png_153.png': require('./emojisource/get.png'),
  'emoji_png_152.png': require('./emojisource/ok.png'),
  'emoji_png_151.png': require('./emojisource/no.png'),
  unknown: require('./emojisource/unknown.png'),
};

export const unknownEmoji = require('./emojisource/unknown.png');

export const expressionSourceMap = {
  'lt/lt009':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fa92d997311a44b1d80cd785dbb62661d.png?Signature=0S2DG8jgV4dLbOeZgOp%2FF7OLIq0uWPYViCSuhpAGPc8%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy014':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F597d099792bf4aabb1e14e8be3f5209e.png?Signature=WBUi0g4HlhbxN7ZRdvfUDYe41CoGe97I37fcJg0i%2F%2FM%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy028':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F20e8e18fdf214e648b13319dc1f6dd05.png?Signature=E%2FJmrBauoB1wRp6tZCsaoYn72LgAKBl7iv%2BscGvZm3Y%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy029':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F1714fb15354b42589fb3008fba453f67.png?Signature=0aa7%2FKYYfUppgUDWSGlwMRSmI1HZyGc4cM0Zwstx9Js%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy001':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F1ead3a05896c45dd9b4d55b6322025fa.png?Signature=Qk5kLW%2F%2FYrUfqENxO1DsbzX9vv%2BSD6ovc3m31CKyEL0%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy015':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F5e4ba041ea9b4a4292494e741ab7a56b.png?Signature=C3LeXAiXmlottRUU5744S4LIZn31ExlvMLu6f5yDMAo%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy003':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fb612390c0d144069a3638dea1a16884a.png?Signature=xocOJ1esy4Fs7MxXszH0NqNOMYqqrV1PTkm9EYIiCMw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy017':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fa017503c6b1a425b9aeb4de6c164836a.png?Signature=yGR1iXCfJFl7at3ldJkHTzMozIpdZHqvIFEErcHTf9U%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy016':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F9e9cabfcab84427dbf89283c9771906f.png?Signature=tM8aviVuIFgKExUvb%2FKTOosEQQVPi9TY4DmqZmhqebs%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy002':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F9e5a85abbbca4fa685fd58712e229135.png?Signature=XGp%2FNOk%2FzG0oS%2FWf6Lu1rQxuFXTwS1RX27sjYxeJHLw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy006':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fcf9237e81bae48bc8cb4d9103678f8a7.png?Signature=XNFQWXjJxphzZBeJV3Uh3CfFpmRtqWf4i0csynUiiuc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy012':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F1ba3623db6454def87eb9e65db9f6280.png?Signature=7EhQnVC51VR7GHi7F%2FxTd8eVPcQthzQ7FvzVkndFtEg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy013':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F74d4d3db22894229a23ad109f67332c1.png?Signature=GrpcnL6UCXr46L%2Bd1VRL20jV%2BjOcZHdzBpKc%2FsXjIxo%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy007':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fac00b9cce29f4c66bdecedf22c72227b.png?Signature=uOnpJC5de67Sr%2BB6nN5uRQprxdopXYxgG96Za8iZ%2Fec%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy039':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fd27834259d7241f18158da6cdcd8f6e8.png?Signature=EsqjuVv%2FMMiUtq9cmW9utRYu%2FyiQIDusak2ZxMgUi%2F4%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy011':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fcc4282fa30144bddb96ba59fef19d0e4.png?Signature=ER0A1mkTUp7ADHC%2F9UgkVax42f44iPU7vsH1cLJQ97A%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy005':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F99f511478e494ce6b91ef3fcf9842369.png?Signature=85mB6lCgDeTruyXQdBtuEibUDtG6BOAXYkY8qsdVKCo%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy004':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fee5e2f9745c84383af1c19af12d3f24f.png?Signature=PHtmu0KXtb0vtRVwSHKckVQ0QcC3tXGdif6p4dYC%2Bsg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy010':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F2181d286c9404683a8c2c0afd688b230.png?Signature=riRN%2B0x5o71fWL18ir%2FTI4eQSxLejbfMNJ2R41o1Tdo%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy038':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F0528af849e4f434cbe357de5d030cb98.png?Signature=S7cgILizTYvtwFDuuwRI%2Bxuf7l3fBNrP8qrbaXmpu%2BU%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy040':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fa624671cefdc4f5e8423cb575a021291.png?Signature=Y37dxts%2Fd9OjI7iDq8UdOKiUQNkAYsYK%2FK77o26A5hM%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy035':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F2923c873aa944d079b7cc60fcbd20fae.png?Signature=LCrkz0bNJ5PWbveyo1JbFfKe2GaQX4dU4ahGXbZiK%2F8%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy021':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F07abc96c4c0e4b28bcde539c7690240e.png?Signature=lrWJG5dL9wcI8n8AdyiDWV1d4n0kPIABwqM9pbK4lZw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy009':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fce51da81054c4ea898248975a44facd1.png?Signature=5duFu3JN1YVxY4CSk%2Fr16fcyvnnxlFc19QArvegMOJY%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy008':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F895fe83273084636b96fb4d4c7c806e0.png?Signature=UUrNE2GMQKNJZuQD0NKfFNq%2FN5Wy2SqOXcLy4qJKisE%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy020':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fcdf3d4de1f2a4b8c970b5782eb2c7f7a.png?Signature=oRY%2FY3m4KCRDhhUX4gFVHqpIKMjJCgt15%2BFuDjVg%2BhE%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy034':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F6d9ace0fe63547c9b4f998626fa3e433.png?Signature=0XEqmfzWTW6Y6OiDpTCivdobe%2F4UsdaHnSfIZs%2Bx%2Bv4%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy022':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fabd0942dbe7745788b719410cdaabee2.png?Signature=1KIJmHjqL9SgM6TzuYCwl%2B0gmI8Ccu08UxewQHHLD74%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy036':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fe6a0d48a312c4ae5a78c7d87f77253cd.png?Signature=RgHIeZQzXsa7zVsrTN3xvEyyAe%2B%2Bm0xwLAiLq8DqiTs%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy037':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fd16d0b3232614645bf8ae79fd8e2a821.png?Signature=4OGK7XAg3xnrIZKlPO%2FuXHB5fJftyHbDFCa4RRn7Jwk%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy023':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F975ad5bc91374c7c8b48ce4cdea4d6ce.png?Signature=It7zheB12fE5eFip%2BwyUv6rgmsUexMaBh4W2U7g66pI%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy027':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F0e7be6da31934451951defabbb2e1607.png?Signature=trrl%2B3cdshVrS2VWo8AkhRegfdmg1lCV4BJHnzwWgpM%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy033':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Ffaf2b53911644340b6fa436d9fa8d3a0.png?Signature=rhjx%2BBQji4VoBt%2B8oKcnAfSE6vPwZNHnXi%2FBceSANFc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy032':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F11c56f8a449a4140a2b93cf70bfad3b4.png?Signature=hbcifGKRQr8tb1L5FE8UefOmulqT4PVjkuiYYmtOuiw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy026':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F1fafb3d7a09f4876a3f1fe66654a1443.png?Signature=Mu5X%2BXEZslHT%2F2El0GO6Q1Z5VPhOhMG393rkne7rKL0%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy018':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F34757bb066294f0784d8cef70f228602.png?Signature=J2xmI6YwA4x0EEco6cDQO61WQuri%2FqEX6Jt0ei0UXfI%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy030':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F29649891b9b4462e90dd7e7f5a1406bc.png?Signature=QM1ueVWLVU%2B5I%2FShR17GPMsBv8BAH3KzD0zkmXuQmRU%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy024':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fda01e70c45434644a222b3d513425651.png?Signature=ATMMIlvDG8LahxCTEzwUy3OhSTAABv6jt%2BkPsmUtnUE%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy025':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F9d902a4aa37848e9abcb28501460f386.png?Signature=Q796TBvqqVAfxdM5g8KFM6Jh%2B7N%2F%2B%2BtALCde5Dko8Ec%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy031':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F8e7caf9380374bf0b52373f80ad13e68.png?Signature=%2BQznGlUpG%2F8z0ZSuJJAUs6lMn91LXgEan5RqwaaQP%2Fw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'xxy/xxy019':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fdaa18e6245b64365a485f55e35c387b1.png?Signature=mwpGauNcYEXSRr%2FbiyAh4mQ7Jeohf4a%2FwkQeYS61Etw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd048':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F2f30753ad7f6483c9b8fb0b727a5ab18.png?Signature=s3SgY57cuu%2B5oN24GVMQzYvpQO6%2B657Ri%2BOZxFVJglA%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd029':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F64bb2e515f3048f5b55d93842becdaa2.png?Signature=iwDGEOS%2B5Cow6vS7%2BpylXwXiWfYxavSsdUp5M1Abudk%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd001':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Ffdd585c91680487b90ea89da8270a4ff.png?Signature=4yhCTF0KikpwE6Zgl4XmxExXIkmu42zc66iFV%2FpRf4E%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd015':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F20b38e232e044b70b73b24f07703f644.png?Signature=oFk9MVgm7TwiGKSepZoRzLGI1mjNJjyBHrQKBheCo0s%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd014':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fd182da47d20c46a5be667ecd770d5570.png?Signature=EIejjaO8kBGnw9%2BwXmrY5OCN2RPvSxShq8orHViy%2F%2BI%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd028':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F103708cb4bc04e3381dcd8b8b72f28c8.png?Signature=SO92ckzA0f%2FdWSUwx2XX34cMs9%2B6xbHCRVvkSfYoyNc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd016':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fdf4357e023f2437a94a337cf01501d96.png?Signature=1tgFCrbuIzkqOwfyyyfOnZ8c92MGrtLEyG%2BaY7hIEpQ%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd002':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F7890be0212f64ad693d34b0cfca2de30.png?Signature=Ksi%2BBAvvLaIAFqtnLh2gZTznL6GPX2yhf1kpRJBLimw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd003':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fe7921f90c1024ebc9e9dd630b8d3d5d3.png?Signature=5OBBiTepvAqC3IN%2BMoTizaGf8O584PngEoY2NEA%2BDEA%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd017':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F6f4d6509151f4f4794a31edfda2b68e0.png?Signature=AL7FFQoFDAzrAz%2BiTY22H81qSbJ5CsMhVw8EZnLmjjo%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd013':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Faea8a14699ad4ace951e29c6d6e7c522.png?Signature=94a%2FKevhrum3yHtPWie6F%2F0YwVy9ruH%2F2H1Foijmg9k%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd007':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fc45d7cd02abb402d92a560ad1ad9ad6e.png?Signature=pUeLReUZLsP6vbxFcsv2tlmvVidQC9fFxiULE5fVtSk%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd006':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F6ae4807076bc4af0b02612ec2ab0ecf0.png?Signature=Zp%2B0rQNaWpbUsyeaskgps0ZGfwCJ1b9xtTcFydW8H94%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd012':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F253b795b150a4f6daaed25d82d1ae3dc.png?Signature=3beP5ch7Tq0VODxIusduu7XbDi4XhUl4607SuQPW%2FzU%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd004':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F4857e76f75f24a55bcf47e1e79dcef23.png?Signature=LIpY6CNcaPkZsLQ8c6SW3JB%2B7niWN4We5v9%2BfVLD2Cs%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd010':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F079e898180c2455a99949e04b9652f0c.png?Signature=7W%2FW5VnN%2BUdCEWoW55D8gQrZF0gApvTPThc5nI1NM2A%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd038':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F82a47dd1a754480ebba599e10a31182c.png?Signature=su348WKhVh4aYfTZYNI4isqG6tZXN%2F7kx0wF1%2BX%2FHy0%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd039':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F43691572582a440e80b1b91e120a8a1b.png?Signature=fTgYMGUiNX5ceqVBnxyiMgtCpaw%2FL%2FruaoDaDjexApg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd011':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F8b8ce2c23e9d4751ad7a48d0b46607d9.png?Signature=6WG6n8zivzl%2BfNm7SND5nEOFhFDQ%2FLLzH22oOVuEHKc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd005':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fb58f96e10c864caaa8cfdf8c43ac7592.png?Signature=wB7h9WTog0A2bgDEYAfMJy%2BvjReAe3W6H%2BKZPEeM9OQ%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd008':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Faa41ad52ea7540dda1848ed563d1c2c0.png?Signature=3zr1RcKKK5ePiZ70cDHxAGqtWfhD0ZfIbtLQyVJ86lk%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd020':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F6fb74c11b7784a819ed42315a4a7196d.png?Signature=SKdS93n%2BpFWpJwiMTLqBlyjtiJaDxdkqe5bUeO%2FcrLE%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd034':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F1dbf6d502c444661a81b583c5ffe3b89.png?Signature=neCY1mrKtXKDQLo7DeE99NFmD%2Bj2bh8qxZ%2F6QLS346k%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd035':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fa7b1f0adc21c41d5880cfb90a826bd4a.png?Signature=mc1%2BlBZz1wrsbkew3o7fxshYN18ztEFomhKYjyYy1t4%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd021':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F91d0ed0cb55049c89030667200901a65.png?Signature=tp7f0kKc1RHaxtK1j4dCSmlZs%2F5VLoT14DxJJW0rvr4%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd009':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F5a4dea50b8604f1eb1c722487b7330b4.png?Signature=K4dNHXB7uFZ6RoaS3anP%2BK%2B%2BJDLjcfFOPXC3tlRazJs%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd037':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fbe3f7f53d9594e598d9f699fe11acf03.png?Signature=0XWx%2FlipEmuLAY887UD0XyXtiYevKUhvkesRp3pqD4I%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd023':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F979147a86d13466da5584d61da53ed50.png?Signature=P2G2v79LklZNPH6sG7IuVrvauNLU0RlSnJ0HxClX6Dk%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd022':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F42c8369a346447029297be4a2054fa0c.png?Signature=tFGsnSxEueoy1Si4uY7wDLt1%2FaParU4r1yeFfofWYqg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd036':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fcca6dc9c7e9d49f9b3f96f67aa6120f9.png?Signature=2SKbitszMRdOCrAB8Ys%2B7lavaPaMSadXpwI7CZUNfoc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd032':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F71327cc69de54191843f26c1058b2d7f.png?Signature=Hmdz72nKkc%2FXvIE7cmUdMEAZ4RyCJNZkgTU2NTsLzpY%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd026':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F6532d2eb18bc4d0eba704dedd439386f.png?Signature=a3hRozd8NLjFyx5rN4wGPEmzS8TpOfRmYdcEI6M%2BRsg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd027':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F7d70c5c9be4245b0b052432dd636f54e.png?Signature=qSFrWjBFno8G0WK1Orm9Ojbvr4JLtas8lrdM13eszTg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd033':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F15da7b01b00a46679603767114315a5f.png?Signature=bSmhuetXP0qhgDGWGn2%2B4iOVSKb%2BatZWD8rHS7OjEbQ%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd025':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F4bd6e932eea84f18b84833cf6f243f0b.png?Signature=Yde87eLBaN2ZTBRs6oZ7OrpkJd%2BNmWxm3wN3R1R8E7A%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd031':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fe8354113956b4298becbdc1c85a29fd5.png?Signature=vOh8e1CoO0XDhqFM0IVlI4tk2KTZOqgfr7cr5kRuXeY%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd019':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F546119648f6c42439cca51aec5659784.png?Signature=lgCqKTdQU5%2FB8LAeW%2BLabQ2TBKaJTdpar0vfeSD5HI4%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd018':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F0f102d18a05b443d9b9db81b9f45473f.png?Signature=tB2lQWAfNfK1Ci6HXY0vTRQOIZMtcUhJL5wVOYmNP5c%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd030':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F5de1a9e47a9d4820adbb0f54a8ae6d35.png?Signature=TKUPKS4mzV5WSAzF21DPC0Tc6OHK1NR1hilLpd%2FzgQ0%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd024':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Ffb0db64bb9ca44aab5c8d83c117ba732.png?Signature=G%2FVRK06ZukFsB3Si5WnamgdXE4vDGH0%2BIFK3eVif7ys%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd043':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fd9a51cc38a5943fb9ce6d9162da6bfb5.png?Signature=93pVVdhl9gqmL64jIAE0mzbr7L30ymWK2FKF%2BoQD4sw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd042':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F4a501eb75cbb4745a911356f3f926ee2.png?Signature=Uneqc2NPp6b9V3OVhBd%2B9bezavRPuuqy7NNLPioh2ok%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd040':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F921c282336ac458bb9fd39726a069f6d.png?Signature=w0hdQd1aUB6ULWyxk%2BzKGxascf3uZ%2FNa1VgWM0gI6yc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd041':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F5e89809ce2db4c8aaff51f3260010bd3.png?Signature=Ko6NDiNtUFbmPaYSpwpmVAM1fHsgdJcMBpuaN0Cg4bo%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd045':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F17f187c860454ba49657d4fe8b820d90.png?Signature=F%2F8HTp4Z2tJ4S0%2FyOJVNOySoDOu82AJuBVu8CCD4dE8%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd044':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F60b24c1615464f76bc96925c617cdac9.png?Signature=9zutOQomvrVIM1N%2BRk3I88skzEaP5FAWipzsGJT%2FwtY%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd046':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F3a3594f765ac45ba9e75dcc6e13336b2.png?Signature=Ov%2BDrzt6iNFt%2BVN9sWTOvGWjAhBKu3Q%2FGCb0Od8DgrI%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'ajmd/ajmd047':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F49f1ea98107845778514348978dfe412.png?Signature=Q85vX9Fyg7doZJfa78lWUxD66nzScl6hesbE2hP6wE4%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt010':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fc021d2823c7545b2b647a2ea83532a7b.png?Signature=dbJWHVkHyN55QgRNKIR54Xy1KoxXty7L6d%2FxsOw7Ud0%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt004':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F425f5a74e8eb47fea1c46a360b540a04.png?Signature=CLcFa%2FTff5CAIbUBqZ%2Bv0hkh5PRjFWYU9MSCuD%2Fcwi8%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt005':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F09b5628eb7ca4217b26e35409c13f7c3.png?Signature=81hbOII9ltmh8X%2BNAFlHy%2B5a3qSdCQTgLYi2lhEbBno%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt011':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F5bb20675fbb443e8b2f343f4ae7d8b30.png?Signature=STJvl7atBbts%2BZr0Fvw%2F6Gaf4%2BYqJU78u3EuZBFMDpg%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt007':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fa523e5949f30453fa70472794df3c0eb.png?Signature=9eNZfIOZ5TWnYO1ltWV2jlbGRA4EMmG6o1%2Fm5OtzjbQ%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt013':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fefe6f462b7d540758c660e786dfeebfa.png?Signature=KOkzAjMnM5GT4B7b72gSIpYZF0cK5M2OuKu8nk9dD8E%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt012':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F99ca5216f0184a81ab821382ec9f5369.png?Signature=pcqV2YNTVDivDabHuDSavBJ0%2FC2L0tZImZV5CXQcj20%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt006':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F074610057b424fd2928b3bc8e529cb78.png?Signature=%2FkQ%2FNrHDVZ2DLKu2cHyyV2XLIC4BZ8Ka%2BxCTzBnwhAE%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt002':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F918521da833747f7acd086d34cd2d3f8.png?Signature=VNLIwGFPuqvmSOJjcWPi5%2FqPxL0BPxBd%2FYTaxAPb8s8%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt016':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F6615af010a3a4345b067d4b763f3501b.png?Signature=vst8IDGO2Edx%2BX4Rr8Sf6VxSuQ7n8%2B%2FiL2KrAwhANrw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt017':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F509bc4fa86334800ad19dc7741e1718a.png?Signature=q7qDBLY4rGSg1oPRACH9SBLmzOuam5EaYO1Of0BSVeQ%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt003':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F82277f977b87489798ddd8ed4535bfef.png?Signature=rgANLKdoWTr70sg2N0sGFP1CrmWYp%2Fl%2F2%2BSrI9E%2FwFI%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt015':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fe2c197c69f5a4abbace234bf85783d27.png?Signature=K%2BfYQCW2msKtIhr28Nh8UiCErQKURwHz1JKez2ORz5I%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt001':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F9b601e4f062844968502a8dcc0c4daec.png?Signature=pjbrNM0dZJMULCLT%2B0BB2P5yxDhJI71zw2nyLKmm0yU%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt014':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Fbc4bd22533494f67a7f26fa33b39ecc4.png?Signature=OcEEZbEWmtR5osQhdqCvk31wadyNMkvcJa7axozQuWs%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt019':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F59e74ddc4b0a4e54af4eb1a54b42e4a7.png?Signature=c3GNnzF6LiSVGFcS8D0ZotyeNA%2B7li0M18Vf4omNZNw%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt018':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2Ff2f55ae2f86e4bc7ad6804dd140fa3f0.png?Signature=gI%2BoI%2FXksCMhOK14XH5Fn0CTZ%2BxtKywQqwiz%2Bjx7Ipc%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt020':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F78ae3d17ce1342d9998433ffc4300217.png?Signature=PBSFqbtaZPcAA2oJZYbhaL%2BaV9Kvhj08gXhrtTkZ4nY%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
  'lt/lt008':
    'https://cowork-storage-public-cdn.lx.netease.com/lxbg%2F2021%2F03%2F23%2F53636a47f3764897954dfd7926c374fa.png?Signature=4jiJVhnoiUtoV65WwPpcy7PYn8E2SvQLB6A8gq7vLC0%3D&Expires=32503651199&NOSAccessKeyId=1cb2908442ba492c899bb3e38fab93ca',
};

// 快速评论列表
export const CommentNumberList = Array.from(emojiList).map(item => item[0]);

const downloadItemEmoji = (key: string, url) => {
  const { env } = window.electronLib as {
    env: {
      isMac: boolean;
      userDataPath: string;
    };
  };

  // 排队下载
  return fileApi.download({
    fileName: key.replace(/\w+\//, '') + '.png',
    dirPath: env.userDataPath + '/im/expression',
    fileUrl: url,
  });
};

export const downloadEmoji = () => {
  if (!inElectron) {
    return;
  }
  // emoji表情批量下载(100ms下载一次 每次下载两张)
  const observables = Object.keys(expressionSourceMap).map(key =>
    defer(() => {
      const request = downloadItemEmoji(key, expressionSourceMap[key]);
      return from(request);
    }).pipe(
      tap(res => {
        console.log('[emoji]', res);
      }),
      delay(200)
    )
  );

  concat(...observables).subscribe(() => {});
};
