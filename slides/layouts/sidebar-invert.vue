<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import { computed, ref, watch } from 'vue'
import { type SidebarBody, useSidebarMeta } from './useSidebarMeta'

const { $page } = useSlideContext()
const pageNo = computed(() => String($page.value).padStart(2, '0'))

const props = withDefaults(defineProps<{
  sidebarKicker?: string
  sidebarTitle?: string
  sidebarCaption?: string
  sidebarBody?: SidebarBody
  sidebarBodyImage?: string
  sidebarBodyImageAlt?: string
  sidebarLogo?: string
  sidebarLogoAlt?: string
  footerText?: string
}>(), {
  sidebarLogo: '/oneqrew-ds-logo-light.svg',
  sidebarLogoAlt: 'OneQrew Digital Services logo',
  sidebarBodyImageAlt: 'Sidebar illustration',
  footerText: 'WTF Manila',
})

const {
  contentRef,
  sidebarKicker,
  sidebarTitle,
  sidebarCaption,
  sidebarBodyLines,
} = useSidebarMeta(props)

const isImageModalOpen = ref(false)

const openImageModal = () => {
  if (!props.sidebarBodyImage)
    return
  isImageModalOpen.value = true
}

const closeImageModal = () => {
  isImageModalOpen.value = false
}

watch(isImageModalOpen, (isOpen, _, onCleanup) => {
  if (!isOpen)
    return

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape')
      closeImageModal()
  }

  window.addEventListener('keydown', onKeydown)
  onCleanup(() => window.removeEventListener('keydown', onKeydown))
})
</script>

<template>
  <div class="slidev-layout oneqrew-detail oneqrew-detail--sidebar-dark">
    <aside class="oq-side">
      <img
        :src="props.sidebarLogo"
        :alt="props.sidebarLogoAlt"
      >
      <p class="oq-kicker">{{ sidebarKicker }}</p>
      <h2 class="oq-side-title">{{ sidebarTitle }}</h2>
      <p class="oq-side-caption">{{ sidebarCaption }}</p>
      <div
        v-if="props.sidebarBodyImage || sidebarBodyLines.length"
        class="oq-side-body"
      >
        <button
          v-if="props.sidebarBodyImage"
          type="button"
          class="oq-side-body-image-button"
          :aria-label="`Open enlarged image: ${props.sidebarBodyImageAlt}`"
          @click="openImageModal"
        >
          <img
            class="oq-side-body-image"
            :src="props.sidebarBodyImage"
            :alt="props.sidebarBodyImageAlt"
          >
        </button>
        <p
          v-for="(line, index) in sidebarBodyLines"
          :key="`sidebar-body-${index}`"
        >
          {{ line }}
        </p>
      </div>
    </aside>

    <main class="oq-main">
      <section
        ref="contentRef"
        class="oq-main-content"
      >
        <slot />
      </section>
      <p class="oq-main-meta">
        <span>{{ props.footerText }}</span>
        <span>|</span>
        <span class="oq-page-no">{{ pageNo }}</span>
      </p>
    </main>

    <div
      v-if="isImageModalOpen"
      class="oq-image-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="props.sidebarBodyImageAlt"
      @click.self="closeImageModal"
    >
      <button
        type="button"
        class="oq-image-modal-close"
        aria-label="Close enlarged image"
        @click="closeImageModal"
      >
        Close
      </button>
      <img
        v-if="props.sidebarBodyImage"
        class="oq-image-modal-content"
        :src="props.sidebarBodyImage"
        :alt="props.sidebarBodyImageAlt"
      >
    </div>
  </div>
</template>

<style src="../styles/index.css"></style>
