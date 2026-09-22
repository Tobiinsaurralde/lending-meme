export default function PageBody() {
  return (
    <>
      <div className="style w-embed" />
      {/* The engine holds this as $music_bg and calls play/pause on it, so the
          element has to exist — querySelector returning null throws. Dropping
          the <source> leaves it valid but silent. */}
      <audio loop muted className="audio-bg" />
      <div className="cursor-insight" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(-50%, -50%) translate3d(1175.97px, 3.0135px, 0px)" } as React.CSSProperties}>
        <div className="cursor-insight__hold">
          <div className="cursor-insight__follow" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "rotate(-34deg) scale(1.0008, 1)" } as React.CSSProperties} />
          <div className="cursor-insight__bg" />
          <div className="cursor-insight__text">
            Play insight
          </div>
        </div>
      </div>
      <div className="trg-note" style={{ "opacity": "1" } as React.CSSProperties}>
        <div className="trg-note__hold">
          <div className="subtitle__text lined trg-note__text">
            THE NOTE
          </div>
          <div className="trg-note__svg w-embed">
            <svg width="100%" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="52" height="52" rx="26" fill="#FEF1D0" />
              <rect className="trg-note__border" x="2.5" y="2.5" width="47" height="47" rx="23.5" stroke="#002E77" />
              <rect className="trg-note__dot" x="20" y="20" width="3.5" height="3.5" rx="1.75" fill="#002E77" />
              <rect className="trg-note__dot" x="20" y="28.5" width="3.5" height="3.5" rx="1.75" fill="#002E77" />
              <rect className="trg-note__dot" x="28.5" y="20" width="3.5" height="3.5" rx="1.75" fill="#002E77" />
              <rect className="trg-note__dot" x="28.5" y="28.5" width="3.5" height="3.5" rx="1.75" fill="#002E77" />
            </svg>
          </div>
        </div>
      </div>
      <div className="trg-sound" style={{ "opacity": "1" } as React.CSSProperties}>
        <div className="trg-sound__hold">
          <div className="trg-sound__svg w-embed">
            <svg className="sound-svg" viewBox="0 0 10 5" width="100%">
              <polyline className="wave active" vectorEffect="non-scaling-stroke" fill="none" stroke="#2451b5" strokeWidth="2" points="0.000,0.001 0.667,0.065 1.333,0.282 2.000,0.638 2.667,1.112 3.333,1.672 4.000,2.285 4.667,2.911 5.333,3.511 6.000,4.048 6.667,4.488 7.333,4.802 8.000,4.972 8.667,4.987 9.333,4.845 10.000,4.556" />
            </svg>
          </div>
        </div>
      </div>
      <section className="note" style={{ "display": "block", "opacity": "0", "visibility": "hidden" } as React.CSSProperties}>
        <div className="note__hold">
          <div className="note__fader">
            <div className="note__fader__layer note__fader__soft" />
          </div>
          <div className="note__content">
            <div className="note__video__wrap">
              <div data-player-muted="false" className="bunny-player" data-player-fullscreen="false" data-player-activated="false" data-player-autoplay="false" data-bunny-player-init="" data-player-hover="idle" data-player-src="https://vz-053c863d-ce1.b-cdn.net/6120cdac-24b3-4b97-a63a-fc78af4016c3/playlist.m3u8" data-player-status="ready" data-player-update-size="cover" data-player-lazy="meta">
                <div data-player-before="" className="bunny-player__before" />
                <video preload="none" width="1920" height="1080" playsInline className="bunny-player__video" muted webkit-playsinline="" disableRemotePlayback />
                <img width="960" sizes="100vw" alt="" src="/assets/6909e65e512080d43f9f0625_ender_cover.webp" loading="lazy" srcSet="/assets/6909e65e512080d43f9f0625_ENDER_COVER-p-500.webp 500w, /assets/6909e65e512080d43f9f0625_ENDER_COVER.webp 700w" className="bunny-player__placeholder" />
                <div className="bunny-player__dark" />
                <div data-player-control="playpause" className="bunny-player__playpause">
                  <div className="bunny-player__big-btn">
                    <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__pause-svg" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 5V19" stroke="currentColor" strokeWidth="3" strokeMiterlimit="10" />
                      <path d="M8 5V19" stroke="currentColor" strokeWidth="3" strokeMiterlimit="10" />
                    </svg>
                    <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__play-svg" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 12V5.01109C6 4.05131 7.03685 3.4496 7.87017 3.92579L14 7.42855L20.1007 10.9147C20.9405 11.3945 20.9405 12.6054 20.1007 13.0853L14 16.5714L7.87017 20.0742C7.03685 20.5503 6 19.9486 6 18.9889V12Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <div className="bunny-player__interface">
                  <div className="bunny-player__interface-fade" />
                  <div className="bunny-player__interface-bottom">
                    <div data-player-control="playpause" className="bunny-player__toggle-playpause">
                      <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__pause-svg" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 5V19" stroke="currentColor" strokeWidth="3" strokeMiterlimit="10" />
                        <path d="M8 5V19" stroke="currentColor" strokeWidth="3" strokeMiterlimit="10" />
                      </svg>
                      <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__play-svg" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12V5.01109C6 4.05131 7.03685 3.4496 7.87017 3.92579L14 7.42855L20.1007 10.9147C20.9405 11.3945 20.9405 12.6054 20.1007 13.0853L14 16.5714L7.87017 20.0742C7.03685 20.5503 6 19.9486 6 18.9889V12Z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="bunny-player__time">
                      <p data-player-time-progress="" className="bunny-player__text">
                        00:00
                      </p>
                      <p className="bunny-player__text is--transparent">
                        /
                      </p>
                      <p data-player-time-duration="" className="bunny-player__text is--transparent">
                        00:36
                      </p>
                    </div>
                    <div data-player-timeline="" className="bunny-player__timeline">
                      <div className="bunny-player__timeline-bar">
                        <div className="bunny-player__timeline-bg" />
                        <div data-player-buffered="" className="bunny-player__timeline-buffered" />
                        <div data-player-progress="" className="bunny-player__timeline-progress" />
                      </div>
                      <div data-player-timeline-handle="" className="bunny-player__timeline-handle" />
                    </div>
                    <div className="bunny-player__interface-btns">
                      <div data-player-control="mute" className="bunny-player__toggle-mute">
                        <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__volume-up-svg" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 8.99998V15H7L12 20V3.99998L7 8.99998H3ZM16.5 12C16.5 10.23 15.48 8.70998 14 7.96998V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.22998V5.28998C16.89 6.14998 19 8.82998 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.71998 18.01 4.13998 14 3.22998Z" fill="currentColor" />
                        </svg>
                        <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__volume-mute-svg" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.45 14 18.7V20.76C15.38 20.45 16.63 19.81 17.69 18.95L19.73 21L21 19.73L12 10.73L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z" fill="currentColor" />
                        </svg>
                      </div>
                      <div data-player-control="fullscreen" className="bunny-player__toggle-fullscreen">
                        <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__fullscreen-scale-svg" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="14" width="2" height="7" fill="currentColor" />
                          <rect x="3" y="3" width="2" height="7" fill="currentColor" />
                          <rect x="19" y="3" width="2" height="7" fill="currentColor" />
                          <rect x="19" y="14" width="2" height="7" fill="currentColor" />
                          <rect x="3" y="19" width="7" height="2" fill="currentColor" />
                          <rect x="14" y="19" width="7" height="2" fill="currentColor" />
                          <rect x="3" y="3" width="7" height="2" fill="currentColor" />
                          <rect x="14" y="3" width="7" height="2" fill="currentColor" />
                        </svg>
                        <svg width="100%" viewBox="0 0 24 24" fill="none" className="bunny-player__fullscreen-shrink-svg" xmlns="http://www.w3.org/2000/svg">
                          <rect x="7" y="2" width="2" height="7" fill="currentColor" />
                          <rect x="15" y="2" width="2" height="7" fill="currentColor" />
                          <rect x="15" y="15" width="2" height="7" fill="currentColor" />
                          <rect x="8" y="15" width="2" height="7" fill="currentColor" />
                          <rect x="2" y="7" width="7" height="2" fill="currentColor" />
                          <rect x="3" y="15" width="7" height="2" fill="currentColor" />
                          <rect x="15" y="7" width="7" height="2" fill="currentColor" />
                          <rect x="15" y="15" width="7" height="2" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bunny-player__loading">
                  <svg version="1.1" id="L9" x="0px" y="0px" viewBox="0 0 100 100" width="100%" fill="none" className="bunny-player__loading-svg vimeo-player__loading-svg" xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve">
                    <path fill="currentColor" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
                      <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 50 50" to="360 50 50" repeatCount="indefinite" />
                    </path>
                  </svg>
                </div>
              </div>
              <video muted playsInline autoPlay loop className="note__video__vector">
                <source src="/media/69099e284d23967d9c1ea30e_video_note-transcode.webm" className="source" />
                <source src="/media/69099e284d23967d9c1ea30e_video_note-transcode.mp4" />
              </video>
            </div>
            <div className="note__texts">
              <div className="note__title">
                <div className="description note__descr" aria-label="Why we built ContextLock">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      W
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      w
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      b
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      u
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      x
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      c
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      k
                    </div>
                  </div>
                </div>
              </div>
              <div className="note__descr note__descr__parags">
                <p className="parag note__parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                  This page isn’t a pitch.
                  <span className="note__parag__bold">
                    It’s the argument behind the product.
                  </span>
                  <br />
                  ‍
                  <br />
                  We kept seeing the same shape of failure. An agent is given a key so it can move quickly, told carefully what it may and may not do, and then trusted to keep obeying that instruction — against every input it will ever read, from anyone who can reach it.
                  <br />
                  <br />
                  That is not a security model. It is a hope, written in the same channel an attacker gets to write in. The model is not the problem: it does exactly what it is told, by whoever is doing the telling.
                  <br />
                  Obedience is the vulnerability.
                  <br />
                  <br />
                  If you take one thought from this, let it be this:
                  <br />
                  <span className="note__parag__bold">
                    A boundary the agent can reinterpret is not a boundary.
                  </span>
                  <br />
                  Authority has to live somewhere the model cannot argue with it — a policy layer that evaluates every action and refuses most of them. Thanks for reading this far.
                  <br />
                  ‍
                  <br />
                  <span className="note__parag__serif">
                    Give it authority. Never give it keys.
                    <br />
                    ‍
                    <br />
                    — The ContextLock team
                  </span>
                </p>
              </div>
              <ul role="list" className="note__list w-list-unstyled">
                <li className="note__list__each">
                  <a href="https://vwlab.io/products/memorable-web-experience" target="_blank" className="note__list__a lined w-inline-block">
                    <div className="subtitle is-subt">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text note__role" aria-label="DESIGN, DEVELOPMENT, 3D ASSETS:">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            D
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            G
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            N
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            ,
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            D
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            V
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            O
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            P
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            M
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            N
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            ,
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            3
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            D
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            A
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            :
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="subtitle is-subt">
                      <div className="subtitle__text note__credit" aria-label="VICTOR WORK">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            V
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            C
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            O
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            W
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            O
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            K
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
              <a href="#" className="note__texts__cta w-inline-block" />
            </div>
            <div className="note__close">
              <div className="note__close__text">
                Close
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="pattern" />
      {/* Narration elements kept but sourceless: the engine looks them up
          by data-audio and calls play() on the match, so removing them
          would throw. With no <source> they are silent. */}
      <div className="audios">
        <audio muted data-audio="wont_rest" className="audio-chapter audio__wont-rest">
        </audio>
        <audio muted data-audio="sleep_maint" className="audio-chapter audio__wont-rest">
        </audio>
        <audio muted data-audio="its_preparation" className="audio-chapter audio__its_preparation">
        </audio>
        <audio muted data-audio="mind_logoff" className="audio-chapter audio__mind_logoff">
        </audio>
        <audio muted data-audio="overheat" className="audio-chapter audio__overheat">
        </audio>
        <audio muted data-audio="cant_dream" className="audio-chapter audio__cant_dream">
        </audio>
      </div>
      <canvas className="webgl" data-engine="three.js r180" width="2130" height="1420" style={{ "touchAction": "none", "width": "1065px", "height": "710px" } as React.CSSProperties} />
      <div className="insights" style={{ "opacity": "0", "visibility": "hidden" } as React.CSSProperties}>
        <div className="insights__hold">
          <div className="insights__fader" />
          <div className="insights__-content">
            <div className="insights__counter">
              <div className="insights__counter__svg w-embed">
                <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                  <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                </svg>
              </div>
              <div className="insights__counter__numbers">
                <div className="insights__counter__dyna">
                  00
                </div>
                <div className="insights__counter__static">
                  / 06
                </div>
              </div>
            </div>
            <div className="insights__insight">
              <div className="insights__insight__text">
                “Your agent isn’t malicious. It’s obedient.”
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="insigh-pannel" style={{ "opacity": "1" } as React.CSSProperties}>
        <div className="insigh-pannel__hold">
          <div className="insights__text">
            Find the hidden Insights
          </div>
          <ul role="list" className="insights__indic-lis w-list-unstyled">
            <li data-insi-indic="its_preparation" className="insigh-pannel__each">
              <div className="insights__active-bg" />
              <div className="insigh-pannel__each__index">
                1
                <br />
              </div>
              <div className="insights__dot" />
            </li>
            <li data-insi-indic="wont_rest" className="insigh-pannel__each">
              <div className="insights__active-bg" />
              <div className="insigh-pannel__each__index">
                2
              </div>
              <div className="insights__dot" />
            </li>
            <li data-insi-indic="cant_dream" className="insigh-pannel__each">
              <div className="insights__active-bg" />
              <div className="insigh-pannel__each__index">
                3
                <br />
              </div>
              <div className="insights__dot" />
            </li>
            <li data-insi-indic="overheat" className="insigh-pannel__each">
              <div className="insights__active-bg" />
              <div className="insigh-pannel__each__index">
                4
              </div>
              <div className="insights__dot" />
            </li>
            <li data-insi-indic="mind_logoff" className="insigh-pannel__each">
              <div className="insights__active-bg" />
              <div className="insigh-pannel__each__index">
                5
              </div>
              <div className="insights__dot" />
            </li>
            <li data-insi-indic="sleep_maint" className="insigh-pannel__each">
              <div className="insights__active-bg" />
              <div className="insigh-pannel__each__index">
                6
              </div>
              <div className="insights__dot" />
            </li>
          </ul>
        </div>
      </div>
      <div className="hero is-hero">
        <div className="hero__hold">
          <div className="hero__content" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "0.9919", "transform": "translate3d(0px, 0.651vh, 0px)" } as React.CSSProperties}>
            <div className="hero__subt" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
              <div className="hero__subt__wrap">
                <div className="hero__subt__dot" />
                <div className="hero__subt__text">
                  GIVE AI AUTHORITY , NOT KEYS
                </div>
                <div className="hero__subt__dot" />
              </div>
            </div>
            <div className="hero__title">
              <h1 className="hero__title__h1" style={{ "--mask": "linear-gradient(-15deg, transparent 0%, black 0%)" } as React.CSSProperties}>
                CTX
              </h1>
              <h1 className="hero__title__h1" style={{ "--mask": "linear-gradient(-15deg, transparent 0%, black 0%)" } as React.CSSProperties}>
                LOCK
              </h1>
            </div>
            {/*
              The way into the product. The page had no route to /projects at
              all — every link went to the original author's site — so a visitor
              could read the whole story and never find the thing it is about.

              Its own class, added as a child of .hero__content: the Three.js
              bundle animates that wrapper as a whole and only reads
              .hero__title__h1, .hero__subt and .hero__scroll by name, so a new
              sibling is safe.
            */}
            <div className="cl-hero-cta">
              <a href="/projects?connect=1" className="cl-hero-cta__primary">
                Enter Studio
              </a>
              <a href="#introduction" className="cl-hero-cta__secondary">
                See how it works
              </a>
            </div>

            <div className="hero__scroll" style={{ "opacity": "0.9654" } as React.CSSProperties}>
              <div className="hero__scroll__wrap">
                <div className="hero__scroll__dot">
                  <div className="hero__scroll__svg w-embed">
                    <svg width="100%" viewBox="0 0 24 24" className="icon glyph" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm3.71,9.71-3,3a1,1,0,0,1-1.42,0l-3-3a1,1,0,0,1,1.42-1.42L12,12.59l2.29-2.3a1,1,0,0,1,1.42,1.42Z" style={{ "fill": "var(--color-medium)" } as React.CSSProperties} />
                    </svg>
                  </div>
                </div>
                <div className="hero__scroll__text">
                  Scroll to Explore
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="introduction" id="introduction">
        <div className="introduction__hold">
          <div className="introduction__index">
            <div className="section-index">
              <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                  <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                </svg>
              </div>
              <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                01
              </div>
            </div>
          </div>
          <div className="introduction__subt">
            <div className="subtitle">
              <div className="subtitle__dot" />
              <div className="subtitle__text" aria-label="A PROMPT IS NOT A PERMISSION">
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    A
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    P
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    R
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    O
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    M
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    P
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    I
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    S
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    N
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    O
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    A
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    P
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    E
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    R
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    M
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    I
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    S
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    S
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    I
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    O
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    N
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="introduction__descr">
            <div className="description intro-descr" aria-label="Told to behave, an agent behaves — until something else does the telling. One injected instruction, one stale price, one confused tool call, and the transaction is already signed. “Your agent isn’t malicious. It’s obedient.”">
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  T
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  b
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  h
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  v
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ,
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  g
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  b
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  h
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  v
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  —
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  u
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  m
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  h
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  g
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  h
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  g
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  .
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  O
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  j
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  r
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  u
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ,
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  p
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  r
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ,
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  f
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  u
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ,
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  h
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  r
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  r
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  y
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  g
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  .
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  “
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  Y
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  u
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  r
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  g
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ’
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  m
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  a
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  l
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  c
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  u
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  .
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  I
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ’
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  s
                </div>
              </div>
              <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  o
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  b
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  d
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  i
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  e
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  n
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  t
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  .
                </div>
                <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                  ”
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="stats section-reboot section-blue">
        <div className="stats__top-decor w-embed">
          <svg width="100%" viewBox="0 0 1920 586" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M960.25 40C390.5 40 0 286 0 286V585.5H1920.5V286C1920.5 286 1530 40 960.25 40Z" fill="var(--dark-blue)" />
            <path className="path-stats-opac" d="M0 247C0 247 390.5 1 960.25 1C1530 1 1920.5 247 1920.5 247" stroke="var(--color-soft)" strokeWidth="2" />
            <path className="path-stats-solid" d="M0 247C0 247 390.5 1 960.25 1C1530 1 1920.5 247 1920.5 247" stroke="#0042af" strokeWidth="2" />
          </svg>
        </div>
        <div className="stats__hold">
          <div className="onclock__spiral stats__spiral">
            <div className="onclock__pendulum__svg onclock__lines__solid status__pendulum__svg w-embed">
              <svg width="100%" viewBox="0 0 2065 1439" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="stats__solid" d="M1032.29 0.0045166C1028.38 427.821 684.394 867.645 0.320312 1438.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1800.86", "strokeDasharray": "19.4368px, 1801.75px" } as React.CSSProperties} />
                <path className="stats__solid" d="M1032.3 0.0045166C1030.19 423.694 813.679 877.535 419.133 1437.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1552.2", "strokeDasharray": "19.8569px, 1566.58px" } as React.CSSProperties} />
                <path className="stats__solid" d="M1032.21 0.504517C1028.54 422.856 933.91 864.174 748.32 1438.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1415.67", "strokeDasharray": "29.8792px, 1441.71px" } as React.CSSProperties} />
                <path className="stats__solid" d="M1032.43 0.504517C1036.1 422.856 1130.73 864.174 1316.32 1438.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1379.77", "strokeDasharray": "47.8803px, 1423.71px" } as React.CSSProperties} />
                <path className="stats__solid" d="M1032.32 0.0045166V1436.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1297.23", "strokeDasharray": "74.5391px, 1362.06px" } as React.CSSProperties} />
                <path className="stats__solid" d="M1032.34 0.0045166C1034.45 423.694 1246.09 878.535 1640.63 1438.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1356.64", "strokeDasharray": "119.421px, 1466.09px" } as React.CSSProperties} />
                <path className="stats__solid" d="M1032.35 0.0045166C1036.26 427.821 1380.25 867.645 2064.32 1438.5" stroke="var(--soft)" style={{ "strokeDashoffset": "-1443.79", "strokeDasharray": "201.944px, 1619.25px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.29 0.0045166C1028.38 427.821 684.394 867.645 0.320312 1438.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1821.09px, 0.1px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.3 0.0045166C1030.19 423.694 813.679 877.535 419.133 1437.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1586.33px, 0.1px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.21 0.504517C1028.54 422.856 933.91 864.174 748.32 1438.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1471.49px, 0.1px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.43 0.504517C1036.1 422.856 1130.73 864.174 1316.32 1438.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1471.49px, 0.1px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.32 0.0045166V1436.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1436.5px, 0.1px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.34 0.0045166C1034.45 423.694 1246.09 878.535 1640.63 1438.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1585.41px, 0.1px" } as React.CSSProperties} />
                <path className="stats__opac__line" d="M1032.35 0.0045166C1036.26 427.821 1380.25 867.645 2064.32 1438.5" stroke="var(--color-soft)" strokeOpacity="0.5" style={{ "strokeDashoffset": "0", "strokeDasharray": "1821.09px, 0.1px" } as React.CSSProperties} />
              </svg>
            </div>
            <div className="onclock__spiral__center stats__spiral__center__pattern">
              <img src="/assets/68fcf9490b2a28caaa0e59c6_tunnel_texture.webp" loading="lazy" alt="" />
            </div>
          </div>
          <div className="stats__lines-decor" />
          <div data-anima="texts" className="stats__text">
            <div className="stats__text__serif">
              <div className="title_serif" aria-label="Verifying">
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    V
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    f
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    y
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    g
                  </div>
                </div>
              </div>
            </div>
            <div className="stats__text__sans">
              <div className="title_sans" aria-label="The inputs.">
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    p
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                </div>
              </div>
            </div>
            <div data-anima="parag" className="stats__text__parag">
              <p className="small-parag" style={{ "opacity": "1" } as React.CSSProperties}>
                Verified Chainlink rounds in. Chainlink CRE around the run. Inputs you can re-check, not just trust.
              </p>
            </div>
          </div>
          <div className="stats__stats">
            <div className="stats_stats__pattern" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
              <img src="/assets/68fcf9490b2a28caaa0e59c6_tunnel_texture.webp" loading="lazy" sizes="100vw" srcSet="/assets/68fcf9490b2a28caaa0e59c6_tunnel_texture-p-500.webp 500w, /assets/68fcf9490b2a28caaa0e59c6_tunnel_texture-p-800.webp 800w, /assets/68fcf9490b2a28caaa0e59c6_tunnel_texture-p-1080.webp 1080w, /assets/68fcf9490b2a28caaa0e59c6_tunnel_texture.webp 1232w" alt="" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties} />
            </div>
            <div className="stats_stats__solid" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties} />
            <div className="stats_stats__border" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties} />
            <ul role="list" className="stats__stats__ul w-list-unstyled" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
              <li className="stats__stats__li">
                <div className="stats__stats__number" aria-label="00s" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      0
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      0
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                  </div>
                </div>
              </li>
              <li className="stats__stats__li">
                <div className="stats__stats__number" aria-label="09s" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 95%)" } as React.CSSProperties}>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      0
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      9
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                  </div>
                </div>
              </li>
              <li className="stats__stats__li">
                <div className="stats__stats__number" aria-label="60s" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 190%)" } as React.CSSProperties}>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      6
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      0
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <div className="stats__stats__minimum">
              {/*
                Inlined rather than <img src="/media/Chainlink.svg">: the source
                file is filled #0847F7, which on this blue ground would be very
                nearly invisible. Inline, the path takes --soft and reads the
                way the ring's own type does.
              */}
              <svg
                className="cl-stats-mark"
                /* Tightened to the path's own bounds. The source file is
                   385x317 but the hexagon only spans x 147-237, y 107-210 —
                   roughly a quarter of the canvas — so the rest was empty
                   padding making the mark render far smaller than its box. */
                viewBox="147 107 91 104"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Chainlink"
              >
                <path
                  d="M192.335 107.486L147.668 133.154V184.492L192.335 210.161L237.001 184.492V133.154L192.335 107.486ZM218.078 173.613L192.343 188.402L166.607 173.613V144.034L192.343 129.245L218.078 144.034V173.613Z"
                  fill="var(--soft)"
                />
              </svg>
            </div>
          </div>
          <div data-anima="parag" className="stats__subt">
            <div className="subtitle">
              <div className="subtitle__dot" />
              <div className="subtitle__text importance__text" aria-label="KEYS - THE SHORTCUT TRAP">
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    K
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    E
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    Y
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    S
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    -
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    H
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    E
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    S
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    H
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    O
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    R
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    C
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    U
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    T
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    R
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    A
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    P
                  </div>
                </div>
              </div>
            </div>
            <p className="parag importance__text" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
              A key promises speed and removes the one place a mistake could be stopped.
            </p>
          </div>
        </div>
      </section>
      {/*
        Retired scene. The node has to stay: the engine does
        querySelector(".scene-tunnel").previousElementSibling, and a null there
        throws and takes the whole 3D runtime down with it. Hidden in CSS
        instead, which also drops its scroll height so the section is gone from
        the page.
      */}
      <div className="spacer-fs scene-tunnel">
        <div className="scene-tunnel__hold">
          <div className="title_serif title_serif__tunnel" style={{ "opacity": "0" } as React.CSSProperties}>
            Built on proof
          </div>
        </div>
      </div>
      <section className="importance section-blue">
        <div className="importance__hold">
          <div className="importance__top">
            <div className="importance__index">
              <div className="section-index">
                <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                    <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
                <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                  02
                </div>
              </div>
            </div>
            <div data-anima="texts" className="importance__title">
              <div className="importance__title__serif">
                <div className="title_serif" aria-label="The importance">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      m
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      p
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      c
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                </div>
              </div>
              <div className="importance__title__sans">
                <div className="title_sans" aria-label="of the right limit.">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      f
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      g
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      m
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      .
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="importance__beats">
            <div className="importance__beats__svg importance__beats__svg__solid w-embed">
              <svg width="100%" viewBox="0 0 1920 507" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1_10)">
                  <path d="M1920 250.4H1274.6L1274.2 251.3C1271.8 256.4 1265.9 256.2 1263.8 250.9L1263.4 250C1257.9 238.4 1254.8 239.3 1251.8 250C1248.8 260 1245.7 279.9 1239.2 291.3C1232.6 302.7 1229.1 281.2 1225.6 250.1C1222.1 219.6 1218.5 179.5 1211.1 168.5C1203.6 157.5 1199.7 199.2 1195.8 250C1191.9 300.2 1187.9 359.6 1179.8 370C1171.6 380.3 1167.4 319.4 1163.1 250.1C1158.8 181.3 1154.6 104.1 1145.9 94.6001C1137.1 85.2001 1132.6 163.8 1128.2 250C1123.7 335.6 1119.2 428.8 1110.1 437.1C1100.9 445.2 1096.3 350.9 1091.6 250.1C1086.9 149.8 1082.3 43.0001 1072.9 36.2001C1063.5 29.6001 1058.8 137.3 1054 250C1049.3 362.4 1044.5 479.8 1035 484.8C1025.5 489.7 1020.8 371.6 1016 250C1011.3 128.7 1006.5 4.00007 997.1 1.00007C978.4 -5.29993 978.3 503.3 959.9 505.4C941.5 503.3 941.5 -5.39993 922.7 1.00007C913.3 4.00007 908.6 128.7 903.8 250C899.1 371.5 894.3 489.6 884.8 484.8C875.3 479.8 870.6 362.4 865.8 250C861.1 137.3 856.3 29.6001 846.9 36.2001C837.5 43.0001 832.8 149.7 828.2 250.1C823.6 350.9 818.9 445.2 809.7 437.1C800.5 428.9 796.1 335.7 791.6 250C787.1 163.9 782.6 85.2001 773.9 94.6001C765.2 104 760.9 181.3 756.7 250.1C752.5 319.4 748.2 380.3 740 370C731.8 359.6 727.9 300.2 724 250C720.1 199.2 716.2 157.5 708.7 168.5C701.3 179.5 697.7 219.7 694.2 250.1C690.7 281.2 687.2 302.7 680.6 291.3C674.1 279.9 671 260 668 250C665 239.3 662 238.5 656.4 250L656 250.9C653.8 256.2 648 256.4 645.6 251.3L645.2 250.4H0" stroke="var(--color)" strokeWidth="2" strokeMiterlimit="10" style={{ "strokeDashoffset": "-5691.66", "strokeDasharray": "758.799px, 6355.09px" } as React.CSSProperties} />
                </g>
                <defs>
                  <clipPath id="clip0_1_10">
                    <rect width="1920" height="506.5" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="importance__beats__svg importance__beats__svg__opac w-embed">
              <svg width="100%" viewBox="0 0 1920 507" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1_10)">
                  <path d="M1920 250.4H1274.6L1274.2 251.3C1271.8 256.4 1265.9 256.2 1263.8 250.9L1263.4 250C1257.9 238.4 1254.8 239.3 1251.8 250C1248.8 260 1245.7 279.9 1239.2 291.3C1232.6 302.7 1229.1 281.2 1225.6 250.1C1222.1 219.6 1218.5 179.5 1211.1 168.5C1203.6 157.5 1199.7 199.2 1195.8 250C1191.9 300.2 1187.9 359.6 1179.8 370C1171.6 380.3 1167.4 319.4 1163.1 250.1C1158.8 181.3 1154.6 104.1 1145.9 94.6001C1137.1 85.2001 1132.6 163.8 1128.2 250C1123.7 335.6 1119.2 428.8 1110.1 437.1C1100.9 445.2 1096.3 350.9 1091.6 250.1C1086.9 149.8 1082.3 43.0001 1072.9 36.2001C1063.5 29.6001 1058.8 137.3 1054 250C1049.3 362.4 1044.5 479.8 1035 484.8C1025.5 489.7 1020.8 371.6 1016 250C1011.3 128.7 1006.5 4.00007 997.1 1.00007C978.4 -5.29993 978.3 503.3 959.9 505.4C941.5 503.3 941.5 -5.39993 922.7 1.00007C913.3 4.00007 908.6 128.7 903.8 250C899.1 371.5 894.3 489.6 884.8 484.8C875.3 479.8 870.6 362.4 865.8 250C861.1 137.3 856.3 29.6001 846.9 36.2001C837.5 43.0001 832.8 149.7 828.2 250.1C823.6 350.9 818.9 445.2 809.7 437.1C800.5 428.9 796.1 335.7 791.6 250C787.1 163.9 782.6 85.2001 773.9 94.6001C765.2 104 760.9 181.3 756.7 250.1C752.5 319.4 748.2 380.3 740 370C731.8 359.6 727.9 300.2 724 250C720.1 199.2 716.2 157.5 708.7 168.5C701.3 179.5 697.7 219.7 694.2 250.1C690.7 281.2 687.2 302.7 680.6 291.3C674.1 279.9 671 260 668 250C665 239.3 662 238.5 656.4 250L656 250.9C653.8 256.2 648 256.4 645.6 251.3L645.2 250.4H0" stroke="var(--color-soft)" strokeOpacity="0.5" strokeWidth="2" strokeMiterlimit="10" style={{ "strokeDashoffset": "0", "strokeDasharray": "7113.79px, 0.1px" } as React.CSSProperties} />
                </g>
                <defs>
                  <clipPath id="clip0_1_10">
                    <rect width="1920" height="506.5" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div className="importance__bottom">
            <div data-anima="parag" className="importance__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text importance__text" aria-label="THE CEILING WITHIN">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      W
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag importance__text" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Under the limit, it acts. Over the limit, a human decides. Over the ceiling, it is refused — whatever the model believes.
              </p>
            </div>
            <div data-anima="parag" className="importance__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="NO CEILING = NO BOUND">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      =
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      B
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Ten permitted actions of $900 is $9,000. Every one passed the per-action check.
                <em>
                  A window is what stops correct decisions compounding.
                </em>
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="spacer-fs scene-woman" />
      <section className="onclock section-blue">
        <div className="onclock__hold">
          <div className="onclock__top">
            <div className="onclock__index">
              <div className="section-index">
                <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                    <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
                <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                  03
                </div>
              </div>
            </div>
            <div className="onclock__title">
              <div data-anima="texts" className="onclock__title__serif">
                <div className="title_serif" aria-label="Be on the Hook.">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      B
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      k
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      .
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="onclock__spiral__wrapper">
            <div className="onclock__spiral onclock__spiral__original">
              <div className="onclock__pendulum__svg onclock__lines__solid w-embed">
                <svg width="100%" viewBox="0 0 1324 1787" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.320557 0C881.654 677.095 881.654 1073.18 0.320557 1809" stroke="var(--white)" strokeOpacity="1" style={{ "strokeDashoffset": "-2162.9", "strokeDasharray": "79.9385px, 2230.56px" } as React.CSSProperties} />
                  <path d="M280.321 4C788.821 681.358 788.821 1073.5 280.321 1795" stroke="var(--white)" opacity="1" style={{ "strokeDashoffset": "-1783.32", "strokeDasharray": "104.936px, 1874.54px" } as React.CSSProperties} />
                  <path d="M479.321 0C722.321 662 722.321 1058.08 479.321 1809" stroke="var(--white)" strokeOpacity="1" style={{ "strokeDashoffset": "-1581.43", "strokeDasharray": "146.473px, 1707.86px" } as React.CSSProperties} />
                  <path d="M661.321 3.5V1788.5" stroke="var(--white)" strokeOpacity="1" style={{ "strokeDashoffset": "-1408.55", "strokeDasharray": "197.124px, 1587.98px" } as React.CSSProperties} />
                  <path d="M843.696 0C600.696 662 600.696 1058.08 843.696 1809" stroke="var(--white)" strokeOpacity="1" style={{ "strokeDashoffset": "-1310.14", "strokeDasharray": "292.127px, 1562.21px" } as React.CSSProperties} />
                  <path d="M1042.7 4C534.196 681.358 534.196 1073.5 1042.7 1795" stroke="var(--white)" strokeOpacity="1" style={{ "strokeDashoffset": "-1191.35", "strokeDasharray": "411.355px, 1568.13px" } as React.CSSProperties} />
                  <path d="M1322.7 0C441.362 677.095 441.362 1073.18 1322.7 1809" stroke="var(--white)" strokeOpacity="1" style={{ "strokeDashoffset": "-1089.15", "strokeDasharray": "655.692px, 1654.81px" } as React.CSSProperties} />
                </svg>
              </div>
              <div className="onclock__pendulum__svg onclock__lines__opac w-embed">
                <svg width="100%" viewBox="0 0 1324 1787" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.320557 0C881.654 677.095 881.654 1073.18 0.320557 1809" stroke="var(--color-soft)" strokeOpacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "2310.4px, 0.1px" } as React.CSSProperties} />
                  <path d="M280.321 4C788.821 681.358 788.821 1073.5 280.321 1795" stroke="var(--color-soft)" opacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "1979.38px, 0.1px" } as React.CSSProperties} />
                  <path d="M479.321 0C722.321 662 722.321 1058.08 479.321 1809" stroke="var(--color-soft)" strokeOpacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "1854.24px, 0.1px" } as React.CSSProperties} />
                  <path d="M661.321 3.5V1788.5" stroke="var(--color-soft)" strokeOpacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "1785px, 0.1px" } as React.CSSProperties} />
                  <path d="M843.696 0C600.696 662 600.696 1058.08 843.696 1809" stroke="var(--color-soft)" strokeOpacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "1854.24px, 0.1px" } as React.CSSProperties} />
                  <path d="M1042.7 4C534.196 681.358 534.196 1073.5 1042.7 1795" stroke="var(--color-soft)" strokeOpacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "1979.38px, 0.1px" } as React.CSSProperties} />
                  <path d="M1322.7 0C441.362 677.095 441.362 1073.18 1322.7 1809" stroke="var(--color-soft)" strokeOpacity="0.35" style={{ "strokeDashoffset": "0", "strokeDasharray": "2310.41px, 0.1px" } as React.CSSProperties} />
                </svg>
              </div>
              {/*
                Inlined rather than <img src="/media/LEDGER.svg">: the file is
                filled black, which is invisible on this ground. Inline, the
                path takes --soft like every other mark on the page.
              */}
              <div className="onclock__spiral__center cl-ledger-center">
                <svg
                  className="cl-ledger"
                  viewBox="0 0 383 128"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Ledger"
                >
                  <path d="M327.262 119.94V127.998H382.57V91.6548H374.511V119.94H327.262ZM327.262 0V8.05844H374.511V36.3452H382.57V0H327.262ZM298.74 62.3411V43.6158H311.382C317.546 43.6158 319.758 45.6696 319.758 51.2803V54.5982C319.758 60.3657 317.624 62.3411 311.382 62.3411H298.74ZM318.808 65.6589C324.575 64.1578 328.604 58.7842 328.604 52.3856C328.604 48.3564 327.025 44.7211 324.023 41.7972C320.23 38.1619 315.172 36.3452 308.615 36.3452H290.838V91.6529H298.74V69.6097H310.592C316.675 69.6097 319.125 72.1378 319.125 78.4599V91.6548H327.184V79.7239C327.184 71.0325 325.13 67.7147 318.808 66.7662V65.6589ZM252.282 67.4756H276.618V60.207H252.282V43.6139H278.988V36.3452H244.222V91.6529H280.173V84.3842H252.282V67.4756ZM225.812 70.3995V74.1916C225.812 82.1717 222.888 84.78 215.541 84.78H213.803C206.454 84.78 202.899 82.4088 202.899 71.4264V56.5717C202.899 45.5109 206.613 43.2181 213.96 43.2181H215.539C222.73 43.2181 225.021 45.9048 225.099 53.3322H233.791C233.001 42.4283 225.732 35.5555 214.828 35.5555C209.535 35.5555 205.11 37.2153 201.792 40.3745C196.814 45.0367 194.049 52.9383 194.049 63.9991C194.049 74.6659 196.42 82.5675 201.318 87.4649C204.636 90.7044 209.219 92.4426 213.723 92.4426C218.463 92.4426 222.81 90.5456 225.021 86.438H226.126V91.6529H233.395V63.1309H211.983V70.3995H225.812ZM156.126 43.6139H164.739C172.878 43.6139 177.303 45.6677 177.303 56.7304V71.2677C177.303 82.3285 172.878 84.3842 164.739 84.3842H156.126V43.6139ZM165.449 91.6548C180.541 91.6548 186.149 80.1982 186.149 64.001C186.149 47.5666 180.145 36.3471 165.29 36.3471H148.223V91.6548H165.449ZM110.063 67.4756H134.399V60.207H110.063V43.6139H136.768V36.3452H102.002V91.6529H137.954V84.3842H110.063V67.4756ZM63.4464 36.3452H55.3879V91.6529H91.7332V84.3842H63.4464V36.3452ZM0 91.6548V128H55.3076V119.94H8.05844V91.6548H0ZM0 0V36.3452H8.05844V8.05844H55.3076V0H0Z" fill="var(--soft)" />
                </svg>
              </div>
              <ul role="list" className="onclock__words w-list-unstyled">
                <li className="onclock__word" style={{ "--_rest": "rotate(0rad) translate(0, -340.8px) rotate(0rad)", "transform": "translate(-50%, -50%) rotate(0rad) translate(0px, -340.8px) rotate(0rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(0.2617993877991494rad) translate(0, -340.8px) rotate(-0.2617993877991494rad)", "transform": "translate(-50%, -50%) rotate(0.261799rad) translate(0px, -340.8px) rotate(-0.261799rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(0.5235987755982988rad) translate(0, -340.8px) rotate(-0.5235987755982988rad)", "transform": "translate(-50%, -50%) rotate(0.523599rad) translate(0px, -340.8px) rotate(-0.523599rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    CHECK
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(0.7853981633974483rad) translate(0, -340.8px) rotate(-0.7853981633974483rad)", "transform": "translate(-50%, -50%) rotate(0.785398rad) translate(0px, -340.8px) rotate(-0.785398rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(1.0471975511965976rad) translate(0, -340.8px) rotate(-1.0471975511965976rad)", "transform": "translate(-50%, -50%) rotate(1.0472rad) translate(0px, -340.8px) rotate(-1.0472rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    DENY
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(1.3089969389957472rad) translate(0, -340.8px) rotate(-1.3089969389957472rad)", "transform": "translate(-50%, -50%) rotate(1.309rad) translate(0px, -340.8px) rotate(-1.309rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(1.5707963267948966rad) translate(0, -340.8px) rotate(-1.5707963267948966rad)", "transform": "translate(-50%, -50%) rotate(1.5708rad) translate(0px, -340.8px) rotate(-1.5708rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    CHECK
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(1.8325957145940461rad) translate(0, -340.8px) rotate(-1.8325957145940461rad)", "transform": "translate(-50%, -50%) rotate(1.8326rad) translate(0px, -340.8px) rotate(-1.8326rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(2.0943951023931953rad) translate(0, -340.8px) rotate(-2.0943951023931953rad)", "transform": "translate(-50%, -50%) rotate(2.0944rad) translate(0px, -340.8px) rotate(-2.0944rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(2.356194490192345rad) translate(0, -340.8px) rotate(-2.356194490192345rad)", "transform": "translate(-50%, -50%) rotate(2.35619rad) translate(0px, -340.8px) rotate(-2.35619rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    ESCALATE
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(2.6179938779914944rad) translate(0, -340.8px) rotate(-2.6179938779914944rad)", "transform": "translate(-50%, -50%) rotate(2.61799rad) translate(0px, -340.8px) rotate(-2.61799rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(2.8797932657906435rad) translate(0, -340.8px) rotate(-2.8797932657906435rad)", "transform": "translate(-50%, -50%) rotate(2.87979rad) translate(0px, -340.8px) rotate(-2.87979rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    CHECK
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(3.141592653589793rad) translate(0, -340.8px) rotate(-3.141592653589793rad)", "transform": "translate(-50%, -50%) rotate(3.14159rad) translate(0px, -340.8px) rotate(-3.14159rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    ALLOW
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(3.4033920413889422rad) translate(0, -340.8px) rotate(-3.4033920413889422rad)", "transform": "translate(-50%, -50%) rotate(3.40339rad) translate(0px, -340.8px) rotate(-3.40339rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(3.6651914291880923rad) translate(0, -340.8px) rotate(-3.6651914291880923rad)", "transform": "translate(-50%, -50%) rotate(3.66519rad) translate(0px, -340.8px) rotate(-3.66519rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(3.9269908169872414rad) translate(0, -340.8px) rotate(-3.9269908169872414rad)", "transform": "translate(-50%, -50%) rotate(3.92699rad) translate(0px, -340.8px) rotate(-3.92699rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    DENY
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(4.1887902047863905rad) translate(0, -340.8px) rotate(-4.1887902047863905rad)", "transform": "translate(-50%, -50%) rotate(4.18879rad) translate(0px, -340.8px) rotate(-4.18879rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    CHECK
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(4.4505895925855405rad) translate(0, -340.8px) rotate(-4.4505895925855405rad)", "transform": "translate(-50%, -50%) rotate(4.45059rad) translate(0px, -340.8px) rotate(-4.45059rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(4.71238898038469rad) translate(0, -340.8px) rotate(-4.71238898038469rad)", "transform": "translate(-50%, -50%) rotate(4.71239rad) translate(0px, -340.8px) rotate(-4.71239rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(4.974188368183839rad) translate(0, -340.8px) rotate(-4.974188368183839rad)", "transform": "translate(-50%, -50%) rotate(4.97419rad) translate(0px, -340.8px) rotate(-4.97419rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    ESCALATE
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(5.235987755982989rad) translate(0, -340.8px) rotate(-5.235987755982989rad)", "transform": "translate(-50%, -50%) rotate(5.23599rad) translate(0px, -340.8px) rotate(-5.23599rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(5.497787143782138rad) translate(0, -340.8px) rotate(-5.497787143782138rad)", "transform": "translate(-50%, -50%) rotate(5.49779rad) translate(0px, -340.8px) rotate(-5.49779rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    CHECK
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(5.759586531581287rad) translate(0, -340.8px) rotate(-5.759586531581287rad)", "transform": "translate(-50%, -50%) rotate(5.75959rad) translate(0px, -340.8px) rotate(-5.75959rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    READ
                  </div>
                </li>
                <li className="onclock__word" style={{ "--_rest": "rotate(6.021385919380437rad) translate(0, -340.8px) rotate(-6.021385919380437rad)", "transform": "translate(-50%, -50%) rotate(6.02139rad) translate(0px, -340.8px) rotate(-6.02139rad)" } as React.CSSProperties}>
                  <div className="onclock__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "opacity": "1", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    DENY
                  </div>
                </li>
              </ul>
              <div className="onclock__spiral__boder" />
            </div>
          </div>
          <div className="onclock__bottom">
            <div data-anima="parag" className="onclock__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="WE OVER-PERMISSION OUR AGENTS">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      W
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      V
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      -
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      M
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                One more scope. One more key. One more address. Each is reasonable alone — together they are the whole treasury.
              </p>
            </div>
            <div data-anima="parag" className="encounter__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="THEN WONDER AT THE DRAIN">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      W
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Permission granted for convenience becomes permission nobody remembers granting. “We over-permission our agents. Then wonder why the funds move.”
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="encouter">
        <div className="encouter__hold">
          <div className="encouter__top">
            <div className="encouter__index">
              <div className="section-index">
                <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                    <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
                <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                  04
                </div>
              </div>
            </div>
            <div data-anima="texts" className="encouter__title">
              <div className="encounter__title__serif">
                <div className="title_serif" aria-label="Every agent">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      v
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      g
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                  </div>
                </div>
              </div>
              <div className="encounter__title__sans">
                <div className="title_sans encounter__title__sans__title" aria-label="answers to a name">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      w
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      m
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="encounter__pendulum__wrapper">
            <div className="encounter__pendulum">
              <ul role="list" className="encounter__pendulum__list w-list-unstyled">
                <li className="encounter__pendulum__each">
                  <div className="pendulum__string" />
                  <div className="pendulum__ball">
                    <div className="pendulum__ball__border">
                      <div className="pendulum__ball__img">
                        <svg className="cl-pend-mark cl-pend-mark--chain" viewBox="147 107 91 104" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chainlink"><path d="M192.335 107.486L147.668 133.154V184.492L192.335 210.161L237.001 184.492V133.154L192.335 107.486ZM218.078 173.613L192.343 188.402L166.607 173.613V144.034L192.343 129.245L218.078 144.034V173.613Z" fill="var(--color)" /></svg>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="encounter__pendulum__each">
                  <div className="pendulum__string" />
                  <div className="pendulum__ball">
                    <div className="pendulum__ball__border">
                      <div className="pendulum__ball__img pendulum__ball__img__middle"><img src="/media/ens.png" alt="ENS" className="cl-pend-mark cl-pend-mark--ens" /></div>
                    </div>
                  </div>
                </li>
                <li className="encounter__pendulum__each">
                  <div className="pendulum__string" />
                  <div className="pendulum__ball">
                    <div className="pendulum__ball__border">
                      <div className="pendulum__ball__img">
                        <svg className="cl-pend-mark cl-pend-mark--ledger" viewBox="0 0 383 128" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ledger"><path d="M327.262 119.94V127.998H382.57V91.6548H374.511V119.94H327.262ZM327.262 0V8.05844H374.511V36.3452H382.57V0H327.262ZM298.74 62.3411V43.6158H311.382C317.546 43.6158 319.758 45.6696 319.758 51.2803V54.5982C319.758 60.3657 317.624 62.3411 311.382 62.3411H298.74ZM318.808 65.6589C324.575 64.1578 328.604 58.7842 328.604 52.3856C328.604 48.3564 327.025 44.7211 324.023 41.7972C320.23 38.1619 315.172 36.3452 308.615 36.3452H290.838V91.6529H298.74V69.6097H310.592C316.675 69.6097 319.125 72.1378 319.125 78.4599V91.6548H327.184V79.7239C327.184 71.0325 325.13 67.7147 318.808 66.7662V65.6589ZM252.282 67.4756H276.618V60.207H252.282V43.6139H278.988V36.3452H244.222V91.6529H280.173V84.3842H252.282V67.4756ZM225.812 70.3995V74.1916C225.812 82.1717 222.888 84.78 215.541 84.78H213.803C206.454 84.78 202.899 82.4088 202.899 71.4264V56.5717C202.899 45.5109 206.613 43.2181 213.96 43.2181H215.539C222.73 43.2181 225.021 45.9048 225.099 53.3322H233.791C233.001 42.4283 225.732 35.5555 214.828 35.5555C209.535 35.5555 205.11 37.2153 201.792 40.3745C196.814 45.0367 194.049 52.9383 194.049 63.9991C194.049 74.6659 196.42 82.5675 201.318 87.4649C204.636 90.7044 209.219 92.4426 213.723 92.4426C218.463 92.4426 222.81 90.5456 225.021 86.438H226.126V91.6529H233.395V63.1309H211.983V70.3995H225.812ZM156.126 43.6139H164.739C172.878 43.6139 177.303 45.6677 177.303 56.7304V71.2677C177.303 82.3285 172.878 84.3842 164.739 84.3842H156.126V43.6139ZM165.449 91.6548C180.541 91.6548 186.149 80.1982 186.149 64.001C186.149 47.5666 180.145 36.3471 165.29 36.3471H148.223V91.6548H165.449ZM110.063 67.4756H134.399V60.207H110.063V43.6139H136.768V36.3452H102.002V91.6529H137.954V84.3842H110.063V67.4756ZM63.4464 36.3452H55.3879V91.6529H91.7332V84.3842H63.4464V36.3452ZM0 91.6548V128H55.3076V119.94H8.05844V91.6548H0ZM0 0V36.3452H8.05844V8.05844H55.3076V0H0Z" fill="var(--color)" /></svg>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="encounter__bottom">
            <div data-anima="parag" className="encounter__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="IDENTITY, NOT ANONYMITY">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      ,
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      M
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Each agent holds its own ENS name, and with it its own policy, budget and keys. Not one super-agent wearing several hats — separate principals, separately bounded.
              </p>
            </div>
            <div data-anima="parag" className="encounter__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="AND REVOCATION THAT HOLDS">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      V
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                A name you can revoke is a name that means something. Revoke it and every capability issued under it stops being honoured:
                <em>
                  Identity is what makes authority accountable. A nameless agent cannot be revoked.
                </em>
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="drop-cans scene-cans section-blue">
        <div className="drop-cans__hold">
          <div className="drop-cans__top">
            <div className="drop-cans__subt">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="⚠️ IN PRODUCTION: AVOID IT AT ANY COST">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      ⚠
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      ️
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      :
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      V
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div data-anima="texts" className="drop-cans__title">
              <div className="drop-cans__title__serif">
                <div className="title_serif" aria-label="Just drop the keys,">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      J
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      u
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      p
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      k
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      y
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      ,
                    </div>
                  </div>
                </div>
              </div>
              <div className="drop-cans__title__sans">
                <div className="title_sans" aria-label="no more blind signing">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      m
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      b
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      g
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      g
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="drop-cans__svg">
            <div className="cycle__cycle">
              <div className="cycle__circle cycle__circle3 w-embed">
                <svg width="100%" viewBox="0 0 1031 1030" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M515.5 0.413086C799.975 0.413086 1030.59 230.802 1030.59 515C1030.59 799.198 799.975 1029.59 515.5 1029.59C231.025 1029.59 0.413086 799.198 0.413086 515C0.413086 230.802 231.025 0.413086 515.5 0.413086Z" stroke="var(--color-soft)" strokeWidth="1" />
                </svg>
              </div>
              <div className="cycle__circle cycle__circle2 w-embed">
                <svg width="100%" viewBox="0 0 1031 1030" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M515.5 0.413086C799.975 0.413086 1030.59 230.802 1030.59 515C1030.59 799.198 799.975 1029.59 515.5 1029.59C231.025 1029.59 0.413086 799.198 0.413086 515C0.413086 230.802 231.025 0.413086 515.5 0.413086Z" stroke="var(--color-soft)" strokeWidth="1" />
                </svg>
              </div>
              <div className="cycle__circle w-embed">
                <svg width="100%" viewBox="0 0 1031 1030" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M515.5 0.413086C799.975 0.413086 1030.59 230.802 1030.59 515C1030.59 799.198 799.975 1029.59 515.5 1029.59C231.025 1029.59 0.413086 799.198 0.413086 515C0.413086 230.802 231.025 0.413086 515.5 0.413086Z" stroke="var(--color-soft)" strokeWidth="1" />
                </svg>
              </div>
              <div className="cycle__directions__svg w-embed">
                <svg width="100%" viewBox="0 0 779 766" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="389.54" cy="389.304" r="341.834" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M342.057 93.821L388.821 47.0566L342.057 0.292272" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M684.292 342.539L731.057 389.304L777.821 342.539" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M422.36 674.521L389.292 731.795L446.567 764.862" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M93.821 436.069L47.0566 389.305L0.292272 436.069" stroke="var(--color)" strokeWidth="0.826685" />
                </svg>
              </div>
            </div>
          </div>
          <div className="drop-cans__bottom">
            <div data-anima="parag" className="drop-cans__bottom__left">
              <div className="description" aria-label="What an agent may spend shapes everything downstream. A stated ceiling is not bureaucracy — it’s the blast radius.">
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    W
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    g
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    m
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    y
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    p
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    p
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    v
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    y
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    g
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    w
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    m
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    A
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    g
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    b
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    y
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    —
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    ’
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    b
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="spacer-fs section-blue scene-phone-before typog" style={{ "opacity": "1" } as React.CSSProperties}>
        <div className="typog__hold">
          <div className="typog__travel">
            <ul role="list" className="typog__words w-list-unstyled" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
              <li className="typog__word">
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  “The
                </div>
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  Blue
                </div>
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  Light
                </div>
              </li>
              <li className="typog__word">
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  Will
                </div>
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  Be
                </div>
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  The
                </div>
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  New
                </div>
              </li>
              <li className="typog__word">
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  Midnight
                </div>
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  Sun”
                </div>
              </li>
              <li className="typog__word typog__word-sun">
                <div className="typog__word__text" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                  <div className="typog__word__sun w-embed">
                    <svg width="100%" viewBox="0 0 146 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M75.3158 102.585C66.1251 102.542 57.7228 94.7661 56.657 85.1449C56.3998 82.9226 56.4959 80.6738 56.9417 78.4812C59.0003 68.8818 68.2859 63.8169 77.6299 67.0288C87.3535 70.3715 93.2081 81.3516 90.529 91.2199C89.6765 94.5579 87.7027 97.5052 84.9354 99.5726C82.1681 101.64 78.7737 102.703 75.3158 102.585ZM88.9303 86.2204C88.8792 78.4812 83.9517 71.4833 76.8634 69.0344C68.9502 66.3239 61.2195 70.4006 59.1317 78.4231C57.1169 86.0968 61.1173 94.8678 68.3735 98.6756C78.3818 103.915 89.0033 97.4984 88.9303 86.2204ZM122.561 19.0462C123.328 20.2017 122.328 20.7612 121.715 21.4225C119.466 23.8447 117.201 26.25 114.918 28.6384C104.392 39.6912 95.1426 51.7976 85.7183 63.766C85.1927 64.4346 84.6525 65.0886 84.0904 65.7208C83.9663 65.8516 83.7108 65.8661 83.2144 66.0478C83.083 65.5246 82.7618 64.9723 82.8786 64.5436C83.1165 63.9532 83.4576 63.4095 83.886 62.9376C94.9674 48.2006 106.516 33.8705 119.437 20.6522C120.773 19.286 120.773 19.286 122.561 19.0462ZM73.6441 0C73.853 0.443159 74.0003 0.912534 74.0821 1.39522C73.6587 20.2889 70.5781 39.0808 70.7898 58.0761C70.7898 58.3305 70.5197 58.5848 70.3299 58.9045C68.9137 58.7592 68.9794 57.7273 68.9794 56.8044C68.9794 52.4444 68.7823 48.0843 69.067 43.7242C69.943 30.1426 71.0015 16.5828 71.987 3.03025C72.0965 1.94023 71.6731 0.566809 73.6441 0ZM77.4547 63.0684C75.5202 62.2545 76.2429 61.0773 76.5057 60.1617C77.7394 55.867 79.0607 51.5941 80.3747 47.3285C84.0247 35.5782 89.2296 24.5181 94.8068 13.6034C95.2813 12.6805 95.5952 11.2635 97.3399 11.9611C97.7049 13.4145 96.7997 14.4464 96.2522 15.5218C90.7188 26.3494 85.6891 37.3803 82.0245 48.9926C80.7397 53.0475 79.506 57.1169 78.2285 61.179C78.046 61.7676 77.7686 62.3272 77.4547 63.0684ZM24.9458 21.1681C25.8218 22.2073 26.5956 23.0575 27.2818 23.9658C30.6617 28.3768 33.9832 32.7732 37.2317 37.235C42.7289 44.8223 48.7153 52.0461 55.1532 58.8609C55.958 59.702 56.6905 60.6087 57.3432 61.5714C57.6279 62.0002 57.5622 62.6542 57.1169 63.5916C56.5402 63.112 55.9197 62.6833 55.3941 62.1383C44.7507 51.318 35.8447 39.1026 26.8438 26.967C26.0262 25.8552 25.1648 24.787 24.3399 23.6679C23.7924 22.934 23.6464 22.1928 24.9458 21.1681ZM66.2273 109.569C68.1618 110.6 67.2493 111.749 66.9573 112.788C65.1323 118.558 63.2635 124.32 61.3947 130.075C58.4747 139.072 55.5547 148.061 52.6347 157.042C52.347 157.952 51.9679 158.831 51.5032 159.666C51.3619 159.803 51.1881 159.902 50.9979 159.954C50.8077 160.006 50.6073 160.009 50.4155 159.964C50.2433 159.868 50.097 159.731 49.989 159.567C49.881 159.403 49.8144 159.215 49.795 159.019C49.8486 158.492 49.9866 157.977 50.2038 157.493C55.1532 142.475 60.1123 127.442 65.0812 112.395C65.3294 111.443 65.8039 110.542 66.2273 109.569ZM143.761 69.5286C144.294 71.2653 143.213 71.5923 142.155 71.8176C139.541 72.3699 136.921 72.8786 134.293 73.3872C122.228 75.7078 110.159 78.021 98.0845 80.327C96.9165 80.5523 95.639 81.1264 94.6681 79.7239C97.2596 78.1397 131.876 70.9819 143.761 69.5286ZM77.3014 109.227C78.1433 125.529 78.9731 141.826 79.7907 158.118C79.7907 158.481 79.5133 158.845 79.1556 159.767C78.5278 158.946 77.9 158.496 77.827 157.973C77.5423 155.872 77.3379 153.751 77.2503 151.636C76.9218 143.57 76.6955 135.504 76.3378 127.445C76.1699 123.63 75.7684 119.822 75.5129 116.014C75.3685 114.323 75.3222 112.624 75.3742 110.927C75.5443 110.228 75.8358 109.564 76.2356 108.965L77.3014 109.227ZM51.1017 99.7802C51.2258 101.808 49.8461 102.062 48.9117 102.578C44.9746 104.739 41.0131 106.841 37.0273 108.885C27.9388 113.529 18.9817 118.289 10.6013 124.059C9.8713 124.582 9.0829 125.403 8.0098 124.298C7.9514 122.75 9.3384 122.256 10.3385 121.639C15.2368 118.594 20.0986 115.476 25.1575 112.722C32.9466 108.479 40.8744 104.511 48.7657 100.456C49.5215 100.159 50.3036 99.9325 51.1017 99.7802ZM25.5517 143.621C25.8457 142.892 26.2151 142.195 26.654 141.542C32.0195 134.93 37.3777 128.31 42.8235 121.769C46.9845 116.777 51.2696 111.894 55.5182 106.982C56.0884 106.388 56.6903 105.825 57.3213 105.296C58.4455 106.749 57.5184 107.592 56.9125 108.348C54.5181 111.342 52.0726 114.292 49.6125 117.242C42.6872 125.599 35.7498 133.951 28.8002 142.298C28.4314 142.827 28.0055 143.315 27.53 143.751C27.0916 143.98 26.6179 144.135 26.1284 144.209L25.5517 143.621ZM146.002 91.5615C145.666 93.1674 144.396 92.8695 143.425 92.8985C135.395 93.1674 127.431 93.4871 119.43 93.5816C112.064 93.6688 104.698 93.5162 97.3326 93.4072C96.3106 93.4072 94.9674 93.7633 94.2666 91.8521C95.2108 91.6877 96.1639 91.5785 97.1209 91.5251C107.582 91.5251 118.043 91.6777 128.511 91.5905C133.417 91.5469 138.315 91.0891 143.213 90.813C144.235 90.733 145.33 90.406 146.002 91.5615ZM0.00170042 96.9243C-0.0493996 94.9042 1.0602 94.9042 2.1187 94.7806C7.1046 94.192 12.0759 93.5671 17.0618 92.9857C23.8435 92.2009 30.6252 91.3725 37.4215 90.7112C40.4948 90.406 43.5973 90.4133 46.6925 90.3624C47.4207 90.4512 48.1345 90.6319 48.8168 90.9002C48.4883 91.4379 48.3569 91.8885 48.1744 91.903C32.2166 93.5889 16.2442 95.2384 0.00170042 96.9243ZM83.3969 107.032C85.857 107.759 85.8132 109.263 86.1855 110.353C90.0788 121.82 93.9259 133.297 97.7268 144.783C98.2579 146.285 98.7111 147.813 99.0846 149.361C99.1299 149.645 99.1058 149.935 99.0143 150.207C98.9228 150.479 98.7666 150.725 98.559 150.924C97.6611 151.323 97.2888 150.597 97.0552 149.805C96.5807 148.177 96.0624 146.556 95.5295 144.943C91.7773 133.544 88.0275 122.145 84.2802 110.746C83.9517 109.728 83.7765 108.638 83.3969 107.032ZM92.0985 71.3671C92.6049 70.8576 93.1571 70.3955 93.7483 69.9864C105.19 63.3784 116.641 56.7947 128.102 50.2353C128.942 49.7484 129.876 48.8328 131.022 50.1263C130.935 51.7032 129.438 51.8994 128.423 52.4807C118.145 58.328 107.857 64.1415 97.5589 69.921C96.3544 70.6041 95.2083 71.3743 93.9673 72.0065C93.5293 72.2245 92.8942 72.0065 92.3467 72.0065L92.0985 71.3671ZM88.6748 104.751C89.2692 105.086 89.8104 105.507 90.2808 106.001C98.1721 117.388 106.436 128.528 114.371 140.823C112.984 140.634 112.283 140.743 111.925 140.445C111.312 139.854 110.779 139.184 110.341 138.454C103.323 128.281 96.3203 118.119 89.3318 107.97C88.7993 107.136 88.312 106.275 87.8718 105.39L88.6748 104.751ZM91.6605 101.895C92.0547 101.822 92.5438 101.568 92.8358 101.706C105.479 107.766 118.116 113.856 131.453 120.28C130.27 120.912 129.701 121.479 129.204 121.421C128.376 121.236 127.583 120.922 126.854 120.491C118.386 116.465 109.903 112.453 101.464 108.377C98.6831 107.04 95.9821 105.528 93.2811 104.017C92.6104 103.587 91.9779 103.101 91.3904 102.563L91.6605 101.895ZM48.1233 79.4841C46.5246 80.7557 44.8894 80.2107 43.4148 79.9564C37.8084 79.128 32.2117 78.2196 26.6248 77.2314C21.6827 76.3448 16.7625 75.3493 11.8423 74.3246C10.3809 74.0093 8.95144 73.5618 7.5718 72.9876C6.6301 72.6097 6.6812 72.4716 7.0973 70.8075C20.1294 74.0584 33.3371 76.5671 46.656 78.3214C46.9645 78.368 47.2616 78.4715 47.532 78.6266C47.7072 78.7501 47.7875 78.9899 48.1233 79.4841ZM51.0068 70.5895C50.2403 70.2698 49.4519 70.0009 48.7146 69.623C38.1393 64.1633 27.547 58.6938 16.9377 53.2146C16.0667 52.8176 15.2499 52.3122 14.5068 51.7104C14.171 51.398 14.2513 50.6349 14.1491 50.0827C14.6163 50.0391 15.1638 49.8356 15.558 49.9955C16.434 50.3588 17.2224 50.9256 18.0692 51.3689L48.3423 67.225C49.2159 67.6183 50.0515 68.0902 50.8389 68.6348C51.2258 68.9254 51.328 69.5867 51.5689 70.0881L51.0068 70.5895ZM65.0447 59.8856C64.5266 59.3996 64.0549 58.8669 63.6358 58.2941C58.5063 48.0141 53.389 37.7243 48.2839 27.4248C47.8448 26.6945 47.4967 25.9136 47.2473 25.0995C47.1305 24.5327 47.459 23.8714 47.6853 22.745C48.2878 23.2926 48.8309 23.9015 49.3059 24.5617C54.2942 34.5608 59.2728 44.572 64.2417 54.5953C64.7441 55.5215 65.1525 56.4952 65.4608 57.502C65.563 58.0907 65.2491 58.7592 65.0447 59.8856ZM71.6074 109.474C71.7627 110.297 71.8603 111.13 71.8994 111.967C71.549 124.204 71.1864 136.441 70.8117 148.678C70.8117 149.812 71.1548 151.244 69.0962 152.014C68.8787 151.059 68.7516 150.086 68.7166 149.107C69.6583 136.07 68.7166 122.947 70.5124 109.946C70.4978 109.823 70.9869 109.728 71.6074 109.474ZM121.364 44.6689C121.162 45.1365 120.878 45.5646 120.525 45.9333C110.115 53.3091 99.6759 60.6631 88.8281 68.3078C88.9157 67.3195 88.7916 66.6655 89.0544 66.2803C89.528 65.708 90.0927 65.2171 90.7261 64.827C99.7927 58.2336 108.874 51.6596 117.97 45.1049C119.649 43.8914 119.722 43.9713 121.364 44.6689ZM74.0748 59.8492C72.2936 58.9409 72.7316 57.6692 72.8922 56.6155C73.9531 49.6975 75.0481 42.7795 76.1772 35.8616C76.8561 31.7849 77.6372 27.7155 78.3672 23.6461C78.4475 23.2246 78.3672 22.7087 78.5862 22.4035C79.0107 21.9126 79.4853 21.4669 80.0024 21.0737C80.2214 21.6041 80.6886 22.1782 80.6156 22.6651C80.163 25.8189 79.5863 28.9509 79.0607 32.1119C77.6007 40.9047 76.1407 49.6951 74.6807 58.4831C74.5212 58.956 74.3184 59.4133 74.0748 59.8492ZM133.49 103.188C132.599 105.259 131.489 104.765 130.475 104.598C121.418 103.145 112.358 101.677 103.297 100.194C100.377 99.7148 97.4567 99.148 94.4783 98.6102C94.6608 96.6773 95.712 96.9171 96.7851 97.106C101.092 97.8763 105.399 98.6829 109.721 99.366C116.575 100.449 123.445 101.43 130.299 102.483C131.292 102.621 132.27 102.905 133.49 103.188ZM79.7469 63.6788C79.7687 62.8891 79.8788 62.1043 80.0754 61.3389C84.2583 50.4969 88.7332 39.7929 94.6754 29.7575C94.8433 29.4813 94.982 29.1907 95.1572 28.9218C95.6171 28.1951 96.0697 27.2214 97.0917 27.8172C98.1137 28.4131 97.3764 29.336 97.0041 29.9973C95.3543 33.1075 93.4782 36.1014 92.0036 39.2915C88.6602 46.5583 85.5212 53.8832 82.2362 61.1572C81.8128 62.1383 81.8493 63.6352 79.7469 63.6788ZM62.5554 108.5C62.2273 109.641 61.8149 110.756 61.3217 111.836C59.285 115.469 57.0512 118.943 55.0802 122.583C51.9485 128.397 48.9701 134.21 45.8895 140.024C45.3229 140.969 44.7065 141.883 44.0426 142.763C42.5826 141.47 43.2542 140.532 43.7214 139.624C46.6414 133.97 49.5103 128.28 52.569 122.692C55.0729 118.136 57.8177 113.703 60.4895 109.242C60.8427 108.792 61.2496 108.387 61.7013 108.035L62.5554 108.5ZM27.1285 127.459C34.9249 118.449 43.8017 110.92 52.3719 103.058C52.7515 102.709 53.4085 102.665 54.4524 102.331C54.3013 103.052 54.0559 103.751 53.7224 104.409C53.0151 105.205 52.2619 105.96 51.4667 106.669C44.6534 113.243 37.8181 119.812 30.961 126.377C30.0412 127.212 29.2893 128.687 27.1285 127.459ZM133.438 83.2991C124.386 84.7525 115.612 85.5446 106.859 86.3512C103.472 86.6636 100.026 87.4485 96.4639 86.9034C96.6318 85.1521 97.6903 85.2757 98.6028 85.1812C104.231 84.5781 109.859 83.9822 115.488 83.3573C120.364 82.8195 125.241 82.2309 130.132 81.715C131.175 81.606 132.475 80.9737 133.438 83.2991ZM88.1054 143.519C86.0979 143.519 86.149 142.211 85.9154 141.266C85.0029 137.015 84.1561 132.75 83.2801 128.491C82.1851 123.201 81.0901 117.911 79.9951 112.606C79.7834 111.538 79.2651 110.375 80.5134 108.973C80.9625 109.493 81.3293 110.079 81.6011 110.709C83.7911 120.883 85.9446 131.056 88.0616 141.23C88.1469 141.99 88.1616 142.756 88.1054 143.519ZM66.4317 58.5412C64.3804 47.5538 62.3656 36.8063 60.3946 26.0587C60.4032 25.5779 60.4996 25.1026 60.6793 24.6562C62.3218 24.3946 62.3364 25.5137 62.5116 26.422C63.2416 30.0554 63.9716 33.6888 64.6286 37.3803C65.7163 43.5571 66.7456 49.7339 67.7895 55.9324C67.972 56.9207 68.4538 58.0543 66.4317 58.5412ZM95.0404 75.5745C95.9187 75.0931 96.8283 74.6706 97.7633 74.3101C106.713 71.4906 115.675 68.6929 124.649 65.917C124.854 65.8516 125.095 65.6772 125.255 65.7353C125.788 65.917 126.299 66.1786 126.825 66.4111C126.562 66.8253 126.387 67.3921 126.014 67.6174C125.35 67.9577 124.646 68.2164 123.919 68.3877C118.393 70.0227 112.852 71.6141 107.334 73.2855C104.063 74.2665 100.829 75.3711 97.5808 76.4175C96.6975 76.6936 95.7558 77.3331 95.0404 75.5745ZM60.2267 60.3942C59.5861 59.6587 58.9982 58.8792 58.4674 58.0616C53.956 49.9737 49.4884 41.8639 44.9989 33.7687C44.4879 32.8386 43.8528 31.9448 45.1522 30.5641C45.7648 31.2231 46.3353 31.9196 46.8604 32.6497C52.3528 41.2947 57.1657 50.3494 61.256 59.7329L60.2267 60.3942ZM18.8138 105.528C18.3174 103.9 19.6752 103.835 20.6023 103.537C24.2523 102.36 27.9023 101.234 31.5888 100.114C36.7864 98.523 41.9913 96.9534 47.1889 95.362C48.1525 95.064 49.1307 94.3592 50.0067 95.5509C47.897 97.6874 22.0331 105.928 18.8138 105.528ZM28.3403 48.9854C29.6397 47.5829 30.3624 48.4476 31.107 48.9854C34.1292 51.1654 37.0638 53.4908 40.1809 55.5255C44.8894 58.6211 49.722 61.5206 54.4962 64.5218C54.7575 64.756 54.9881 65.0221 55.1824 65.3138C54.2407 66.6219 53.153 66.1277 52.1456 65.5754C49.9994 64.391 47.7656 63.2719 45.78 61.8984C40.67 58.4322 35.6184 54.8642 30.5887 51.2817C29.7691 50.5876 29.0163 49.8188 28.3403 48.9854ZM23.1573 68.424C23.8216 66.4911 24.8217 66.8544 25.7342 67.1087C31.8516 68.5621 37.9763 70.0154 44.0864 71.5342C45.5464 71.8903 47.0064 72.3263 48.3788 72.8059C49.0157 73.083 49.6264 73.4162 50.2038 73.8014C49.4227 75.5091 48.3423 74.7679 47.3787 74.5281C42.9476 73.3364 38.5311 72.0647 34.0854 70.9529C31.3917 70.2843 28.6396 69.8701 25.924 69.2888C25.0407 69.0853 24.1866 68.7438 23.1573 68.424ZM19.8942 85.5446C20.3176 83.6043 21.5586 83.9604 22.5149 83.9531C27.7417 83.9531 32.9685 83.9531 38.188 83.9531C40.7503 83.9531 43.298 83.9531 45.8676 84.0912C46.8407 84.2097 47.8026 84.4065 48.7438 84.6798V85.3629C48.2675 85.6612 47.7406 85.8705 47.1889 85.9806C38.7647 86.0145 30.3429 86.0145 21.9236 85.9806C21.2343 85.9025 20.5545 85.7564 19.8942 85.5446Z" fill="var(--soft)" />
                      <path d="M59.0184 78.1826C61.1076 69.7959 68.7162 65.5429 76.5018 68.376V68.375C83.5267 70.9391 88.4506 78.3134 88.5018 86.5049C88.5381 92.4567 85.915 97.0828 82.0897 99.5371C78.2689 101.988 73.1913 102.311 68.2186 99.5479C61.005 95.5372 57.0139 86.2731 59.0184 78.1826Z" fill="#D4C500" stroke="black" />
                    </svg>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="spacer-fs scene-phone">
        <div data-anima="parag" className="scene-phone__description">
          <div className="description descr-phone">
            “Your agent reads. Your agent obeys.” Every untrusted input is an instruction waiting to be followed.
          </div>
        </div>
        <div data-anima="parag" className="scene-phone__description scene-phone__description__left">
          <div className="description descr-phone">
            “A key is the new blank cheque.” Signed before anyone can read what it authorised.
          </div>
        </div>
        <div data-anima="parag" className="scene-phone__description">
          <div className="description descr-phone">
            “You can’t bound it if you only asked it nicely.” A rule the agent can reinterpret is not a rule at all.
          </div>
        </div>
      </div>
      <section className="the-balance section-blue" style={{ "opacity": "0" } as React.CSSProperties}>
        <div className="the-balance__hold">
          <div className="the-balance__top">
            <div className="the-balance__index">
              <div className="section-index">
                <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                    <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
                <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                  05
                </div>
              </div>
            </div>
            <div data-anima="texts" className="the-balance__title">
              <div className="cycle__title__serif">
                <div className="title_serif" aria-label="An enemy called">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      m
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      c
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                  </div>
                </div>
              </div>
              <div className="cycle__title__sans">
                <div className="title_sans" aria-label="the stale feed.">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      f
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      .
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="the-balance__parags">
            <div data-anima="parag" className="the-balance__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="THE SILENT CONFUSION">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      F
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                A stale price still parses, still looks reasonable, still returns a number. To the model, an hour ago looks like now.
              </p>
            </div>
            <div data-anima="parag" className="cycle__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="YOUR AGENT LISTENS TO DATA">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                That gap is where losses live. Seconds of staleness can price a position at yesterday’s value.
              </p>
            </div>
          </div>
          <div className="the-balance__bottom">
            <div data-anima="parag" className="the-balance__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="PRICES, FEEDS, DURING A SPIKE">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      ,
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      F
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      ,
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      K
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Every source carries its own claim to truth.
                <br />
                A verified round says:
                <em>
                  This was true at this block.
                  <br />
                </em>
                An indexed guess says
                <em>
                  : probably, recently.
                </em>
              </p>
            </div>
            <div data-anima="parag" className="the-balance__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="ALIGNMENT WITH THE CHAIN HEAD">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      M
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      W
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                When a feed drifts, the agent acts on the wrong number — confidently, and exactly as instructed.
              </p>
            </div>
          </div>
          <div className="the-balance__wrapper">
            <ul role="list" className="the-balance__list w-list-unstyled">
              <li className="the-balance__pointers">
                <div className="the-balance__pointers__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "rotateX(180deg)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 364 489" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="point point-solid" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" stroke="var(--white)" strokeWidth="1" style={{ "strokeDashoffset": "-645.283", "strokeDasharray": "123.03px, 1513.3px" } as React.CSSProperties} />
                    <path className="point point-opac" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" opacity="0.35" stroke="var(--color-soft)" strokeWidth="1" style={{ "strokeDashoffset": "0", "strokeDasharray": "1636.23px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
              </li>
              <li className="the-balance__pointers">
                <div className="the-balance__pointers__svg w-embed">
                  <svg width="100%" viewBox="0 0 364 489" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="point point-solid" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" stroke="var(--white)" strokeWidth="1" style={{ "strokeDashoffset": "-1052.46", "strokeDasharray": "123.03px, 1513.3px" } as React.CSSProperties} />
                    <path className="point point-opac" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" opacity="0.35" stroke="var(--color-soft)" strokeWidth="1" style={{ "strokeDashoffset": "0", "strokeDasharray": "1636.23px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
              </li>
              <li className="the-balance__pointers">
                <div className="the-balance__pointers__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "rotateX(180deg)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 364 489" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="point point-solid" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" stroke="var(--white)" strokeWidth="1" style={{ "strokeDashoffset": "-933.253", "strokeDasharray": "211.637px, 1424.69px" } as React.CSSProperties} />
                    <path className="point point-opac" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" opacity="0.35" stroke="var(--color-soft)" strokeWidth="1" style={{ "strokeDashoffset": "0", "strokeDasharray": "1636.23px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
              </li>
              <li className="the-balance__pointers">
                <div className="the-balance__pointers__svg w-embed">
                  <svg width="100%" viewBox="0 0 364 489" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="point point-solid" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" stroke="var(--white)" strokeWidth="1" style={{ "strokeDashoffset": "-774.415", "strokeDasharray": "224.137px, 1412.19px" } as React.CSSProperties} />
                    <path className="point point-opac" d="M327 1C346.882 1 363 17.1177 363 37V452C363 471.882 346.882 488 327 488H37C17.1177 488 1 471.882 1 452V37C1 17.1178 17.1178 1 37 1H327Z" opacity="0.35" stroke="var(--color-soft)" strokeWidth="1" style={{ "strokeDashoffset": "0", "strokeDasharray": "1636.23px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
              </li>
            </ul>
            <div className="the-balance__rings">
              <ul role="list" className="the-balance__rings-list w-list-unstyled">
                <li className="the-balance__ring">
                  <div className="the-balance__ring__ring" />
                </li>
              </ul>
              <ul role="list" className="the-balance__rings-list w-list-unstyled">
                <li className="the-balance__ring">
                  <div className="the-balance__ring__ring" />
                </li>
              </ul>
              <ul role="list" className="the-balance__rings-list w-list-unstyled">
                <li className="the-balance__ring">
                  <div className="the-balance__ring__ring" />
                </li>
              </ul>
              <ul role="list" className="the-balance__rings-list w-list-unstyled">
                <li className="the-balance__ring">
                  <div className="the-balance__ring__ring" />
                </li>
              </ul>
            </div>
          </div>
          <div className="the-balance__bottom__subt">
            <div data-anima="parag" className="drop-cans__bottom__left">
              <div className="description" aria-label="Check the clock on the price. A feed past its window still returns a number, and the number still looks like a fact. “Stale data doesn’t error. It answers.”">
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    C
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    k
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    k
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    p
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    A
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    f
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    p
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    w
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    w
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    m
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    b
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    ,
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    h
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    u
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    m
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    b
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    k
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    i
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    k
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    f
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    c
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    “
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    S
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    l
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    d
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    ’
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    o
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    I
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    t
                  </div>
                </div>
                <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    a
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    n
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    w
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    e
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    r
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    s
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    .
                  </div>
                  <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                    ”
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="spacer-fs scene-lamp" />
      <section className="cycle section-blue">
        <div className="cycle__hold">
          <div className="cycle__top">
            <div className="cycle__index">
              <div className="section-index">
                <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                  <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                    <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                  </svg>
                </div>
                <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                  06
                </div>
              </div>
            </div>
            <div data-anima="texts" className="cycle__title">
              <div className="cycle__title__serif">
                <div className="title_serif" aria-label="The Layers of one">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      y
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      r
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      f
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                </div>
              </div>
              <div className="cycle__title__sans">
                <div className="title_sans" aria-label="bounded decision.">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      b
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      u
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      d
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      c
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      s
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      n
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      .
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="cycle__top__parags">
            <div data-anima="parag" className="cycle__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="THE TRIGGER (A SIGNAL ARRIVES)">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      (
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      V
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      )
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                A health factor crosses a threshold. Nothing is decided yet, and nothing can move.
              </p>
            </div>
            <div data-anima="parag" className="cycle__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="THE STRATEGY (INTENT FORMS)">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      G
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      (
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      F
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      M
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      )
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                The model reads verified data and forms an intent. This is the only layer it reasons in — and it holds no authority.
              </p>
            </div>
          </div>
          <div className="cycle__wrapper">
            <div className="cycle__cycle">
              <div className="cycle__circle cycle__circle3 w-embed">
                <svg width="100%" viewBox="0 0 1031 1030" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M515.5 0.413086C799.975 0.413086 1030.59 230.802 1030.59 515C1030.59 799.198 799.975 1029.59 515.5 1029.59C231.025 1029.59 0.413086 799.198 0.413086 515C0.413086 230.802 231.025 0.413086 515.5 0.413086Z" stroke="var(--color-soft)" strokeWidth="1" />
                </svg>
              </div>
              <div className="cycle__circle cycle__circle2 w-embed">
                <svg width="100%" viewBox="0 0 1031 1030" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M515.5 0.413086C799.975 0.413086 1030.59 230.802 1030.59 515C1030.59 799.198 799.975 1029.59 515.5 1029.59C231.025 1029.59 0.413086 799.198 0.413086 515C0.413086 230.802 231.025 0.413086 515.5 0.413086Z" stroke="var(--color-soft)" strokeWidth="1" />
                </svg>
              </div>
              <div className="cycle__circle w-embed">
                <svg width="100%" viewBox="0 0 1031 1030" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M515.5 0.413086C799.975 0.413086 1030.59 230.802 1030.59 515C1030.59 799.198 799.975 1029.59 515.5 1029.59C231.025 1029.59 0.413086 799.198 0.413086 515C0.413086 230.802 231.025 0.413086 515.5 0.413086Z" stroke="var(--color-soft)" strokeWidth="1" />
                </svg>
              </div>
              <div className="cycle__directions__svg w-embed">
                <svg width="100%" viewBox="0 0 779 766" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="389.54" cy="389.304" r="341.834" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M342.057 93.821L388.821 47.0566L342.057 0.292272" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M684.292 342.539L731.057 389.304L777.821 342.539" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M422.36 674.521L389.292 731.795L446.567 764.862" stroke="var(--color)" strokeWidth="0.826685" />
                  <path d="M93.821 436.069L47.0566 389.305L0.292272 436.069" stroke="var(--color)" strokeWidth="0.826685" />
                </svg>
              </div>
              <div className="cycle__cycle__title cycle__cycle__title__h1">
                <div className="title_serif title_serif__cycle" aria-label="The PolicyPath">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      e
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      o
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      l
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      i
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      c
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      y
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      a
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      t
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      h
                    </div>
                  </div>
                </div>
              </div>
              <ul role="list" className="cycle__thumbs w-list-unstyled">
                <li className="cycle__thumbs__imgs">
                  <img src="/assets/68fcf9490b2a28caaa0e59c7_floor_texture.webp" loading="lazy" sizes="100vw" srcSet="/assets/68fcf9490b2a28caaa0e59c7_floor_texture-p-500.webp 500w, /assets/68fcf9490b2a28caaa0e59c7_floor_texture-p-800.webp 800w, /assets/68fcf9490b2a28caaa0e59c7_floor_texture-p-1080.webp 1080w, /assets/68fcf9490b2a28caaa0e59c7_floor_texture.webp 1232w" alt="" className="cycle__thumbs__img" />
                </li>
                <li className="cycle__thumbs__imgs">
                  <img src="/assets/68fcf9490b2a28caaa0e59c6_tunnel_texture.webp" loading="lazy" sizes="100vw" srcSet="/assets/68fcf9490b2a28caaa0e59c6_tunnel_texture-p-500.webp 500w, /assets/68fcf9490b2a28caaa0e59c6_tunnel_texture-p-800.webp 800w, /assets/68fcf9490b2a28caaa0e59c6_tunnel_texture-p-1080.webp 1080w, /assets/68fcf9490b2a28caaa0e59c6_tunnel_texture.webp 1232w" alt="" className="cycle__thumbs__img" />
                </li>
                <li className="cycle__thumbs__imgs">
                  <img src="/assets/68fcf9490b2a28caaa0e59d0_floor_lamp_texture.webp" loading="lazy" sizes="100vw" srcSet="/assets/68fcf9490b2a28caaa0e59d0_floor_lamp_texture-p-500.webp 500w, /assets/68fcf9490b2a28caaa0e59d0_floor_lamp_texture-p-800.webp 800w, /assets/68fcf9490b2a28caaa0e59d0_floor_lamp_texture-p-1080.webp 1080w, /assets/68fcf9490b2a28caaa0e59d0_floor_lamp_texture.webp 1232w" alt="" className="cycle__thumbs__img" />
                </li>
                <li className="cycle__thumbs__imgs">
                  <img src="/assets/6905b16ea9546b07c0f2fc37_texture4.webp" loading="lazy" sizes="100vw" srcSet="/assets/6905b16ea9546b07c0f2fc37_texture4-p-500.webp 500w, /assets/6905b16ea9546b07c0f2fc37_texture4-p-800.webp 800w, /assets/6905b16ea9546b07c0f2fc37_texture4-p-1080.webp 1080w, /assets/6905b16ea9546b07c0f2fc37_texture4.webp 1232w" alt="" className="cycle__thumbs__img" />
                </li>
              </ul>
            </div>
          </div>
          <div className="cycle__bottom">
            <div data-anima="parag" className="cycle__bottom__left">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="THE POLICY (AUTHORITY DECIDES)">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      P
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      (
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      A
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      Y
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      )
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Amount, recipient, freshness, window. If a capability is ever issued, it is decided here.
              </p>
            </div>
            <div data-anima="parag" className="cycle__bottom__right">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="THE EXECUTOR (SETTLEMENT)">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      H
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      X
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      C
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      R
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      (
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      M
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      )
                    </div>
                  </div>
                </div>
              </div>
              <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                Only now does anything reach a chain — with a capability that is scoped, single-use and already expiring.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="solution spacer-fs scene-follow section-blue">
        <div className="scene-path-follow__hold solution__hold">
          <div className="solution__travel" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
            <div className="solution__hero">
              <div className="solution__hero__index">
                <div className="section-index">
                  <div className="section-index__svg w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)" } as React.CSSProperties}>
                    <svg width="100%" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="index_path__opacity" opacity="0.1" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" />
                      <circle className="index_path__solid" cx="58.5" cy="58.5" r="58" stroke="var(--color-soft)" style={{ "strokeDashoffset": "0", "strokeDasharray": "364.425px, 0.1px" } as React.CSSProperties} />
                    </svg>
                  </div>
                  <div className="section-index__index" style={{ "opacity": "1" } as React.CSSProperties}>
                    07
                  </div>
                </div>
              </div>
              <div className="solution__decor w-embed" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0px, 0px)", "opacity": "1" } as React.CSSProperties}>
                <svg width="100%" viewBox="0 0 727 727" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="363.25" cy="363.25" r="362" stroke="var(--color-soft)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.91 29.25" transform="matrix(1,0,0,1,0,0)" style={{ "transformOrigin": "0px 0px", "translate": "none", "rotate": "none", "scale": "none" } as React.CSSProperties} />
                  <circle cx="363.009" cy="363.448" r="340.061" transform="matrix(0.99859,0.05307,-0.05307,0.99859,19.80005,-18.75241)" stroke="var(--color-soft)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.91 29.25" style={{ "transformOrigin": "0px 0px", "translate": "none", "rotate": "none", "scale": "none" } as React.CSSProperties} />
                  <circle cx="363.009" cy="363.448" r="318.667" transform="matrix(0.99859,0.05307,-0.05307,0.99859,19.80005,-18.75241)" stroke="var(--color-soft)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.91 29.25" style={{ "transformOrigin": "0px 0px", "translate": "none", "rotate": "none", "scale": "none" } as React.CSSProperties} />
                  <circle cx="362.892" cy="362.888" r="292.495" transform="matrix(0.99859,0.05307,-0.05307,0.99859,19.77016,-18.74699)" stroke="var(--color-soft)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.91 29.25" style={{ "transformOrigin": "0px 0px", "translate": "none", "rotate": "none", "scale": "none" } as React.CSSProperties} />
                </svg>
              </div>
              <div className="solution__hero__title">
                <div className="solution__hero__subt">
                  <div className="subtitle">
                    <div className="subtitle__dot" />
                    <div className="subtitle__text" aria-label="THE RULES WE HOLD :">
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          T
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          H
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          R
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          U
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          L
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          S
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          W
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          H
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          O
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          L
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          D
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          :
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="solution__hero__title__serif">
                  <div className="title_serif">
                    How to redesign
                  </div>
                </div>
                <div className="solution__hero__title__sans">
                  <div className="title_sans">
                    before you trust it.
                  </div>
                </div>
              </div>
              <div className="solution__hero__parag">
                <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                  Six rules we hold. They are not advice to the model. They are enforced.
                </p>
              </div>
              <div className="solution__hero__dot" />
            </div>
            <ul role="list" className="solutions__list w-list-unstyled">
              <li className="solutions__each solutions__each__empty" />
              <li className="solutions__each">
                <div className="solutions__each__media">
                  <video muted playsInline autoPlay loop className="solutions__each__video">
                    <source src="/media/6907b3367cd6438e3bc6709d_sunset-transcode.webm" />
                    <source src="/media/6907b3367cd6438e3bc6709d_sunset-transcode.mp4" />
                  </video>
                </div>
                <div className="solutions__each__texts">
                  <div className="solutions__each__subt">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text" aria-label="01  - FIRST RULE">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            0
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            1
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                             
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            -
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            F
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="solutions__each__title">
                    <div className="description">
                      🌗 Set a bedtime ritual.
                    </div>
                  </div>
                  <div className="solutions__each__parag">
                    <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                      State the ceiling yourself — it is never inferred.
                    </p>
                  </div>
                </div>
              </li>
              <li className="solutions__each">
                <div className="solutions__each__media">
                  <video muted playsInline autoPlay loop className="solutions__each__video">
                    <source src="/media/6907b3817e5fc505b9c93153_candle-transcode.webm" />
                    <source src="/media/6907b3817e5fc505b9c93153_candle-transcode.mp4" />
                  </video>
                </div>
                <div className="solutions__each__texts">
                  <div className="solutions__each__subt">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text" aria-label="02 - SECOND RULE">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            0
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            2
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            -
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            C
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            O
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            N
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            D
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="solutions__each__title">
                    <div className="description">
                      🕯 Dim the lights.
                    </div>
                  </div>
                  <div className="solutions__each__parag">
                    <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                      Let your body feel the night.
                    </p>
                  </div>
                </div>
              </li>
              <li className="solutions__each">
                <div className="solutions__each__media">
                  <video muted playsInline autoPlay loop className="solutions__each__video">
                    <source src="/media/6907b4186656f690955a079d_bedroom-transcode.webm" />
                    <source src="/media/6907b4186656f690955a079d_bedroom-transcode.mp4" />
                  </video>
                </div>
                <div className="solutions__each__texts">
                  <div className="solutions__each__subt">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text" aria-label="03 - THIRD RULE">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            0
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            3
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            -
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            H
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            D
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="solutions__each__title">
                    <div className="description">
                      🛏 Design your space.
                    </div>
                  </div>
                  <div className="solutions__each__parag">
                    <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                      Narrow, expiring, single-use. Never a standing key.
                    </p>
                  </div>
                </div>
              </li>
              <li className="solutions__each">
                <div className="solutions__each__media">
                  <video muted playsInline autoPlay loop className="solutions__each__video">
                    <source src="/media/6907b3cc4dd96c20de2b116b_mug-transcode.webm" />
                    <source src="/media/6907b3cc4dd96c20de2b116b_mug-transcode.mp4" />
                  </video>
                </div>
                <div className="solutions__each__texts">
                  <div className="solutions__each__subt">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text" aria-label="04 - FOURTH RULE">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            0
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            4
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            -
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            F
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            O
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            H
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="solutions__each__title">
                    <div className="description">
                      ☕ Watch your inputs
                    </div>
                  </div>
                  <div className="solutions__each__parag">
                    <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                      Stale data, unknown recipients and mainnet writes are refused.
                    </p>
                  </div>
                </div>
              </li>
              <li className="solutions__each">
                <div className="solutions__each__media">
                  <video muted playsInline autoPlay loop className="solutions__each__video">
                    <source src="/media/6907b461642f6edab568098f_running-transcode.webm" />
                    <source src="/media/6907b461642f6edab568098f_running-transcode.mp4" />
                  </video>
                </div>
                <div className="solutions__each__texts">
                  <div className="solutions__each__subt">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text" aria-label="05 - FIFTH RULE">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            0
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            5
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            -
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            F
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            F
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            H
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="solutions__each__title">
                    <div className="description">
                      🏃 Move daily.
                    </div>
                  </div>
                  <div className="solutions__each__parag">
                    <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                      Prove it in simulation before it ever touches a network.
                    </p>
                  </div>
                </div>
              </li>
              <li className="solutions__each">
                <div className="solutions__each__media">
                  <video muted playsInline autoPlay loop className="solutions__each__video">
                    <source src="/media/6907b404180c4364fcc1d439_book-transcode.webm" />
                    <source src="/media/6907b404180c4364fcc1d439_book-transcode.webm" />
                  </video>
                </div>
                <div className="solutions__each__texts">
                  <div className="solutions__each__subt">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text" aria-label="06 - SIXTH RULE">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            0
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            6
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            -
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            X
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            H
                          </div>
                        </div>
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            U
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="solutions__each__title">
                    <div className="description">
                      🌿 Mindful buffer.
                    </div>
                  </div>
                  <div className="solutions__each__parag">
                    <p className="parag" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                      Attack it yourself — find the limit before someone else does.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="ender">
        <div className="ender__holder">
          <div className="ender__content">
            <div className="ender__content__subt">
              <div className="subtitle">
                <div className="subtitle__dot" />
                <div className="subtitle__text" aria-label="NOW IT'S TIME TO BUILD">
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      N
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      W
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      '
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      S
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      M
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      E
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      T
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      O
                    </div>
                  </div>
                  <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      B
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      U
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      I
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      L
                    </div>
                    <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                      D
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ender__content__descr" style={{ "opacity": "1" } as React.CSSProperties}>
              <div className="description intro-descr ender__descr">
                Now that you know what holds, it’s time to build something that holds. Start on a testnet, bound it tightly, and watch it refuse. That’s the deal.
              </div>
            </div>
            <div className="ender__content__descr2" style={{ "opacity": "0" } as React.CSSProperties}>
              <div className="description intro-descr ender__descr">
                Make it part of the design, not a patch. Write the limits down, prove them, deploy them disabled, and turn authority on only once the evidence is in
                <br />
                — go reboot yourself. 😴
              </div>
            </div>
            <div data-zindex="1" className="ender__media" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 50%) translate(15vw, 50svh)" } as React.CSSProperties}>
              <video muted playsInline autoPlay loop className="solutions__each__video">
                <source src="/media/6907b3367cd6438e3bc6709d_sunset-transcode.webm" />
                <source src="/media/6907b3367cd6438e3bc6709d_sunset-transcode.mp4" />
              </video>
            </div>
            <div data-zindex="0" className="ender__media" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 50%) translate(-15vw, 50svh)" } as React.CSSProperties}>
              <video muted playsInline autoPlay loop className="solutions__each__video">
                <source src="/media/6907b3817e5fc505b9c93153_candle-transcode.webm" />
                <source src="/media/6907b3817e5fc505b9c93153_candle-transcode.mp4" />
              </video>
            </div>
            <div data-zindex="1" className="ender__media" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 50%) translate(15vw, 50svh)" } as React.CSSProperties}>
              <video muted playsInline autoPlay loop className="solutions__each__video">
                <source src="/media/6907b4186656f690955a079d_bedroom-transcode.webm" />
                <source src="/media/6907b4186656f690955a079d_bedroom-transcode.mp4" />
              </video>
            </div>
            <div data-zindex="2" className="ender__media" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 50%) translate(-15vw, 50svh)" } as React.CSSProperties}>
              <video muted playsInline autoPlay loop className="solutions__each__video">
                <source src="/media/6907b3cc4dd96c20de2b116b_mug-transcode.webm" />
                <source src="/media/6907b3cc4dd96c20de2b116b_mug-transcode.mp4" />
              </video>
            </div>
            <div data-zindex="0" className="ender__media" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 50%) translate(15vw, 50svh)" } as React.CSSProperties}>
              <video muted playsInline autoPlay loop className="solutions__each__video">
                <source src="/media/6907b461642f6edab568098f_running-transcode.webm" />
                <source src="/media/6907b461642f6edab568098f_running-transcode.mp4" />
              </video>
            </div>
            <div data-zindex="1" className="ender__media" style={{ "translate": "none", "rotate": "none", "scale": "none", "transform": "translate(0%, 50%) translate(-15vw, 50svh)" } as React.CSSProperties}>
              <video muted playsInline autoPlay loop className="solutions__each__video">
                <source src="/media/6907b404180c4364fcc1d439_book-transcode.webm" />
                <source src="/media/6907b404180c4364fcc1d439_book-transcode.webm" />
              </video>
            </div>
          </div>
        </div>
      </div>
      <footer className="footer">
        <div className="footer__hold">
          <div className="footer__title">
            <div className="footer__title__hold">
              <div className="footer__logo">
                <img src="/assets/690747c5cb104dc51ee85b27_group_2031.avif" loading="lazy" sizes="100vw" srcSet="/assets/690747c5cb104dc51ee85b27_Group%2031-p-500.avif 500w, /assets/690747c5cb104dc51ee85b27_Group%2031.avif 1340w" alt="" className="footer__logo__img" />
              </div>
              <div className="footer__descr">
                <p className="parag parag__footer" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                  An agentic IDE for designing, proving, deploying and operating secure financial agents. Authority is bounded by a deterministic policy layer, never by a prompt.
                  <br />
                  <span className="text-span">
                    Give it authority. Never give it keys.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="footer__link">
            <div className="footer__link__hold">
              <div className="footer__cta">
                <a href="https://vwlab.io/products/memorable-web-experience" target="_blank" className="footer__cta__link w-inline-block">
                  <div className="hover-btn w-embed">
                    <svg width="100%" viewBox="0 0 273 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="272" height="41" rx="20.5" fill="var(--white)" />
                      <path className="cta-button" d="M136.5 0.5H21C9.67816 0.5 0.5 9.67816 0.5 21C0.5 32.3218 9.67817 41.5 21 41.5H136.5" stroke="var(--color)" stroke-wodth="2" style={{ "strokeDashoffset": "-219.821", "strokeDasharray": "40.3496px, 255.162px" } as React.CSSProperties} />
                      <path className="cta-button" d="M136.5 41.5L252 41.5C263.322 41.5 272.5 32.3218 272.5 21C272.5 9.67816 263.322 0.499999 252 0.499998L136.5 0.499988" stroke="var(--color)" stroke-wodth="2" style={{ "strokeDashoffset": "-155.584", "strokeDasharray": "92.2904px, 203.222px" } as React.CSSProperties} />
                      <path d="M136.5 0.5H21C9.67816 0.5 0.5 9.67816 0.5 21C0.5 32.3218 9.67817 41.5 21 41.5H136.5" stroke="var(--color-soft)" opacity="0.7" stroke-wodth="2" />
                      <path d="M136.5 41.5L252 41.5C263.322 41.5 272.5 32.3218 272.5 21C272.5 9.67816 263.322 0.499999 252 0.499998L136.5 0.499988" stroke="var(--color-soft)" opacity="0.7" stroke-wodth="2" />
                    </svg>
                  </div>
                  <div className="footer__cta__link__span">
                    LEARN CREATIVE ANIMATION
                  </div>
                </a>
              </div>
              <ul role="list" className="footer__socials w-list-unstyled">
                <li className="footer__socials__link">
                  <a href="https://www.linkedin.com/in/workvictor/" target="_blank" className="footer__socials__a w-inline-block">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text lined" aria-label="LINKEDIN">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            L
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            N
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            K
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            D
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            N
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
                <li className="footer__socials__link">
                  <a href="https://instagram.com/victorwork_" target="_blank" className="footer__socials__a w-inline-block">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text lined" aria-label="INSTAGRAM">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            N
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            S
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            A
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            G
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            A
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            M
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
                <li className="footer__socials__link">
                  <a href="https://x.com/victorwork_" target="_blank" className="footer__socials__a w-inline-block">
                    <div className="subtitle">
                      <div className="subtitle__dot" />
                      <div className="subtitle__text lined" aria-label="X/TWITTER">
                        <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            X
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            /
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            W
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            I
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            T
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            E
                          </div>
                          <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                            R
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
              <div className="footer__disclosure">
                <p className="parag parag__footer participation" style={{ "--mask": "linear-gradient(-15deg, transparent -50%, black 0%)" } as React.CSSProperties}>
                  ORIGINAL EXPERIENCE DESIGN BY VICTOR WORK · VWLAB.IO
                </p>
              </div>
              <a href="https://vwlab.io/products/memorable-web-experience" target="_blank" className="footer__vwlab__link w-inline-block">
                <div className="footer__vwlab">
                  <div className="subtitle">
                    <div className="subtitle__dot" />
                    <div className="subtitle__text subtitle__text__vwlab lined" aria-label="EXPERIENCE CRAFTED WITH ANIMATIONS FROM:">
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          X
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          P
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          R
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          I
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          N
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          C
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          C
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          R
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          A
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          F
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          T
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          D
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          W
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          I
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          T
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          H
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          A
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          N
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          I
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          M
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          A
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          T
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          I
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          O
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          N
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          S
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          F
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          R
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          O
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          M
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          :
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="footer__vwlab__svg w-embed">
                    <svg width="100%" viewBox="0 0 136 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M59.5547 30.2989L59.9178 29.9649V28.8321L60.7165 28.0334H61.8202L62.1687 27.6704V12.9885L62.982 12.1753H64.1147L64.8844 12.9885V27.6704L64.1147 28.4836H62.982L62.6189 28.8321V29.9649L61.8202 30.7345H60.7165L60.368 31.0976V32.2303L59.5547 33H58.422L57.6523 32.2303V31.0976L57.3038 30.7345H56.1711L55.4014 29.9649V28.8321L55.0384 28.4836H53.9056L53.136 27.6704V12.9885L53.9056 12.1753H55.0384L55.8371 12.9885V27.6704L56.1711 28.0334H57.3038L58.1025 28.8321V29.9649L58.422 30.2989H59.5547ZM75.5407 29.9649V12.9885L76.3539 12.1753H77.4867L78.2563 12.9885V29.9649L77.4867 30.7345H76.3539L75.9909 31.0976V32.2303L75.1922 33H74.0885L73.2898 32.2303V31.0976L72.9267 30.7345H71.794L71.4745 31.0976V32.2303L70.6758 33H69.5431L68.7734 32.2303V31.0976L68.4103 30.7345H67.2776L66.5079 29.9649V12.9885L67.2776 12.1753H68.4103L69.2091 12.9885V29.9649L69.5431 30.2989H70.6758L71.0243 29.9649V24.3158L71.794 23.517H72.9267L73.74 24.3158V29.9649L74.0885 30.2989H75.1922L75.5407 29.9649ZM85.7323 32.4336L85.166 33H84.0478L83.2636 32.2013V31.0686L83.8299 30.5022L83.2636 29.9358V28.8031L84.0478 28.0044H85.166L85.7323 28.5707L86.3277 28.0044H87.4314L88.2301 28.8031V29.9358L87.6638 30.5022L88.2301 31.0686V32.2013L87.4314 33H86.3277L85.7323 32.4336ZM85.7323 30.1682L85.4129 30.5022L85.7323 30.8217L86.0954 30.5022L85.7323 30.1682ZM93.2519 32.2303V12.9885L94.0506 12.1753H95.1833L95.9821 12.9885V29.9649L95.4157 30.5312L95.7497 30.8652L96.3161 30.2989H104.231L105.029 31.0976V32.2303L104.231 33H94.0506L93.2519 32.2303ZM109.688 33L108.918 32.2013V31.0686L108.555 30.7345H107.423L106.624 29.9358V26.5522L107.423 25.7389H108.555L108.918 25.4194V24.2867L109.688 23.488H115.337L115.904 24.0544L116.252 23.7204L115.7 23.154V19.7703L115.337 19.4363H109.688L109.354 19.7703V20.8885L108.555 21.7018H107.423L106.624 20.8885V19.7703L107.423 18.9571H108.555L108.918 18.6376V17.5049L109.688 16.7062H115.337L116.136 17.5049V18.6376L116.499 18.9571H117.603L118.401 19.7703V32.2013L117.603 33H109.688ZM109.688 30.2698H115.337L115.904 30.8217L116.252 30.5022L115.7 29.9358V26.5522L116.252 25.9858L115.904 25.6518L115.337 26.2182H109.688L109.354 26.5522V29.9358L109.688 30.2698ZM129.479 32.2013L128.709 33H120.766L119.996 32.2013V12.9595L120.766 12.1753H121.898L122.697 12.9595V16.3431L122.131 16.9095L122.465 17.2725L123.031 16.7062H128.709L129.479 17.4758V18.6086L129.842 18.9571H130.975L131.744 19.7703V29.9358L130.975 30.7055H129.842L129.479 31.0686V32.2013ZM122.131 30.5022L122.465 30.8217L123.031 30.2698H128.709L129.029 29.9358V19.7703L128.709 19.4073H123.031L122.465 18.8409L122.131 19.1749L122.697 19.7703V29.9358L122.131 30.5022Z" fill="var(--color)" />
                      <path d="M24.0449 6.54297C26.8669 6.54301 29.1541 8.83044 29.1543 11.6523C29.1543 14.4744 26.867 16.7627 24.0449 16.7627C23.7243 16.7627 23.4106 16.733 23.1064 16.6763C21.8956 16.4506 20.4976 16.5946 19.7485 17.5723C19.2801 18.1837 19.1881 18.9876 19.2599 19.7545C19.2747 19.9118 19.2822 20.0712 19.2822 20.2324C19.2822 20.7042 19.2181 21.1609 19.0982 21.5945C18.7157 22.9778 18.5268 24.5788 19.4 25.7177C20.2833 26.87 21.9047 27.0985 23.3564 27.0786C23.3802 27.0783 23.4039 27.0781 23.4277 27.0781C26.2497 27.0781 28.5379 29.3656 28.5381 32.1875C28.5381 35.0096 26.2498 37.2979 23.4277 37.2979C20.6058 37.2977 18.3184 35.0095 18.3184 32.1875C18.3184 32.1377 18.3191 32.088 18.3205 32.0385C18.3676 30.3986 18.4454 28.5926 17.4475 27.2904L16.7429 26.3707C16.1545 25.6027 15.1403 25.3427 14.1729 25.3428C13.2048 25.3428 12.1899 25.603 11.601 26.3712L10.9771 27.1853C9.9996 28.4605 10.0985 30.2326 10.2078 31.8356C10.2157 31.9519 10.2197 32.0692 10.2197 32.1875C10.2197 35.0096 7.93145 37.2979 5.10938 37.2979C2.28749 37.2976 0 35.0094 0 32.1875C0.000181406 29.3657 2.2876 27.0784 5.10938 27.0781C6.52336 27.0781 8.08903 26.833 8.94907 25.7106C9.81919 24.5752 9.63157 22.9795 9.24837 21.6012C9.12727 21.1656 9.0625 20.7066 9.0625 20.2324C9.06268 17.4105 11.3509 15.123 14.1729 15.123C14.7366 15.1231 15.2788 15.2146 15.7857 15.3834C16.8157 15.7264 18.0707 15.641 18.7308 14.7791C19.1626 14.2155 19.2112 13.4621 19.0569 12.7691C18.9768 12.4096 18.9346 12.0358 18.9346 11.6523C18.9348 8.83042 21.223 6.54297 24.0449 6.54297ZM32.9209 18.3789C35.7427 18.3791 38.0301 20.6665 38.0303 23.4883C38.0303 26.3103 35.7428 28.5985 32.9209 28.5986C30.0988 28.5986 27.8105 26.3104 27.8105 23.4883C27.8107 20.6664 30.0989 18.3789 32.9209 18.3789Z" fill="var(--color)" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
          <div className="footer__decor">
            <div className="footer__decor__svg w-embed">
              <svg width="100%" viewBox="0 0 1850 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="footer-decor-solid" d="M35.2686 338.908C187.14 177.372 461.874 15.9925 955.769 1.4209C1421.69 -12.3255 1692.58 129.876 1849.27 287.447" stroke="var(--color)" style={{ "strokeDashoffset": "-1971.24", "strokeDasharray": "0px, 999999px" } as React.CSSProperties} />
                <path className="footer-decor-solid" d="M0.268638 199.088C164.321 94.5817 403.312 11.6727 750.769 1.42154C1267.16 -13.8139 1543.97 162.512 1691.27 339.014" stroke="var(--color)" style={{ "strokeDashoffset": "-1820.34", "strokeDasharray": "0.000864px, 1820.45px" } as React.CSSProperties} />
                <path opacity="0.5" d="M35.2686 338.908C187.14 177.372 461.874 15.9925 955.769 1.4209C1421.69 -12.3255 1692.58 129.876 1849.27 287.447" stroke="var(--color-soft)" />
                <path opacity="0.5" d="M0.268638 199.088C164.321 94.5817 403.312 11.6727 750.769 1.42154C1267.16 -13.8139 1543.97 162.512 1691.27 339.014" stroke="var(--color-soft)" />
              </svg>
            </div>
          </div>
          <div className="footer__bottom">
            <div className="footer__bottom__hold">
              <div className="footer__copyrights">
                <div className="subtitle__text">
                  © ALL RIGHTS RESERVED |
                  <span className="year">
                    2026
                  </span>
                </div>
              </div>
              <a href="https://vwlab.io/pages/report" target="_blank" className="footer__credits__link w-inline-block">
                <div className="footer__credits lined">
                  <div className="subtitle">
                    <div className="subtitle__dot" />
                    <div className="subtitle__text" aria-label="DESIGNED AND DEV:">
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          D
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          S
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          I
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          G
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          N
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          D
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          A
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          N
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          D
                        </div>
                      </div>
                      <div className="js-words" aria-hidden="true" style={{ "position": "relative", "display": "inline-block" } as React.CSSProperties}>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          D
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          E
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          V
                        </div>
                        <div aria-hidden="true" style={{ "position": "relative", "display": "inline-block", "opacity": "1" } as React.CSSProperties}>
                          :
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="subtitle__text subtitle__text__victor">
                    VICTOR WORK
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
