(() => {
  'use strict';
  const links = [...document.querySelectorAll('.masthead nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;
  const setCurrent = id => links.forEach(link => {
    if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setCurrent(visible.target.id);
  }, {rootMargin:'-20% 0px -55% 0px', threshold:[0, .1, .4]});
  sections.forEach(section => observer.observe(section));
  links.forEach(link => link.addEventListener('click', () => setCurrent(link.getAttribute('href').slice(1))));
  setCurrent(sections[0].id);
})();
