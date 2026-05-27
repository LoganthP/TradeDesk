export const panelSlide = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
} as const;

export const modalScale = {
  hidden:  { scale: 0.95, opacity: 0 },
  visible: { scale: 1,    opacity: 1, transition: { duration: 0.18, ease: [0.16,1,0.3,1] } },
  exit:    { scale: 0.97, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } },
} as const;

export const dropdownSlide = {
  hidden:  { y: -8, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
  exit:    { y: -4, opacity: 0, transition: { duration: 0.10, ease: 'easeIn' } },
};

export const rowFadeIn = {
  hidden:  { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease: 'easeOut' }
  }),
};

export const toastSlide = {
  hidden:  { y: 80, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
  exit:    { y: 20, opacity: 0, transition: { duration: 0.2 } },
};
