# 🚀 Início Rápido - Servidor de Impressão

## Para Novos Terminais

### 1️⃣ Instalar Node.js
- Baixe: [nodejs.org](https://nodejs.org)
- Instale a versão LTS
- Reinicie o computador

### 2️⃣ Conectar Impressora
- Conecte via USB
- Ligue a impressora
- Aguarde Windows reconhecer

### 3️⃣ Copiar Arquivos
- Copie pasta `print-server` para: `C:\CocoLoko\print-server\`

### 4️⃣ Instalar Serviço
- Clique com botão direito em `install-windows-service.bat`
- Selecione "Executar como administrador"
- Aguarde instalação

### 5️⃣ Testar
- Abra navegador: `http://localhost:3001/health`
- Deve mostrar: `"status": "ok"`

## Comandos Rápidos

### Verificar Status
```cmd
sc query "Coco Loko Print Server"
```

### Reiniciar Serviço
```cmd
net stop "Coco Loko Print Server"
net start "Coco Loko Print Server"
```

### Testar Conexão
```
http://localhost:3001/health
```

## No Sistema Coco Loko

1. **Admin** → **Impressão**
2. Clique **"Testar Conexão"**
3. Clique **"Imprimir Teste"**
4. Vá para **Cozinha**
5. Ative **"Impressão Automática"**

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| Servidor não inicia | Execute como administrador |
| Impressora não detecta | Verifique USB e reinicie serviço |
| Não imprime | Teste com "Imprimir Teste" |
| Porta em uso | Pare o serviço e inicie novamente |

## Gerenciar Serviço

**Abrir Serviços do Windows:**
1. Pressione `Win + R`
2. Digite `services.msc`
3. Procure "Coco Loko Print Server"
4. Clique com botão direito para gerenciar

## Suporte

📖 Guia completo: `WINDOWS_INSTALLATION_GUIDE.md`
📝 Documentação técnica: `README.md`

---

**Dica**: Após instalar, o servidor inicia automaticamente com o Windows. Basta ligar a impressora!
