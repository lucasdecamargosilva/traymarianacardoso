(function () {
    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/quantic-materialize';

    // ─── LOGO DA LOJA ─────────────────────────────────────────────────────────────
    const LOGO_URL = 'https://images.tcdn.com.br/files/1173244/themes/75/img/settings/logo-new.svg';

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
        if (/tailoring/.test(n) || /\d\/\d\s*short/.test(n) || /\b(1\/5|2\/5|3\/5|4\/5)\b/.test(n)) return { category: 'bottom', fit: 'tailoring' };
        if (/underwear|cueca/.test(n)) return { category: 'bottom', fit: 'underwear' };
        if (/sweatpant|sweatshort|sweat pant|sweat short|calca|bermuda/.test(n)) return { category: 'bottom', fit: 'sweat' };
        if (/henley/.test(n)) return { category: 'top', fit: 'boxyHenley' };
        if (/boxy.*(hoodie|crewneck|crew)/.test(n) || /(hoodie|crewneck|crew).*boxy/.test(n)) return { category: 'top', fit: 'boxyHoodie' };
        if (/puffer|jacket/.test(n)) return { category: 'top', fit: 'puffer' };
        if (/vest/.test(n)) return { category: 'top', fit: 'vest' };
        if (/(hoodie|hoodie zip|half zip|crewneck|crew neck)/.test(n) && !/oversized|boxy|short sleeve/.test(n)) return { category: 'top', fit: 'hoodie' };
        if (/oversized.*(hoodie|crewneck|crew|short sleeve)/.test(n) || /short sleeve.*(hoodie|crewneck)/.test(n)) return { category: 'top', fit: 'oversizedSS' };
        if (/oversized|boxy tee|2\/4/.test(n)) return { category: 'top', fit: 'oversized' };
        return { category: 'top', fit: 'regular' };
    }

    // ─── CÁLCULOS DE MEDIDAS ──────────────────────────────────────────────────────

    function estimarTorax(altura, peso) {
        if (altura < 3) altura *= 100;
        let circ = 0.65 * peso + 56;
        const imc = peso / Math.pow(altura / 100, 2);
        if (imc > 30) circ += 4; else if (imc > 25) circ += 2;
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
        recommendedSize = sizes[Math.max(findClosest(gradeC, cintura / 2), findClosest(gradeQ, quadril / 2))];
        document.getElementById('mc-res-letter').innerText = recommendedSize;
    }

    function calculateFinalSize() {
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

        /* ── BOTÃO SELO ─────────────────────────────────────────────────────────── */
        .mc-btn-trigger-ia {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 100;
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
        .mc-btn-trigger-ia:hover {
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28));
        }
        .mc-btn-trigger-ia img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* ── MODAL ──────────────────────────────────────────────────────────────── */
        #mc-modal-ia {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(255,255,255,0.98);
            z-index: 999999;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
        }
        .mc-card-ia {
            background: var(--mc-bg);
            width: 100%;
            max-width: 480px;
            padding: 0;
            position: relative;
            color: var(--mc-text);
            border: 1px solid var(--mc-border);
            max-height: 94vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .mc-content-scroll {
            padding: 40px 30px;
            overflow-y: auto;
            flex: 1;
            text-align: center;
        }
        .mc-close-ia {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            color: var(--mc-text);
            cursor: pointer;
            font-size: 24px;
            z-index: 100;
            font-weight: 300;
        }
        .mc-tips-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            padding: 20px 0;
            margin: 20px 0;
            border-top: 1px solid var(--mc-gray);
            border-bottom: 1px solid var(--mc-gray);
        }
        .mc-tip-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: var(--mc-text-light);
        }
        .mc-tip-item i { color: var(--mc-primary); font-size: 20px; }
        .mc-lead-form {
            margin: 30px 0 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
        }
        .mc-input-row { display: flex; gap: 15px; }
        .mc-group { flex: 1; }
        .mc-group label {
            display: block;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 1.5px;
            color: var(--mc-text);
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .mc-input {
            width: 100%;
            padding: 15px;
            border: 1px solid var(--mc-border);
            font-size: 13px;
            font-family: 'Inter', sans-serif;
            background: transparent;
            color: var(--mc-text);
            outline: none;
            box-sizing: border-box;
        }
        .mc-input:focus { border-width: 2px; padding: 14px; }
        .mc-input-hint {
            font-size: 9px;
            color: var(--mc-text-light);
            letter-spacing: 0.5px;
            margin-top: 6px;
        }
        .mc-btn-black {
            background: var(--mc-primary);
            color: var(--mc-bg);
            border: 1px solid var(--mc-primary);
            width: 100%;
            padding: 18px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            margin-top: 20px;
            transition: 0.3s;
        }
        .mc-btn-black:disabled {
            background: var(--mc-gray);
            color: #999;
            border-color: var(--mc-gray);
            cursor: not-allowed;
        }
        .mc-btn-black:not(:disabled):hover {
            background: var(--mc-bg);
            color: var(--mc-primary);
        }
        .mc-btn-buy {
            background: var(--mc-primary);
            color: var(--mc-bg);
            border: 1px solid var(--mc-primary);
            width: 100%;
            padding: 20px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            margin-bottom: 15px;
            transition: 0.3s;
        }
        .mc-btn-buy:hover { background: var(--mc-bg); color: var(--mc-primary); }
        .mc-btn-outline {
            background: var(--mc-bg);
            color: var(--mc-primary);
            border: 1px solid var(--mc-border);
            width: 100%;
            padding: 18px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            transition: 0.3s;
        }
        .mc-btn-outline:hover { background: var(--mc-primary); color: var(--mc-bg); }
        .mc-powered-footer {
            background: var(--mc-bg);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-shrink: 0;
            border-top: 1px solid var(--mc-gray);
        }
        .mc-quantic-logo { height: 18px; filter: brightness(0); }
        .mc-status-msg {
            display: none;
            font-size: 9px;
            letter-spacing: 1px;
            color: #ef4444;
            margin-top: 8px;
            font-weight: 600;
            text-align: left;
            text-transform: uppercase;
        }
        @keyframes mc-slide { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes mc-pulse-text { 0%, 100% { opacity: 0.4; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
        .mc-content-scroll::-webkit-scrollbar { width: 4px; }
        .mc-content-scroll::-webkit-scrollbar-thumb { background: #e5e5e5; }

        /* ════════════════════════════════════════════
           LAYOUT PC — TELA DE RESULTADO
        ════════════════════════════════════════════ */
        @media (min-width: 768px) {
            .mc-card-ia.is-result {
                width: 820px !important;
                max-width: 90vw !important;
                height: 560px !important;
                border-radius: 0 !important;
            }
            .mc-card-ia.is-result #mc-header-provador,
            .mc-card-ia.is-result .mc-powered-footer { display: none !important; }
            .mc-card-ia.is-result .mc-content-scroll {
                padding: 0 !important;
                height: 100% !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
            }
            .mc-card-ia.is-result #mc-step-result {
                display: flex !important;
                flex-direction: row !important;
                width: 100%;
                height: 100%;
                align-items: stretch;
            }
            .mc-card-ia.is-result #mc-result-img-col {
                width: 45% !important;
                height: 100% !important;
                margin: 0 !important;
                border: none !important;
                border-right: 1px solid var(--mc-border) !important;
                position: relative !important;
                flex-shrink: 0;
            }
            .mc-card-ia.is-result #mc-result-img-col img {
                position: absolute !important;
                top: 0; left: 0;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                object-position: top center !important;
            }
            .mc-card-ia.is-result #mc-result-actions-col {
                width: 55% !important;
                height: 100% !important;
                padding: 40px !important;
                display: flex !important;
                flex-direction: column;
                justify-content: center;
                box-sizing: border-box;
                overflow-y: auto;
            }
            .mc-card-ia.is-result .mc-res-title {
                display: block !important;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: var(--mc-text);
                margin-bottom: 4px;
            }
            .mc-card-ia.is-result .mc-res-subtitle {
                display: block !important;
                font-size: 11px;
                color: var(--mc-text-light);
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 30px;
            }
            .mc-card-ia.is-result .mc-metrics-row { display: flex !important; gap: 15px; margin-bottom: 30px; }
            .mc-card-ia.is-result .mc-metric-card {
                flex: 1;
                background: transparent;
                border: 1px solid var(--mc-border);
                border-radius: 0;
                padding: 16px;
            }
            .mc-card-ia.is-result .mc-metric-label {
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: var(--mc-text-light);
                margin-bottom: 6px;
                display: block;
            }
            .mc-card-ia.is-result .mc-metric-value { font-size: 20px; font-weight: 700; color: var(--mc-text); }
            .mc-card-ia.is-result .mc-metric-unit { font-size: 12px; color: var(--mc-text-light); margin-left: 2px; }
            .mc-card-ia.is-result .mc-size-card {
                display: flex !important;
                align-items: center;
                gap: 16px;
                background: var(--mc-gray);
                border: 1px solid var(--mc-border);
                border-radius: 0;
                padding: 20px;
                margin-bottom: 24px;
            }
            .mc-card-ia.is-result .mc-size-circle {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: var(--mc-primary);
                color: var(--mc-bg);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: 700;
                flex-shrink: 0;
            }
            .mc-card-ia.is-result .mc-size-info { flex: 1; }
            .mc-card-ia.is-result .mc-size-info strong {
                display: block;
                font-size: 11px;
                font-weight: 600;
                color: var(--mc-text);
                margin-bottom: 4px;
                letter-spacing: 1.5px;
                text-transform: uppercase;
            }
            .mc-card-ia.is-result .mc-size-info span {
                font-size: 9px;
                color: var(--mc-text-light);
                letter-spacing: 1px;
                text-transform: uppercase;
                display: block;
            }
            .mc-card-ia.is-result .mc-size-check { color: var(--mc-primary); font-size: 24px; flex-shrink: 0; }
            .mc-card-ia.is-result .mc-res-note {
                display: flex !important;
                align-items: flex-start;
                gap: 8px;
                font-size: 10px;
                color: var(--mc-text-light);
                font-style: italic;
                letter-spacing: 1px;
                margin-bottom: 24px;
                line-height: 1.5;
            }
            .mc-card-ia.is-result .mc-res-note i { flex-shrink: 0; margin-top: 1px; font-size: 14px; }
            .mc-card-ia.is-result .mc-btn-buy {
                border-radius: 0 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 11px !important;
                padding: 18px !important;
                margin-bottom: 12px;
                font-weight: 600;
                letter-spacing: 2px !important;
                text-transform: uppercase !important;
            }
            .mc-card-ia.is-result .mc-btn-outline {
                border-radius: 0 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px !important;
                padding: 18px !important;
                margin-top: 0;
                font-weight: 600;
                letter-spacing: 2px !important;
                text-transform: uppercase !important;
            }
            .mc-card-ia.is-result .mc-res-mobile-only { display: none !important; }
            .mc-card-ia.is-result .mc-close-ia { top: 16px; right: 16px; color: var(--mc-text); z-index: 10; }
        }
    `;

    // ─── IMAGEM DO BOTÃO (trigger) ─────────────────────────────────────────────
    const stampImageHTML = `<img src="https://cdn.shopify.com/s/files/1/0636/6334/1746/files/logo_provador.png?v=1772494793" alt="Provador Virtual" style="width:100%;height:100%;object-fit:contain;">`;

    // ─── HTML ─────────────────────────────────────────────────────────────────────

    const html = `
        <div id="mc-modal-ia">
            <div class="mc-card-ia">
                <button type="button" class="mc-close-ia" id="mc-close-btn">&times;</button>
                <div class="mc-content-scroll">
                    <div id="mc-header-provador">
                        <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Provador Virtual</h1>
                        <div style="margin:0 0 4px;text-align:center;">
                            <img
                                src="${LOGO_URL}"
                                alt="Mariana Cardoso"
                                style="height:32px;width:auto;display:inline-block;object-fit:contain;"
                                onerror="this.style.display='none'"
                            />
                        </div>
                    </div>

                    <div id="mc-step-upload">
                        <div class="mc-lead-form">
                            <div class="mc-group">
                                <label>Seu WhatsApp</label>
                                <input type="tel" id="mc-phone" class="mc-input" placeholder="(11) 99999-9999" maxlength="15">
                                <div id="mc-phone-error" class="mc-status-msg">Insira um número válido</div>
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
                        <div style="margin:20px 0 0;padding:12px 16px;background:#fff8e1;border-left:3px solid #f59e0b;text-align:left;">
                            <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.5px;color:#92400e;line-height:1.6;text-align:center;">
                                ⚠️ Se você escolheu a foto de costas, envie uma foto sua também de costas, se escolheu a frente, envie de frente.
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
                            <span class="mc-res-subtitle" style="display:none;">Simulação baseada no seu perfil corporal</span>
                            <div class="mc-metrics-row" style="display:none;">
                                <div class="mc-metric-card">
                                    <span class="mc-metric-label">Altura</span>
                                    <span class="mc-metric-value" id="mc-res-height">—</span>
                                    <span class="mc-metric-unit">m</span>
                                </div>
                                <div class="mc-metric-card">
                                    <span class="mc-metric-label">Peso</span>
                                    <span class="mc-metric-value" id="mc-res-weight">—</span>
                                    <span class="mc-metric-unit">kg</span>
                                </div>
                            </div>
                            <div class="mc-size-card" style="display:none;">
                                <div class="mc-size-circle" id="mc-res-letter-pc">M</div>
                                <div class="mc-size-info">
                                    <strong>Tamanho Recomendado</strong>
                                    <span>Ajuste ideal para o seu perfil</span>
                                </div>
                                <i class="ph ph-seal-check mc-size-check"></i>
                            </div>
                            <div class="mc-res-mobile-only" style="border-top:1px solid var(--mc-border);border-bottom:1px solid var(--mc-border);padding:20px 0;width:100%;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;">
                                <span style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--mc-text-light);">Tamanho Ideal</span>
                                <div id="mc-res-letter" style="font-size:24px;font-weight:400;font-family:monospace;line-height:1;">M</div>
                            </div>
                            <div class="mc-res-note" style="display:none;">
                                <i class="ph ph-info"></i>
                                <span>A simulação AI considera o caimento do tecido baseado na sua estrutura corporal informada.</span>
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
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        if (!window.phosphorIconsLoaded) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            document.head.appendChild(ph);
            window.phosphorIconsLoaded = true;
        }

        const styleTag = document.createElement('style');
        styleTag.innerHTML = styles;
        document.head.appendChild(styleTag);

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);

        // ── Botão trigger ──
        const openBtn = document.createElement('button');
        openBtn.className = 'mc-btn-trigger-ia';
        openBtn.id = 'mc-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        openBtn.innerHTML = stampImageHTML;

        // ─── POSICIONAMENTO DO BOTÃO — ESPECÍFICO PARA TRAY ──────────────────────
        // Na Tray, as imagens ficam dentro de .image-show
        // O botão é inserido dentro de .image-show para ficar sobre a galeria
        const trayImgContainers = [
            '.image-show',            // container principal das imagens na Tray
            '.box-gallery',           // wrapper da galeria
            '.product-colum-left',    // coluna esquerda do produto
        ];

        // Seletores de fallback (outras plataformas)
        const fallbackContainers = [
            '.product__media-wrapper',
            '.product-gallery__media',
            '.product__media',
            '.product-image-main',
            '.product-media-container',
            '[data-media-id]',
            '.product__media-item',
            '.product-gallery',
            '.product-single__media',
            '.media-gallery'
        ];

        let placed = false;
        for (const sel of [...trayImgContainers, ...fallbackContainers]) {
            const el = document.querySelector(sel);
            if (el) {
                if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
                el.appendChild(openBtn);
                placed = true;
                break;
            }
        }
        if (!placed) {
            openBtn.style.cssText = 'position:fixed;bottom:30px;right:20px;top:auto;width:60px;height:60px;';
            document.body.appendChild(openBtn);
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
            modal.style.display = 'flex';
            lockBodyScroll();
        }

        function closeModal() {
            modal.style.display = 'none';
            unlockBodyScroll();
        }

        function applyProduct(product) {
            currentProduct = product;
            document.getElementById('mc-fields-top').style.display = product.category === 'top' ? 'block' : 'none';
            document.getElementById('mc-fields-bottom').style.display = product.category === 'bottom' ? 'block' : 'none';
        }

        openBtn.onclick = () => {
            // Na Tray: h1.product-name
            const prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;
            applyProduct(detectProduct(prodName));
            openModal();
        };

        closeBtn.onclick = () => closeModal();
        backBtn.onclick = () => closeModal();

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        retryBtn.onclick = () => {
            document.getElementById('mc-step-result').style.display = 'none';
            document.getElementById('mc-step-upload').style.display = 'block';
            document.querySelector('.mc-card-ia').classList.remove('is-result');
            userPhoto = null;
            document.getElementById('mc-pre-view').style.display = 'none';
            checkFields();
        };

        triggerUpload.onclick = () => realInput.click();

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
            genBtn.disabled = !(measOk && userPhoto && phoneOk);
        }

        ['mc-h-val', 'mc-w-val', 'mc-cin-val', 'mc-quad-val'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', checkFields);
        });

        realInput.onchange = (e) => {
            userPhoto = e.target.files[0];
            if (userPhoto) {
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
            // ── Imagem do produto na Tray: .image-show .list .item.active img ou .zoom img ──
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

            // ── Nome do produto na Tray: h1.product-name ──
            const prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;

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
                } else {
                    fd.append('cintura', document.getElementById('mc-cin-val').value);
                    fd.append('quadril', document.getElementById('mc-quad-val').value);
                }

                if (prodImg) {
                    try {
                        const b = await fetch(prodImg).then(r => r.blob());
                        fd.append('product_image', b, 'p.png');
                    } catch (_) { }
                }

                calculateFinalSize();

                const res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });
                if (res.ok) {
                    const blob = await res.blob();
                    document.getElementById('mc-loading-box').style.display = 'none';
                    document.getElementById('mc-final-view-img').src = URL.createObjectURL(blob);

                    const hVal = document.getElementById('mc-h-val').value;
                    const wVal = document.getElementById('mc-w-val').value;
                    const cVal = document.getElementById('mc-cin-val').value;
                    const resH = document.getElementById('mc-res-height');
                    const resW = document.getElementById('mc-res-weight');
                    if (resH) resH.textContent = hVal ? (parseFloat(hVal) / 100).toFixed(2) : '—';
                    if (resW) resW.textContent = wVal || (cVal ? cVal + ' cm' : '—');

                    const letterPC = document.getElementById('mc-res-letter-pc');
                    if (letterPC) letterPC.textContent = recommendedSize;

                    document.querySelector('.mc-card-ia').classList.add('is-result');
                    document.getElementById('mc-step-result').style.display = 'flex';

                } else {
                    throw new Error();
                }
            } catch (e) {
                alert('Ocorreu um erro ao processar sua imagem. Tente novamente.');
                location.reload();
            }
        };

        // ─── ADICIONAR AO CARRINHO — ESPECÍFICO PARA TRAY ────────────────────────
        // Na Tray o formulário é #form_comprar e o botão é dentro dele

        document.getElementById('mc-add-to-cart-btn').onclick = () => {
            const size = recommendedSize;

            // Tray usa inputs de variante com data-value ou value
            const swatchSelectors = [
                `input[type="radio"][data-value="${size}"]`,
                `input[type="radio"][value="${size}"]`,
                `button[data-value="${size}"]`,
                `button[value="${size}"]`,
                `.swatch__input[value="${size}"]`,
                `[data-option-value="${size}"]`,
                `.variant-option input[value="${size}"]`,
                `.product-form__option input[value="${size}"]`,
                // Tray-specific
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
                    break;
                }
            }

            if (!selected) {
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
                        break;
                    }
                }
            }

            function tryAddToCart() {
                const addBtnSelectors = [
                    // Tray-specific
                    '#form_comprar button[type="submit"]',
                    '#form_comprar .btn-comprar',
                    '#form_comprar .buy-button',
                    '.buy-button',
                    '.btn-comprar',
                    // Genéricos
                    'button[name="add"]',
                    'button.product-form__submit',
                    '.btn-add-to-cart',
                    '[data-action="add-to-cart"]',
                    'button[data-btn-addtocart]',
                    '.product-form button[type="submit"]',
                    'form[action*="/cart/add"] button[type="submit"]',
                    '#AddToCart',
                    '#add-to-cart',
                    '.add-to-cart',
                    '[id*="add-to-cart"]',
                    '[class*="add-to-cart"]',
                    '[class*="addtocart"]',
                ];
                for (const sel of addBtnSelectors) {
                    const btn = document.querySelector(sel);
                    if (btn && !btn.disabled) { btn.click(); return true; }
                }
                return false;
            }

            setTimeout(() => {
                const ok = tryAddToCart();
                if (!ok) setTimeout(() => tryAddToCart(), 400);
                closeModal();
            }, selected ? 300 : 0);
        };
    }

    // ─── EXECUTA EM PÁGINAS DE PRODUTO ───────────────────────────────────────────
    // Na Tray as páginas de produto ficam em /produto/ ou /p/ (além de /products/ do Shopify)
    const path = window.location.pathname;
    const isProductPage =
        path.includes('/produto/') ||
        path.includes('/p/') ||
        path.includes('/products/') ||
        document.getElementById('product-container') !== null ||
        document.getElementById('form_comprar') !== null;

    if (isProductPage) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }

})();
