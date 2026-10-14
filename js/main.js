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

  /* ── 5. 3열 갤러리 그리드 & 더보기 토글 ── */
  const galleryMoreBtn = document.getElementById('galleryMoreBtn');
  const hiddenItems = Array.from(document.querySelectorAll('.gallery-item-wrap.is-hidden'));
  const gallerySection = document.getElementById('gallery');
  let isGalleryExpanded = false;

  if (galleryMoreBtn && hiddenItems.length > 0) {
    const moreText = galleryMoreBtn.querySelector('.gallery-more-text');
    const hiddenCount = hiddenItems.length;

    galleryMoreBtn.addEventListener('click', () => {
      isGalleryExpanded = !isGalleryExpanded;

      if (isGalleryExpanded) {
        hiddenItems.forEach((item) => {
          item.classList.remove('is-hidden');
          item.classList.add('is-revealing');
        });
        galleryMoreBtn.classList.add('expanded');
        galleryMoreBtn.setAttribute('aria-expanded', 'true');
        if (moreText) moreText.textContent = '사진 접기';

        // 새로 펼쳐진 사진 목록으로 부드럽게 스크롤
        setTimeout(() => {
          if (hiddenItems[0]) {
            hiddenItems[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      } else {
        hiddenItems.forEach((item) => {
          item.classList.remove('is-revealing');
          item.classList.add('is-hidden');
        });
        galleryMoreBtn.classList.remove('expanded');
        galleryMoreBtn.setAttribute('aria-expanded', 'false');
        if (moreText) moreText.textContent = `사진 더보기 (${hiddenCount}장)`;

        if (gallerySection) {
          gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  /* ── 5-1. 모달 라이트박스 (슬라이드 애니메이션, 하단 페이징, 핀치 줌 & 흔들림/넘김 방지) ── */
  const imageModal = document.getElementById('imageModal');
  const modalViewport = document.getElementById('modalViewport');
  const modalTrack = document.getElementById('modalTrack');
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const modalCurNum = document.getElementById('modalCurNum');
  const modalTotalNum = document.getElementById('modalTotalNum');
  const galleryButtons = Array.from(document.querySelectorAll('.gallery-item'));

  const totalPhotos = galleryButtons.length;
  let currentPhotoIndex = 0;
  const slides = [];

  // 줌 상태 관리
  let currentScale = 1;
  let panX = 0;
  let panY = 0;
  let startScale = 1;
  let initialPinchDistance = 0;
  let isPinching = false;
  let isPanning = false;

  // 슬라이드(스와이프) 상태 관리
  let isSliding = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let startPanX = 0;
  let startPanY = 0;
  let dragDeltaX = 0;
  let touchStartTime = 0;

  // 더블탭 판별
  let lastTapTime = 0;

  // 슬라이드 생성
  if (modalTrack && totalPhotos > 0) {
    if (modalTotalNum) modalTotalNum.textContent = totalPhotos;

    galleryButtons.forEach((btn, idx) => {
      const src = btn.dataset.image;
      const imgEl = btn.querySelector('img');
      const alt = imgEl ? imgEl.alt : `웨딩 사진 ${idx + 1}`;

      const slide = document.createElement('div');
      slide.className = 'modal-slide';
      slide.setAttribute('data-index', idx);

      const zoomWrap = document.createElement('div');
      zoomWrap.className = 'modal-zoom-wrap';

      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.loading = idx < 3 ? 'eager' : 'lazy';
      img.draggable = false;

      zoomWrap.appendChild(img);
      slide.appendChild(zoomWrap);
      modalTrack.appendChild(slide);
      slides.push(slide);
    });
  }

  function getZoomWrap(idx) {
    return slides[idx] ? slides[idx].querySelector('.modal-zoom-wrap') : null;
  }

  function resetZoom(idx, animate = true) {
    const wrap = getZoomWrap(idx);
    if (!wrap) return;
    if (animate) {
      wrap.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.3, 1)';
    } else {
      wrap.style.transition = 'none';
    }
    wrap.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
    currentScale = 1;
    panX = 0;
    panY = 0;
  }

  function applyZoom(idx, scale, x, y, animate = false) {
    const wrap = getZoomWrap(idx);
    if (!wrap) return;
    if (animate) {
      wrap.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.3, 1)';
    } else {
      wrap.style.transition = 'none';
    }
    wrap.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
  }

  function updatePaginationUI(idx) {
    if (modalCurNum) {
      modalCurNum.textContent = idx + 1;
    }
  }

  function goToSlide(index, animate = true) {
    if (!modalTrack) return;
    const targetIndex = Math.max(0, Math.min(totalPhotos - 1, index));
    const previousIndex = currentPhotoIndex;

    if (previousIndex !== targetIndex) {
      resetZoom(previousIndex, false);
    }
    resetZoom(targetIndex, false);

    currentPhotoIndex = targetIndex;

    if (animate) {
      modalTrack.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
    } else {
      modalTrack.style.transition = 'none';
    }

    const offsetPercent = -currentPhotoIndex * 100;
    modalTrack.style.transform = `translate3d(${offsetPercent}vw, 0px, 0px)`;

    updatePaginationUI(currentPhotoIndex);
  }

  function openModal(index) {
    if (!imageModal) return;
    imageModal.classList.add('active');
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    goToSlide(index, false);
  }

  function closeModal() {
    if (!imageModal) return;
    imageModal.classList.remove('active');
    imageModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetZoom(currentPhotoIndex, false);
  }

  galleryButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      openModal(idx);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  if (modalPrev) {
    modalPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentPhotoIndex > 0) {
        goToSlide(currentPhotoIndex - 1, true);
      } else {
        goToSlide(totalPhotos - 1, true);
      }
    });
  }

  if (modalNext) {
    modalNext.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentPhotoIndex < totalPhotos - 1) {
        goToSlide(currentPhotoIndex + 1, true);
      } else {
        goToSlide(0, true);
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!imageModal || !imageModal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      if (currentScale > 1.05) return;
      if (currentPhotoIndex > 0) goToSlide(currentPhotoIndex - 1, true);
    } else if (e.key === 'ArrowRight') {
      if (currentScale > 1.05) return;
      if (currentPhotoIndex < totalPhotos - 1) goToSlide(currentPhotoIndex + 1, true);
    }
  });

  /* ── 터치 제스처: 핀치 줌(확대) 흔들림 방지 & 확대 시 슬라이드 전환 원천 차단 ── */
  if (modalViewport) {
    function getDistance(t1, t2) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    modalViewport.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();

      // 두 손가락 핀치 줌 시작: 슬라이드 모드 즉시 해제
      if (e.touches.length === 2) {
        isPinching = true;
        isSliding = false;
        isPanning = false;
        dragDeltaX = 0;
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        startScale = currentScale;
        return;
      }

      // 한 손가락 터치
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        dragDeltaX = 0;

        // 확대된 상태: 사진 넘김 완전 차단, 오직 내부 팬(이동)만 허용
        if (currentScale > 1.05) {
          isPanning = true;
          isSliding = false;
          startPanX = panX;
          startPanY = panY;
        } else {
          // 1배 기본 크기: 슬라이드 스와이프 준비
          isSliding = true;
          isPanning = false;
          if (modalTrack) modalTrack.style.transition = 'none';
        }
      }
    }, { passive: false });

    modalViewport.addEventListener('touchmove', (e) => {
      // 핀치 줌
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        if (initialPinchDistance > 0) {
          const ratio = currentDist / initialPinchDistance;
          let newScale = Math.max(1, Math.min(startScale * ratio, 3.5));
          currentScale = newScale;
          applyZoom(currentPhotoIndex, currentScale, panX, panY, false);
        }
        return;
      }

      // 한 손가락 이동
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        // 확대 상태에서의 팬 이동: 슬라이드 전환 원천 차단
        if (isPanning && currentScale > 1.05) {
          e.preventDefault();
          panX = startPanX + dx;
          panY = startPanY + dy;

          const maxPanX = (window.innerWidth * (currentScale - 1)) / 1.8;
          panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
          const maxPanY = (window.innerHeight * (currentScale - 1)) / 1.8;
          panY = Math.max(-maxPanY, Math.min(maxPanY, panY));

          applyZoom(currentPhotoIndex, currentScale, panX, panY, false);
          return;
        }

        // 기본 1배 크기일 때만 슬라이드(스와이프) 넘김
        if (isSliding && currentScale <= 1.05) {
          dragDeltaX = dx;
          if ((currentPhotoIndex === 0 && dx > 0) || (currentPhotoIndex === totalPhotos - 1 && dx < 0)) {
            dragDeltaX = dx * 0.3;
          }
          if (modalTrack) {
            modalTrack.style.transform = `translate3d(calc(${-currentPhotoIndex * 100}vw + ${dragDeltaX}px), 0px, 0px)`;
          }
        }
      }
    }, { passive: false });

    modalViewport.addEventListener('touchend', (e) => {
      if (isPinching) {
        if (e.touches.length === 0) {
          isPinching = false;
          if (currentScale < 1.08) {
            resetZoom(currentPhotoIndex, true);
          }
        }
        return;
      }

      if (isPanning) {
        if (e.touches.length === 0) {
          isPanning = false;
        }
        return;
      }

      // 슬라이드 스와이프 종료 판정 (1배 상태일 때만)
      if (isSliding && currentScale <= 1.05) {
        isSliding = false;
        const deltaTime = Date.now() - touchStartTime;
        const threshold = window.innerWidth * 0.18;
        const isQuickFlick = deltaTime < 280 && Math.abs(dragDeltaX) > 35;

        if ((dragDeltaX < -threshold || (isQuickFlick && dragDeltaX < 0)) && currentPhotoIndex < totalPhotos - 1) {
          goToSlide(currentPhotoIndex + 1, true);
        } else if ((dragDeltaX > threshold || (isQuickFlick && dragDeltaX > 0)) && currentPhotoIndex > 0) {
          goToSlide(currentPhotoIndex - 1, true);
        } else {
          goToSlide(currentPhotoIndex, true);
        }
        dragDeltaX = 0;
      }

      // 더블 탭 확대/축소 토글
      if (e.changedTouches.length === 1 && !isPinching) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          if (currentScale > 1.05) {
            resetZoom(currentPhotoIndex, true);
          } else {
            currentScale = 2.4;
            panX = 0;
            panY = 0;
            applyZoom(currentPhotoIndex, currentScale, panX, panY, true);
          }
        }
        lastTapTime = now;
      }
    });

    // 데스크톱 마우스 드래그 슬라이드 지원
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseDeltaX = 0;

    modalViewport.addEventListener('mousedown', (e) => {
      if (currentScale > 1.05) return;
      isMouseDown = true;
      mouseStartX = e.clientX;
      mouseDeltaX = 0;
      if (modalTrack) modalTrack.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown || currentScale > 1.05) return;
      mouseDeltaX = e.clientX - mouseStartX;
      if ((currentPhotoIndex === 0 && mouseDeltaX > 0) || (currentPhotoIndex === totalPhotos - 1 && mouseDeltaX < 0)) {
        mouseDeltaX *= 0.3;
      }
      if (modalTrack) {
        modalTrack.style.transform = `translate3d(calc(${-currentPhotoIndex * 100}vw + ${mouseDeltaX}px), 0px, 0px)`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      if (currentScale <= 1.05) {
        const threshold = 60;
        if (mouseDeltaX < -threshold && currentPhotoIndex < totalPhotos - 1) {
          goToSlide(currentPhotoIndex + 1, true);
        } else if (mouseDeltaX > threshold && currentPhotoIndex > 0) {
          goToSlide(currentPhotoIndex - 1, true);
        } else {
          goToSlide(currentPhotoIndex, true);
        }
      }
      mouseDeltaX = 0;
    });
  }

  /* ── 6. D-Day Calculator ── */
  const ddayCountEl = document.getElementById('ddayCount');
  const ddaySentenceEl = document.getElementById('ddaySentence');
  if (ddayCountEl) {
    const weddingDate = new Date('2027-02-27T11:00:00+09:00');
    const now = new Date();
    // Normalize to date comparison
    const diffTime = weddingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      ddayCountEl.textContent = `${diffDays}일`;
    } else if (diffDays === 0) {
      if (ddaySentenceEl) {
        ddaySentenceEl.innerHTML = '현준 ♥ 민아의 결혼식이 <strong class="dday-highlight" id="ddayCount">오늘</strong>입니다.';
      } else {
        ddayCountEl.textContent = '오늘';
      }
    } else {
      if (ddaySentenceEl) {
        ddaySentenceEl.innerHTML = `현준 ♥ 민아의 결혼식으로부터 <strong class="dday-highlight" id="ddayCount">${Math.abs(diffDays)}일</strong> 지났습니다.`;
      } else {
        ddayCountEl.textContent = `${Math.abs(diffDays)}일`;
      }
    }
  }

  /* ── 7. Share Invitation (카카오톡 공유 & 링크 복사) ── */
  const shareKakaoBtn = document.getElementById('shareKakao');
  const shareLinkBtn = document.getElementById('shareLink');
  const legacyShareBtn = document.getElementById('share');

  async function handleShare() {
    const shareData = {
      title: '현준 그리고 민아, 결혼합니다',
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
  }

  if (shareKakaoBtn) {
    shareKakaoBtn.addEventListener('click', handleShare);
  }

  if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', () => {
      copyText(window.location.href, '청첩장 링크가 복사되었습니다.');
    });
  }

  if (legacyShareBtn) {
    legacyShareBtn.addEventListener('click', handleShare);
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

  /* ── 10. Contact Modal (축하 연락하기 모달) ── */
  const contactModal = document.getElementById('contactModal');
  const contactModalOpenBtn = document.getElementById('contactModalOpenBtn');
  const contactModalClose = document.getElementById('contactModalClose');
  const contactModalBackdrop = document.getElementById('contactModalBackdrop');

  function openContactModal() {
    if (!contactModal) return;
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeContactModal() {
    if (!contactModal) return;
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (contactModalOpenBtn) {
    contactModalOpenBtn.addEventListener('click', openContactModal);
  }
  if (contactModalClose) {
    contactModalClose.addEventListener('click', closeContactModal);
  }
  if (contactModalBackdrop) {
    contactModalBackdrop.addEventListener('click', closeContactModal);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
      closeContactModal();
    }
  });
})();
