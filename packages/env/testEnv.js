#!/usr/bin/env node
const shell = require('shelljs');
const path = require('path');

const envDef = require('env_def');

(0, JSON.stringify)({ stage: 1 });

console.log(envDef);
console.log(
  envDef.rsaEncrypt(
    '00923bceb4d568a58875784230bbbe5fcfc31841f61f004ca39bf16dd27b88a2bb4dce652813d74b82f17efaab065e2af3cd2efe5b098390fb8dfad06804ceaf3a2d70072c3750741790667d521ece79a097aa6f9ee20711355ae9ac80a419347701463b17c4e27e204bac2292905195bfb2a289fa04aa4404ede5a9a2e0fb1005',
    '010001',
    'yPA4a1NS',
    'ssand11325'
  )
);
