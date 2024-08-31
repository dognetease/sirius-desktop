!(function(){
  function getIsInElectron() {
    const userAgentLowCased = navigator.userAgent.toLowerCase();
    return userAgentLowCased.includes('sirius-desktop') || userAgentLowCased.includes('electron');
  }

  function main() {
    if (typeof window === undefined) return;
    const inElectron = getIsInElectron();
    if (!inElectron) {
      document.write('<script src="/snapshot-umd.js"></script>')
    }
  }

  main();
})()