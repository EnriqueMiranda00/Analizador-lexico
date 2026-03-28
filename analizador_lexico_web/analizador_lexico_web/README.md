# Analizador léxico (JavaScript, Web)

Proyecto listo para **descomprimir y ejecutar** como página web (no requiere servidor ni dependencias).

## ¿Qué incluye?
- `index.html` – UI limpia para pegar/cargar código, configurar opciones y ver tokens.
- `assets/js/lexer.js` – Analizador léxico en JavaScript.
- `assets/js/app.js` – Lógica de la interfaz.
- `assets/css/style.css` – Estilos con tema claro/oscuro.

## Características
- Palabras clave configurables (campo de texto).
- Identificadores, números (decimales y exponentes), cadenas con escapes, comentarios `//`, `#`, `/*…*/`.
- Operadores compuestos (`==`, `!=`, `<=`, `>=`, `&&`, `||`, `+=`, etc.) y delimitadores.
- Opciones: incluir comentarios y/o emitir `NEWLINE`.
- Resultado en **tabla** y **JSON**, con descarga en JSON/CSV y botón de copiar.

## Cómo usar (VS Code o navegador)
1. Descomprime el zip.
2. Abre la carpeta en **Visual Studio Code**.
3. Abre `index.html` y presiona **Open with Live Server** (si tienes la extensión) o **abre el archivo en tu navegador** con doble clic.
4. Pega o carga tu archivo y presiona **Tokenizar**.

> No hay CORS ni fetch a archivos locales. El proyecto funciona totalmente offline.

## Personalizar
- Cambia el conjunto de palabras clave, operadores y delimitadores editando `assets/js/lexer.js`.
- Ajusta estilos en `assets/css/style.css`.

## Licencia
MIT
