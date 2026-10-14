(() => {
  /* ── 1. Toast Notification ── */
  const toast = document.getElementById('toast');
  let toastTimer;

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  /* ── 2. Copy Helper (with modern clipboard + fallback) ── */
  async function copyText(text, successMsg = '복사되었습니다.') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        notify(successMsg);
      } else {
        fallbackCopy(text, successMsg);
      }
    } catch (_) {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    notify(copied ? successMsg : '복사 기능을 지원하지 않는 환경입니다.');
  }

  /* ── 3. Address Copy ── */
  const copyAddressBtn = document.getElementById('copy-address');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', () => {
      const address = '경기도 성남시 분당구 양현로 322';
      copyText(address, '주소를 복사했어요.');
    });
  }

  /* ── 4. Account Accordion & Copy ── */
  const accountToggles = document.querySelectorAll('.account-toggle');
  accountToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const group = toggle.closest('.account-group');
      if (!group) return;
      const isOpen = group.classList.contains('open');

      // Close all other groups (accordion behavior)
      document.querySelectorAll('.account-group').forEach(item => {
        if (item !== group) {
          item.classList.remove('open');
          const t = item.querySelector('.account-toggle');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        group.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        group.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const copyAccountButtons = document.querySelectorAll('.copy-btn');
  copyAccountButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const account = btn.dataset.account;
      if (account) {
        copyText(account, '계좌번호가 복사되었습니다.');
      }
    });
  });

  /* ── 5. Horizontal Gallery Slider ── */
  const gallerySlider = document.getElementById('gallerySlider');
  const sliderPrev = document.getElementById('sliderPrev');
  const sliderNext = document.getElementById('sliderNext');
  const sliderCounter = document.getElementById('sliderCounter');
  const sliderProgressFill = document.getElementById('sliderProgressFill');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  if (gallerySlider) {
    function getSlideStep() {
      const slide = gallerySlider.querySelector('.gallery-slide');
      return slide ? slide.offsetWidth + 12 : 320;
    }

    if (sliderPrev) {
      sliderPrev.addEventListener('click', () => {
        gallerySlider.scrollBy({ left: -getSlideStep(), behavior: 'smooth' });
      });
    }

    if (sliderNext) {
      sliderNext.addEventListener('click', () => {
        gallerySlider.scrollBy({ left: getSlideStep(), behavior: 'smooth' });
      });
    }

    let sliderTicking = false;
    gallerySlider.addEventListener('scroll', () => {
      if (!sliderTicking) {
        requestAnimationFrame(() => {
          const step = getSlideStep();
          const idx = Math.round(gallerySlider.scrollLeft / step);
          const safeIdx = Math.max(0, Math.min(galleryItems.length - 1, idx));
          if (sliderCounter) {
            sliderCounter.innerHTML = `<strong>${safeIdx + 1}</strong> / ${galleryItems.length}`;
          }
          if (sliderProgressFill) {
            sliderProgressFill.style.width = `${((safeIdx + 1) / galleryItems.length) * 100}%`;
          }
          sliderTicking = false;
        });
        sliderTicking = true;
      }
    }, { passive: true });
  }

  /* ── 5-1. Gallery Modal Lightbox with 20-photo navigation ── */
  const imageModal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalClose = document.getElementById('modalClose');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const modalCounter = document.getElementById('modalCounter');

  let currentPhotoIndex = 0;

  function showPhoto(index) {
    if (!galleryItems.length || !modalImage) return;
    // Wrap around
    if (index < 0) index = galleryItems.length - 1;
    if (index >= galleryItems.length) index = 0;

    currentPhotoIndex = index;
    const item = galleryItems[currentPhotoIndex];
    const src = item.dataset.image;
    const img = item.querySelector('img');
    const alt = img ? img.alt : `문현준 조민아 웨딩 사진 ${currentPhotoIndex + 1}`;

    modalImage.src = src;
    modalImage.alt = alt;

    if (modalCounter) {
      modalCounter.textContent = `${currentPhotoIndex + 1} / ${galleryItems.length}`;
    }
  }

  function openModal(index) {
    if (!imageModal) return;
    showPhoto(index);
    imageModal.classList.add('active');
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!imageModal) return;
    imageModal.classList.remove('active');
    imageModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  galleryItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      openModal(idx);
    });
  });

  if (modalPrev) {
    modalPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      showPhoto(currentPhotoIndex - 1);
    });
  }

  if (modalNext) {
    modalNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showPhoto(currentPhotoIndex + 1);
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      // Close only if clicking the backdrop outside image and buttons
      if (e.target === imageModal) {
        closeModal();
      }
    });
  }

  // Keyboard navigation (ESC to close, Left/Right arrows to browse)
  window.addEventListener('keydown', (e) => {
    if (!imageModal || !imageModal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      showPhoto(currentPhotoIndex - 1);
    } else if (e.key === 'ArrowRight') {
      showPhoto(currentPhotoIndex + 1);
    }
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  if (imageModal) {
    imageModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    imageModal.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 45) {
        if (diffX > 0) {
          showPhoto(currentPhotoIndex - 1); // Swipe right -> Previous
        } else {
          showPhoto(currentPhotoIndex + 1); // Swipe left -> Next
        }
      }
    }, { passive: true });
  }

  /* ── 6. D-Day Calculator ── */
  const ddayCountEl = document.getElementById('ddayCount');
  if (ddayCountEl) {
    const weddingDate = new Date('2027-02-27T11:00:00+09:00');
    const now = new Date();
    // Normalize to date comparison
    const diffTime = weddingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      ddayCountEl.textContent = `D-${diffDays}`;
    } else if (diffDays === 0) {
      ddayCountEl.textContent = 'D-DAY';
    } else {
      ddayCountEl.textContent = `D+${Math.abs(diffDays)}`;
    }
  }

  /* ── 7. Share Invitation ── */
  const shareBtn = document.getElementById('share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: '현준 그리고 민아, 결혼합니다',
        text: '2027년 2월 27일 토요일 오전 11시 · 더 바실리움\n소중한 분들을 초대합니다.',
        url: window.location.href
      };

      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          if (error.name !== 'AbortError') {
            copyText(window.location.href, '청첩장 링크가 복사되었습니다.');
          }
        }
      } else {
        copyText(window.location.href, '청첩장 링크가 복사되었습니다.');
      }
    });
  }

  /* ── 8. Scroll Reveal (wedding-main IntersectionObserver) ── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Scroll cue fade out on scroll
    const scrollCue = document.querySelector('.scroll-cue');
    if (scrollCue) {
      window.addEventListener('scroll', () => {
        scrollCue.style.opacity = window.scrollY > 60 ? '0' : '0.85';
      }, { passive: true });
    }
  }

  /* ── 9. Kakao Roughmap Controller & Cont suppression ── */
  const hideKakaoControls = () => {
    document.querySelectorAll('.root_daum_roughmap .wrap_controllers, .root_daum_roughmap .cont, .btn_zoom_in, .btn_zoom_out, .btn_zoom_reset').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });
  };
  hideKakaoControls();
  const kakaoContainer = document.querySelector('.root_daum_roughmap');
  if (kakaoContainer) {
    const roughmapObserver = new MutationObserver(hideKakaoControls);
    roughmapObserver.observe(kakaoContainer, { childList: true, subtree: true });
  }
})();
