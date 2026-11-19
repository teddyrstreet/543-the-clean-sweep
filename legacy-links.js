'use strict';

const legacyPages = {
  '#request': '/request/',
  '#commercial': '/commercial/',
  '#services': '/commercial/#scope',
  '#process': '/commercial/#process',
  '#about': '/about/'
};

function openLegacyLink() {
  const target = legacyPages[window.location.hash];
  if (target) window.location.replace(target);
}

openLegacyLink();
window.addEventListener('hashchange', openLegacyLink);
