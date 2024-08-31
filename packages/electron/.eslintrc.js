module.exports = {
  root: false,
  env: {
    browser: true,
    // "es2021": true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'airbnb'],
  // parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules', 'packages/*/node_modules', 'dist'],
  // plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'off',
    'import/no-unresolved': [
      2,
      {
        ignore: ['^@/'], // @ 是设置的路径别名
      },
    ], // zoumingliang
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/extensions': 'off',
    'no-unused-expressions': 'off', // mlzou
    'no-static-element-interactions': 'off',
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
    // 'object-curly-newline': 'warn',
    'no-underscore-dangle': 'off',
    'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
    'no-debugger': 'error',
    '@typescript-eslint/interface-name-prefix': 'off', // shisheng 为啥不能以I开头，毛病多
    'import/no-extraneous-dependencies': ['warn', { packageDir: ['../../packages/web', './', '../../packages/api', '../../packages/electron'] }],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['warn', { allow: ['done', 'reject', 'resolve', 'decode', 'encode'] }], //
    // shisheng,避免命名覆盖了上层的全局函数，但是使用中却未注意，此外无重命名的覆盖变量会增加代码可读性
    '@typescript-eslint/no-explicit-any': 'warn', // shisheng,推荐使用类型系统进行变量定义，确保传参准确性和代码可读性
    '@typescript-eslint/no-parameter-properties': 'warn', // shisheng,避免使用内联类型定义，除非该类型只在一个地方使用
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], // shisheng,允许使用_开头的变量不被此规则检查 (- -! 感觉没生效)
    'import/prefer-default-export': 'off',
    'no-lonely-if': 'error', // shisheng,else分支里只有一个if,可以合并为else if语句，看到此处警告可以优化下代码
    // shisheng,为了可读性和稳定性，减少编程心智负担，应保障函数的入参不变，这样更容易理清内部逻辑，且保障函数内部逻辑不产生对外部其他函数的副作用，故此处改为警告，出现对入参的修改可以考虑改进代码；
    // 但部分内部耦合紧密的函数，使用更改入参的编程模式通常为了获取更好的效率，避免频繁复制对象，故此处不禁止，但使用需谨慎，确认清晰入参的作用域范围，推荐对于非本模块自产自销的变量对象遵循此原则
    'no-param-reassign': 'warn',
    // indent: ['warn', 2, { VariableDeclarator: 2 }], // zhangpeiyuan 9.29
    'arrow-parens': ['error', 'as-needed'], // guochao
    'max-classes-per-file': ['error', 5], // shisheng,每个文件最多5个class,
    // 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-destructuring': 'warn', // shisheng, 鼓励使用解构函数，但不禁止其他写法，故改成warn
    'max-len': ['error', { code: 170 }], // shisheng,最大宽度170,写超了想办法折行
    'max-lines': ['error', { max: 2000, skipComments: true, skipBlankLines: true }], // shisheng,拒绝2000行以上代码的大文件
    'max-params': ['error', 4], // shisheng,避免过多参数造成函数复杂度过高
    'max-statements': ['error', 50], // shisheng,单函数最多能写50条表达式，如果函数超过这个限制，需要拆分成子函数
    'max-depth': ['error', 5], // shisheng,拒绝单个函数写五层以上的嵌套
    'class-methods-use-this': 'off', // shisheng,不使用this的class函数通常可以写成static的，但是强制执行这条没太多收益，改成警告 ---> off //mlzou
    camelcase: 'warn', // mlzou，不使用驼峰命名。强制执行这条没太多收益，改成警告
    'no-useless-escape': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    /** *** 以下为与 prettier 冲突的规则设置, 均由 prettier 接管 **** */
    'operator-linebreak': ['off', 'none'], // 三元表达式的符号位置
    indent: 'off', // 缩进
    'implicit-arrow-linebreak': 'off', // https://eslint.org/docs/latest/rules/implicit-arrow-linebreak#when-not-to-use-it
    'object-curly-newline': 'off', // https://eslint.org/docs/latest/rules/object-curly-newline
    'function-paren-newline': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'lines-between-class-members': 'off',
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
