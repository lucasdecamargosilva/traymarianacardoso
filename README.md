# traymarianacardoso

Provador Virtual da **Mariana Cardoso** — integrado à plataforma **Tray**.

## Como funciona

O script `provador-mariana-cardoso.js` injeta um botão de Provador Virtual na página de produto da loja. Ao clicar, o cliente:

1. Informa WhatsApp, altura e peso (ou cintura e quadril, dependendo do produto)
2. Envia uma foto sua
3. Recebe a simulação de como a peça ficaria no seu corpo
4. Adiciona ao carrinho com o tamanho ideal já selecionado automaticamente

## Instalação na Tray

### Via Google Tag Manager (recomendado)

1. Acesse o GTM da loja
2. Crie uma nova **Tag** do tipo "HTML Personalizado"
3. Cole o conteúdo de `provador-mariana-cardoso.js` dentro de `<script>...</script>`
4. Configure o **Acionador** para páginas de produto (URL contém `/produto/` ou `/p/`)
5. Publique

### Via código do tema

1. Acesse o painel da Tray → **Design** → **Editar Arquivos**
2. Abra `product.html`
3. Cole a tag `<script>` com o conteúdo do arquivo antes do `</body>`

## Estrutura do projeto

```
provador-mariana-cardoso.js   # Script principal do provador
README.md                     # Este arquivo
```

## Plataforma

- **Loja:** Mariana Cardoso
- **Plataforma:** Tray
- **Provador:** Provou Levou

---

> Powered by [Provou Levou](https://provoulevou.com.br)
