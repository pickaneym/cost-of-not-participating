import { useSlideContext } from '@slidev/client'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

export type SidebarBody = string | string[]

interface SidebarInput {
  sidebarKicker?: string
  sidebarTitle?: string
  sidebarCaption?: string
  sidebarBody?: SidebarBody
}

const DEFAULT_TITLE = 'Session Details'
const DEFAULT_KICKER = 'Presentation'
const DEFAULT_CAPTION = 'Use the slide frontmatter to customize this sidebar.'

export function useSidebarMeta(props: SidebarInput) {
  const { $page } = useSlideContext()
  const contentRef = ref<HTMLElement | null>(null)
  const derivedTitle = ref('')
  const derivedCaption = ref('')

  const refreshDerived = async () => {
    await nextTick()
    const root = contentRef.value

    if (!root) {
      return
    }

    const heading = normalize(root.querySelector('h1, h2, h3')?.textContent ?? '')
    const firstBodyText = collectTextBlocks(root)
      .map((line) => trimEndingPunctuation(line))
      .find((line) => line.length >= 24 && line.length <= 120)

    derivedTitle.value = heading
    derivedCaption.value = firstBodyText ?? ''
  }

  onMounted(() => {
    void refreshDerived()
  })

  watch(
    () => $page.value,
    () => {
      void refreshDerived()
    },
  )

  const sidebarTitle = computed(() => normalize(props.sidebarTitle) || derivedTitle.value || DEFAULT_TITLE)
  const sidebarKicker = computed(() => normalize(props.sidebarKicker) || DEFAULT_KICKER)
  const sidebarCaption = computed(() => normalize(props.sidebarCaption) || derivedCaption.value || DEFAULT_CAPTION)

  const sidebarBodyLines = computed(() => {
    const source = props.sidebarBody

    if (!source) {
      return []
    }

    if (Array.isArray(source)) {
      return source.map((line) => normalize(String(line))).filter(Boolean)
    }

    return source
      .split(/\n+/)
      .map((line) => normalize(line))
      .filter(Boolean)
  })

  return {
    contentRef,
    sidebarTitle,
    sidebarKicker,
    sidebarCaption,
    sidebarBodyLines,
  }
}

function collectTextBlocks(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('p, li, blockquote, figcaption'))
    .map((node) => normalize(node.textContent ?? ''))
    .filter(Boolean)
}

function trimEndingPunctuation(value: string): string {
  return value.replace(/[\s.:;!?]+$/g, '')
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}
