import { type Header, type DefaultTheme } from 'vitepress';
import { useAside } from 'vitepress/dist/client/theme-default/composables/aside';
import { throttleAndDebounce } from 'vitepress/dist/client/theme-default/support/utils';
import { onMounted, onUnmounted, onUpdated, type Ref } from 'vue';

// magic number to avoid repeated retrieval
const PAGE_OFFSET = 71;

export type MenuItem = Omit<Header, 'slug' | 'children'> & {
  children?: MenuItem[];
};

export function resolveTitle(theme: DefaultTheme.Config) {
  return (
    (typeof theme.outline === 'object' && !Array.isArray(theme.outline) && theme.outline.label) ||
    theme.outlineTitle ||
    'On this page'
  );
}

export function serializeHeader(h: Element) {
  let ret = '';
  for (const node of Array.from(h.childNodes)) {
    if (node.nodeType === 1) {
      const element = node as Element;
      if (element.classList.contains('VPBadge') || element.classList.contains('header-anchor')) {
        continue;
      }
      ret += element.textContent;
    } else if (node.nodeType === 3) {
      ret += node.textContent;
    }
  }

  return ret.trim();
}

function filterHeadersByRange(
  headers: MenuItem[],
  high: number | undefined,
  low: number | undefined
): MenuItem[] {
  return headers.filter(
    h => (high === undefined || h.level >= high) && (low === undefined || h.level <= low)
  );
}

function calculateRangeLevels(range: DefaultTheme.Config['outline']): {
  high: number | undefined;
  low: number | undefined;
} {
  const levelsRange = typeof range === 'object' && !Array.isArray(range) ? range.level : range || 2;
  const high: number | undefined =
    typeof levelsRange === 'number' ? levelsRange : levelsRange === 'deep' ? 2 : undefined;
  const low: number | undefined =
    typeof levelsRange === 'number' ? levelsRange : levelsRange === 'deep' ? 6 : undefined;

  return { high, low };
}

function addToParentOrRoot(headers: MenuItem[], cur: MenuItem): boolean {
  for (let i = headers.length - 1; i >= 0; i--) {
    const prevHeader = headers[i];
    if (prevHeader.level < cur.level) {
      (prevHeader.children || (prevHeader.children = [])).push(cur);

      return true;
    }
  }

  return false;
}

export function resolveHeaders(
  headers: MenuItem[],
  range?: DefaultTheme.Config['outline']
): MenuItem[] {
  if (range === false) {
    return [];
  }

  const { high, low } = calculateRangeLevels(range);
  const filteredHeaders = filterHeadersByRange(headers, high, low);
  const ret: MenuItem[] = [];

  for (const cur of filteredHeaders) {
    if (!addToParentOrRoot(ret, cur)) {
      ret.push(cur);
    }
  }

  return ret;
}

function activateLink(
  hash: string | null,
  container: Ref<HTMLElement>,
  marker: Ref<HTMLElement>,
  prevActiveLink: HTMLAnchorElement | null
) {
  if (prevActiveLink) {
    prevActiveLink.classList.remove('active');
  }

  if (hash !== null) {
    prevActiveLink = container.value.querySelector(`a[href="${decodeURIComponent(hash)}"]`);
  }

  const activeLink = prevActiveLink;

  if (activeLink) {
    activeLink.classList.add('active');
    marker.value.style.top = activeLink.offsetTop + 33 + 'px';
    marker.value.style.opacity = '1';
  } else {
    marker.value.style.top = '33px';
    marker.value.style.opacity = '0';
  }
}

function getAnchorTop(anchor: HTMLAnchorElement): number {
  if (anchor.parentElement !== null) {
    return anchor.parentElement.offsetTop - PAGE_OFFSET;
  }

  return 0;
}

function isAnchorActive(
  index: number,
  anchor: HTMLAnchorElement,
  nextAnchor: HTMLAnchorElement | undefined
): [boolean, string | null] {
  const scrollTop = window.scrollY;

  if (index === 0 && scrollTop === 0) {
    return [true, null];
  }

  if (scrollTop < getAnchorTop(anchor)) {
    return [false, null];
  }

  if (!nextAnchor || scrollTop < getAnchorTop(nextAnchor)) {
    return [true, anchor.hash];
  }

  return [false, null];
}

function setActiveLink(
  container: Ref<HTMLElement>,
  marker: Ref<HTMLElement>,
  isAsideEnabled: Ref<boolean>,
  prevActiveLink: HTMLAnchorElement | null
) {
  if (
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    !container.value ||
    !marker.value ||
    !isAsideEnabled.value
  ) {
    return;
  }

  const links = [].slice.call(
    container.value.querySelectorAll('.outline-link')
  ) as HTMLAnchorElement[];

  const anchors = [].slice
    .call(document.querySelectorAll('.content .header-anchor'))
    .filter((anchor: HTMLAnchorElement) => {
      return links.some(link => {
        return link.hash === anchor.hash && anchor.offsetParent !== null;
      });
    }) as HTMLAnchorElement[];

  const scrollY = window.scrollY;
  const innerHeight = window.innerHeight;
  const offsetHeight = document.body.offsetHeight;
  const isBottom = Math.abs(scrollY + innerHeight - offsetHeight) < 1;

  // page bottom - highlight last one
  if (anchors.length && isBottom) {
    activateLink(anchors[anchors.length - 1].hash, container, marker, prevActiveLink);
    return;
  }

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const nextAnchor = anchors[i + 1];
    const [isActive, hash] = isAnchorActive(i, anchor, nextAnchor);

    if (isActive) {
      activateLink(hash, container, marker, prevActiveLink);
      return;
    }
  }
}

export function useActiveAnchor(container: Ref<HTMLElement>, marker: Ref<HTMLElement>) {
  const { isAsideEnabled } = useAside();
  const prevActiveLink: HTMLAnchorElement | null = null;
  const onScroll = throttleAndDebounce(
    () => setActiveLink(container, marker, isAsideEnabled, prevActiveLink),
    100
  );

  onMounted(() => {
    requestAnimationFrame(() => setActiveLink(container, marker, isAsideEnabled, prevActiveLink));
    window.addEventListener('scroll', onScroll);
  });

  onUpdated(() => {
    // sidebar update means a route change
    activateLink(location.hash, container, marker, prevActiveLink);
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
  });
}
