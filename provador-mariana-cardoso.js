(function () {
    // ─── LOG HELPER ───────────────────────────────────────────────────────────────
    const LOG = {
        info: (...a) => console.log('[PL]', ...a),
        ok: (...a) => console.log('[PL✓]', ...a),
        warn: (...a) => console.warn('[PL⚠]', ...a),
        error: (...a) => console.error('[PL✗]', ...a),
        group: (...a) => console.group('[PL]', ...a),
        end: () => console.groupEnd(),
    };

    // ===============================================
    // 0. CHUMBAR A API KEY AQUI DIRETO NO CÓDIGO
    // ===============================================
    const apiKey = "pl_live_718051120233d56b27c6a394adcda4db687b687bd7f0c2924679c8700f085f5f";
    window.PROVOU_LEVOU_API_KEY = apiKey;

    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/quantic-materialize';
    const LOGO_URL = 'https://images.tcdn.com.br/files/1173244/themes/75/img/settings/logo-new.svg';

    const WEBHOOK_LIMITE = 'https://n8n.segredosdodrop.com/webhook/limite-provas';
    const DAILY_LIMIT = 3;

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

    // ─── ESTIMATIVA DE MEDIDAS FEMININAS (PESO/ALTURA → CINTURA/BUSTO/QUADRIL) ─
    function estimarMedidasFemininas(altura, peso) {
        if (altura < 3) altura *= 100;
        const imc = peso / Math.pow(altura / 100, 2);
        const dh = altura - 165; // diferença da altura média
        const cintura = 2.1 * imc + 0.05 * dh + 24;
        const busto = 2.05 * imc + 0.08 * dh + 43;
        const quadril = 1.8 * imc + 0.06 * dh + 58;
        LOG.info('Estimativa feminina: IMC=' + imc.toFixed(1) + ' → cintura=' + cintura.toFixed(1) + ' busto=' + busto.toFixed(1) + ' quadril=' + quadril.toFixed(1));
        return { cintura, busto, quadril };
    }

    // ─── TABELA DE MEDIDAS MARIANA CARDOSO (CALÇAS) ─────────────────────────────
    // Cada entrada: { label, cintura: [min, max], quadril: [min, max] }
    const MARIANA_CALCA_SIZES = [
        { label: 'P (38/40)', cintura: [68, 82], quadril: [95, 104] },
        { label: 'M (42)', cintura: [83, 94], quadril: [105, 116] },
        { label: 'G (44/46)', cintura: [95, 106], quadril: [117, 122] },
        { label: 'GG (46/48)', cintura: [107, 114], quadril: [122, 125] },
    ];

    function calcMarianaCalca(cintura, quadril) {
        function findIdx(table, field, val) {
            for (let i = 0; i < table.length; i++) {
                if (val >= table[i][field][0] && val <= table[i][field][1]) return i;
            }
            return val < table[0][field][0] ? 0 : table.length - 1;
        }
        const idxC = findIdx(MARIANA_CALCA_SIZES, 'cintura', cintura);
        const idxQ = findIdx(MARIANA_CALCA_SIZES, 'quadril', quadril);
        const finalSize = MARIANA_CALCA_SIZES[Math.max(idxC, idxQ)];
        LOG.info('Recomendação calça Mariana: cintura=' + cintura + '(idx' + idxC + ') quadril=' + quadril + '(idx' + idxQ + ') → final: ' + finalSize.label);
        return finalSize.label;
    }

    // ─── TABELA DE MEDIDAS MARIANA CARDOSO (BLUSAS / BODY) ────────────────────
    const MARIANA_BLUSA_SIZES = [
        { label: 'P (38/40)', cintura: [68, 78], busto: [86, 92], quadril: [99, 106] },
        { label: 'M (42)', cintura: [79, 87], busto: [93, 107], quadril: [107, 114] },
        { label: 'G (44/46)', cintura: [88, 96], busto: [108, 118], quadril: [115, 122] },
        { label: 'GG (46/48)', cintura: [97, 108], busto: [119, 125], quadril: [123, 130] },
    ];

    function calcMarianaBlusa(altura, peso) {
        const med = estimarMedidasFemininas(altura, peso);
        function findIdx(table, field, val) {
            for (let i = 0; i < table.length; i++) {
                if (val >= table[i][field][0] && val <= table[i][field][1]) return i;
            }
            return val < table[0][field][0] ? 0 : table.length - 1;
        }
        const idxC = findIdx(MARIANA_BLUSA_SIZES, 'cintura', med.cintura);
        const idxB = findIdx(MARIANA_BLUSA_SIZES, 'busto', med.busto);
        const idxQ = findIdx(MARIANA_BLUSA_SIZES, 'quadril', med.quadril);
        const finalIdx = Math.max(idxC, idxB, idxQ);
        const finalSize = MARIANA_BLUSA_SIZES[finalIdx];
        LOG.info('Recomendação blusa Mariana: cintura=' + med.cintura.toFixed(1) + '(idx' + idxC + ') busto=' + med.busto.toFixed(1) + '(idx' + idxB + ') quadril=' + med.quadril.toFixed(1) + '(idx' + idxQ + ') → final: ' + finalSize.label);
        return finalSize.label;
    }

    // Tipo de produto detectado: 'calca', 'blusa' ou null
    let marianaType = null;

    // ─── DETECÇÃO DO PRODUTO ──────────────────────────────────────────────────────

    function detectProduct(name) {
        const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const n = norm(name);
        LOG.group('Detecção de produto');
        LOG.info('Nome: "' + name + '" → "' + n + '"');

        // Pega categoria da Tray via dataLayer (ex: "Jaqueta", "Calça", "Blusas")
        let cat = '';
        try {
            if (window.dataLayer) {
                for (let i = 0; i < window.dataLayer.length; i++) {
                    if (window.dataLayer[i] && window.dataLayer[i].category) {
                        cat = norm(window.dataLayer[i].category);
                        break;
                    }
                }
            }
        } catch (e) { }
        LOG.info('Categoria Tray: "' + (cat || '(não encontrada)') + '"');

        // Concatena categoria + nome para busca
        const txt = cat + ' ' + n;
        LOG.info('Texto para match: "' + txt + '"');

        let result;
        // Calça, Legging, Bermuda, Short → cintura e quadril
        if (/\bcalca|legging|flare|skinny|pantalona|wide.?leg|jogger|bermuda|shorts?\b/.test(txt)) {
            result = { category: 'bottom', fit: 'mariana_calca' };
        }
        // Tudo que não é calça → peso e altura (Jaqueta, Blusas, Body, Vestidos, Macações, etc.)
        else {
            result = { category: 'top', fit: 'mariana_blusa' };
        }
        LOG.ok('Resultado:', JSON.stringify(result), '→ marianaType será:', result.fit === 'mariana_calca' ? 'calca' : 'blusa');
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
        // if (document.getElementById('mc-res-letter')) document.getElementById('mc-res-letter').innerText = recommendedSize;
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
        // if (document.getElementById('mc-res-letter')) document.getElementById('mc-res-letter').innerText = recommendedSize;
    }

    function calculateFinalSize() {
        if (marianaType === 'calca') {
            const cintura = parseFloat(document.getElementById('mc-cin-val')?.value);
            const quadril = parseFloat(document.getElementById('mc-quad-val')?.value);
            if (!cintura || !quadril) return null;
            recommendedSize = calcMarianaCalca(cintura, quadril);
            return recommendedSize;
        }
        if (marianaType === 'blusa') {
            const altura = parseFloat(document.getElementById('mc-blusa-h-val')?.value);
            const peso = parseFloat(document.getElementById('mc-blusa-w-val')?.value);
            if (!altura || !peso) return null;
            recommendedSize = calcMarianaBlusa(altura, peso);
            return recommendedSize;
        }
        return null;
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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        :root {
            --mc-primary: #111111;
            --mc-bg: #ffffff;
            --mc-border: #111111;
            --mc-gray: #f7f6f4;
            --mc-text: #111111;
            --mc-text-light: #8a7a5a;
            --mc-gold: #c9a227;
            --font-display: 'Bebas Neue', sans-serif;
            --font-body: 'DM Sans', sans-serif;
        }

        @keyframes mc-shake { 0%,50%,100%{transform:rotate(0deg)} 10%,30%{transform:rotate(-10deg)} 20%,40%{transform:rotate(10deg)} }
        .mc-btn-trigger-ia {
            position: absolute; top: 60px; left: 15px; z-index: 10;
            background: none; border: none; padding: 0; cursor: pointer;
            width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
            animation: mc-shake 3s infinite;
        }
        .mc-btn-trigger-ia:hover { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28)); animation-play-state: paused; transform: scale(1.1) !important; }
        .mc-btn-trigger-ia img { width: 100%; height: 100%; object-fit: contain; }

        .pl-buy-btn-container { width: 100%; position: relative; margin: 35px auto 15px; max-width: 200px; }
        .pl-btn-provador-buy {
            display: flex !important; align-items: center !important; justify-content: center !important; gap: 10px !important;
            width: 100% !important; height: 45px !important;
            background-color: #ffffff !important; color: #000000 !important;
            border: 1px solid #000000 !important; border-radius: 0 !important;
            font-family: 'Work Sans', sans-serif !important; font-size: 10px !important;
            font-weight: 700 !important; text-transform: uppercase !important;
            letter-spacing: 2px !important; cursor: pointer !important; transition: all 0.3s ease !important;
        }
        .pl-btn-provador-buy:hover { background-color: #000000 !important; color: #ffffff !important; }

        @keyframes mc-modal-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        #mc-modal-ia {
            display: none; position: fixed; inset: 0;
            background: rgba(240,238,235,0.96);
            z-index: 999999; align-items: center; justify-content: center;
            font-family: var(--font-body);
        }
        .mc-card-ia {
            background: var(--mc-bg); width: 100%; max-width: 480px;
            padding: 0; position: relative; color: var(--mc-text);
            border: none; max-height: 94vh;
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
            animation: mc-modal-in 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .mc-content-scroll { padding: 28px 28px 32px; overflow-y: auto; flex: 1; text-align: center; display: flex; flex-direction: column; gap: 20px; }
        .mc-close-ia {
            position: absolute; top: 18px; right: 18px;
            background: none; border: none; color: var(--mc-text-light);
            cursor: pointer; font-size: 26px; z-index: 100; font-weight: 300; line-height: 1; padding: 4px 6px;
        }
        .mc-close-ia:hover { color: var(--mc-text); }

        #mc-header-provador { text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; border-bottom: 1px solid var(--mc-gold); padding-bottom: 20px; }
        #mc-header-provador h1 { margin: 0; font-family: var(--font-display); font-size: 26px; letter-spacing: 4px; text-transform: uppercase; color: var(--mc-text); font-weight: 400; line-height: 1; }

        #mc-step-upload { display: flex; flex-direction: column; gap: 16px; }

        .mc-lead-form { display: flex; flex-direction: column; gap: 16px; }
        .mc-group { flex: 1; }
        .mc-group label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--mc-text-light); margin-bottom: 8px; }
        .mc-input-row { display: flex; gap: 12px; }
        .mc-lead-form .mc-input,
        .mc-lead-form input[type="text"].mc-input,
        .mc-lead-form input[type="tel"].mc-input,
        .mc-lead-form input[type="number"].mc-input {
            width: 100% !important; height: 52px !important; padding: 0 16px !important;
            border: none !important; border-bottom: 1.5px solid #e8e8e8 !important;
            font-size: 16px !important; font-family: var(--font-body) !important;
            background: var(--mc-gray) !important; color: var(--mc-text) !important;
            outline: none !important; box-sizing: border-box !important;
            border-radius: 0 !important; -webkit-appearance: none !important; appearance: none !important;
            margin: 0 !important; text-align: center !important;
        }
        .mc-lead-form .mc-input:focus { border-bottom-color: var(--mc-gold) !important; background: #fff !important; }
        .mc-input-hint { font-size: 10px; color: var(--mc-text-light); margin-top: 4px; }
        .mc-status-msg { display: none; font-size: 10px; color: #ef4444; font-weight: 600; margin-top: 4px; }

        .mc-tips-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 16px 0; border-top: 1px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; }
        .mc-tip-item { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--mc-text-light); }
        .mc-tip-item i { color: var(--mc-gold); font-size: 20px; }

        #mc-trigger-upload { width: 120px; height: 160px; border: 2px dashed #e8e8e8; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: var(--mc-gray); transition: 0.2s; }
        #mc-trigger-upload:hover { border-color: var(--mc-gold); }
        #mc-trigger-upload i { font-size: 32px; color: var(--mc-gold); margin-bottom: 8px; }
        #mc-trigger-upload span { font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
        #mc-pre-view { width: 120px; height: 160px; overflow: hidden; border: 1px solid #e8e8e8; border-radius: 4px; }
        #mc-pre-img { width: 100%; height: 100%; object-fit: cover; }


        .mc-btn-black {
            background: var(--mc-text); color: var(--mc-bg);
            border: none; width: 100%; padding: 16px;
            font-family: var(--font-display); font-size: 18px; font-weight: 400;
            letter-spacing: 3px; text-transform: uppercase; cursor: pointer; margin-top: 4px; transition: 0.3s; box-sizing: border-box;
        }
        .mc-btn-black:disabled { background: #ccc; cursor: not-allowed; }
        .mc-btn-black:not(:disabled):hover { opacity: 0.82; }
        .mc-btn-buy { background: var(--mc-text); color: var(--mc-bg); border: none; width: 100%; padding: 18px; font-family: var(--font-display); font-size: 18px; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; margin-bottom: 12px; transition: 0.3s; }
        .mc-btn-buy:hover { opacity: 0.82; }
        .mc-btn-outline { background: var(--mc-bg); color: var(--mc-text); border: 1.5px solid #e8e8e8; width: 100%; padding: 16px; font-family: var(--font-display); font-size: 18px; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; transition: 0.3s; box-sizing: border-box; }
        .mc-btn-outline:hover { border-color: var(--mc-text); }

        .mc-powered-footer { background: var(--mc-gray); padding: 14px 20px; display: flex; align-items: center; justify-content: center; gap: 9px; flex-shrink: 0; border-top: 1px solid var(--mc-gold); text-decoration: none; }
        .mc-powered-footer span { font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--mc-text-light); }
        .mc-quantic-logo { height: 22px; opacity: 0.7; }

        @keyframes mc-slide { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes mc-pulse-text { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes mc-alt-show { 0%,5%{opacity:0;transform:translateY(6px)} 15%,45%{opacity:1;transform:translateY(0)} 55%,100%{opacity:0;transform:translateY(-6px)} }
        @keyframes mc-alt-hide { 0%,55%{opacity:0;transform:translateY(6px)} 65%,95%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }

        #mc-step-confirm { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); z-index: 200; display: none; align-items: center; justify-content: center; padding: 20px; }
        .mc-confirm-box { background: #fff; width: 100%; max-width: 380px; padding: 40px 30px; border: 1px solid #e8e8e8; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border-radius: 4px; }

        @media (max-width: 767px) {
            .mc-warning-back-front { font-size: 11px !important; padding: 10px 8px !important; line-height: 1.45 !important; }
        }

        /* ── Result (mobile-first, layout Cacife) ── */
        #mc-step-result { display: none; flex-direction: column; gap: 0; align-items: stretch; }
        .mc-res-title { display: block !important; font-family: var(--font-display); font-size: 18px; letter-spacing: 3px; text-transform: uppercase; color: var(--mc-text); padding: 18px 28px 14px; margin: 0; border-bottom: 1px solid var(--mc-gold); text-align: center; }
        #mc-result-img-col { width: 100%; max-height: 65vh; background: var(--mc-gray); overflow: hidden; display: flex; align-items: center; justify-content: center; border: none !important; margin: 0 !important; }
        #mc-result-img-col img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
        #mc-result-actions-col { display: flex; flex-direction: column; gap: 12px; padding: 20px 28px 0; }
        #mc-size-recommendation { text-align: center; padding: 14px 16px; border: 1px solid var(--mc-gold); background: #fffaf0; }
        #mc-size-recommendation p:first-child { margin: 0 0 4px; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--mc-text-light); }
        #mc-rec-size-label { margin: 0; font-family: var(--font-display); font-size: 22px; letter-spacing: 3px; color: var(--mc-text); }
        #mc-rec-size-desc { margin: 4px 0 0; font-size: 10px; color: var(--mc-text-light); line-height: 1.4; }
        .mc-res-mobile-only { margin: 0; }

        /* Related products */
        #mc-related-products { padding: 0 28px 24px; }
        #mc-related-products h4 { font-family: var(--font-display); font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: var(--mc-text-light); margin: 18px 0 12px; font-weight: 400; }
        .mc-related-grid { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; justify-content: flex-start; }
        .mc-related-grid::-webkit-scrollbar { display: none; }
        .mc-related-card { flex: 0 0 calc(33% - 7px); min-width: 80px; max-width: 110px; text-decoration: none; color: var(--mc-text); display: flex; flex-direction: column; gap: 5px; }
        .mc-related-card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border: 1px solid #e8e8e8; display: block; }
        .mc-related-card-name { font-size: 9.5px; font-weight: 500; line-height: 1.4; color: var(--mc-text); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .mc-related-card-price { font-size: 10px; font-weight: 700; color: var(--mc-gold); }

        @media (min-width: 768px) {
            .mc-card-ia.is-result { width: 780px !important; max-width: 90vw !important; max-height: 92vh !important; height: auto !important; }
            .mc-card-ia.is-result #mc-header-provador { display: none !important; }
            .mc-card-ia.is-result .mc-content-scroll { padding: 0 !important; overflow-y: auto !important; display: flex !important; flex-direction: column !important; gap: 0 !important; }
            .mc-card-ia.is-result #mc-step-result { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; width: 100%; align-items: stretch; gap: 0; }
            .mc-card-ia.is-result .mc-res-title { flex-basis: 100%; order: -1; font-size: 16px; padding: 16px 24px; }
            .mc-card-ia.is-result #mc-result-img-col { width: 44% !important; min-height: 380px !important; max-height: 80vh !important; border-right: 1px solid var(--mc-gold) !important; flex-shrink: 0; }
            .mc-card-ia.is-result #mc-result-actions-col { width: 56% !important; padding: 28px 24px !important; gap: 12px; overflow-y: auto; }
            .mc-card-ia.is-result .mc-res-mobile-only { display: flex !important; align-items: center; justify-content: center; gap: 8px; }
            .mc-card-ia.is-result .mc-close-ia { top: 12px; right: 12px; z-index: 10; }
        }
        #mc-step-error { display: none; flex-direction: column; gap: 24px; align-items: center; text-align: center; padding: 52px 28px; }
        #mc-step-error h2 { font-family: var(--font-display); font-size: 22px; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 400; }
        #mc-step-error p { font-size: 13px; color: var(--mc-text-light); margin: 0; line-height: 1.6; }
    `
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
                        <div class="mc-lead-form" style="margin-bottom:0;">
                            <div class="mc-group">
                                <label>SEU CELULAR</label>
                                <input type="tel" id="mc-phone" class="mc-input" placeholder="(11) 99999-9999" maxlength="15">
                                <div id="mc-phone-error" class="mc-status-msg">Insira um n\u00famero v\u00e1lido</div>
                            </div>
                            <div id="mc-calca-fields">
                                <p style="margin:0 0 8px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);text-align:center;">Suas medidas (recomenda\u00e7\u00e3o de tamanho)</p>
                                <div style="display:flex;gap:12px;">
                                    <div class="mc-group" style="flex:1;">
                                        <label style="font-size:11px;font-weight:600;margin-bottom:4px;display:block;">Cintura (cm)</label>
                                        <input type="number" id="mc-cin-val" class="mc-input" placeholder="Ex: 78" min="50" max="150" style="text-align:center;">
                                    </div>
                                    <div class="mc-group" style="flex:1;">
                                        <label style="font-size:11px;font-weight:600;margin-bottom:4px;display:block;">Quadril (cm)</label>
                                        <input type="number" id="mc-quad-val" class="mc-input" placeholder="Ex: 102" min="60" max="160" style="text-align:center;">
                                    </div>
                                </div>
                            </div>
                            <div id="mc-blusa-fields">
                                <div style="display:flex;gap:12px;">
                                    <div class="mc-group" style="flex:1;">
                                        <label style="font-size:11px;font-weight:600;margin-bottom:4px;display:block;">Altura (cm)</label>
                                        <input type="number" id="mc-blusa-h-val" class="mc-input" placeholder="Ex: 165" min="140" max="210" style="text-align:center;">
                                    </div>
                                    <div class="mc-group" style="flex:1;">
                                        <label style="font-size:11px;font-weight:600;margin-bottom:4px;display:block;">Peso (kg)</label>
                                        <input type="number" id="mc-blusa-w-val" class="mc-input" placeholder="Ex: 65" min="35" max="200" style="text-align:center;">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p style="margin:20px 0 10px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);text-align:center;">Sua foto deve seguir estes requisitos:</p>
                        <div class="mc-tips-grid" style="margin-top:0;">
                            <div class="mc-tip-item"><i class="ph ph-t-shirt"></i><span>Com Roupa</span></div>
                            <div class="mc-tip-item"><i class="ph ph-person"></i><span>Corpo Inteiro</span></div>
                            <div class="mc-tip-item"><i class="ph ph-sun"></i><span>Boa Luz</span></div>
                        </div>
                        <div class="mc-warning-back-front" style="display:block !important;visibility:visible !important;margin:14px 0 0;font-size:13px;color:#444;text-align:center;line-height:1.6;padding:14px 12px;background:#fff8e6;border:1px solid #f0d77a;border-radius:4px;font-weight:500;">&#9888;&#65039; Se voc&#234; escolheu a foto de costas, envie uma foto sua tamb&#233;m de costas. Se escolheu a frente, envie de frente.</div>
                        <div style="display:flex;gap:20px;justify-content:center;margin-top:20px;">



                            <div id="mc-trigger-upload" style="width:120px;height:160px;border:1px solid var(--mc-border);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--mc-gray);transition:0.3s;">
                                <i class="ph ph-camera-plus" style="font-size:32px;color:var(--mc-primary);margin-bottom:10px;"></i>
                                <span style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Enviar Foto</span>
                                <input type="file" id="mc-real-input" accept="image/*" style="display:none">
                            </div>
                            <div id="mc-pre-view" style="display:none;width:120px;height:160px;overflow:hidden;border:1px solid var(--mc-border);">
                                <img id="mc-pre-img" style="width:100%;height:100%;object-fit:cover;">
                            </div>
                        </div>
                        <div id="mc-terms-row" onclick="(function(){var t=window._mcTerms=!window._mcTerms;document.getElementById('mc-terms-icon').textContent=t?'☑':'☐';document.getElementById('mc-terms-row').style.opacity=t?'1':'0.6';document.getElementById('mc-btn-generate').disabled=!(window._mcPhoto&&t);})()" style="display:block;margin:14px 0 0;font-size:13px;color:#444;text-align:center;line-height:1.6;cursor:pointer;opacity:0.6;user-select:none;">
                            <span id="mc-terms-icon" style="font-size:18px;vertical-align:middle;margin-right:6px;">&#9744;</span><span>Concordo com os <a href="http://provoulevou.com.br/termos.html" target="_blank" onclick="event.stopPropagation()" style="color:var(--mc-gold);text-decoration:underline;">Termos e Condi&#231;&#245;es</a></span>
                        </div>
                        <button class="mc-btn-black" id="mc-btn-generate" disabled style="margin-bottom:24px;">Ver no meu corpo</button>
                    </div>

                    <!-- PASSO DE CONFIRMAÇÃO (oculto - mantido para compatibilidade) -->
                    <div id="mc-step-confirm" style="display:none !important;">
                        <button id="mc-btn-confirm-yes" style="display:none;"></button>
                        <button id="mc-btn-confirm-no" style="display:none;"></button>
                    </div>


                    <div id="mc-loading-box" style="display:none;padding:60px 28px;text-align:center;flex-direction:column;align-items:center;justify-content:center;min-height:240px;">
                        <div class="mc-loading-texts" style="position:relative;height:36px;width:100%;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
                            <div class="mc-loading-t1" style="position:absolute;width:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px;letter-spacing:4px;text-transform:uppercase;color:var(--mc-text);animation:mc-alt-show 3.6s ease-in-out infinite;">Gerando Prova Virtual</div>
                            <a href="https://provoulevou.com.br" target="_blank" class="mc-loading-t2" style="position:absolute;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;opacity:0;animation:mc-alt-hide 3.6s ease-in-out infinite;">
                                <span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mc-text-light);font-family:var(--font-body);">Powered by</span>
                                <img src="https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png" alt="Provou Levou" style="height:24px;width:auto;opacity:0.8;">
                            </a>
                        </div>
                        <div style="height:1px;background:#e8e8e8;width:100%;position:relative;overflow:hidden;">
                            <div style="position:absolute;top:0;left:0;height:100%;width:30%;background:var(--mc-text);animation:mc-slide 1.5s infinite linear;"></div>
                        </div>
                    </div>
                    <div id="mc-step-result">
                        <span class="mc-res-title">Veja como ficou em voc&ecirc; &#x2728;</span>
                        <div id="mc-result-img-col">
                            <img id="mc-final-view-img">
                        </div>
                        <div id="mc-result-actions-col">
                            <div id="mc-size-recommendation" style="display:none;">
                                <p>Tamanho Recomendado</p>
                                <p id="mc-rec-size-label"></p>
                                <p id="mc-rec-size-desc"></p>
                            </div>
                            <button class="mc-btn-outline" id="mc-btn-back">Voltar ao Produto</button>
                            <button class="mc-btn-black mc-res-mobile-only" id="mc-retry-btn" style="display:flex;align-items:center;justify-content:center;gap:8px;">
                                <i class="ph ph-camera"></i> Tentar outra foto
                            </button>
                            <div id="mc-related-products" style="display:none;">
                                <h4>Veja tamb&eacute;m</h4>
                                <div class="mc-related-grid" id="mc-related-grid"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <a href="https://provoulevou.com.br" target="_blank" class="mc-powered-footer" style="text-decoration:none;">
                    <span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);">Powered by</span>
                    <img src="https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png" class="mc-quantic-logo" alt="Provou Levou">
                </a>
            </div>
        </div>
    `;

    // ─── INIT ─────────────────────────────────────────────────────────────────────

    function init() {
        LOG.info('Iniciando provador...');

        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';
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

        // ── Pop-up de erro bonito ──
        window.showErrorPopup = function () {
            if (document.getElementById('mc-error-popup')) return;
            const ov = document.createElement('div');
            ov.id = 'mc-error-popup';
            ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,sans-serif;';
            const box = document.createElement('div');
            box.style.cssText = 'background:#fff;max-width:380px;width:100%;padding:36px 28px;text-align:center;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
            box.innerHTML = '<div style="font-size:48px;margin-bottom:12px;">&#128679;</div><h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#111;letter-spacing:0.5px;">Provador fora do ar</h2><p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.5;">Estamos passando por uma manuten&#231;&#227;o r&#225;pida. Voltamos em breve!</p><button id="mc-error-close" style="background:#111;color:#fff;border:none;padding:12px 28px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border-radius:4px;">Fechar</button>';
            ov.appendChild(box);
            document.body.appendChild(ov);
            document.getElementById('mc-error-close').onclick = () => ov.remove();
            ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
        };

        // Pré-detecta tipo de produto para garantir que os campos corretos apareçam
        const _initProd = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;
        applyProduct(detectProduct(_initProd));

        // ── Botão trigger acima da foto ──
        const openBtn = document.createElement('button');
        openBtn.className = 'mc-btn-trigger-ia';
        openBtn.id = 'mc-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        openBtn.innerHTML = stampImageHTML;

        const trayImgContainers = ['.image-show', '.box-gallery', '.product-colum-left'];
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
                const btnSize = isMobile ? '80px' : '70px';
                document.body.appendChild(openBtn);
                openBtn.style.position = 'fixed';
                openBtn.style.zIndex = '50';
                openBtn.style.width = btnSize;
                openBtn.style.height = btnSize;

                function positionBtn() {
                    const rect = el.getBoundingClientRect();
                    const btnTop = rect.top + (isMobile ? 70 : 15);
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
                placed = true;
                LOG.ok('Botão posicionado (' + (isMobile ? 'mobile' : 'desktop') + ') sobre: "' + sel + '"');
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
        const confirmStep = document.getElementById('mc-step-confirm');
        const confirmBtnYes = document.getElementById('mc-btn-confirm-yes');
        const confirmBtnNo = document.getElementById('mc-btn-confirm-no');
        const confirmImg = document.getElementById('mc-confirm-img');
        const uploadStep = document.getElementById('mc-step-upload');

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
            marianaType = product.fit === 'mariana_calca' ? 'calca' : product.fit === 'mariana_blusa' ? 'blusa' : null;
            const calcaFields = document.getElementById('mc-calca-fields');
            const blusaFields = document.getElementById('mc-blusa-fields');
            if (calcaFields) calcaFields.style.display = marianaType === 'calca' ? 'block' : 'none';
            if (blusaFields) blusaFields.style.display = marianaType === 'blusa' ? 'block' : 'none';
            LOG.info('Categoria: ' + product.category + ' | Fit: ' + product.fit + ' | marianaType: ' + marianaType);
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
            const recBox = document.getElementById('mc-size-recommendation');
            if (recBox) recBox.style.display = 'none';
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
            const phoneOk = (nums.length === 10 || nums.length === 11) && /^[1-9][1-9]/.test(nums) && (nums.length === 10 || nums[2] === '9');
            document.getElementById('mc-phone-error').style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : 'var(--mc-border)';
            const allOk = !!userPhoto && !!window._mcTerms;
            genBtn.disabled = !allOk;
            LOG.info('Validação campos — phone:' + phoneOk + ' foto:' + !!userPhoto + ' termos:' + !!window._mcTerms + ' → botão ' + (allOk ? 'HABILITADO' : 'desabilitado'));
        }

        ['mc-h-val', 'mc-w-val', 'mc-cin-val', 'mc-quad-val', 'mc-blusa-h-val', 'mc-blusa-w-val'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', checkFields);
        });


        realInput.onchange = (e) => {
            userPhoto = e.target.files[0];
            window._mcPhoto = userPhoto;
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

        genBtn.onclick = () => {
            LOG.info('Botão "Ver no meu corpo" clicado');
            if (!userPhoto) {
                LOG.warn('Tentativa de gerar sem foto selecionada');
                return;
            }
            if (!window._mcTerms) {
                LOG.warn('Termos não aceitos');
                return;
            }
            // Pula a etapa de confirmação e dispara o gerar diretamente
            if (confirmBtnYes) confirmBtnYes.click();
        };



        confirmBtnNo.onclick = () => {
            LOG.info('Botão "Não, quero trocar" clicado');
            if (confirmStep) confirmStep.style.display = 'none';
            if (uploadStep) uploadStep.style.display = 'block';
        };


        confirmBtnYes.onclick = async () => {
            LOG.info('Botão "Sim, gerar foto" clicado');

            // 🚨 LIMITE DE USO DIÁRIO — Supabase + localStorage 🚨
            const today = new Date().toISOString().slice(0, 10);
            const storageKey = 'pl_usage_' + today;
            const localUsed = parseInt(localStorage.getItem(storageKey) || '0', 10);

            // Consulta servidor para contar provas do telefone hoje (sem expor credenciais)
            let dbUsed = 0;
            let bypassActive = false;
            const phoneNorm = phoneInput.value.replace(/\D/g, '');
            try {
                const dbRes = await fetch(WEBHOOK_LIMITE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefone: phoneNorm,
                        origin: 'usemarianacardoso.com.br'
                    })
                });
                if (dbRes.ok) {
                    const data = await dbRes.json();
                    dbUsed = data.count || 0;
                    bypassActive = data.bypass === true;
                    LOG.info('Provas no banco hoje: ' + dbUsed + (bypassActive ? ' (bypass IP)' : ''));
                    if (bypassActive) {
                        // limpa contador local também
                        localStorage.removeItem(storageKey);
                    }
                }
            } catch (e) {
                LOG.warn('Falha ao consultar limite no servidor — usando localStorage');
            }

            const usedToday = bypassActive ? 0 : Math.max(localUsed, dbUsed);
            if (usedToday >= DAILY_LIMIT) {
                if (confirmStep) confirmStep.style.display = 'none';
                if (uploadStep) uploadStep.style.display = 'none';
                document.getElementById('mc-loading-box').style.display = 'none';
                document.getElementById('mc-step-result').style.display = 'none';

                let limitMsg = document.getElementById('mc-limit-msg');
                if (!limitMsg) {
                    limitMsg = document.createElement('div');
                    limitMsg.id = 'mc-limit-msg';
                    limitMsg.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 30px;';

                    const icon = document.createElement('i');
                    icon.className = 'ph ph-clock';
                    icon.style.cssText = 'font-size:48px;color:var(--mc-primary);margin-bottom:20px;';

                    const title = document.createElement('h2');
                    title.style.cssText = 'margin:0 0 12px;font-size:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;';
                    title.textContent = 'Limite atingido';

                    const desc = document.createElement('p');
                    desc.style.cssText = 'margin:0 0 30px;font-size:12px;color:var(--mc-text-light);letter-spacing:0.5px;line-height:1.6;';
                    desc.textContent = 'Voc\u00ea j\u00e1 usou suas ' + DAILY_LIMIT + ' provas virtuais de hoje. Volte amanh\u00e3 para experimentar mais looks!';

                    const btn = document.createElement('button');
                    btn.className = 'mc-btn-outline';
                    btn.id = 'mc-limit-close';
                    btn.style.maxWidth = '280px';
                    btn.textContent = 'Voltar ao Produto';
                    btn.onclick = () => {
                        modal.style.display = 'none';
                        unlockBodyScroll();
                        limitMsg.style.display = 'none';
                        if (uploadStep) uploadStep.style.display = 'block';
                    };

                    limitMsg.appendChild(icon);
                    limitMsg.appendChild(title);
                    limitMsg.appendChild(desc);
                    limitMsg.appendChild(btn);
                    document.querySelector('.mc-content-scroll').appendChild(limitMsg);
                }
                limitMsg.style.display = 'flex';
                return;
            }

            if (confirmStep) confirmStep.style.display = 'none';
            if (uploadStep) uploadStep.style.display = 'none';
            const loadingBox = document.getElementById('mc-loading-box');
            if (loadingBox) loadingBox.style.display = 'block';


            // 🚨 VALIDAÇÃO BÁSICA NO FRONT 🚨
            const keyToUse = window.PROVOU_LEVOU_API_KEY;
            if (!keyToUse || keyToUse.includes("COLOQUE_A_CHAVE_AQUI")) {
                window.showErrorPopup();
                return;
            }

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
            LOG.info('WhatsApp: informado');
            LOG.info('Categoria: ' + currentProduct.category + '  |  Fit: ' + currentProduct.fit);

            document.getElementById('mc-step-upload').style.display = 'none';
            document.getElementById('mc-loading-box').style.display = 'flex';

            try {
                const fd = new FormData();
                fd.append('person_image', userPhoto);
                fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                fd.append('phone_raw', phoneInput.value);
                fd.append('product_name', prodName);
                fd.append('product_type', currentProduct.category);
                fd.append('product_fit', currentProduct.fit);

                // 👉 INJETA A CHAVE NO FORM DATA PRO N8N LER
                fd.append('api_key', keyToUse);

                if (marianaType === 'calca') {
                    const cinVal = document.getElementById('mc-cin-val')?.value || '';
                    const quadVal = document.getElementById('mc-quad-val')?.value || '';
                    fd.append('height', '');
                    fd.append('weight', '');
                    fd.append('cintura', cinVal);
                    fd.append('quadril', quadVal);
                    LOG.info('Medidas calça: cintura=' + cinVal + ' quadril=' + quadVal);
                } else if (marianaType === 'blusa') {
                    const hVal = document.getElementById('mc-blusa-h-val')?.value || '';
                    const wVal = document.getElementById('mc-blusa-w-val')?.value || '';
                    fd.append('height', hVal);
                    fd.append('weight', wVal);
                    fd.append('cintura', '');
                    fd.append('quadril', '');
                    LOG.info('Medidas blusa: altura=' + hVal + ' peso=' + wVal);
                } else {
                    fd.append('height', '');
                    fd.append('weight', '');
                    fd.append('cintura', '');
                    fd.append('quadril', '');
                    LOG.info('Produto sem tabela Mariana — medidas enviadas vazias');
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

                const contentType = res.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data.error) {
                        LOG.error('Erro da API retornado via JSON:', data.error);
                        LOG.end();
                        document.getElementById('mc-loading-box').style.display = 'none';
                        document.getElementById('mc-step-upload').style.display = 'block';
                        if (data.error === "Chave invalida, vencida ou inativa." || data.error.includes("vencida ou inativa")) {
                            window.showErrorPopup();
                        } else {
                            window.showErrorPopup();
                        }
                        return;
                    }
                }

                if (res.ok) {
                    // Incrementa contador de uso diário
                    localStorage.setItem(storageKey, String(usedToday + 1));

                    const blob = await res.blob();
                    LOG.ok('Imagem gerada com sucesso! (' + (blob.size / 1024).toFixed(0) + 'KB, ' + blob.type + ')');
                    LOG.end();

                    document.getElementById('mc-loading-box').style.display = 'none';
                    document.getElementById('mc-final-view-img').src = URL.createObjectURL(blob);

                    // Exibe recomendação de tamanho se for calça e medidas foram informadas
                    const recSize = calculateFinalSize();
                    const recBox = document.getElementById('mc-size-recommendation');
                    if (recSize && recBox) {
                        document.getElementById('mc-rec-size-label').textContent = recSize;
                        document.getElementById('mc-rec-size-desc').textContent = marianaType === 'calca' ? 'Baseado nas suas medidas de cintura e quadril' : 'Baseado no seu peso e altura';
                        recBox.style.display = 'block';
                    } else if (recBox) {
                        recBox.style.display = 'none';
                    }

                    document.querySelector('.mc-card-ia').classList.add('is-result');
                    document.getElementById('mc-step-result').style.display = 'flex';
                    loadRelatedProducts();
                    LOG.ok('Resultado exibido.' + (recSize ? ' Tamanho recomendado: ' + recSize : ''));

                } else if (res.status === 401 || res.status === 403) {
                    LOG.error('Webhook retornou erro de permissão: ' + res.status);
                    LOG.end();
                    document.getElementById('mc-loading-box').style.display = 'none';
                    document.getElementById('mc-step-upload').style.display = 'block';
                    window.showErrorPopup();
                } else {
                    LOG.error('Webhook retornou erro: ' + res.status);
                    LOG.end();
                    throw new Error('HTTP ' + res.status);
                }
            } catch (e) {
                console.error('------- ERRO DETALHADO capturado no CATCH -------');
                console.error('Nome:', e.name);
                console.error('Mensagem:', e.message);
                console.error('Stack:', e.stack);
                console.error('-------------------------------------------------');
                LOG.error('Falha no fluxo de geração: ' + e.message, e);
                LOG.end();
                document.getElementById('mc-loading-box').style.display = 'none';
                document.getElementById('mc-step-upload').style.display = 'block';
                window.showErrorPopup();
            }
        };

        // Funcionalidade de adicionar ao carrinho removida conforme solicitado




        function loadRelatedProducts() {
            var grid = document.getElementById('mc-related-grid');
            var section = document.getElementById('mc-related-products');
            if (!grid || !section) return;

            // Seletores Tray Mariana Cardoso
            var items = document.querySelectorAll('.product-related .item.swiper-slide');
            if (!items.length) items = document.querySelectorAll('.product-related .product');
            if (!items.length) items = document.querySelectorAll('.list-product .swiper-slide .product');
            if (!items.length) {
                LOG.warn('Nenhum produto relacionado encontrado');
                return;
            }

            var products = [];
            items.forEach(function(item) {
                if (products.length >= 3) return;
                try {
                    var imgEl = item.querySelector('img[data-src], img[src]');
                    var nameEl = item.querySelector('.product-name');
                    var priceOff = item.querySelector('.price-off');
                    var priceLine = item.querySelector('.line-price');
                    var linkEl = item.querySelector('a.info-product, a[href*="/"]');

                    var img = imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : '';
                    var name = nameEl ? nameEl.textContent.trim() : (imgEl && imgEl.alt ? imgEl.alt.trim() : '');
                    var price = '';
                    if (priceOff) price = priceOff.textContent.trim().replace(/\s+/g, ' ');
                    else if (priceLine) price = priceLine.textContent.trim().replace(/\s+/g, ' ');
                    var link = linkEl ? linkEl.getAttribute('href') : '';

                    if (img && (name || price)) {
                        products.push({ name: name, img: img, price: price, link: link });
                    }
                } catch(e) {}
            });

            if (!products.length) return;
            while (grid.firstChild) grid.removeChild(grid.firstChild);
            products.forEach(function(p) {
                var a = document.createElement('a');
                a.className = 'mc-related-card';
                a.href = p.link || '#';
                a.target = '_blank';
                var img = document.createElement('img');
                img.src = p.img;
                img.alt = p.name;
                img.loading = 'lazy';
                var nameEl = document.createElement('span');
                nameEl.className = 'mc-related-card-name';
                nameEl.textContent = p.name;
                a.appendChild(img);
                a.appendChild(nameEl);
                if (p.price) {
                    var priceEl = document.createElement('span');
                    priceEl.className = 'mc-related-card-price';
                    priceEl.textContent = p.price;
                    a.appendChild(priceEl);
                }
                grid.appendChild(a);
            });
            section.style.display = 'block';
            LOG.ok('Related products carregados: ' + products.length);
        }

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
            document.getElementById('form_comprar') !== null ||
            document.querySelector('.box-gallery') !== null;

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
