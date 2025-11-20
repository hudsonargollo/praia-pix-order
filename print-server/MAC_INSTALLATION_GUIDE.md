# Guia de Instalação - Servidor de Impressão (Mac)

## 📋 Visão Geral

Este guia explica como instalar e configurar o servidor de impressão local para impressoras térmicas no macOS.

## ✅ Requisitos

- **macOS** 10.15 (Catalina) ou superior
- **Node.js** 16 ou superior
- **Impressora Térmica USB** (compatível com ESC/POS)
- **Cabo USB** para conectar a impressora

## 📦 Passo 1: Instalar Node.js

### Opção A: Via Site Oficial

1. Acesse [https://nodejs.org](https://nodejs.org)
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador
4. Siga as instruções na tela

### Opção B: Via Homebrew

```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node
```

### Verificar Instalação

```bash
node --version
# Deve mostrar: v18.x.x ou superior

npm --version
# Deve mostrar: 9.x.x ou superior
```

## 🖨️ Passo 2: Conectar a Impressora

1. Conecte a impressora térmica via USB
2. Ligue a impressora
3. Aguarde o macOS reconhecer o dispositivo
4. **Não é necessário instalar drivers** - o servidor se comunica diretamente via USB

### Verificar Impressora

```bash
# Listar dispositivos USB
system_profiler SPUSBDataType | grep -A 10 "Printer"
```

## 📁 Passo 3: Preparar os Arquivos

1. Navegue até a pasta do servidor:
   ```bash
   cd /caminho/para/print-server
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

## 🚀 Passo 4: Iniciar o Servidor

### Opção A: Inicialização Manual (Teste)

```bash
# Iniciar o servidor
npm start

# Ou diretamente
node server.js
```

O servidor iniciará em `http://localhost:3001`

Para parar: Pressione `Ctrl + C`

### Opção B: Inicialização em Background

```bash
# Iniciar em background
node server.js &

# Ou com log
nohup node server.js > print-server.log 2>&1 &

# Para parar depois
ps aux | grep "node server.js"
kill <PID>
```

### Opção C: Serviço Automático (Recomendado)

Para iniciar automaticamente ao fazer login:

```bash
# Dar permissão de execução
chmod +x install-mac-service.sh

# Instalar como serviço
./install-mac-service.sh
```

O servidor agora:
- ✅ Inicia automaticamente ao fazer login
- ✅ Reinicia automaticamente se falhar
- ✅ Roda em segundo plano

## 🧪 Passo 5: Testar o Servidor

### Teste 1: Verificar se está Rodando

```bash
# Via curl
curl http://localhost:3001/health

# Deve retornar:
# {"status":"ok","serverRunning":true,"printerConnected":true}
```

Ou abra no navegador: `http://localhost:3001/health`

### Teste 2: Testar Impressão

1. Acesse o painel administrativo do Coco Loko
2. Vá em **Admin** → **Impressão**
3. Clique em **"Testar Conexão"**
4. Clique em **"Imprimir Teste"**
5. A impressora deve imprimir um recibo de teste

## 🔧 Gerenciar o Serviço (se instalado como serviço)

### Ver Status

```bash
launchctl list | grep cocoloko
```

### Parar o Serviço

```bash
launchctl stop com.cocoloko.printserver
```

### Iniciar o Serviço

```bash
launchctl start com.cocoloko.printserver
```

### Reiniciar o Serviço

```bash
launchctl kickstart -k gui/$(id -u)/com.cocoloko.printserver
```

### Desinstalar o Serviço

```bash
chmod +x uninstall-mac-service.sh
./uninstall-mac-service.sh
```

## 📊 Logs e Monitoramento

### Localização dos Logs (se instalado como serviço)

```bash
# Log de saída
tail -f ~/Library/Logs/coco-loko-print-server.log

# Log de erros
tail -f ~/Library/Logs/coco-loko-print-server-error.log
```

### Logs em Tempo Real (execução manual)

Os logs aparecem diretamente no terminal onde você executou `npm start`

## 🐛 Solução de Problemas

### Problema: Servidor não inicia

**Sintomas**: Erro ao executar `npm start`

**Soluções**:
1. Verifique se o Node.js está instalado: `node --version`
2. Reinstale as dependências: `rm -rf node_modules && npm install`
3. Verifique se a porta 3001 está livre: `lsof -i :3001`
4. Se a porta estiver em uso, mate o processo: `kill -9 <PID>`

### Problema: Impressora não detectada

**Sintomas**: `printerConnected: false` no status

**Soluções**:
1. Verifique a conexão USB
2. Certifique-se de que a impressora está ligada
3. Tente uma porta USB diferente
4. Reinicie o servidor
5. Verifique se a impressora aparece: `system_profiler SPUSBDataType`

### Problema: Impressão não funciona

**Sintomas**: Servidor conectado mas não imprime

**Soluções**:
1. Verifique se há papel na impressora
2. Teste com "Imprimir Teste" no painel admin
3. Reinicie a impressora
4. Reinicie o servidor
5. Verifique os logs para erros

### Problema: Porta 3001 em uso

**Sintomas**: Erro "Port 3001 is already in use"

**Soluções**:
```bash
# Encontrar o processo usando a porta
lsof -i :3001

# Matar o processo
kill -9 <PID>

# Ou alterar a porta em server.js (linha 7)
```

### Problema: Permissões negadas

**Sintomas**: Erro de permissão ao acessar USB

**Soluções**:
1. Execute com sudo (não recomendado): `sudo npm start`
2. Adicione seu usuário ao grupo de dispositivos USB
3. Verifique as permissões do sistema em Preferências → Segurança

## 🔐 Segurança

- O servidor roda apenas em `localhost` (não acessível pela rede)
- Não requer autenticação (acesso local apenas)
- CORS habilitado apenas para localhost

## 📝 Comandos Úteis

```bash
# Verificar status do serviço
launchctl list | grep cocoloko

# Ver logs em tempo real
tail -f ~/Library/Logs/coco-loko-print-server.log

# Testar conexão
curl http://localhost:3001/health

# Listar processos Node.js
ps aux | grep node

# Verificar porta 3001
lsof -i :3001

# Reiniciar serviço
launchctl kickstart -k gui/$(id -u)/com.cocoloko.printserver
```

## ✅ Checklist de Instalação

- [ ] Node.js instalado e funcionando
- [ ] Impressora conectada via USB e ligada
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm start` ou serviço instalado)
- [ ] Teste de conexão bem-sucedido (`http://localhost:3001/health`)
- [ ] Impressão de teste funcionando
- [ ] Configurado no painel admin
- [ ] Impressão automática ativada na cozinha

## 🎉 Conclusão

Após seguir todos os passos, o servidor de impressão estará:

✅ Rodando no Mac
✅ Conectado à impressora térmica
✅ Pronto para imprimir comandas automaticamente

Para uso diário:
1. O servidor inicia automaticamente (se instalado como serviço)
2. Ou execute `npm start` na pasta print-server
3. Ative "Impressão Automática" na página da cozinha

**Pronto! O sistema está configurado e funcionando! 🎊**

## 🆘 Suporte

### Informações para Suporte

Ao solicitar ajuda, forneça:

1. Versão do macOS: `sw_vers`
2. Versão do Node.js: `node --version`
3. Status do serviço: `launchctl list | grep cocoloko`
4. Logs do servidor (últimas 50 linhas)
5. Modelo da impressora
6. Mensagem de erro completa

### Comandos de Diagnóstico

```bash
# Informações do sistema
sw_vers

# Versão do Node.js
node --version

# Dispositivos USB
system_profiler SPUSBDataType | grep -A 10 "Printer"

# Status do serviço
launchctl list | grep cocoloko

# Logs
tail -50 ~/Library/Logs/coco-loko-print-server.log
```
