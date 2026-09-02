<template>
  <div class="site-shell hz-page-shell">
    <a class="skip-link hz-skip-link" href="#main-content">Skip to content</a>
    <AppHeader />
    <main id="main-content" tabindex="-1">
      <slot />
    </main>
    <ServiceActivationNotice />
    <AppFooter />
    <ConsentBanner />
  </div>
</template>
