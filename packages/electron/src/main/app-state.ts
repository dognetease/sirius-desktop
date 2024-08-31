let isUpdatingQuit = false;

export function setIsUpdatingQuit(val: boolean) {
  isUpdatingQuit = val;
}

export function getIsUpdatingQuit(): boolean {
  return isUpdatingQuit;
}
