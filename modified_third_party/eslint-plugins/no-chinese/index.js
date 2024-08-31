// 简单的自定义eslint rule
// eslint-disable-next-line @typescript-eslint/no-require-imports
const utils = require('@typescript-eslint/utils');
const { ESLintUtils, AST_NODE_TYPES } = utils;

const MyRule = ESLintUtils.RuleCreator(
    (ruleName) => ruleName
);

// 匹配中文正则
// eslint-disable-next-line prefer-regex-literals
const pattern = new RegExp('[\u4E00-\u9FA5]+');

const rule = ESLintUtils.RuleCreator.withoutDocs({
    create: (_context) => ({
        JSXText: node => {
            if (pattern.test(node.value)) {
                _context.report({
                    messageId: 'notArrowChinese',
                    loc: node.loc,
                    node,
                    // node: node.value,
                });
            }
        },
        JSXAttribute: node => {
            if (node.value !== null) {
                const value = node.value;
                if (value.type === 'Literal') {
                    const value1 = value.value;
                    if (typeof value1 === 'string' && pattern.test(value1)) {
                        _context.report({
                            messageId: 'notArrowChinese',
                            loc: node.loc,
                            // node: node.value,
                            node: node,
                        });
                    }
                }
            }
        },
    }),
    meta: {
        messages: {
            'notArrowChinese': 'Do not use Chinese'
        },
        type: 'suggestion',
        schema: [],
    },
    defaultOptions: [],
});

// eslint/index.js
module.exports = rule;