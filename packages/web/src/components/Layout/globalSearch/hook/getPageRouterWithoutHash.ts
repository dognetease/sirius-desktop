export default () => {
  if (typeof window !== 'undefined') {
    const routeWithoutHash = window.location.hash.replace(/^#/, '');
    if (routeWithoutHash) {
      return window.encodeURIComponent(routeWithoutHash);
    } else {
      return undefined;
    }
  }
  return undefined;
};
