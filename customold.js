// informacoes no topo
if (document.querySelector('.fundo_info')) {
    var fundoInfo = new Swiper('.fundo_info .swiper-container', {
        preloadImages: false,
        slidesPerView: 1,
        lazy: {
            loadPrevNext: true,
        },
        navigation: {
            nextEl: '.next',
            prevEl: '.prev',
        },
        loop: true,
        autoplay: {
            delay: 3000,
        },
    });
}

// search bar mobile
document.querySelector('.search-mobile-btn button')
    .addEventListener('click', function () {
        var search = document.querySelector('.search-mobile');
        var logo = document.querySelector('html.page-product .header .logo');
        if (search.classList.contains('active')) {
            search.classList.remove('active');
            if (logo) logo.classList.remove('show');
        } else {
            search.classList.add('active');
            if (logo) logo.classList.add('show');
        }
    });

// tabela de medidas na pdp
function encontrarAbaTabalaMedidas() {
    var abasPersonalizadas = document.querySelectorAll('.section-box[class*="AdditionalTab"]');
    for (var i = 0; i < abasPersonalizadas.length; i++) {
        var aba = abasPersonalizadas[i];
        var titulo = aba.querySelector('.title');
        if (titulo && titulo.textContent.toLowerCase().includes('tabela de medidas')) {
            var conteudo = aba.querySelector('.board.aba_personalizada');
            return conteudo;
        }
    }
    return null;
}
function waitForFormComprar(attempts) {
    if (attempts <= 0) return;
    if (!document.querySelector('html.page-product #form_comprar .box-price')) {
        setTimeout(function () { waitForFormComprar(attempts - 1); }, 500);
        return;
    }

    // --- BOTÃO PROVADOR VIRTUAL (independente da tabela de medidas) ---
    if (!document.querySelector('.wrapper-provador-mariana')) {
        var boxPrice = document.querySelector('html.page-product #form_comprar .box-price');
        var wrapperProvador = document.createElement('div');
        wrapperProvador.className = 'wrapper-provador-mariana';
        wrapperProvador.style.cssText = `
            position: relative;
            width: 65%;
            max-width: 200px;
            margin: 10px auto 15px;
        `;

        var btnProvadorNovo = document.createElement('button');
        btnProvadorNovo.type = 'button';
        btnProvadorNovo.className = 'btn-provador-mariana';
        btnProvadorNovo.innerHTML = `
            <img src="https://i.ibb.co/50TPgYj/cabine-icone-oficial.png" alt="Icon" style="width: 20px; height: 20px; margin-right: 8px; object-fit: contain;">
            Provador Virtual
        `;

        btnProvadorNovo.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 45px;
            background-color: #ffffff;
            color: #000000;
            border: 1px solid #000000;
            border-radius: 50px;
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0;
            text-decoration: none;
        `;

        btnProvadorNovo.onmouseenter = () => {
            btnProvadorNovo.style.background = '#000000';
            btnProvadorNovo.style.color = '#ffffff';
        };
        btnProvadorNovo.onmouseleave = () => {
            btnProvadorNovo.style.background = '#ffffff';
            btnProvadorNovo.style.color = '#000000';
        };
        btnProvadorNovo.onclick = () => {
            document.getElementById('mc-open-ia')?.click();
        };

        // Badge "Novidade!"
        var badgeNovidade = document.createElement('div');
        badgeNovidade.className = 'badge-novidade-mariana';
        badgeNovidade.innerHTML = 'Novidade!';
        badgeNovidade.style.cssText = `
            position: absolute;
            top: -28px;
            background: #000;
            color: #fff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
            z-index: 2;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            font-family: 'Inter', sans-serif;
            animation: mc-float-badge 3s ease-in-out infinite;
        `;
        // Posicionamento desktop vs mobile
        if (window.innerWidth > 767) {
            badgeNovidade.style.right = '-85px';
        } else {
            badgeNovidade.style.right = '-55px';
        }

        // Linha interligando (SVG)
        var svgLinha = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgLinha.className = 'svg-linha-mariana';
        svgLinha.style.cssText = `
            position: absolute;
            top: -20px;
            pointer-events: none;
            z-index: 1;
        `;

        if (window.innerWidth > 767) {
            svgLinha.style.right = '-65px';
            svgLinha.setAttribute('width', '80');
            svgLinha.setAttribute('height', '40');
            svgLinha.innerHTML = `<path d="M75,10 Q50,35 5,32" stroke="black" stroke-width="1.2" fill="none" stroke-dasharray="3,3" />`;
        } else {
            svgLinha.style.right = '-45px';
            svgLinha.setAttribute('width', '60');
            svgLinha.setAttribute('height', '40');
            svgLinha.innerHTML = `<path d="M55,10 Q40,35 5,32" stroke="black" stroke-width="1.2" fill="none" stroke-dasharray="3,3" />`;
        }

        // Estilos de animação
        if (!document.getElementById('mc-novidade-style')) {
            var styleNovidade = document.createElement('style');
            styleNovidade.id = 'mc-novidade-style';
            styleNovidade.innerHTML = `
                @keyframes mc-float-badge {
                    0%, 100% { transform: translateY(0) rotate(2deg); }
                    50% { transform: translateY(-5px) rotate(-1deg); }
                }
                @media (max-width: 767px) {
                    .wrapper-provador-mariana {
                        overflow: visible !important;
                    }
                }
            `;
            document.head.appendChild(styleNovidade);
        }

        wrapperProvador.appendChild(btnProvadorNovo);
        wrapperProvador.appendChild(badgeNovidade);
        wrapperProvador.appendChild(svgLinha);

        boxPrice.parentNode.insertBefore(wrapperProvador, boxPrice);
    }

    // --- TABELA DE MEDIDAS (separada, só aparece se a aba existir) ---
    var tabelaTentativas = 0;
    function initTabelaMedidas() {
        if (document.querySelector('.btn-tabela-medidas')) return;

        var conteudoTabelaMedidas = encontrarAbaTabalaMedidas();
        if (!conteudoTabelaMedidas || !conteudoTabelaMedidas.innerHTML.trim()) {
            tabelaTentativas++;
            if (tabelaTentativas < 10) {
                setTimeout(initTabelaMedidas, 1000);
            }
            return;
        }

        var btnTabelaMedidas = document.createElement('button');
        btnTabelaMedidas.type = 'button';
        btnTabelaMedidas.className = 'btn-tabela-medidas';
        btnTabelaMedidas.textContent = 'Tabela de Medidas';
        btnTabelaMedidas.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px;margin-top:-15px;background:transparent;border-radius:4px;color:rgb(51,51,51);font-size:12px;font-weight:500;cursor:pointer;transition:0.3s;width:100%;justify-content:center;text-decoration:underline;opacity:0.7;border:none;';
        var wrapperProv = document.querySelector('.wrapper-provador-mariana');
        if (wrapperProv) {
            wrapperProv.parentNode.insertBefore(btnTabelaMedidas, wrapperProv);
        } else {
            var bxPrice = document.querySelector('html.page-product #form_comprar .box-price');
            bxPrice.parentNode.insertBefore(btnTabelaMedidas, bxPrice);
        }

        var modalHTML = `
        < style >
        #conteudo - tabela - medidas img {
        width: auto;
        height: 70vh;
    }
    @media screen and(max - width: 767px){
        #conteudo - tabela - medidas img {
            width: 100 %;
            height: auto;
        }
    }
            </style >
        <div id="modal-tabela-medidas" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                z-index: 9999;
                justify-content: center;
                align-items: center;
            ">
            <div style="
                    background: white;
                    max-width: 90%;
                    max-height: 90%;
                    overflow-y: auto;
                    border-radius: 8px;
                    position: relative;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                ">
                <div style="
                        position: sticky;
                        top: 0;
                        background: white;
                        padding: 20px;
                        border-bottom: 1px solid #eee;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        z-index: 1;
                    ">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Tabela de Medidas</h3>
                    <button id="fechar-modal-tabela" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            padding: 5px;
                            line-height: 1;
                            color: #666;
                        ">&times;</button>
                </div>
                <div id="conteudo-tabela-medidas" style="padding: 20px;">
                    <!-- Conteudo aqui -->
                </div>
            </div>
        </div>
    `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        var modal = document.getElementById('modal-tabela-medidas');
        var conteudoModal = document.getElementById('conteudo-tabela-medidas');
        var btnFechar = document.getElementById('fechar-modal-tabela');

        btnTabelaMedidas.addEventListener('click', function (e) {
            e.preventDefault();
            var conteudoAbaPersonalizada = encontrarAbaTabalaMedidas();
            if (conteudoAbaPersonalizada && conteudoAbaPersonalizada.innerHTML.trim()) {
                console.log('Conteudo encontrado para a tabela de medidas - exibindo modal');
                conteudoModal.innerHTML = conteudoAbaPersonalizada.innerHTML;
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });

        btnFechar.addEventListener('click', function () {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        btnTabelaMedidas.addEventListener('mouseenter', function () {
            this.style.opacity = '1';
        });
        btnTabelaMedidas.addEventListener('mouseleave', function () {
            this.style.opacity = '0.7';
        });
    }
    initTabelaMedidas();
}
if (document.querySelector('html.page-product')) {
    waitForFormComprar(20);
}

// beneficios do tecido
function encontrarAbaBeneficiosTecido() {
    var abasPersonalizadas = document.querySelectorAll('.section-box[class*="AdditionalTab"]');
    for (var i = 0; i < abasPersonalizadas.length; i++) {
        var aba = abasPersonalizadas[i];
        var titulo = aba.querySelector('.title');
        if (titulo && titulo.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('beneficios do nosso tecido')) {
            var conteudo = aba.querySelector('.board.aba_personalizada');
            return {
                titulo: titulo.textContent.trim(),
                conteudo: conteudo
            };
        }
    }
    return null;
}

function initBeneficiosTecido() {
    if (document.querySelector('.beneficios-tecido-container')) return;
    console.log('initBeneficiosTecido');

    var beneficiosGroup = document.querySelector('.product-colum-right .beneficios-produto-group');
    if (!beneficiosGroup) {
        console.log('Elemento .beneficios-produto-group nao encontrado - tentando novamente em 1s');
        setTimeout(initBeneficiosTecido, 1000);
        return;
    }

    var abaBeneficios = encontrarAbaBeneficiosTecido();
    if (!abaBeneficios || !abaBeneficios.conteudo || !abaBeneficios.conteudo.innerHTML.trim()) {
        console.log('Conteudo de benefícios do tecido nao encontrado - tentando novamente em 1s');
        setTimeout(initBeneficiosTecido, 1000);
        return;
    }

    console.log('Conteudo de beneficios do tecido encontrado - adicionando na pagina');

    var beneficiosContainer = document.createElement('div');
    beneficiosContainer.className = 'beneficios-tecido-container';
    beneficiosContainer.style.cssText = `
    margin - top: 15px;
    `;

    var tituloContainer = document.createElement('h3');
    tituloContainer.textContent = abaBeneficios.titulo;
    tituloContainer.style.cssText = `
    display: none;
    margin: 0 0 5px 0;
    font - size: 16px;
    font - weight: 500;
    color: #333;
    text - align: center;
    `;

    var conteudoContainer = document.createElement('div');
    conteudoContainer.className = 'beneficios-tecido-conteudo';
    conteudoContainer.innerHTML = abaBeneficios.conteudo.querySelector('img').outerHTML;
    //conteudoContainer.style.cssText = 'text-align: center;';

    var styleElement = document.createElement('style');
    styleElement.textContent = `
        .beneficios - tecido - conteudo img {
        max - width: 100 %;
        height: auto;
    }
    @media screen and(max - width: 767px){
            .beneficios - tecido - conteudo {
            overflow - x: auto;
        }
            .beneficios - tecido - conteudo img {
            height: 150px!important;
            width: auto!important;
            max - width: none!important;
        }
    }
    `;
    document.head.appendChild(styleElement);
    beneficiosContainer.appendChild(tituloContainer);
    beneficiosContainer.appendChild(conteudoContainer);
    beneficiosGroup.after(beneficiosContainer);
}
if (document.querySelector('html.page-product')) {
    initBeneficiosTecido();
}



(function(){var s=document.createElement('script');s.src='https://lucasdecamargosilva.github.io/traymarianacardoso/provador.js?v='+Date.now();document.head.appendChild(s);})();
