/* ==========================================================================
   EchoLife Theme Switcher (Dark / Light Mode)
   ========================================================================== */

const THEME_KEY = 'echolife_theme_pref';

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  // Update theme toggle icons across the DOM
  const themeIcons = document.querySelectorAll('.theme-toggle-icon');
  themeIcons.forEach(icon => {
    if (theme === 'light') {
      icon.classList.remove('bi-moon-stars-fill');
      icon.classList.add('bi-sun-fill');
    } else {
      icon.classList.remove('bi-sun-fill');
      icon.classList.add('bi-moon-stars-fill');
    }
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(nextTheme);
}

// Apply immediately on script load
setTheme(getPreferredTheme());

document.addEventListener('DOMContentLoaded', () => {
  setTheme(getPreferredTheme());

  const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
});
