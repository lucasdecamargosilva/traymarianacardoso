(function () {
    // ─── LOG HELPER ───────────────────────────────────────────────────────────────
    const LOG = {
        prefix: '%c[Provador MC]',
        style: 'background:#000;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;font-size:10px;',
        info: function (msg, data) { console.log(LOG.prefix + ' ' + msg, LOG.style, ...(data !== undefined ? [data] : [])); },
        ok: function (msg, data) { console.log('%c[Provador MC] ✓ ' + msg, 'background:#16a34a;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;font-size:10px;', ...(data !== undefined ? [data] : [])); },
        warn: function (msg, data) { console.warn('%c[Provador MC] ⚠ ' + msg, 'background:#d97706;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;font-size:10px;', ...(data !== undefined ? [data] : [])); },
        error: function (msg, data) { console.error('%c[Provador MC] ✗ ' + msg, 'background:#dc2626;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;font-size:10px;', ...(data !== undefined ? [data] : [])); },
        group: function (label) { console.groupCollapsed(LOG.prefix + ' ' + label, LOG.style); },
        end: function () { console.groupEnd(); },
    };

    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/quantic-materialize';
    const LOGO_URL = 'https://images.tcdn.com.br/files/1173244/themes/75/img/settings/logo-new.svg';

    LOG.info('Script carregado — Provador Virtual Mariana Cardoso (Tray)');

    // ─── TABELAS DE TAMANHOS ──────────────────────────────────────────────────────

    const SIZES_TOP = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];
    const SIZES_BOTTOM = ['36/XXP', '38/XP', '40/P', '42/M', '44/G', '46/XG', '48/XXG', '50/3XG', '52/4XG', '54/5XG'];
    const SIZES_BOTTOM_SW = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];

    const GRADE = {
        regular: [49, 51, 54, 57, 61, 62, 64, 66, 70, 73],
        oversized: [58, 60, 62, 64, 66, 70, 73, 76, 79, 83],
        oversizedSS: [58, 61, 63, 67, 70, 74, 78, 82, 87, 92],
        hoodie: [50, 53, 55, 58, 62, 65, 69, 74, 79, 83],
        boxyHoodie: [61, 77, 78, 79, 80, 81, 82, 83, 84, 85],
        puffer: [53, 56, 59, 61, 70, 74, 78, 82, 86, 90],
        vest: [52, 55, 57, 59, 63, 66, 70, 72, 76, 82],
        boxyHenley: [54, 56, 58, 64, 66, 68, 70, 76, 78, 84],
        bottomTailoring: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        bottomSweat: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        underwear: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        quadrilTailoring: [48, 50, 52, 56, 58, 60, 62, 64, 66, 68],
        quadrilSweat: [48, 50, 52, 54, 56, 58, 60, 62, 64, 66],
        quadrilUnderwear: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68],
    };

    // ─── DETECÇÃO DO PRODUTO ──────────────────────────────────────────────────────

    function detectProduct(name) {
        const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        LOG.group('Detecção de produto');
        LOG.info('Nome bruto: "' + name + '"');
        LOG.info('Nome normalizado: "' + n + '"');
        let result;
        if (/tailoring/.test(n) || /\d\/\d\s*short/.test(n) || /\b(1\/5|2\/5|3\/5|4\/5)\b/.test(n)) result = { category: 'bottom', fit: 'tailoring' };
        else if (/underwear|cueca/.test(n)) result = { category: 'bottom', fit: 'underwear' };
        else if (/sweatpant|sweatshort|sweat pant|sweat short|calca|bermuda/.test(n)) result = { category: 'bottom', fit: 'sweat' };
        else if (/henley/.test(n)) result = { category: 'top', fit: 'boxyHenley' };
        else if (/boxy.*(hoodie|crewneck|crew)/.test(n) || /(hoodie|crewneck|crew).*boxy/.test(n)) result = { category: 'top', fit: 'boxyHoodie' };
        else if (/puffer|jacket/.test(n)) result = { category: 'top', fit: 'puffer' };
        else if (/vest/.test(n)) result = { category: 'top', fit: 'vest' };
        else if (/(hoodie|hoodie zip|half zip|crewneck|crew neck)/.test(n) && !/oversized|boxy|short sleeve/.test(n)) result = { category: 'top', fit: 'hoodie' };
        else if (/oversized.*(hoodie|crewneck|crew|short sleeve)/.test(n) || /short sleeve.*(hoodie|crewneck)/.test(n)) result = { category: 'top', fit: 'oversizedSS' };
        else if (/oversized|boxy tee|2\/4/.test(n)) result = { category: 'top', fit: 'oversized' };
        else result = { category: 'top', fit: 'regular' };
        LOG.ok('Produto detectado:', result);
        LOG.end();
        return result;
    }

    // ─── CÁLCULOS DE MEDIDAS ──────────────────────────────────────────────────────

    function estimarTorax(altura, peso) {
        if (altura < 3) altura *= 100;
        let circ = 0.65 * peso + 56;
        const imc = peso / Math.pow(altura / 100, 2);
        if (imc > 30) circ += 4; else if (imc > 25) circ += 2;
        LOG.info('Tórax estimado: ' + circ.toFixed(1) + 'cm  |  IMC: ' + imc.toFixed(1));
        return circ;
    }

    function findClosest(arr, val) {
        let idx = 0, minDiff = Infinity;
        arr.forEach((v, i) => { const d = Math.abs(v - val); if (d < minDiff) { minDiff = d; idx = i; } });
        return idx;
    }

    let recommendedSize = 'M';
    let currentProduct = { category: 'top', fit: 'regular' };

    function calcTop(fit) {
        const altura = parseFloat(document.getElementById('mc-h-val').value);
        const peso = parseFloat(document.getElementById('mc-w-val').value);
        if (!altura || !peso) return;
        const torax = estimarTorax(altura, peso);
        const folga = { regular: 4, oversized: 8, oversizedSS: 8, hoodie: 6, boxyHoodie: 12, puffer: 10, vest: 5, boxyHenley: 9 };
        const larguraAlvo = torax / 2 + (folga[fit] || 4);
        recommendedSize = SIZES_TOP[findClosest(GRADE[fit], larguraAlvo)];
        LOG.group('Cálculo de tamanho (top)');
        LOG.info('Fit: ' + fit + '  |  Folga: ' + (folga[fit] || 4) + 'cm');
        LOG.info('Largura alvo (meia-tórax + folga): ' + larguraAlvo.toFixed(1) + 'cm');
        LOG.ok('Tamanho recomendado: ' + recommendedSize);
        LOG.end();
        document.getElementById('mc-res-letter').innerText = recommendedSize;
    }

    function calcBottom(fit) {
        const cintura = parseFloat(document.getElementById('mc-cin-val').value);
        const quadril = parseFloat(document.getElementById('mc-quad-val').value);
        if (!cintura || !quadril) return;
        let gradeC, gradeQ, sizes;
        if (fit === 'tailoring') { gradeC = GRADE.bottomTailoring; gradeQ = GRADE.quadrilTailoring; sizes = SIZES_BOTTOM; }
        else if (fit === 'underwear') { gradeC = GRADE.underwear; gradeQ = GRADE.quadrilUnderwear; sizes = SIZES_BOTTOM_SW; }
        else { gradeC = GRADE.bottomSweat; gradeQ = GRADE.quadrilSweat; sizes = SIZES_BOTTOM_SW; }
        const idxC = findClosest(gradeC, cintura / 2);
        const idxQ = findClosest(gradeQ, quadril / 2);
        recommendedSize = sizes[Math.max(idxC, idxQ)];
        LOG.group('Cálculo de tamanho (bottom)');
        LOG.info('Fit: ' + fit + '  |  Cintura: ' + cintura + 'cm  |  Quadril: ' + quadril + 'cm');
        LOG.info('Índice cintura: ' + idxC + '  |  Índice quadril: ' + idxQ + '  →  usado: ' + Math.max(idxC, idxQ));
        LOG.ok('Tamanho recomendado: ' + recommendedSize);
        LOG.end();
        document.getElementById('mc-res-letter').innerText = recommendedSize;
    }

    function calculateFinalSize() {
        LOG.info('Calculando tamanho final...');
        if (currentProduct.category === 'top') calcTop(currentProduct.fit);
        else calcBottom(currentProduct.fit);
    }

    // ─── LOCK / UNLOCK SCROLL DA PÁGINA ──────────────────────────────────────────

    let scrollY = 0;

    function lockBodyScroll() {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflowY = 'scroll';
    }

    function unlockBodyScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
    }

    // ─── ESTILOS ──────────────────────────────────────────────────────────────────

    const styles = `
        :root {
            --mc-primary: #000000;
            --mc-bg: #ffffff;
            --mc-border: #000000;
            --mc-gray: #f5f5f5;
            --mc-text: #000000;
            --mc-text-light: #666666;
        }
        .mc-btn-trigger-ia {
            position: absolute;
            top: 60px;
            left: 15px;
            z-index: 10;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
            transition: filter 0.2s ease;
        }
        .mc-btn-trigger-ia:hover { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28)); }
        .mc-btn-trigger-ia img { width: 100%; height: 100%; object-fit: contain; }
        #mc-modal-ia {
            display: none; position: fixed; inset: 0;
            background: rgba(255,255,255,0.98);
            z-index: 999999; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif;
        }
        .mc-card-ia {
            background: var(--mc-bg); width: 100%; max-width: 480px;
            padding: 0; position: relative; color: var(--mc-text);
            border: 1px solid var(--mc-border); max-height: 94vh;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .mc-content-scroll { padding: 40px 30px; overflow-y: auto; flex: 1; text-align: center; }
        .mc-close-ia {
            position: absolute; top: 20px; right: 20px;
            background: none; border: none; color: var(--mc-text);
            cursor: pointer; font-size: 24px; z-index: 100; font-weight: 300;
        }
        .mc-tips-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
            padding: 20px 0; margin: 20px 0;
            border-top: 1px solid var(--mc-gray); border-bottom: 1px solid var(--mc-gray);
        }
        .mc-tip-item {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            font-size: 9px; font-weight: 600; letter-spacing: 1px;
            text-transform: uppercase; color: var(--mc-text-light);
        }
        .mc-tip-item i { color: var(--mc-primary); font-size: 20px; }
        .mc-lead-form { margin: 30px 0 20px; display: flex; flex-direction: column; gap: 20px; text-align: left; }
        .mc-input-row { display: flex; gap: 15px; }
        .mc-group { flex: 1; }
        .mc-group label {
            display: block; font-size: 9px; font-weight: 600;
            letter-spacing: 1.5px; color: var(--mc-text); margin-bottom: 8px; text-transform: uppercase;
        }
        .mc-input {
            width: 100%; padding: 15px; border: 1px solid var(--mc-border);
            font-size: 13px; font-family: 'Inter', sans-serif;
            background: transparent; color: var(--mc-text); outline: none; box-sizing: border-box;
            border-radius: 0; -webkit-appearance: none; appearance: none;
        }
        .mc-input:focus { border-width: 2px; padding: 14px; }
        .mc-input-hint { font-size: 9px; color: var(--mc-text-light); letter-spacing: 0.5px; margin-top: 6px; }
        .mc-btn-black {
            background: var(--mc-primary); color: var(--mc-bg);
            border: 1px solid var(--mc-primary); width: 100%; padding: 18px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 11px;
            letter-spacing: 2px; text-transform: uppercase; cursor: pointer; margin-top: 20px; transition: 0.3s;
        }
        .mc-btn-black:disabled { background: var(--mc-gray); color: #999; border-color: var(--mc-gray); cursor: not-allowed; }
        .mc-btn-black:not(:disabled):hover { background: var(--mc-bg); color: var(--mc-primary); }
        .mc-btn-buy {
            background: var(--mc-primary); color: var(--mc-bg);
            border: 1px solid var(--mc-primary); width: 100%; padding: 20px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 12px;
            letter-spacing: 2px; text-transform: uppercase; cursor: pointer; margin-bottom: 15px; transition: 0.3s;
        }
        .mc-btn-buy:hover { background: var(--mc-bg); color: var(--mc-primary); }
        .mc-btn-outline {
            background: var(--mc-bg); color: var(--mc-primary);
            border: 1px solid var(--mc-border); width: 100%; padding: 18px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 11px;
            letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: 0.3s;
        }
        .mc-btn-outline:hover { background: var(--mc-primary); color: var(--mc-bg); }
        .mc-powered-footer {
            background: var(--mc-bg); padding: 20px;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            flex-shrink: 0; border-top: 1px solid var(--mc-gray);
        }
        .mc-quantic-logo { height: 18px; filter: brightness(0); }
        .mc-status-msg {
            display: none; font-size: 9px; letter-spacing: 1px; color: #ef4444;
            margin-top: 8px; font-weight: 600; text-align: left; text-transform: uppercase;
        }
        @keyframes mc-slide { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes mc-pulse-text { 0%, 100% { opacity: 0.4; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
        .mc-content-scroll::-webkit-scrollbar { width: 4px; }
        .mc-content-scroll::-webkit-scrollbar-thumb { background: #e5e5e5; }

        @media (min-width: 768px) {
            .mc-card-ia.is-result { width: 820px !important; max-width: 90vw !important; height: 560px !important; border-radius: 0 !important; }
            .mc-card-ia.is-result #mc-header-provador,
            .mc-card-ia.is-result .mc-powered-footer { display: none !important; }
            .mc-card-ia.is-result .mc-content-scroll { padding: 0 !important; height: 100% !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
            .mc-card-ia.is-result #mc-step-result { display: flex !important; flex-direction: row !important; width: 100%; height: 100%; align-items: stretch; }
            .mc-card-ia.is-result #mc-result-img-col { width: 45% !important; height: 100% !important; margin: 0 !important; border: none !important; border-right: 1px solid var(--mc-border) !important; position: relative !important; flex-shrink: 0; }
            .mc-card-ia.is-result #mc-result-img-col img { position: absolute !important; top: 0; left: 0; width: 100% !important; height: 100% !important; object-fit: cover !important; object-position: top center !important; }
            .mc-card-ia.is-result #mc-result-actions-col { width: 55% !important; height: 100% !important; padding: 40px !important; display: flex !important; flex-direction: column; justify-content: center; box-sizing: border-box; overflow-y: auto; }
            .mc-card-ia.is-result .mc-res-title { display: block !important; font-size: 20px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--mc-text); margin-bottom: 4px; }
            .mc-card-ia.is-result .mc-res-subtitle { display: block !important; font-size: 11px; color: var(--mc-text-light); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 30px; }
            .mc-card-ia.is-result .mc-metrics-row { display: flex !important; gap: 15px; margin-bottom: 30px; }
            .mc-card-ia.is-result .mc-metric-card { flex: 1; background: transparent; border: 1px solid var(--mc-border); border-radius: 0; padding: 16px; }
            .mc-card-ia.is-result .mc-metric-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--mc-text-light); margin-bottom: 6px; display: block; }
            .mc-card-ia.is-result .mc-metric-value { font-size: 20px; font-weight: 700; color: var(--mc-text); }
            .mc-card-ia.is-result .mc-metric-unit { font-size: 12px; color: var(--mc-text-light); margin-left: 2px; }
            .mc-card-ia.is-result .mc-size-card { display: flex !important; align-items: center; gap: 16px; background: var(--mc-gray); border: 1px solid var(--mc-border); border-radius: 0; padding: 20px; margin-bottom: 24px; }
            .mc-card-ia.is-result .mc-size-circle { width: 44px; height: 44px; border-radius: 50%; background: var(--mc-primary); color: var(--mc-bg); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
            .mc-card-ia.is-result .mc-size-info { flex: 1; }
            .mc-card-ia.is-result .mc-size-info strong { display: block; font-size: 11px; font-weight: 600; color: var(--mc-text); margin-bottom: 4px; letter-spacing: 1.5px; text-transform: uppercase; }
            .mc-card-ia.is-result .mc-size-info span { font-size: 9px; color: var(--mc-text-light); letter-spacing: 1px; text-transform: uppercase; display: block; }
            .mc-card-ia.is-result .mc-size-check { color: var(--mc-primary); font-size: 24px; flex-shrink: 0; }
            .mc-card-ia.is-result .mc-res-note { display: flex !important; align-items: flex-start; gap: 8px; font-size: 10px; color: var(--mc-text-light); font-style: italic; letter-spacing: 1px; margin-bottom: 24px; line-height: 1.5; }
            .mc-card-ia.is-result .mc-res-note i { flex-shrink: 0; margin-top: 1px; font-size: 14px; }
            .mc-card-ia.is-result .mc-btn-buy { border-radius: 0 !important; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 11px !important; padding: 18px !important; margin-bottom: 12px; font-weight: 600; letter-spacing: 2px !important; text-transform: uppercase !important; }
            .mc-card-ia.is-result .mc-btn-outline { border-radius: 0 !important; display: flex; align-items: center; justify-content: center; font-size: 11px !important; padding: 18px !important; margin-top: 0; font-weight: 600; letter-spacing: 2px !important; text-transform: uppercase !important; }
            .mc-card-ia.is-result .mc-res-mobile-only { display: none !important; }
            .mc-card-ia.is-result .mc-close-ia { top: 16px; right: 16px; color: var(--mc-text); z-index: 10; }
        }
    `;

    const stampImageHTML = `<img src="https://i.ibb.co/4wFQF9pb/provador-tag.webp" alt="Provador Virtual" style="width:100%;height:100%;object-fit:contain;">`;


    const html = `
        <div id="mc-modal-ia">
            <div class="mc-card-ia">
                <button type="button" class="mc-close-ia" id="mc-close-btn">&times;</button>
                <div class="mc-content-scroll">
                    <div id="mc-header-provador">
                        <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Provador Virtual</h1>
                        <div style="margin:0 0 4px;text-align:center;">
                            <img src="${LOGO_URL}" alt="Mariana Cardoso" style="height:32px;width:auto;display:inline-block;object-fit:contain;" onerror="this.style.display='none'"/>
                        </div>
                    </div>
                    <div id="mc-step-upload">
                        <div class="mc-lead-form">
                            <div class="mc-group">
                                <label>Seu WhatsApp</label>
                                <input type="tel" id="mc-phone" class="mc-input" placeholder="(11) 99999-9999" maxlength="15">
                                <div id="mc-phone-error" class="mc-status-msg">Insira um n&#250;mero v&#225;lido</div>
                            </div>
                            <div id="mc-fields-top" style="display:none;">
                                <div class="mc-input-row">
                                    <div class="mc-group"><label>Altura (cm)</label><input type="text" id="mc-h-val" class="mc-input" placeholder="Ex: 175"></div>
                                    <div class="mc-group"><label>Peso (kg)</label><input type="text" id="mc-w-val" class="mc-input" placeholder="Ex: 80"></div>
                                </div>
                            </div>
                            <div id="mc-fields-bottom" style="display:none;">
                                <div class="mc-input-row">
                                    <div class="mc-group"><label>Cintura (cm)</label><input type="text" id="mc-cin-val" class="mc-input" placeholder="Ex: 84"><p class="mc-input-hint">Meça ao redor do umbigo</p></div>
                                    <div class="mc-group"><label>Quadril (cm)</label><input type="text" id="mc-quad-val" class="mc-input" placeholder="Ex: 100"><p class="mc-input-hint">Parte mais larga do quadril</p></div>
                                </div>
                            </div>
                        </div>
                        <p style="margin:10px 0 10px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);text-align:center;">Sua foto deve seguir estes requisitos:</p>
                        <div class="mc-tips-grid" style="margin-top:0;">
                            <div class="mc-tip-item"><i class="ph ph-t-shirt"></i><span>Com Roupa</span></div>
                            <div class="mc-tip-item"><i class="ph ph-person"></i><span>Corpo Inteiro</span></div>
                            <div class="mc-tip-item"><i class="ph ph-sun"></i><span>Boa Luz</span></div>
                        </div>
                        <div style="display:flex;gap:20px;justify-content:center;margin-top:30px;">
                            <div id="mc-trigger-upload" style="width:120px;height:160px;border:1px solid var(--mc-border);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--mc-gray);transition:0.3s;">
                                <i class="ph ph-camera-plus" style="font-size:32px;color:var(--mc-primary);margin-bottom:10px;"></i>
                                <span style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Enviar Foto</span>
                                <input type="file" id="mc-real-input" accept="image/*" style="display:none">
                            </div>
                            <div id="mc-pre-view" style="display:none;width:120px;height:160px;overflow:hidden;border:1px solid var(--mc-border);">
                                <img id="mc-pre-img" style="width:100%;height:100%;object-fit:cover;">
                            </div>
                        </div>
                        <div style="margin:20px 0 0;padding:12px 16px;background:#fff8e1;border-left:3px solid #f59e0b;">
                            <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.5px;color:#92400e;line-height:1.6;text-align:center;">
                                &#9888;&#65039; Se voc&#234; escolheu a foto de costas, envie uma foto sua tamb&#233;m de costas, se escolheu a frente, envie de frente.
                            </p>
                        </div>
                        <button class="mc-btn-black" id="mc-btn-generate" disabled>Ver no meu corpo</button>
                    </div>
                    <div style="display:none;padding:60px 0;text-align:center;" id="mc-loading-box">
                        <div style="font-weight:600;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;animation:mc-pulse-text 1.5s infinite ease-in-out;">Gerando Prova Virtual...</div>
                        <div style="height:1px;background:var(--mc-gray);width:100%;position:relative;overflow:hidden;">
                            <div style="position:absolute;top:0;left:0;height:100%;width:30%;background:var(--mc-primary);animation:mc-slide 1.5s infinite linear;"></div>
                        </div>
                    </div>
                    <div id="mc-step-result" style="display:none;flex-direction:column;align-items:center;">
                        <div id="mc-result-img-col" style="width:100%;border:1px solid var(--mc-border);margin-bottom:30px;background:var(--mc-gray);">
                            <img id="mc-final-view-img" style="width:100%;height:auto;display:block;">
                        </div>
                        <div id="mc-result-actions-col" style="width:100%;">
                            <span class="mc-res-title" style="display:none;">Provador Virtual</span>
                            <span class="mc-res-subtitle" style="display:none;">SIMULA&#199;&#195;O BASEADA NO SEU PERFIL CORPORAL</span>
                            <div class="mc-metrics-row" style="display:none;">
                                <div class="mc-metric-card">
                                    <span class="mc-metric-label" id="mc-label-1">Altura</span>
                                    <span class="mc-metric-value" id="mc-res-height">&mdash;</span>
                                    <span class="mc-metric-unit" id="mc-unit-1">m</span>
                                </div>
                                <div class="mc-metric-card">
                                    <span class="mc-metric-label" id="mc-label-2">Peso</span>
                                    <span class="mc-metric-value" id="mc-res-weight">&mdash;</span>
                                    <span class="mc-metric-unit" id="mc-unit-2">kg</span>
                                </div>
                            </div>
                            <!-- RECOMENDAÇÃO DE TAMANHO REMOVIDA TEMPORARIAMENTE -->
                            <div class="mc-res-note" style="display:none;">
                                <i class="ph ph-info"></i>
                                <span>A simula&#231;&#227;o AI considera o caimento do tecido baseado na sua estrutura corporal informada.</span>
                            </div>
                            <button class="mc-btn-buy" id="mc-add-to-cart-btn">
                                <i class="ph ph-shopping-cart"></i>
                                Adicionar ao Carrinho
                            </button>
                            <button class="mc-btn-outline" id="mc-btn-back">Voltar ao Produto</button>
                            <p class="mc-res-mobile-only" style="margin-top:30px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);cursor:pointer;text-decoration:underline;text-underline-offset:4px;" id="mc-retry-btn">Tentar outra foto</p>
                        </div>
                    </div>
                </div>
                <div class="mc-powered-footer">
                    <span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);">Powered by</span>
                    <img src="https://i.ibb.co/jP66Xwqt/logo-provou-levou-sem-fundo.png" class="mc-quantic-logo" alt="Provou Levou">
                </div>
            </div>
        </div>
    `;

    // ─── INIT ─────────────────────────────────────────────────────────────────────

    function init() {
        LOG.info('Iniciando provador...');

        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        if (!window.phosphorIconsLoaded) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            document.head.appendChild(ph);
            window.phosphorIconsLoaded = true;
            LOG.info('Phosphor Icons carregado');
        }

        const styleTag = document.createElement('style');
        styleTag.innerHTML = styles;
        document.head.appendChild(styleTag);
        LOG.ok('Estilos injetados');

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);
        LOG.ok('Modal HTML injetado no DOM');

        // ── Botão trigger ──
        const openBtn = document.createElement('button');
        openBtn.className = 'mc-btn-trigger-ia';
        openBtn.id = 'mc-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        openBtn.innerHTML = stampImageHTML;

        const trayImgContainers = [
            '.image-show',
            '.box-gallery',
            '.product-colum-left',
        ];
        const fallbackContainers = [
            '.product__media-wrapper', '.product-gallery__media', '.product__media',
            '.product-image-main', '.product-media-container', '[data-media-id]',
            '.product__media-item', '.product-gallery', '.product-single__media', '.media-gallery'
        ];

        let placed = false;
        for (const sel of [...trayImgContainers, ...fallbackContainers]) {
            const el = document.querySelector(sel);
            if (el) {
                const isMobile = window.innerWidth < 768;
                const btnSize = isMobile ? '80px' : '60px';

                // Ambos usam position:fixed para evitar overflow:hidden dos containers
                document.body.appendChild(openBtn);
                // Mobile z-index igual ao desktop — evitamos overlap por threshold de posição
                openBtn.style.cssText = `position:fixed;z-index:50;width:${btnSize};height:${btnSize};display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:none;padding:0;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.18));transition:transform 0.2s ease,filter 0.2s ease;`;

                function positionBtn() {
                    const rect = el.getBoundingClientRect();
                    const btnTop = rect.top + (isMobile ? 70 : 15);
                    // Mobile: esconde quando o botão entraria na área do header fixo (~56px)
                    // Desktop: esconde quando entraria no menu fixo (~120px)
                    const threshold = isMobile ? 80 : 120;
                    if (btnTop < threshold || rect.bottom < 0) {
                        openBtn.style.visibility = 'hidden';
                    } else {
                        openBtn.style.visibility = 'visible';
                        openBtn.style.top = btnTop + 'px';
                        openBtn.style.left = (rect.right - (isMobile ? 100 : 180)) + 'px';
                    }
                }
                positionBtn();
                window.addEventListener('scroll', positionBtn);
                window.addEventListener('resize', positionBtn);

                // Hover effect (desktop)
                openBtn.addEventListener('mouseenter', () => {
                    openBtn.style.transform = 'scale(1.08)';
                    openBtn.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.32))';
                });
                openBtn.addEventListener('mouseleave', () => {
                    openBtn.style.transform = 'scale(1)';
                    openBtn.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))';
                });

                placed = true;
                LOG.ok('Botão posicionado (' + (isMobile ? 'mobile' : 'desktop') + ') sobre: "' + sel + '" (position:fixed)');
                break;
            }
        }
        if (!placed) {
            document.body.appendChild(openBtn);
            openBtn.style.cssText = 'position:fixed;bottom:100px;left:20px;z-index:50;width:60px;height:60px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:none;padding:0;';
            LOG.warn('Nenhum container encontrado — botão fixado no canto (fallback)');
        }

        const modal = document.getElementById('mc-modal-ia');
        const genBtn = document.getElementById('mc-btn-generate');
        const closeBtn = document.getElementById('mc-close-btn');
        const backBtn = document.getElementById('mc-btn-back');
        const retryBtn = document.getElementById('mc-retry-btn');
        const realInput = document.getElementById('mc-real-input');
        const triggerUpload = document.getElementById('mc-trigger-upload');
        const phoneInput = document.getElementById('mc-phone');

        let userPhoto = null;

        function openModal() {
            LOG.info('Modal aberto');
            modal.style.display = 'flex';
            lockBodyScroll();
        }

        function closeModal() {
            LOG.info('Modal fechado');
            modal.style.display = 'none';
            unlockBodyScroll();
        }

        function applyProduct(product) {
            currentProduct = product;
            document.getElementById('mc-fields-top').style.display = product.category === 'top' ? 'block' : 'none';
            document.getElementById('mc-fields-bottom').style.display = product.category === 'bottom' ? 'block' : 'none';
            LOG.info('Campos exibidos para categoria: ' + product.category);
        }

        openBtn.onclick = () => {
            const prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;
            LOG.info('Botão clicado — produto: "' + prodName + '"');
            applyProduct(detectProduct(prodName));
            openModal();
        };

        closeBtn.onclick = () => { LOG.info('Botão fechar clicado'); closeModal(); };
        backBtn.onclick = () => { LOG.info('Botão "Voltar ao produto" clicado'); closeModal(); };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) { LOG.info('Clique fora do card — fechando modal'); closeModal(); }
        });

        retryBtn.onclick = () => {
            LOG.info('Tentar outra foto — resetando fluxo');
            document.getElementById('mc-step-result').style.display = 'none';
            document.getElementById('mc-step-upload').style.display = 'block';
            document.querySelector('.mc-card-ia').classList.remove('is-result');
            userPhoto = null;
            document.getElementById('mc-pre-view').style.display = 'none';
            checkFields();
        };

        triggerUpload.onclick = () => { LOG.info('Abrindo seletor de arquivo...'); realInput.click(); };

        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            checkFields();
        });

        function checkFields() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = nums.length >= 10 && nums.length <= 11;
            document.getElementById('mc-phone-error').style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : 'var(--mc-border)';
            let measOk = currentProduct.category === 'top'
                ? !!document.getElementById('mc-h-val').value && !!document.getElementById('mc-w-val').value
                : !!document.getElementById('mc-cin-val').value && !!document.getElementById('mc-quad-val').value;
            const allOk = measOk && !!userPhoto && phoneOk;
            genBtn.disabled = !allOk;
            LOG.info('Validação campos — phone:' + phoneOk + ' medidas:' + measOk + ' foto:' + !!userPhoto + ' → botão ' + (allOk ? 'HABILITADO' : 'desabilitado'));
        }

        ['mc-h-val', 'mc-w-val', 'mc-cin-val', 'mc-quad-val'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', checkFields);
        });

        realInput.onchange = (e) => {
            userPhoto = e.target.files[0];
            if (userPhoto) {
                LOG.ok('Foto selecionada: "' + userPhoto.name + '" (' + (userPhoto.size / 1024).toFixed(0) + 'KB, ' + userPhoto.type + ')');
                const rd = new FileReader();
                rd.onload = ev => {
                    document.getElementById('mc-pre-img').src = ev.target.result;
                    document.getElementById('mc-pre-view').style.display = 'block';
                    checkFields();
                };
                rd.readAsDataURL(userPhoto);
            }
        };

        genBtn.onclick = async () => {
            const prodImgTag = document.querySelector(
                '.image-show .box-img.active .zoom img, ' +
                '.image-show .box-img .zoom img, ' +
                '.image-show img, ' +
                '.product__media img, ' +
                'img.product-featured-media, ' +
                '.product-single__photo'
            );
            const prodImg = prodImgTag
                ? (prodImgTag.dataset.src || prodImgTag.dataset.lazy || prodImgTag.src)
                : (document.querySelector('meta[property="og:image"]')?.content || '');
            const prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;

            LOG.group('Enviando para webhook');
            LOG.info('Produto: ' + prodName);
            LOG.info('Imagem do produto: ' + (prodImg || '(não encontrada)'));
            LOG.info('WhatsApp: ' + phoneInput.value);
            LOG.info('Categoria: ' + currentProduct.category + '  |  Fit: ' + currentProduct.fit);

            document.getElementById('mc-step-upload').style.display = 'none';
            document.getElementById('mc-loading-box').style.display = 'block';

            try {
                const fd = new FormData();
                fd.append('person_image', userPhoto);
                fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                fd.append('phone_raw', phoneInput.value);
                fd.append('product_name', prodName);
                fd.append('product_type', currentProduct.category);
                fd.append('product_fit', currentProduct.fit);

                if (currentProduct.category === 'top') {
                    fd.append('height', document.getElementById('mc-h-val').value);
                    fd.append('weight', document.getElementById('mc-w-val').value);
                    LOG.info('Altura: ' + document.getElementById('mc-h-val').value + 'cm  |  Peso: ' + document.getElementById('mc-w-val').value + 'kg');
                } else {
                    fd.append('cintura', document.getElementById('mc-cin-val').value);
                    fd.append('quadril', document.getElementById('mc-quad-val').value);
                    LOG.info('Cintura: ' + document.getElementById('mc-cin-val').value + 'cm  |  Quadril: ' + document.getElementById('mc-quad-val').value + 'cm');
                }

                if (prodImg) {
                    try {
                        LOG.info('Baixando imagem do produto para anexar...');
                        const b = await fetch(prodImg).then(r => r.blob());
                        fd.append('product_image', b, 'p.png');
                        LOG.ok('Imagem do produto anexada (' + (b.size / 1024).toFixed(0) + 'KB)');
                    } catch (imgErr) {
                        LOG.warn('Não foi possível baixar imagem do produto: ' + imgErr.message);
                    }
                } else {
                    LOG.warn('Imagem do produto não encontrada no DOM — enviando sem ela');
                }

                calculateFinalSize();
                LOG.info('Enviando POST para webhook: ' + WEBHOOK_PROVA);
                const t0 = Date.now();

                const res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });
                const elapsed = Date.now() - t0;
                LOG.info('Resposta recebida em ' + elapsed + 'ms — status: ' + res.status + ' ' + res.statusText);

                if (res.ok) {
                    const blob = await res.blob();
                    LOG.ok('Imagem gerada com sucesso! (' + (blob.size / 1024).toFixed(0) + 'KB, ' + blob.type + ')');
                    LOG.end();

                    document.getElementById('mc-loading-box').style.display = 'none';
                    document.getElementById('mc-final-view-img').src = URL.createObjectURL(blob);

                    const resH = document.getElementById('mc-res-height');
                    const resW = document.getElementById('mc-res-weight');
                    const label1 = document.getElementById('mc-label-1');
                    const label2 = document.getElementById('mc-label-2');
                    const unit1 = document.getElementById('mc-unit-1');
                    const unit2 = document.getElementById('mc-unit-2');

                    if (currentProduct.category === 'bottom') {
                        const cVal = document.getElementById('mc-cin-val').value;
                        const qVal = document.getElementById('mc-quad-val').value;
                        if (label1) label1.textContent = 'Cintura';
                        if (label2) label2.textContent = 'Quadril';
                        if (unit1) unit1.textContent = 'cm';
                        if (unit2) unit2.textContent = 'cm';
                        if (resH) resH.textContent = cVal || '\u2014';
                        if (resW) resW.textContent = qVal || '\u2014';
                    } else {
                        const hVal = document.getElementById('mc-h-val').value;
                        const wVal = document.getElementById('mc-w-val').value;
                        if (label1) label1.textContent = 'Altura';
                        if (label2) label2.textContent = 'Peso';
                        if (unit1) unit1.textContent = 'm';
                        if (unit2) unit2.textContent = 'kg';
                        if (resH) resH.textContent = hVal ? (parseFloat(hVal) / 100).toFixed(2) : '\u2014';
                        if (resW) resW.textContent = wVal || '\u2014';
                    }

                    document.querySelector('.mc-card-ia').classList.add('is-result');
                    document.getElementById('mc-step-result').style.display = 'flex';
                    LOG.ok('Resultado exibido — tamanho recomendado: ' + recommendedSize);

                } else {
                    LOG.error('Webhook retornou erro: ' + res.status);
                    LOG.end();
                    throw new Error('HTTP ' + res.status);
                }
            } catch (e) {
                LOG.error('Falha no fluxo de geração: ' + e.message, e);
                LOG.end();
                alert('Ocorreu um erro ao processar sua imagem. Tente novamente.');
                location.reload();
            }
        };

        // ─── ADICIONAR AO CARRINHO ────────────────────────────────────────────────

        document.getElementById('mc-add-to-cart-btn').onclick = () => {
            const size = recommendedSize;
            LOG.group('Adicionar ao carrinho');
            LOG.info('Selecionando tamanho: ' + size);

            const swatchSelectors = [
                `input[type="radio"][data-value="${size}"]`,
                `input[type="radio"][value="${size}"]`,
                `button[data-value="${size}"]`,
                `button[value="${size}"]`,
                `.swatch__input[value="${size}"]`,
                `[data-option-value="${size}"]`,
                `.variant-option input[value="${size}"]`,
                `.product-form__option input[value="${size}"]`,
                `input[type="radio"][title="${size}"]`,
                `.variacoes input[value="${size}"]`,
                `.variacao-item input[value="${size}"]`,
                `label[data-value="${size}"] input`,
            ];

            let selected = false;
            for (const sel of swatchSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    el.click();
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    selected = true;
                    LOG.ok('Tamanho selecionado via seletor: "' + sel + '"');
                    break;
                }
            }

            if (!selected) {
                LOG.info('Seletores de botão/radio não funcionaram, tentando <select>...');
                const selects = document.querySelectorAll('select');
                for (const sel of selects) {
                    const opt = [...sel.options].find(o =>
                        o.value.trim().toUpperCase() === size.toUpperCase() ||
                        o.text.trim().toUpperCase() === size.toUpperCase()
                    );
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                        selected = true;
                        LOG.ok('Tamanho selecionado via <select>');
                        break;
                    }
                }
            }

            if (!selected) {
                LOG.warn('Não foi possível selecionar automaticamente o tamanho "' + size + '" — verifique os seletores da loja');
            }

            function tryAddToCart() {
                const addBtnSelectors = [
                    '#form_comprar button[type="submit"]',
                    '#form_comprar .btn-comprar',
                    '#form_comprar .buy-button',
                    '.buy-button', '.btn-comprar',
                    'button[name="add"]', 'button.product-form__submit',
                    '.btn-add-to-cart', '[data-action="add-to-cart"]',
                    'button[data-btn-addtocart]',
                    '.product-form button[type="submit"]',
                    'form[action*="/cart/add"] button[type="submit"]',
                    '#AddToCart', '#add-to-cart', '.add-to-cart',
                    '[id*="add-to-cart"]', '[class*="add-to-cart"]', '[class*="addtocart"]',
                ];
                for (const sel of addBtnSelectors) {
                    const btn = document.querySelector(sel);
                    if (btn && !btn.disabled) {
                        btn.click();
                        LOG.ok('Botão de compra clicado: "' + sel + '"');
                        return true;
                    }
                }
                LOG.warn('Nenhum botão de compra encontrado/habilitado');
                return false;
            }

            setTimeout(() => {
                const ok = tryAddToCart();
                if (!ok) {
                    LOG.info('Tentando novamente em 400ms...');
                    setTimeout(() => {
                        const ok2 = tryAddToCart();
                        if (!ok2) LOG.error('Falha ao adicionar ao carrinho após 2 tentativas');
                    }, 400);
                }
                LOG.end();
                closeModal();
            }, selected ? 300 : 0);
        };

        LOG.ok('Provador inicializado com sucesso!');
    }

    // ─── DETECÇÃO DE PÁGINA DE PRODUTO ───────────────────────────────────────────

    // ── Detecção sempre dentro do DOMContentLoaded para garantir que
    // os elementos existam no DOM (script pode ser carregado async)
    function runWhenReady() {
        const path = window.location.pathname;
        const isProductPage =
            window.__MC_FORCE_INIT__ === true ||
            path.includes('/produto/') ||
            path.includes('/p/') ||
            path.includes('/products/') ||
            document.getElementById('product-container') !== null ||
            document.getElementById('form_comprar') !== null;

        LOG.info('Página atual: "' + path + '"  →  é página de produto: ' + isProductPage);

        if (isProductPage) {
            init();
        } else {
            LOG.warn('Página não é de produto — script não inicializado');
        }
    }

    if (document.readyState === 'loading') {
        LOG.info('DOM ainda carregando — aguardando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', runWhenReady);
    } else {
        runWhenReady();
    }

})();
