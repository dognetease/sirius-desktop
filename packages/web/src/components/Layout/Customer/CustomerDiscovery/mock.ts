import { TaskStatus } from './context';

export function sleep(time = 1000) {
  return new Promise(r => setTimeout(r, time));
}

export const fetchAutoList = async () => {
  await sleep();
  return {
    taskList: [
      {
        taskId: '843943759302',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        startTime: 1672444800000,
        endTime: 1672444800000,
        finishTime: 1655778123037,
        taskStatus: TaskStatus.doing, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759303',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        startTime: 1655178123037,
        endTime: 1672444800000,
        finishTime: 1655778123037,
        taskStatus: TaskStatus.done, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759304',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        startTime: 1655178123037,
        endTime: 1655778123037,
        finishTime: 1655778123037,
        taskStatus: TaskStatus.preparation, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759305',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        startTime: 1655178123037,
        endTime: 1655778123037,
        finishTime: 1655778123037,
        taskStatus: TaskStatus.undo, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759306',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        startTime: 1655178123037,
        endTime: 1655778123037,
        finishTime: 1655778123037,
        taskStatus: TaskStatus.doing, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759307',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        startTime: 1655178123037,
        endTime: 1655778123037,
        finishTime: 1655778123037,
        taskStatus: TaskStatus.doing, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
    ],
    total: 200,
  };
};

export const fetchManualList = async () => {
  await sleep();
  return {
    taskList: [
      {
        taskId: '843943759302',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        finishTime: 1943394534908, // long
        prepareTime: '3天', // 文本
        taskStatus: TaskStatus.undo, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759303',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        finishTime: 1943394534908, // long
        prepareTime: '3天', // 文本
        taskStatus: TaskStatus.preparation, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759304',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        finishTime: 1943394534908, // long
        prepareTime: '3天', // 文本
        taskStatus: TaskStatus.doing, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759305',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        finishTime: 1943394534908, // long
        prepareTime: '3天', // 文本
        taskStatus: TaskStatus.done, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
      {
        taskId: '843943759306',
        taskName: 'xxxx',
        conditionType: [],
        totalDomainCount: 23,
        validDomainCount: 12,
        invalidDomainCount: 11,
        finishTime: 1943394534908, // long
        prepareTime: '3天', // 文本
        taskStatus: TaskStatus.suspend, // 枚举, preparation准备中, doing 标记中， done 完成， undo未操作
        ruleContent: '{}', // 规则内容，json格式
      },
    ],
    total: 200,
  };
};

export const fetchCustomerList = async () => {
  await sleep();
  return {
    regularCustomerList: [
      {
        regularCustomerId: '843943759302',
        regularCustomerDomain: 'www.baidu.com',
        companyName: 'ddd',
        sendCount: 10,
        receiveCount: 2,
        fromCount: 12,
        toCount: 11,
        syncInfo: {
          type: 'openSea', // 公海openSea;线索clue;客户customer;分配线索assignClue,客户公海openCustomer
          referId: '32432432',
          owner: 'self', // other他人 ； self自己
        },
        validInfo: {
          owner: 'self', // other他人 ； self自己
          valid: 2, // 0未标记， 1 有效 2 无效
        }, // valid有效;invalid无效
        grantInfo: {
          status: 'pass', // reject拒绝；pass通过；checking审核中；unauthorized待授权
          grantId: '23214245', // 工单ID
        },
      },
      {
        regularCustomerId: '843943759303',
        regularCustomerDomain: 'www.sina.com',
        companyName: '',
        sendCount: 10,
        receiveCount: 2,
        fromCount: 12,
        toCount: 11,
        syncInfo: {
          type: 'clue', // 公海openSea;线索clue;客户customer;分配线索assignClue,客户公海openCustomer
          referId: '32432432',
          owner: 'self', // other他人 ； self自己
        },
        validInfo: {
          owner: 'self', // other他人 ； self自己
          valid: 1, // 0未标记， 1 有效 2 无效
        }, // valid有效;invalid无效
        grantInfo: {
          status: 'pass', // reject拒绝；pass通过；checking审核中；unauthorized待授权
          grantId: '23214245', // 工单ID
        },
      },
      {
        regularCustomerId: '843943759304',
        regularCustomerDomain: 'www.asdasda.com',
        companyName: '',
        sendCount: 10,
        receiveCount: 2,
        fromCount: 12,
        toCount: 11,
        syncInfo: {
          type: 'assignClue', // 公海openSea;线索clue;客户customer;分配线索assignClue,客户公海openCustomer
          referId: '32432432',
          owner: 'other', // other他人 ； self自己
        },
        validInfo: {
          owner: 'self', // other他人 ； self自己
          valid: 1, // 0未标记， 1 有效 2 无效
        }, // valid有效;invalid无效
        grantInfo: {
          status: 'pass', // reject拒绝；pass通过；checking审核中；unauthorized待授权
          grantId: '23214245', // 工单ID
        },
      },
      {
        regularCustomerId: '843943759305',
        regularCustomerDomain: 'www.awsxin.com',
        companyName: 'ddd',
        sendCount: 10,
        receiveCount: 2,
        fromCount: 12,
        toCount: 11,
        syncInfo: {
          type: 'openCustomer', // 公海openSea;线索clue;客户customer;分配线索assignClue,客户公海openCustomer
          referId: '32432432',
          owner: 'other', // other他人 ； self自己
        },
        validInfo: {
          owner: 'other', // other他人 ； self自己
          valid: 2, // 0未标记， 1 有效 2 无效
        }, // valid有效;invalid无效
        grantInfo: {
          status: 'checking', // reject拒绝；pass通过；checking审核中；unauthorized待授权
          grantId: '23214245', // 工单ID
        },
      },
      {
        regularCustomerId: '843943759306',
        regularCustomerDomain: 'www.dasdadqwweq.com',
        companyName: 'ddd',
        sendCount: 10,
        receiveCount: 2,
        fromCount: 12,
        toCount: 11,
        grantInfo: {
          status: 'unauthorized', // reject拒绝；pass通过；checking审核中；unauthorized待授权
          grantId: '23214245', // 工单ID
        },
      },
    ],
    total: 200,
  };
};

export const fetchCustomerDetail = async () => {
  await sleep();
  return {
    regularCustomerId: '843943759302',
    regularCustomerDomain: 'www.baidu.com',
    companyName: '百度',
    receiverList: [
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
      {
        nickname: 'nickName',
        email: 'sdad@123.com',
      },
    ],
    sendCount: 10,
    receiveCount: 2,
    fromCount: 12,
    toCount: 11,
    // syncInfo: {
    //   type: 'openSea', // 公海openSea;线索clue;客户customer;分配线索assignClue
    //   referId: '32432432'
    // },
    // validFlag: 1, // 1有效, 2无效
    validInfo: [
      {
        accountId: '12213412',
        nick: '',
        email: '',
        validFlag: '1',
        time: 1393483543,
      },
    ], // valid有效;invalid无效
    grantInfo: {
      status: 'checking', // reject拒绝；pass通过；checking审核中；unauthorized待授权
      grantId: '23214245', // 工单ID
    },
  };
};
