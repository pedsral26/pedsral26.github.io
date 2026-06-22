window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');

    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');

    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');

    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function () {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';

            setTimeout(function () {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function (err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function () {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function () {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');

    if (carouselVideos.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });

    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

$(document).ready(function () {
    // Check for click events on the navbar burger icon

    var options = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 5000,
    }

    // Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    bulmaSlider.attach();

    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

})


////////////
// Charts //
////////////

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
});

document.querySelectorAll(".chart-container").forEach(el => {
    observer.observe(el);
});

const liberoBarChart = function (highlightBarsChart, dataset, id, title) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Plugin to show values on top
    const valueLabelPlugin = {
        id: 'valueLabel',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;

            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);

                meta.data.forEach((bar, index) => {
                    const value = dataset.data[index];
                    if (value !== null && value !== undefined) {
                        const { x, y } = bar.tooltipPosition();

                        ctx.save();
                        ctx.font = '14px sans-serif';
                        ctx.fillStyle = 'black';
                        ctx.textAlign = 'center';
                        ctx.fillText(value + '%', x, y - 10);
                        ctx.restore();
                    }
                });
            });
        }
    };
    const createHighlightPlugin = (highlightBars) => ({
        id: 'highlightPlugin',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            highlightBars.forEach(({ datasetIndex, dataIndex, color }) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (meta.data[dataIndex]) {
                    const bar = meta.data[dataIndex];
                    const time = Date.now() / 1000;
                    const intensity = Math.sin(time * Math.PI) * 0.5 + 0.5;
                    ctx.save();
                    ctx.shadowColor = `rgba(${color}, ${intensity})`;
                    ctx.strokeStyle = `rgba(${color}, ${intensity})`;
                    ctx.shadowBlur = 10;
                    ctx.lineWidth = 5;
                    const barWidth = bar.width;
                    const barHeight = chart.chartArea.bottom - bar.y;
                    ctx.strokeRect(bar.x - barWidth / 2, bar.y, barWidth, barHeight);
                    ctx.restore();
                }
            });
            requestAnimationFrame(() => {
                chart.draw();
            });
        }
    });
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [''],
            datasets: dataset
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    position: 'bottom',
                    color: '#000000',
                    padding: {
                        top: 6,
                        bottom: 0
                    },
                    font: {
                        size: 16,
                        // weight: 'bold',
                        family: 'sans-serif'
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false, // Ensures they sit side-by-side
                },
                y: {
                    beginAtZero: false,
                    min: 75,
                    max: 85,
                    title: {
                        display: true,
                        text: 'Success Rate (%)',
                        font: {
                            weight: 'bold',
                            size: 16
                        }
                    }
                }
            }
        },
        plugins: [createHighlightPlugin(highlightBarsChart),

        // Inject your updated data labels layout
        {
            id: 'valueLabels',
            afterDraw: chart => {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, i) => {
                    chart.getDatasetMeta(i).data.forEach((bar, index) => {
                        const originalData = dataset.data[index];
                        if (originalData !== null && originalData !== undefined) {
                            const { x, y } = bar.tooltipPosition();
                            ctx.save();
                            ctx.fillStyle = 'black';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.font = '14px sans-serif';
                            ctx.fillText(originalData.toFixed(1) + '%', x, y - 5);
                            ctx.restore();
                        }
                    });
                });
            }
        }]
    });
};

document.addEventListener('DOMContentLoaded', liberoBarChart(
    highlightBarsChart = [
        { datasetIndex: 4, dataIndex: 0, color: "6, 118, 255" }
    ],
    dataset = [
        { label: 'LAPA', data: [77.8], backgroundColor: '#f87171' },
        { label: 'D-LAPA Model 1', data: [79.8], backgroundColor: '#fb923c' },
        { label: 'D-LAPA Model 2', data: [83.2], backgroundColor: '#fbbf24' },
        { label: 'D-LAPA Model 3', data: [80.2], backgroundColor: '#4ade80' },
        {
            label: 'D-LAPA Model 4', data: [84.2],
            backgroundColor: "rgba(96, 165, 250, 0.5)",
        },

        { label: 'D-LAPA Model 5', data: [77.4], backgroundColor: '#818cf8' }
    ],
    id = "liberoChart",
    title = "LIBERO-LONG Benchmark Results"
))

const calvinBarChart = function (highlightBarsChart, dataset, id, title) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Plugin to dynamically animate highlighting on target bars
    const createHighlightPlugin = (highlightBars) => ({
        id: 'highlightPlugin',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            highlightBars.forEach(({ datasetIndex, dataIndex, color }) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (meta.data[dataIndex]) {
                    const bar = meta.data[dataIndex];
                    const time = Date.now() / 1000;
                    const intensity = Math.sin(time * Math.PI) * 0.5 + 0.5;
                    ctx.save();
                    ctx.shadowColor = `rgba(${color}, ${intensity})`;
                    ctx.strokeStyle = `rgba(${color}, ${intensity})`;
                    ctx.shadowBlur = 10;
                    ctx.lineWidth = 4;
                    const barWidth = bar.width;
                    const barHeight = chart.chartArea.bottom - bar.y;
                    ctx.strokeRect(bar.x - barWidth / 2, bar.y, barWidth, barHeight);
                    ctx.restore();
                }
            });
            requestAnimationFrame(() => {
                chart.draw();
            });
        }
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            // Sequential labels representing successive tasks
            labels: ['1 Task', '2 Tasks', '3 Tasks', '4 Tasks', '5 Tasks'],
            datasets: dataset
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    position: 'bottom',
                    color: '#000000',
                    padding: {
                        top: 6,
                        bottom: 0
                    },
                    font: {
                        size: 16,
                        // weight: 'bold',
                        family: 'sans-serif'
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false // Ensures side-by-side grouping per task
                },
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Success Rate (%)',
                        font: {
                            weight: 'bold',
                            size: 16
                        }
                    }
                }
            }
        },
        plugins: [
            createHighlightPlugin(highlightBarsChart),
            {
                id: 'valueLabels',
                afterDraw: chart => {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                        chart.getDatasetMeta(i).data.forEach((bar, index) => {
                            const originalData = dataset.data[index];
                            if (originalData !== null && originalData !== undefined) {
                                const { x, y } = bar.tooltipPosition();
                                ctx.save();
                                ctx.fillStyle = 'black';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.font = '11px sans-serif'; // Reduced slightly for dense 5-group display
                                ctx.fillText(originalData.toFixed(1) + '%', x, y - 5);
                                ctx.restore();
                            }
                        });
                    });
                }
            }
        ]
    });
};

// Execution / Initialization 
document.addEventListener('DOMContentLoaded', () => {
    calvinBarChart(
        highlightBarsChart = [
            { datasetIndex: 0, dataIndex: 0, color: "248, 64, 64" },
            { datasetIndex: 1, dataIndex: 1, color: "164, 119, 1" },
            { datasetIndex: 1, dataIndex: 2, color: "164, 119, 1" },
            { datasetIndex: 1, dataIndex: 3, color: "164, 119, 1" },
            { datasetIndex: 1, dataIndex: 4, color: "164, 119, 1" },
        ],
        dataset = [
            {
                label: 'LAPA',
                data: [86.8, 61.2, 44.8, 34.1, 22.2],
                backgroundColor: '#f87171'
            },
            {
                label: 'D-LAPA Model 2',
                data: [84.2, 65.5, 46.0, 34.3, 24.6],
                backgroundColor: '#fbbf24'
            },
            {
                label: 'D-LAPA Model 4',
                data: [84.6, 63.2, 44.9, 34.0, 23.9],
                backgroundColor: "rgba(96, 165, 250, 0.5)"
            }
        ],
        id = "calvinChart",
        title = "CALVIN Long-Horizon Results"
    );
});

const modelData = {
    model1: `
    <div class="model-detail-header mb-4">
      <h4 class="title is-4 has-text-link">Model 1: Discrete Indexing</h4>
      <p class="subtitle is-6 text-muted">Depth Image with RGB-Index Conditioning</p>
    </div>

    <div class="columns is-multiline mb-4">
      <div class="column is-6">
        <div class="tags-container">
          <span class="tag is-info is-light"><strong>Input 1:</strong> Depth Image $D_t$</span>
          <span class="tag is-link is-light"><strong>Input 2:</strong> RGB Latent Indices $z_t^{\\mathrm{rgb\\text{-}idx}}$</span>
        </div>
      </div>
      <div class="column is-6 has-text-right-tablet">
        <span class="tag is-info is-light"><strong>Supervision:</strong> Cross-Entropy (CE)</span>
      </div>
    </div>

    <div class="equation-block box py-4 px-5 my-4">
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Forward Pass & Logits Estimation:</p>
      $$h_t^D = f_{\\phi}^{(1)}\\left(D_t,\\, z_t^{\\mathrm{rgb\\text{-}idx}}\\right), \\qquad \\hat{\\ell}_t^D = g_{\\phi}^{(1)}(h_t^D)$$
      <p class="is-size-7 text-muted mt-2">Where $\\hat{\\ell}_t^D \\in \\mathbb{R}^{4 \\times K}$ over codebook size $K=8$.</p>
      
      <hr class="my-3" style="height: 1px; background-color: #e2e8f0;">
      
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Objective Function:</p>
      $$\\mathcal{L}_{\\mathrm{M1}} = \\mathrm{CE}\\left(\\hat{\\ell}_t^D,\\, z_t^{\\mathrm{depth\\text{-}idx}}\\right)$$
    </div>

    <div class="message is-info mt-4">
      <div class="message-body py-3 px-4 text-justified">
        <strong>Ablation Target:</strong> Tests whether coarse <em>index-level conditioning</em> provides sufficient cross-modality constraints. The intermediate feature $h_t^D$ is passed to the downstream fusion network, but it bypasses direct feature regression constraints.
      </div>
    </div>
  `,

    model2: `
    <div class="model-detail-header mb-4">
      <h4 class="title is-4 has-text-link">Model 2: Continuous Conditioning Classification</h4>
      <p class="subtitle is-6 text-muted">Depth Image with RGB-Feature Conditioning</p>
    </div>

    <div class="columns is-multiline mb-4">
      <div class="column is-6">
        <div class="tags-container">
          <span class="tag is-info is-light"><strong>Input 1:</strong> Depth Image $D_t$</span>
          <span class="tag is-link is-light"><strong>Input 2:</strong> Continuous RGB Feature $z_t^{\\mathrm{rgb\\text{-}feat}}$</span>
        </div>
      </div>
      <div class="column is-6 has-text-right-tablet">
        <span class="tag is-info is-light"><strong>Supervision:</strong> Cross-Entropy (CE)</span>
      </div>
    </div>

    <div class="equation-block box py-4 px-5 my-4">
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Forward Pass & Logits Estimation:</p>
      $$h_t^D = f_{\\phi}^{(2)}\\left(D_t,\\, z_t^{\\mathrm{rgb\\text{-}feat}}\\right), \\qquad \\hat{\\ell}_t^D = g_{\\phi}^{(2)}(h_t^D)$$
      
      <hr class="my-3" style="height: 1px; background-color: #e2e8f0;">
      
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Objective Function:</p>
      $$\\mathcal{L}_{\\mathrm{M2}} = \\mathrm{CE}\\left(\\hat{\\ell}_t^D,\\, z_t^{\\mathrm{depth\\text{-}idx}}\\right)$$
    </div>

    <div class="message is-info mt-4">
      <div class="message-body py-3 px-4 text-justified">
        <strong>Ablation Target:</strong> Directly contrasts against Model 1 to evaluate if rich <em>feature-level continuous signals</em> provide cleaner contextual anchors for tokenized depth extraction than discrete equivalents.
      </div>
    </div>
  `,

    model3: `
    <div class="model-detail-header mb-4">
      <h4 class="title is-4 has-text-link">Model 3: Blind Token Prediction</h4>
      <p class="subtitle is-6 text-muted">RGB-Feature-Only Depth-Token Prediction</p>
    </div>

    <div class="columns is-multiline mb-4">
      <div class="column is-6">
        <div class="tags-container">
          <span class="tag is-link is-light"><strong>Input 1:</strong> Frozen RGB Feature $z_t^{\\mathrm{rgb\\text{-}feat}}$</span>
        </div>
      </div>
      <div class="column is-6 has-text-right-tablet">
        <span class="tag is-info is-light"><strong>Supervision:</strong> Cross-Entropy (CE)</span>
        <span class="tag is-warning is-light"><strong>Omitted:</strong> Explicit Depth Image ($D_t$)</span>
      </div>
    </div>

    <div class="equation-block box py-4 px-5 my-4">
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Forward Pass & Logits Estimation:</p>
      $$h_t^D = f_{\\phi}^{(3)}\\left(z_t^{\\mathrm{rgb\\text{-}feat}}\\right), \\qquad \\hat{\\ell}_t^D = g_{\\phi}^{(3)}(h_t^D)$$
      
      <hr class="my-3" style="height: 1px; background-color: #e2e8f0;">
      
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Objective Function:</p>
      $$\\mathcal{L}_{\\mathrm{M3}} = \\mathrm{CE}\\left(\\hat{\\ell}_t^D,\\, z_t^{\\mathrm{depth\\text{-}idx}}\\right)$$
    </div>

    <div class="message is-warning mt-4">
      <div class="message-body py-3 px-4 text-justified">
        <strong>Ablation Target:</strong> Serves as a primary baseline control check. Removing the depth image entirely evaluates whether the frozen RGB stream inherently encapsulates latent biases capable of inferring <em>discrete geometry transitions</em> without real-time physical sensor input.
      </div>
    </div>
  `,

    model4: `
    <div class="model-detail-header mb-4">
      <h4 class="title is-4" style="color: #48c774">Model 4: Full Feature Distillation</h4>
      <p class="subtitle is-6 text-muted">Depth Image & RGB-Feature Conditioned Feature Distillation</p>
    </div>

    <div class="columns is-multiline mb-4">
      <div class="column is-6">
        <div class="tags-container">
          <span class="tag is-success is-light"><strong>Input 1:</strong>Depth Image $D_t$</span>
          <span class="tag is-success is-light"><strong>Input 2:</strong> Continuous RGB Feature $z_t^{\\mathrm{rgb\\text{-}feat}}$</span>
        </div>
      </div>
      <div class="column is-6 has-text-right-tablet">
        <span class="tag is-success is-light"><strong>Supervision:</strong> Multi-Objective Distillation</span>
      </div>
    </div>

    <div class="equation-block box py-4 px-5 my-4">
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Continuous Latent Estimation:</p>
      $$\\hat{z}_t^D = f_{\\phi}^{(4)}\\left(D_t,\\, z_t^{\\mathrm{rgb\\text{-}feat}}\\right)$$
      
      <hr class="my-3" style="height: 1px; background-color: #e2e8f0;">
      
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Joint Loss Formulation:</p>
      $$\\mathcal{L}_{\\mathrm{M4}} = \\left\\|\\hat{z}_t^D - z_t^{\\mathrm{depth\\text{-}feat}}\\right\\|_2^2 + \\lambda_{\\cos}\\left(1 - \\cos\\left(\\hat{z}_t^D,\\, z_t^{\\mathrm{depth\\text{-}feat}}\\right)\\right)$$
      <p class="is-size-7 text-muted mt-2">Where $\\lambda_{\\cos}=0.1$. The L2 norm preserves strict spatial magnitudes while the cosine constraint locks directional representation paths.</p>
    </div>

    <div class="message is-success mt-4">
      <div class="message-body py-3 px-4 text-justified">
        <strong>Core Architecture Design:</strong> Our default Stage 2.5 design framework. Bypassing categorical classification bounds allows it to distill a continuous feature manifold directly from the Stage 1 teacher model, cleanly locking onto <em>dense geometric layouts</em> required for high-frequency tracking.
      </div>
    </div>
  `,

    model5: `
    <div class="model-detail-header mb-4">
      <h4 class="title is-4" style="color: #48c774">Model 5: Continuous Hallucination Network</h4>
      <p class="subtitle is-6 text-muted">RGB-Feature-Only Continuous Feature Distillation</p>
    </div>

    <div class="columns is-multiline mb-4">
      <div class="column is-6">
        <div class="tags-container">
          <span class="tag is-success is-light"><strong>Input 1:</strong> Frozen RGB Feature $z_t^{\\mathrm{rgb\\text{-}feat}}$</span>
        </div>
      </div>
      <div class="column is-6 has-text-right-tablet">
        <span class="tag is-success is-light"><strong>Supervision:</strong> Multi-Objective Distillation</span>
        <span class="tag is-warning is-light"><strong>Omitted:</strong> Explicit Depth Maps ($D_t$)</span>
      </div>
    </div>

    <div class="equation-block box py-4 px-5 my-4">
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Continuous Feature Mapping:</p>
      $$\\hat{z}_t^D = f_{\\phi}^{(5)}\\left(z_t^{\\mathrm{rgb\\text{-}feat}}\\right)$$
      
      <hr class="my-3" style="height: 1px; background-color: #e2e8f0;">
      
      <p class="is-size-6 mb-2 text-muted font-weight-bold">Joint Loss Formulation:</p>
      $$\\mathcal{L}_{\\mathrm{M5}} = \\left\\|\\hat{z}_t^D - z_t^{\\mathrm{depth\\text{-}feat}}\\right\\|_2^2 + \\lambda_{\\cos}\\left(1 - \\cos\\left(\\hat{z}_t^D,\\, z_t^{\\mathrm{depth\\text{-}feat}}\\right)\\right)$$
    </div>

    <div class="message is-warning mt-4">
      <div class="message-body py-3 px-4 text-justified">
        <strong>Ablation Target:</strong> Explores model boundaries by verifying if dense continuous geometry can be purely <em>hallucinated</em> from semantic structures within the frozen visual backbone without direct spatial sensor feedback during downstream interaction.
      </div>
    </div>
  `
};

let activeModel = null;

const panel = document.getElementById("model-detail-panel");
const content = panel.querySelector(".model-detail-content");

document.querySelectorAll(".model-item").forEach(item => {
    item.addEventListener("click", () => {
        const modelKey = item.dataset.model;

        // Toggle same model
        if (activeModel === modelKey) {
            panel.classList.remove("active");
            activeModel = null;
            return;
        }

        // Update content with animation
        content.classList.remove("fade");
        void content.offsetWidth; // force reflow
        content.innerHTML = modelData[modelKey];
        if (window.MathJax) {
            MathJax.typesetPromise([content]);
        }
        content.classList.add("fade");

        panel.classList.add("active");
        activeModel = modelKey;
    });
});