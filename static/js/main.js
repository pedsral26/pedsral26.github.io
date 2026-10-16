(() => {
  const PEDS = 'static/videos/Native recorder/Peds only/';
  const ROBOTS = 'static/videos/Native recorder/Robots/';
  const DRIVERS = [
    { key: 'hsfm', name: 'HSFM', klass: 'Force-based', c: 'var(--force)' },
    { key: 'orca', name: 'ORCA', klass: 'Velocity-obstacle', c: 'var(--velocity)' },
    { key: 'socialgail', name: 'SocialGAIL', klass: 'Imitation learning', c: 'var(--imitation)' },
  ];
  const SIMS = [
    { key: 'isaac', name: 'Isaac Sim', klass: 'Photoreal rendering · NVIDIA', logo: 'static/images/logos/isaac.png' },
    { key: 'gazebo', name: 'Gazebo', klass: 'Physics simulation', logo: 'static/images/logos/gazebo.png' },
    { key: 'rviz', name: 'RViz2', klass: 'ROS 2 visualization', logo: 'static/images/logos/ros-dots.png' },
  ];

  // Each viewer: a set of scenarios (tabs), each showing three synchronized videos.
  const VIEWERS = {
    drivers: {
      columns: DRIVERS,
      scenarios: [
        ['bt_coverage', 'BT Coverage'],
        ['escort', 'Escort'],
        ['queue', 'Queue'],
        ['flow_coverage', 'Flow Coverage'],
        ['l_corridor', 'L-Corridor'],
      ],
      src: (s, col) => `${PEDS}${s}_${col.key}.mp4`,
    },
    robots: {
      columns: DRIVERS,
      scenarios: [
        ['bt_coverage', 'BT Coverage'],
        ['escort', 'Escort'],
        ['l_corridor', 'L-Corridor'],
        ['simple_crossing', 'Simple Crossing'],
        ['queue', 'Queue'],
        ['flow_coverage', 'Flow Coverage'],
      ],
      src: (s, col) => `${ROBOTS}robot_${s}_${col.key}_cadrl.mp4`,
      sub: () => 'CADRL robot',
    },
    sims: {
      layout: 'showcase',
      columns: SIMS,
      scenarios: [
        ['queue_and_group_conv', 'Queue & Group Chat', '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M10.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>'],
        ['airport', 'Airport', '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'],
        ['hospital', 'Hospital', '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>'],
      ],
      src: (s, col) => `static/videos/${col.key}_${s}.mp4`,
    },
  };

  const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  const ICON_RESTART = '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>';

  function scenarioTabs(cfg, onSelect) {
    const seg = document.createElement('div');
    seg.className = 'seg';
    seg.setAttribute('role', 'tablist');
    cfg.scenarios.forEach(([, label, icon], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.innerHTML = icon ? `<svg class="tab-ico" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>` : '';
      b.append(label);
      b.addEventListener('click', () => onSelect(i));
      seg.appendChild(b);
    });
    return seg;
  }

  // Showcase: one large stage plus a rail of live previews; clicking a preview promotes it.
  // Video elements are moved between stage and rail rather than duplicated.
  function buildShowcase(el, cfg) {
    let scenario = 0, active = 0, visible = false, paused = false;
    el.classList.add('showcase');
    const head = document.createElement('div');
    head.className = 'viewer-head';
    const seg = scenarioTabs(cfg, (i) => { scenario = i; markTabs(); if (visible) load(); });
    const ctrls = document.createElement('div');
    ctrls.className = 'ctrls';
    const playBtn = document.createElement('button');
    playBtn.className = 'icon-btn'; playBtn.type = 'button';
    const restartBtn = document.createElement('button');
    restartBtn.className = 'icon-btn'; restartBtn.type = 'button';
    restartBtn.title = restartBtn.ariaLabel = 'Restart all';
    restartBtn.innerHTML = ICON_RESTART;
    ctrls.append(playBtn, restartBtn);
    head.append(seg, ctrls);

    const body = document.createElement('div');
    body.className = 'sc-body';
    const stage = document.createElement('div');
    stage.className = 'sc-stage';
    const badge = document.createElement('div');
    badge.className = 'sc-badge';
    stage.appendChild(badge);
    const rail = document.createElement('div');
    rail.className = 'sc-rail';

    const videos = cfg.columns.map(() => {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      return v;
    });
    const thumbs = cfg.columns.map((col, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sc-thumb';
      b.innerHTML = `<span class="sc-thumb-media"><span class="sc-live">On stage</span></span>
        <span class="sc-thumb-cap"><span class="sc-logo"><img src="${col.logo}" alt=""></span>
        <span><b>${col.name}</b><small>${col.klass}</small></span></span>`;
      b.addEventListener('click', () => { active = i; place(); });
      rail.appendChild(b);
      return b;
    });
    body.append(stage, rail);
    el.append(head, body);

    function markTabs() {
      [...seg.children].forEach((b, j) => { b.classList.toggle('on', j === scenario); b.setAttribute('aria-selected', j === scenario); });
    }
    function play(v) { if (!paused && visible) { const p = v.play(); if (p) p.catch(() => {}); } }
    function place() {
      const col = cfg.columns[active];
      badge.innerHTML = `<img src="${col.logo}" alt="">${col.name}<span>${col.klass}</span>`;
      videos.forEach((v, i) => {
        const target = i === active ? stage : thumbs[i].querySelector('.sc-thumb-media');
        if (v.parentNode !== target) target.prepend(v);
        thumbs[i].classList.toggle('on', i === active);
        thumbs[i].setAttribute('aria-pressed', i === active);
        play(v);
      });
    }
    function load() {
      const [key] = cfg.scenarios[scenario];
      videos.forEach((v, i) => {
        const src = encodeURI(cfg.src(key, cfg.columns[i]));
        if (v.getAttribute('src') !== src) { v.setAttribute('src', src); v.load(); }
        play(v);
      });
    }
    function setPlayIcon() {
      playBtn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
      playBtn.title = playBtn.ariaLabel = paused ? 'Play all' : 'Pause all';
    }
    playBtn.addEventListener('click', () => {
      paused = !paused; setPlayIcon();
      videos.forEach((v) => (paused ? v.pause() : play(v)));
    });
    restartBtn.addEventListener('click', () => videos.forEach((v) => { v.currentTime = 0; play(v); }));
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) load(); else videos.forEach((v) => v.pause());
    }, { rootMargin: '200px 0px' }).observe(el);

    setPlayIcon(); markTabs(); place();
  }

  function buildViewer(el) {
    const cfg = VIEWERS[el.dataset.viewer];
    if (!cfg) return;
    if (cfg.layout === 'showcase') { buildShowcase(el, cfg); return; }
    let current = 0;
    let visible = false;
    let paused = false;

    const head = document.createElement('div');
    head.className = 'viewer-head';
    const seg = scenarioTabs(cfg, (i) => select(i));
    const ctrls = document.createElement('div');
    ctrls.className = 'ctrls';
    const playBtn = document.createElement('button');
    playBtn.className = 'icon-btn';
    playBtn.type = 'button';
    const restartBtn = document.createElement('button');
    restartBtn.className = 'icon-btn';
    restartBtn.type = 'button';
    restartBtn.title = restartBtn.ariaLabel = 'Restart all';
    restartBtn.innerHTML = ICON_RESTART;
    ctrls.append(playBtn, restartBtn);
    head.append(seg, ctrls);

    const tiles = document.createElement('div');
    tiles.className = 'tiles';
    const videos = cfg.columns.map((col) => {
      const fig = document.createElement('figure');
      fig.className = 'tile';
      fig.style.setProperty('--c', col.c);
      const media = document.createElement('div');
      media.className = 'tile-media';
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'none';
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      // All tiles share the first column's aspect ratio so captions line up.
      if (!tiles.childElementCount) {
        v.addEventListener('loadedmetadata', () => {
          if (v.videoWidth) tiles.style.setProperty('--ar', `${v.videoWidth} / ${v.videoHeight}`);
        });
      }
      media.appendChild(v);
      const label = document.createElement('span');
      label.className = 'tile-label';
      label.innerHTML = col.logo
        ? `<img src="${col.logo}" alt="">${col.name}`
        : `<span class="dot"></span>${col.name}`;
      media.appendChild(label);
      const cap = document.createElement('figcaption');
      cap.textContent = cfg.sub ? `${col.klass} · ${cfg.sub(col)}` : col.klass;
      fig.append(media, cap);
      tiles.appendChild(fig);
      return v;
    });

    el.append(head, tiles);

    function setPlayIcon() {
      playBtn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
      playBtn.title = playBtn.ariaLabel = paused ? 'Play all' : 'Pause all';
    }
    function playAll() {
      if (paused || !visible) return;
      videos.forEach((v) => { const p = v.play(); if (p) p.catch(() => {}); });
    }
    function pauseAll() { videos.forEach((v) => v.pause()); }
    function load() {
      const [key] = cfg.scenarios[current];
      videos.forEach((v, i) => {
        const src = encodeURI(cfg.src(key, cfg.columns[i]));
        if (v.getAttribute('src') !== src) {
          v.setAttribute('src', src);
          v.load();
        }
      });
      playAll();
    }
    function select(i) {
      current = i;
      [...seg.children].forEach((b, j) => {
        b.classList.toggle('on', j === i);
        b.setAttribute('aria-selected', j === i);
      });
      if (visible) load();
    }

    playBtn.addEventListener('click', () => {
      paused = !paused;
      setPlayIcon();
      paused ? pauseAll() : playAll();
    });
    restartBtn.addEventListener('click', () => {
      videos.forEach((v) => { v.currentTime = 0; });
      playAll();
    });

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) load(); else pauseAll();
    }, { rootMargin: '200px 0px' }).observe(el);

    setPlayIcon();
    select(0);
  }

  document.querySelectorAll('[data-viewer]').forEach(buildViewer);

  // Hero video: pause when off-screen to save CPU.
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause();
    }).observe(heroVideo);
  }

  // Muted autoplay for the overview video, started only once it scrolls into view.
  const yt = document.querySelector('.video-frame iframe[data-src]');
  if (yt) {
    const ytObs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      yt.src = yt.dataset.src;
      ytObs.disconnect();
    }, { threshold: 0.35 });
    ytObs.observe(yt);
  }

  // Nav is transparent over the hero video and turns solid below it; highlight the current section.
  const nav = document.querySelector('.topnav');
  const hero = document.querySelector('.hero');
  const onScroll = () => nav.classList.toggle('on-hero', window.scrollY < hero.offsetHeight - nav.offsetHeight);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  const links = [...nav.querySelectorAll('.navlinks a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  // Theme toggle (remembered per browser).
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  try {
    const saved = localStorage.getItem('peds-theme');
    if (saved) root.dataset.theme = saved;
  } catch (_) {}
  toggle.addEventListener('click', () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('peds-theme', root.dataset.theme); } catch (_) {}
  });

  // Reveal-on-scroll.
  const rev = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => rev.observe(el));

  // Interactive system diagram.
  const sysx = document.getElementById('sysx');
  if (sysx) {
    const LAYERS = {
      ped: 'Pedestrian infrastructure',
      env: 'Environment',
      robot: 'Robot policy',
    };
    const MODS = {
      perception: { layer: 'ped', title: 'Perception Resolver',
        desc: 'Determines which humans and obstacles each pedestrian can perceive, using a KD-tree neighbour lookup followed by field-of-view filtering.' },
      bt: { layer: 'ped', title: 'Need-driven Behavior Trees',
        desc: 'Choose what each pedestrian wants to do next. For example, a thirsty pedestrian queues for and uses a fountain; otherwise they head to a gathering area and join a group conversation.' },
      interaction: { layer: 'ped', title: 'Interaction Manager',
        desc: 'Looks up and routes interactions between agents and places, and enforces interaction contracts so that queues, conversations and similar behaviors stay consistent.' },
      pathfinding: { layer: 'ped', title: 'Global Pathfinding',
        desc: 'Plans each pedestrian’s route to its current target through the map with Dijkstra or A*.' },
      animation: { layer: 'ped', title: 'Animation Generator',
        desc: 'Turns pedestrian motion into animation commands, with a kinematic generator or a dummy one when visuals are not needed.' },
      recording: { layer: 'ped', title: 'Recording / Visualization',
        desc: 'Records trajectories for the dataset and streams the scene to visualizers and external simulators.' },
      driver: { layer: 'ped', title: 'Local Collision Avoidance',
        desc: 'The pedestrian-driver slot. It is the only component that changes between trials: swap the driver and the rest of the pipeline stays fixed.' },
      evaluator: { layer: 'env', title: 'Evaluator',
        desc: 'Scores every episode with the same metrics, such as success rate, collision rate and smoothness, regardless of which driver or policy ran.' },
      simulator: { layer: 'env', title: 'Built-in Simulator',
        desc: 'Lightweight kinematic simulator driven by YAML scenario files. The same scenarios also run in external simulators (Gazebo, Isaac Sim, Unity) over ROS 2.' },
      executor: { layer: 'env', title: 'Deterministic Executor',
        desc: 'Advances the pedestrian driver and the robot policy in lockstep. At a fixed seed, substituting the driver is the only source of trial-to-trial variation.' },
      input: { layer: 'robot', title: 'Input State',
        desc: 'The observation handed to the robot policy at each tick, built from the current pedestrian and robot states.' },
      policy: { layer: 'robot', title: 'Kinematic Policy',
        desc: 'The robot-policy slot. Any navigation policy that maps an observation to a command can be evaluated against every pedestrian driver.' },
      output: { layer: 'robot', title: 'Output State',
        desc: 'The policy’s command, returned as a pose and twist that the executor applies before the next synchronized step.' },
    };
    const DRIVER_INFO = {
      SFM: ['Force-based', 'Social Force Model: pedestrians are attracted to their goals and repelled by other agents and obstacles.'],
      HSFM: ['Force-based', 'Headed Social Force Model: social forces with explicit heading dynamics for smoother, more human-like turning.'],
      ORCA: ['Velocity-obstacle', 'Optimal Reciprocal Collision Avoidance: each agent picks a collision-free velocity, assuming others share the avoidance effort.'],
      Straight: ['Baseline', 'No-avoidance baseline: pedestrians walk straight toward their goals.'],
      NSP: ['Imitation learning', 'Neural Social Physics: a learned model of pedestrian motion trained on human trajectory data.'],
      SocialGAIL: ['Imitation learning', 'Pedestrian policy learned with generative adversarial imitation learning from human trajectories.'],
    };
    const DRIVER_COLOR = { 'Force-based': 'var(--force)', 'Velocity-obstacle': 'var(--velocity)', Baseline: 'var(--baseline)', 'Imitation learning': 'var(--imitation)' };
    const POLICY_INFO = {
      'DRL-VO': 'Deep reinforcement learning policy guided by velocity obstacles.',
      CADRL: 'Collision Avoidance with Deep Reinforcement Learning.',
      SARL: 'Socially Attentive Reinforcement Learning, which attends over surrounding pedestrians.',
      'DS-RNN': 'Decentralized Structural RNN that models robot–human interactions as a spatio-temporal graph.',
    };
    const CYCLE = [
      ['perception', 'Perceive neighbours'],
      ['bt', 'Decide what to do'],
      ['interaction', 'Resolve interactions'],
      ['pathfinding', 'Plan a global route'],
      ['driver', 'Avoid collisions locally'],
      ['animation', 'Animate pedestrians'],
      ['recording', 'Record the step'],
      ['input', 'Build robot observation'],
      ['policy', 'Robot policy acts'],
      ['output', 'Emit pose & twist'],
      ['executor', 'Synchronize in lockstep'],
      ['evaluator', 'Score the episode'],
    ];

    const ICONS = {
      perception: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
      bt: '<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v5M6 17v-5h12v5"/>',
      interaction: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M10.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>',
      pathfinding: '<circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 19h8a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h8"/>',
      animation: '<circle cx="13" cy="4" r="2"/><path d="M8 21l3-6 3 2v4M6 11l3-3 4 1 3 3 3 1M11 15l1-6"/>',
      recording: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3z"/>',
      driver: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 8l2.5 2.5M16 8l-2.5 2.5M12 15.5V13"/>',
      evaluator: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/><path d="m15 7 2 2 4-4"/>',
      simulator: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
      executor: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
      input: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>',
      policy: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l3.3 3.8M7 17l3.3-3.8M13.7 10.8 17 7M13.7 13.2 17 17"/>',
      output: '<circle cx="12" cy="12" r="9"/><path d="M12 12l5-5M13 7h4v4"/>',
    };

    const mods = {};
    sysx.querySelectorAll('.mod').forEach((el) => {
      const id = el.dataset.id;
      mods[id] = el;
      const title = el.querySelector('.mod-t');
      const head = document.createElement('span');
      head.className = 'mod-h';
      head.innerHTML = `<span class="mod-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[id]}</svg></span>`;
      title.replaceWith(head);
      head.appendChild(title);
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.addEventListener('click', (e) => { if (!e.target.closest('.pick')) { stop(); select(id); } });
      el.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); stop(); select(id); }
      });
    });

    const state = { driver: 'HSFM', policy: 'CADRL', sel: 'driver' };
    const panel = {
      step: sysx.querySelector('.panel-step'),
      layer: sysx.querySelector('.panel-layer'),
      title: sysx.querySelector('.panel-title'),
      desc: sysx.querySelector('.panel-desc'),
      extra: sysx.querySelector('.panel-extra'),
    };
    const cycleList = sysx.querySelector('.cycle');
    CYCLE.forEach(([id, label], i) => {
      const li = document.createElement('li');
      li.textContent = label;
      li.addEventListener('click', () => { stop(); showStep(i); });
      cycleList.appendChild(li);
    });

    function render(id, stepIdx) {
      const m = MODS[id];
      panel.layer.textContent = LAYERS[m.layer];
      panel.layer.style.setProperty('--lc', `var(--l-${m.layer})`);
      panel.title.textContent = m.title;
      panel.desc.textContent = m.desc;
      panel.step.textContent = stepIdx == null ? '' : `Step ${stepIdx + 1} of ${CYCLE.length}`;
      panel.extra.innerHTML = '';
      if (id === 'driver') {
        const [klass, text] = DRIVER_INFO[state.driver];
        panel.extra.innerHTML = `<div class="kv"><b>${state.driver}</b><span>${klass}</span></div><p style="margin-top:8px">${text}</p>`;
      } else if (id === 'policy') {
        panel.extra.innerHTML = `<div class="kv"><b>${state.policy}</b><span>${POLICY_INFO[state.policy]}</span></div>`;
      }
      [...cycleList.children].forEach((li, i) => li.classList.toggle('on', i === stepIdx));
    }
    function select(id) {
      state.sel = id;
      Object.values(mods).forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
      render(id, null);
    }

    // Driver / policy pickers.
    const pairChips = { driver: sysx.querySelector('[data-pair="driver"]'), policy: sysx.querySelector('[data-pair="policy"]') };
    sysx.querySelectorAll('.pick').forEach((group) => {
      const kind = group.dataset.pick;
      group.querySelectorAll('button').forEach((b) => {
        if (kind === 'driver') b.style.setProperty('--c', DRIVER_COLOR[DRIVER_INFO[b.dataset.val][0]]);
        b.addEventListener('click', () => {
          state[kind] = b.dataset.val;
          if (kind === 'driver') toy.setDriver(b.dataset.val);
          group.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
          const chip = pairChips[kind];
          chip.textContent = b.dataset.val;
          chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
          if (!playing) select(kind); else if (CYCLE[step][0] === kind) render(kind, step);
        });
        b.classList.toggle('on', b.dataset.val === state[kind]);
      });
    });

    // Toy crowd: a deliberately simple 2-D corridor to convey how driver classes differ.
    const toy = (() => {
      const canvas = sysx.querySelector('.toy-canvas');
      const ctx = canvas.getContext('2d');
      const label = sysx.querySelector('.toy-driver');
      const capDot = label.previousElementSibling;
      const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      let W = 0, H = 0, driver = 'HSFM', agents = [], robot, running = false, last = 0;
      const R = 5, SPEED = 34;

      function size() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function reset() {
        agents = [];
        for (let i = 0; i < 16; i++) {
          const dir = i % 2 ? 1 : -1;
          agents.push({
            x: Math.random() * W, y: 18 + Math.random() * (H - 36),
            vx: dir * SPEED, vy: 0, dir, hit: 0, phase: Math.random() * 6.28,
            speed: SPEED * (0.85 + Math.random() * 0.3), trail: [],
          });
        }
        robot = { x: 10, y: H / 2, vx: SPEED, vy: 0, dir: 1, hit: 0, phase: 0, speed: SPEED * 1.05, trail: [], robot: true };
      }
      function repulse(a, others, A, B) {
        let fx = 0, fy = 0;
        for (const o of others) {
          if (o === a) continue;
          const dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy) || 1e-3;
          if (d > 60) continue;
          const f = A * Math.exp((2 * R - d) / B);
          fx += f * dx / d; fy += f * dy / d;
        }
        // corridor walls
        fy += A * Math.exp((R - a.y) / B) - A * Math.exp((a.y - (H - R)) / B);
        return [fx, fy];
      }
      function ttcPenalty(a, vx, vy, others) {
        let worst = Infinity;
        for (const o of others) {
          if (o === a) continue;
          const px = o.x - a.x, py = o.y - a.y;
          if (px * px + py * py > 90 * 90) continue;
          const rvx = vx - o.vx, rvy = vy - o.vy;
          const r = 2 * R + 2;
          const aa = rvx * rvx + rvy * rvy, bb = px * rvx + py * rvy, cc = px * px + py * py - r * r;
          if (cc < 0) { worst = 0; break; }
          const disc = bb * bb - aa * cc;
          if (bb > 0 && disc > 0) worst = Math.min(worst, (bb - Math.sqrt(disc)) / aa);
        }
        const wall = (a.y + vy * 0.5 < R + 2 || a.y + vy * 0.5 > H - R - 2) ? 5 : 0;
        return 2.2 / Math.max(worst, 0.05) + wall;
      }
      function step(a, all, dt, mode) {
        const gx = a.dir * a.speed, gy = (a.robot ? (H / 2 - a.y) * 0.4 : 0);
        let vx = a.vx, vy = a.vy;
        if (mode === 'Straight') {
          vx = gx; vy = 0;
        } else if (mode === 'ORCA') {
          let best = null, bestCost = Infinity;
          for (let k = -6; k <= 6; k++) {
            for (const sf of [1, 0.7, 0.4]) {
              const ang = k * 0.17, sp = a.speed * sf;
              const cvx = a.dir * sp * Math.cos(ang), cvy = sp * Math.sin(ang);
              const cost = Math.hypot(cvx - gx, cvy - gy) / a.speed + ttcPenalty(a, cvx, cvy, all);
              if (cost < bestCost) { bestCost = cost; best = [cvx, cvy]; }
            }
          }
          vx += (best[0] - vx) * Math.min(1, dt * 6); vy += (best[1] - vy) * Math.min(1, dt * 6);
        } else {
          const learned = mode === 'NSP' || mode === 'SocialGAIL';
          const [fx, fy] = repulse(a, all, learned ? 55 : 80, learned ? 5 : 6);
          let tx = vx + ((gx - vx) / 0.5 + fx) * dt, ty = vy + ((gy - vy) / 0.5 + fy) * dt;
          if (learned) {
            a.phase += dt * (mode === 'SocialGAIL' ? 2.6 : 1.5);
            ty += Math.sin(a.phase) * (mode === 'SocialGAIL' ? 26 : 12) * dt;
          }
          if (mode === 'HSFM') {
            // turn-rate-limited heading for smoother arcs
            const h = Math.atan2(vy, vx), th = Math.atan2(ty, tx);
            let dh = Math.atan2(Math.sin(th - h), Math.cos(th - h));
            dh = Math.max(-2.2 * dt, Math.min(2.2 * dt, dh));
            const sp = Math.hypot(tx, ty);
            tx = sp * Math.cos(h + dh); ty = sp * Math.sin(h + dh);
          }
          vx = tx; vy = ty;
        }
        const sp = Math.hypot(vx, vy), max = a.speed * 1.3;
        if (sp > max) { vx *= max / sp; vy *= max / sp; }
        a.vx = vx; a.vy = vy;
      }
      function frame(t) {
        if (!running) return;
        const dt = Math.min(0.04, (t - last) / 1000 || 0.016);
        last = t;
        const all = agents.concat(robot);
        for (const a of agents) step(a, all, dt, driver);
        step(robot, all, dt, 'robot-sfm');
        for (const a of all) {
          a.x += a.vx * dt; a.y += a.vy * dt;
          a.y = Math.max(R, Math.min(H - R, a.y));
          a.trail.push(a.x, a.y);
          if (a.trail.length > 40) a.trail.splice(0, 2);
          if (a.x > W + 10) { a.x = -10; a.trail = []; if (a.robot) a.y = H / 2; }
          if (a.x < -10) { a.x = W + 10; a.trail = []; }
          a.hit = Math.max(0, a.hit - dt);
        }
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
          if (Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y) < 2 * R - 1) { all[i].hit = all[j].hit = 0.35; }
        }
        draw();
        requestAnimationFrame(frame);
      }
      function draw() {
        const pc = cssVar(DRIVER_COLOR_VAR[driver]), ac = cssVar('--accent'), hc = '#e5484d';
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = cssVar('--line-2'); ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
        ctx.setLineDash([]);
        const all = agents.concat(robot);
        for (const a of all) {
          ctx.strokeStyle = a.robot ? ac : pc;
          ctx.globalAlpha = 0.28; ctx.lineWidth = a.robot ? 2 : 1.4;
          ctx.beginPath();
          for (let k = 0; k < a.trail.length; k += 2) (k ? ctx.lineTo : ctx.moveTo).call(ctx, a.trail[k], a.trail[k + 1]);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        for (const a of all) {
          const r = a.robot ? R + 2 : R;
          ctx.fillStyle = a.robot ? ac : pc;
          ctx.globalAlpha = a.robot ? 1 : (a.dir > 0 ? 0.95 : 0.6);
          ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.283); ctx.fill();
          ctx.globalAlpha = 1;
          if (a.robot) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.283); ctx.stroke(); }
          if (a.hit > 0) { ctx.strokeStyle = hc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x, a.y, r + 3, 0, 6.283); ctx.stroke(); }
        }
      }
      const DRIVER_COLOR_VAR = { SFM: '--force', HSFM: '--force', ORCA: '--velocity', Straight: '--baseline', NSP: '--imitation', SocialGAIL: '--imitation' };
      function play() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
      function pause() { running = false; }
      size(); reset(); draw();
      window.addEventListener('resize', () => { size(); reset(); draw(); });
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      new IntersectionObserver(([e]) => { if (e.isIntersecting && !reduce) play(); else pause(); }).observe(canvas);
      return {
        setDriver(d) {
          driver = d;
          label.textContent = d;
          capDot.style.setProperty('--c', `var(${DRIVER_COLOR_VAR[d]})`);
          reset(); draw();
        },
      };
    })();

    // Executor-cycle playback.
    const playBtn = sysx.querySelector('.sysx-play');
    const playLabel = playBtn.querySelector('span');
    const playIcon = playBtn.querySelector('path');
    let playing = false;
    let step = 0;
    let timer = null;
    function showStep(i) {
      step = i;
      const [id] = CYCLE[i];
      Object.values(mods).forEach((el) => {
        el.classList.remove('sel', 'flash');
        el.querySelector('.step-badge')?.remove();
      });
      const el = mods[id];
      el.classList.add('flash');
      const badge = document.createElement('span');
      badge.className = 'step-badge';
      badge.textContent = i + 1;
      el.appendChild(badge);
      render(id, i);
    }
    function tick() { showStep((step + 1) % CYCLE.length); }
    function start() {
      playing = true;
      sysx.classList.add('playing');
      playBtn.setAttribute('aria-pressed', 'true');
      playLabel.textContent = 'Pause cycle';
      playIcon.setAttribute('d', 'M7 5h4v14H7zM13 5h4v14h-4z');
      showStep(step);
      timer = setInterval(tick, 1700);
    }
    function stop() {
      if (!playing) return;
      playing = false;
      clearInterval(timer);
      sysx.classList.remove('playing');
      playBtn.setAttribute('aria-pressed', 'false');
      playLabel.textContent = 'Play executor cycle';
      playIcon.setAttribute('d', 'M8 5v14l11-7z');
      Object.values(mods).forEach((el) => { el.classList.remove('flash'); el.querySelector('.step-badge')?.remove(); });
    }
    playBtn.addEventListener('click', () => (playing ? stop() : start()));

    select('driver');
  }

  // Section headers: choose one title/intro column split, shared by every section so the
  // columns line up down the page, that best equalizes title and intro heights. A header that
  // still can't balance at that split stacks its intro under the title instead.
  const heads = [...document.querySelectorAll('.section-head:not(.full)')].filter((h) => h.querySelector('h2') && h.querySelector('.section-intro'));
  function balanceHeads() {
    const wide = window.matchMedia('(min-width: 861px)').matches;
    heads.forEach((h) => { h.classList.remove('stacked'); h.style.gridTemplateColumns = ''; });
    if (!wide) return;
    const diffsAt = (pct) => heads.map((h) => {
      h.style.gridTemplateColumns = `minmax(0, ${pct}fr) minmax(0, ${100 - pct}fr)`;
      return Math.abs(h.querySelector('h2').offsetHeight - h.querySelector('.section-intro').offsetHeight);
    });
    let best = null;
    for (let pct = 36; pct <= 60; pct += 2) {
      const diffs = diffsAt(pct);
      const score = diffs.reduce((a, d) => a + d, 0) + Math.abs(pct - 46) * 2;
      if (!best || score < best.score) best = { pct, diffs, score };
    }
    diffsAt(best.pct);
    heads.forEach((h, i) => {
      if (best.diffs[i] > 34) { h.style.gridTemplateColumns = ''; h.classList.add('stacked'); }
    });
  }
  let balanceTimer;
  window.addEventListener('resize', () => { clearTimeout(balanceTimer); balanceTimer = setTimeout(balanceHeads, 120); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(balanceHeads);
  balanceHeads();

  // Figure lightbox.
  const lb = document.querySelector('.lightbox');
  const lbImg = lb.querySelector('img');
  document.querySelectorAll('.figure img').forEach((img) => {
    img.addEventListener('click', () => {
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      lb.classList.add('open');
    });
  });
  document.querySelectorAll('[data-open-fig]').forEach((btn) => {
    btn.addEventListener('click', () => {
      lbImg.src = btn.dataset.openFig;
      lbImg.alt = 'Paper figure';
      lb.classList.add('open');
    });
  });
  lb.addEventListener('click', () => lb.classList.remove('open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('open'); });

  // Copy BibTeX.
  const copyBtn = document.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = document.querySelector('.bib pre').textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      const label = copyBtn.querySelector('span');
      label.textContent = 'Copied';
      setTimeout(() => { label.textContent = 'Copy'; }, 1800);
    });
  }
})();
