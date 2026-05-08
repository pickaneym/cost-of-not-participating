<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'

const { $page } = useSlideContext()
const pageNo = computed(() => String($page.value).padStart(2, '0'))

const props = withDefaults(defineProps<{
  coverLogo?: string
  coverLogoAlt?: string
  coverMeta?: string
  footerText?: string
}>(), {
  coverLogo: '/oneqrew-ds-logo-light.svg',
  coverLogoAlt: 'OneQrew Digital Services logo',
  coverMeta: '',
  footerText: 'WTF Manila',
})
</script>

<template>
  <div class="slidev-layout oneqrew-cover-solid">
    <div class="oq-cover-inner">
      <header class="oq-cover-header">
        <img
          :src="props.coverLogo"
          :alt="props.coverLogoAlt"
        >
        <p class="oq-cover-meta">{{ props.coverMeta }}</p>
      </header>

      <main class="oq-cover-body">
        <slot />
      </main>

      <p class="oq-cover-footer">
        <span>{{ props.footerText }}</span>
        <span>|</span>
        <span class="oq-cover-page-no">{{ pageNo }}</span>
      </p>
    </div>
  </div>
</template>

<style src="../styles/index.css"></style>
