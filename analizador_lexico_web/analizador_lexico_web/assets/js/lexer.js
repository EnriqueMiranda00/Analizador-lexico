// Lexer en JS para ejecutarse en el navegador
class LexicalError extends Error {
  constructor(message, line, column){
    super(message); this.name = 'LexicalError'; this.line = line; this.column = column;
  }
}

class Token {
  constructor(type, value, line, column){
    this.type = type; this.value = value; this.line = line; this.column = column;
  }
}

const TokenType = {
  KEYWORD:'KEYWORD', IDENTIFIER:'IDENTIFIER', NUMBER:'NUMBER', STRING:'STRING',
  OPERATOR:'OPERATOR', DELIMITER:'DELIMITER', COMMENT:'COMMENT', NEWLINE:'NEWLINE', EOF:'EOF', ERROR:'ERROR'
};

class Lexer {
  constructor(source, {keywords, includeComments=true, emitNewlines=false}={}){
    this.source = source; this.length = source.length; this.i = 0; this.line = 1; this.col = 1;
    this.includeComments = includeComments; this.emitNewlines = emitNewlines;
    this.keywords = new Set((keywords || [
      'if','else','while','for','return','var','function','true','false','null',
      'int','float','string','bool','break','continue','class','def','and','or','not'
    ]).map(s=>s.trim()).filter(Boolean));
    this.multiOps = ['===','!==','==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%=','=>','<<','>>','->'];
    this.singleOps = Array.from('+-*/%=<>!&|^~?:.');
    this.delimiters = Array.from('(){}[];,');
  }
  _peek(k=0){ const j=this.i+k; return (j>=this.length)?'':this.source[j]; }
  _advance(k=1){ let ch=''; for(let t=0;t<k;t++){ if(this.i>=this.length) return ''; ch=this.source[this.i++]; if(ch==='\n'){this.line++; this.col=1;} else {this.col++;} } return ch; }
  _isIdentStart(ch){ return ch==='_' || /[A-Za-z]/.test(ch); }
  _isIdentPart(ch){ return ch==='_' || /[A-Za-z0-9]/.test(ch); }

  _readLineComment(prefix){ const startLine=this.line, startCol=this.col; let value=prefix; this._advance(prefix.length);
    while(true){ const ch=this._peek(); if(ch===''|| ch==='\n') break; value += this._advance(1); }
    return new Token(TokenType.COMMENT, value, startLine, startCol);
  }
  _readBlockComment(){ const startLine=this.line, startCol=this.col; let value='/*'; this._advance(2);
    while(true){ const ch=this._peek(); if(ch==='') throw new LexicalError(`Comentario de bloque no cerrado iniciado en línea ${startLine}, columna ${startCol}`, startLine, startCol);
      if(this.source.startsWith('*/', this.i)){ value+='*/'; this._advance(2); break; }
      value += this._advance(1); }
    return new Token(TokenType.COMMENT, value, startLine, startCol);
  }
  _readString(){ const quote=this._advance(1); const startLine=this.line, startCol=this.col-1; let value='';
    while(true){ const ch=this._peek(); if(ch==='') throw new LexicalError(`Cadena no cerrada iniciada en línea ${startLine}, columna ${startCol}`, startLine, startCol);
      if(ch==='\n') throw new LexicalError(`Salto de línea en cadena iniciada en línea ${startLine}, columna ${startCol}`, startLine, startCol);
      if(ch==='\\'){ this._advance(1); const esc=this._peek(); if(esc==='') throw new LexicalError(`Secuencia de escape incompleta`, this.line, this.col);
        const map={n:'\n', t:'\t', r:'\r', '\\':'\\', '"':'"', "'":"'"};
        if(map.hasOwnProperty(esc)){ value += map[esc]; this._advance(1);} else { value += '\\' + this._advance(1);} continue; }
      if(ch===quote){ this._advance(1); break; }
      value += this._advance(1);
    }
    return new Token(TokenType.STRING, value, startLine, startCol);
  }
  _readNumber(){ const startLine=this.line, startCol=this.col; let s='';
    while(/[0-9]/.test(this._peek())) s += this._advance(1);
    if(this._peek()==='.' && /[0-9]/.test(this._peek(1))){ s += this._advance(1); while(/[0-9]/.test(this._peek())) s += this._advance(1); }
    if(/[eE]/.test(this._peek())){ const eLine=this.line, eCol=this.col; s += this._advance(1); if(/[+\-]/.test(this._peek())) s+= this._advance(1); if(!/[0-9]/.test(this._peek())) throw new LexicalError(`Exponente inválido en número (posición línea ${eLine}, columna ${eCol})`, eLine, eCol); while(/[0-9]/.test(this._peek())) s += this._advance(1); }
    return new Token(TokenType.NUMBER, s, startLine, startCol);
  }
  _readIdentifierOrKeyword(){ const startLine=this.line, startCol=this.col; let s=''; while(this._isIdentPart(this._peek())) s += this._advance(1); return this.keywords.has(s)? new Token(TokenType.KEYWORD,s,startLine,startCol): new Token(TokenType.IDENTIFIER,s,startLine,startCol);
  }
  _readOperatorOrDelimiter(){ const startLine=this.line, startCol=this.col; for(const op of [...this.multiOps].sort((a,b)=>b.length-a.length)){ if(this.source.startsWith(op, this.i)){ this._advance(op.length); return new Token(TokenType.OPERATOR, op, startLine, startCol);} }
    const ch=this._peek(); if(this.singleOps.includes(ch)){ this._advance(1); return new Token(TokenType.OPERATOR, ch, startLine, startCol);} if(this.delimiters.includes(ch)){ this._advance(1); return new Token(TokenType.DELIMITER, ch, startLine, startCol);} const bad=this._advance(1); throw new LexicalError(`Carácter inesperado '${bad}'`, startLine, startCol);
  }

  tokenize(){ const tokens=[]; while(this.i < this.length){
      // espacios
      let consumedWS=false; while(true){ const ch=this._peek(); if(ch===' '|| ch==='\t'|| ch==='\r'){ this._advance(1); consumedWS=true; continue; } if(ch==='\n'){ if(this.emitNewlines){ tokens.push(new Token(TokenType.NEWLINE, '\n', this.line, this.col)); this._advance(1); consumedWS=true; continue; } this._advance(1); consumedWS=true; continue; } break; }

      const ch=this._peek(); if(ch==='') break;

      // comentarios
      if(this.source.startsWith('//', this.i)){ const t=this._readLineComment('//'); if(this.includeComments) tokens.push(t); continue; }
      if(ch==='#'){ const t=this._readLineComment('#'); if(this.includeComments) tokens.push(t); continue; }
      if(this.source.startsWith('/*', this.i)){ const t=this._readBlockComment(); if(this.includeComments) tokens.push(t); continue; }

      // cadenas
      if(ch==='"' || ch==="'"){ tokens.push(this._readString()); continue; }

      // números
      if(/[0-9]/.test(ch)){ tokens.push(this._readNumber()); continue; }

      // identificadores / palabras clave
      if(this._isIdentStart(ch)){ tokens.push(this._readIdentifierOrKeyword()); continue; }

      // operadores / delimitadores
      tokens.push(this._readOperatorOrDelimiter());
    }
    tokens.push(new Token(TokenType.EOF, '', this.line, this.col));
    return tokens;
  }
}

window.Lexer = Lexer;
window.LexicalError = LexicalError;
window.TokenType = TokenType;
