export function guideBy(tester: () => boolean): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    console.log('log in decorators:', target, key, descriptor);
    const fn = descriptor.value;
    if (typeof fn === 'function') {
      descriptor.value = function (...args: any[]) {
        if (tester()) {
          return fn.apply(this, args);
        }
        console.log('not pass the condition , return undefined');
        return undefined;
      };
    }
    return descriptor;
  };
}
