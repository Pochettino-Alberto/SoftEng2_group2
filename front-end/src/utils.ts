// scrollUtils.ts
export function scrollToTop(container?: HTMLElement | Window, smooth = true) {
  const scrollContainer = container || window;

  if (scrollContainer instanceof Window) {
    if (window.scrollY > 0) {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  } else {
    if (scrollContainer.scrollTop > 0) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }
}
