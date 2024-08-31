const path = require('path');

module.exports = {
  root: true,
  env: {
    browser: true,
    // "es2021": true
  },
  extends: ['plugin:react/recommended', 'airbnb'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules', 'public'],
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'no-console': 'warn',
    'import/no-unresolved': [
      2,
      {
        ignore: [
          '^@/',
          'api',
          '@web-disk',
          '@web-im',
          '@web-setting',
          '@web-account',
          '@web-contact',
          '@web-apps',
          '@web-unitable-crm',
          '@web-mail',
          '@web-mail-write',
          '@web-common',
          '@web-schedule',
          '@web-site',
          '@web-edm',
        ], // @ 是设置的路径别名
      },
    ],
    'import/extensions': 'off',
    'no-unused-expressions': 'off',
    'no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'react/jsx-filename-extension': 'off',
    'comma-dangle': [
      'error',
      {
        arrays: 'only-multiline',
        objects: 'only-multiline',
        imports: 'only-multiline',
        exports: 'only-multiline',
        functions: 'only-multiline',
      },
    ], // shisheng,多行时增加尾部逗号，有利于代码更改时的比对，因为最后一行不会因为增减逗号额外多出一个更改，而不能加尾部逗号的原因是IE8会报错，who cares
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { functions: true, classes: false, variables: true }],
    'no-extraneous-dependencies': 'off',
    'prefer-arrow-callback': 'off',
    'prefer-template': 'off',
    'no-restricted-globals': 'warn',
    'object-curly-newline': 'warn',
    'no-underscore-dangle': 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-debugger': 'error',
    'react/require-default-props': 'off', // zoumingliang
    'react/jsx-props-no-spreading': [
      'error',
      {
        html: 'ignore',
        custom: 'enforce',
        explicitSpread: 'ignore',
        exceptions: ['SiriusModal'], // 全局模态弹窗允许使用
      },
    ], // zoumingliang, shisheng,传入jsx组件中的参数必须明确入参名称及入参意义，禁止使用 ...args这种简写模式，针对特别的全局组件无法做到，可以加到exceptions数组中
    // 参考https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-spreading.md
    'import/no-extraneous-dependencies': [
      'warn',
      // { packageDir: ['../../packages/web', './', '../../packages/api', '../../packages/electron'] },
      // { packageDir: ['./packages/web', './', './packages/api', './packages/electron'] },
      // If provided as a relative path string,
      // will be computed relative to the current working directory at linter execution time.
      // If this is not ideal (does not work with some editor integrations), consider using __dirname to provide a path relative to your configuration.
      // Refer from https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md
      {
        packageDir: [
          path.join(__dirname, './'),
          path.join(__dirname, '../../packages/web'),
          path.join(__dirname, '../../packages/api'),
          path.join(__dirname, '../../packages/electron'),
        ],
      },
    ],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error', { builtinGlobals: false, allow: ['done', 'reject', 'resolve', 'decode', 'encode'] }], //
    // shisheng,避免命名覆盖了上层的全局函数，但是使用中却未注意，此外无重命名的覆盖变量会增加代码可读性
    '@typescript-eslint/no-explicit-any': 'warn', // shisheng,推荐使用类型系统进行变量定义，确保传参准确性和代码可读性
    '@typescript-eslint/no-parameter-properties': 'warn', // shisheng,避免使用内联类型定义，除非该类型只在一个地方使用
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], // shisheng,允许使用_开头的变量不被此规则检查 - -! 感觉没生效
    'import/prefer-default-export': 'off',
    'no-lonely-if': 'warn', // shisheng,else分支里只有一个if,可以合并为else if语句，看到此处警告可以优化下代码
    // shisheng,为了可读性和稳定性，减少编程心智负担，应保障函数的入参不变，这样更容易理清内部逻辑，且保障函数内部逻辑不产生对外部其他函数的副作用，故此处改为警告，出现对入参的修改可以考虑改进代码；
    // 但部分内部耦合紧密的函数，使用更改入参的编程模式通常为了获取更好的效率，避免频繁复制对象，故此处不禁止，但使用需谨慎，确认清晰入参的作用域范围，推荐对于非本模块自产自销的变量对象遵循此原则
    'no-param-reassign': 'warn',
    indent: ['warn', 2, { VariableDeclarator: 2 }], // zhangpeiyuan 9.29
    'react/jsx-indent': 'off', // guochao
    'react/jsx-indent-props': 'off', // guochao
    'arrow-parens': ['error', 'as-needed'], // guochao
    'max-classes-per-file': ['error', 5], // shisheng,每个文件最多5个class,
    // 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-destructuring': 'warn', // shisheng, 鼓励使用解构函数，但不禁止其他写法，故改成warn
    'max-len': ['error', { code: 170 }], // shisheng,最大宽度170,写超了想办法折行
    'max-lines': ['error', { max: 2000, skipComments: true, skipBlankLines: true }], // shisheng,拒绝2000行以上代码的大文件
    'max-params': ['error', 4], // shisheng,避免过多参数造成函数复杂度过高
    'max-statements': ['error', 50, { ignoreTopLevelFunctions: true }], // shisheng,单函数最多能写50条表达式，如果函数超过这个限制，需要拆分成子函数
    'max-depth': ['error', 5], // shisheng,拒绝单个函数写五层以上的嵌套
    'class-methods-use-this': 'warn', // shisheng,不使用this的class函数通常可以写成static的，但是强制执行这条没太多收益，改成警告
  },
  globals: {
    NodeJS: 'readonly',
    __PATH_PREFIX__: 'readonly',
    api: 'readonly',
    electronLib: 'readonly',
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx'],
      },
    },
  },
};
