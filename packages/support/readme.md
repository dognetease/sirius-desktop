# 构建工具

## Description
 * 此文件包含三个功能，
 * 1. 自动创建env.ts文件，包含所有构建命令录入的参数和系统默认参数，可以使用 [-s ""] 关闭此功能, 
      <br>**生成env.ts带有混淆保护功能，确保重要的配置不可被读取或篡改**
 * 2. 检索所有的 **\/*_impl.ts文件，生成 impl_list.ts文件，可以使用 [-e "login_impl,contact_impl"] 来排除包含某些实现
 * 3. 检索所有 api目录下文件，生成index.ts的 import * from "./api/[path]"
##Usage
`$ buildEnv <value> [conf] [options]`

###Options
- --source           specify tgihe env file position，empty string will not emit config file  (default ./src/)
- --envFileName      specify the env file position，empty string will not emit config file  (default gen/env.ts)
- --implFileName     specify the impl_list file position，empty string will not emit config file  (default gen/impl_list.ts)
- --indexFileName    specify the index file position，empty string will not emit config file  (default index.ts)
- --componentScan    specify the root folder to scan the implements source file  (default ./src/impl/api_data,./src/impl/api_system,./src/impl/logical)
- -exclude, ---e     specify the file name which won't be include  (default login_mock_impl.ts,mock_impl.ts,org_impl.ts)
- --exportScan       build index.ts from scan the specified folder  (default ./src/api)
- -v, --version      Displays current version
- -h, --help         Displays this message

##Examples
`$ buildEnv buildEnv 'a=b c=d xx='abc feg'' prod [options]`<br>
`$ buildEnv --source "../../test"                         `<br>
`$ buildEnv --envFileName "test_env.ts"                   `<br>
`$ buildEnv --implFileName "another_impl_list.ts"         `<br>
`$ buildEnv --indexFileName "another_index.ts"            `<br>
`$ buildEnv --componentScan "../../src"                   `<br>
`$ buildEnv --exclude "login_impl,contact_impl"           `<br>
`$ buildEnv --exportScan "./src/api"                      `<br>
