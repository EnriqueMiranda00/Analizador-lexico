// Lógica de UI
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const $$ = (sel)=>document.querySelectorAll(sel);

  const sourceEl = $('#source');
  const btnTokenize = $('#btn-tokenize');
  const btnClear = $('#btn-clear');
  const btnSample = $('#btn-sample');
  const btnTheme = $('#btn-theme');
  const fileInput = $('#file-input');
  const optComments = $('#opt-comments');
  const optNewlines = $('#opt-newlines');
  const keywordsEl = $('#keywords');
  const statusEl = $('#status');
  const tableBody = $('#table tbody');
  const jsonEl = $('#json');
  const btnJSON = $('#btn-json');
  const btnCSV = $('#btn-csv');
  const btnCopy = $('#btn-copy');

  const SAMPLE = `// Ejemplo de programa de muestra\n# También se aceptan comentarios con #\n\n/* Comentario de bloque\n   multilínea */\n\nvar x = 42;\nvar y = 3.14e-2;\nvar msg = "Hola, mundo\\n";\n\nif (x >= 40 && y < 0.1) {\n    // concatenación\n    msg = msg + 'Valor: ' + x;\n    return msg;\n} else {\n    return "nada";\n}`;

  btnSample.addEventListener('click', ()=>{ sourceEl.value = SAMPLE; setStatus('Ejemplo cargado', ''); });

  btnClear.addEventListener('click', ()=>{ sourceEl.value=''; tableBody.innerHTML=''; jsonEl.textContent=''; setStatus('Entrada limpiada', ''); });

  fileInput.addEventListener('change', async (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const text = await f.text();
    sourceEl.value = text; setStatus(`Archivo cargado: ${f.name} (${f.size} bytes)`, '');
  });

  btnTheme.addEventListener('click', ()=>{
    const root = document.documentElement;
    const light = root.classList.toggle('light');
    localStorage.setItem('theme', light? 'light':'dark');
  });
  // estado inicial de tema
  if(localStorage.getItem('theme')==='light'){ document.documentElement.classList.add('light'); }

  btnTokenize.addEventListener('click', ()=>{
    const src = sourceEl.value ?? '';
    const kws = keywordsEl.value.split(',').map(s=>s.trim()).filter(Boolean);
    const lexer = new window.Lexer(src, {keywords:kws, includeComments: optComments.checked, emitNewlines: optNewlines.checked});
    try{
      const tokens = lexer.tokenize();
      render(tokens);
      setStatus(`Listo: ${tokens.length} tokens`, '');
    }catch(err){
      console.error(err);
      setStatus(err?.message || 'Error léxico', 'error');
    }
  });

  function render(tokens){
    // Tabla
    tableBody.innerHTML = '';
    const frag = document.createDocumentFragment();
    tokens.forEach((t, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx}</td><td>${escapeHtml(t.type)}</td><td>${escapeHtml(String(t.value).replace(/\n/g,'\\n'))}</td><td>${t.line}</td><td>${t.column}</td>`;
      frag.appendChild(tr);
    });
    tableBody.appendChild(frag);

    // JSON
    const data = tokens.map(t=>({type:t.type, value:String(t.value), line:t.line, column:t.column}));
    jsonEl.textContent = JSON.stringify(data, null, 2);

    // Botones de descarga
    btnJSON.onclick = ()=> download('tokens.json', jsonEl.textContent);
    btnCSV.onclick = ()=> {
      const header = ['#','type','value','line','column'];
      const rows = tokens.map((t,i)=> [i, t.type, String(t.value).replace(/"/g,'""').replace(/\n/g,'\\n'), t.line, t.column]);
      const csv = [header.join(','), ...rows.map(r=> r.map(x=> typeof x==='string' && (x.includes(',')||x.includes('"'))? '"'+x+'"': x).join(','))].join('\n');
      download('tokens.csv', csv);
    };
    btnCopy.onclick = async ()=>{ try{ await navigator.clipboard.writeText(jsonEl.textContent); setStatus('JSON copiado al portapapeles',''); }catch{ setStatus('No se pudo copiar','error'); } };
  }

  function setStatus(text, type){ statusEl.textContent = text; statusEl.className = 'status' + (type? ' '+type:''); }

  function download(filename, content){
    const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 500);
  }

  function escapeHtml(s){ return s.replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
})();
